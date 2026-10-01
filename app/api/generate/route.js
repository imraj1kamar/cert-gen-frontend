// app/api/generate/route.js
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { createJob, pushLog, updateProgress, failRow, completeJob, cancelJob, getJob } from '@/lib/jobStore';
const archiver = require('archiver');

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ==========================================
// CONSOLE LOGGER HELPERS
// ==========================================
const ts = () => new Date().toLocaleTimeString('en-IN', { hour12: false });
const log = (msg) => console.log(`[${ts()}] ${msg}`);
const logWarn = (msg) => console.warn(`[${ts()}] ⚠️  ${msg}`);
const logErr = (msg) => console.error(`[${ts()}] ❌ ${msg}`);
const line = (char = '=', n = 70) => console.log(char.repeat(n));
const fmtMs = (ms) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`);
const fmtKB = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

export async function POST(request) {
  const requestStart = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const certificatesDataString = formData.get('data');
    const username = formData.get('user') || 'System Admin';
    const jobId = formData.get('jobId'); // ← frontend sends this

    if (!file || !certificatesDataString) {
      logErr('Request rejected: File and data are required');
      return NextResponse.json({ success: false, message: "File and data are required" }, { status: 400 });
    }

    const certificatesData = JSON.parse(certificatesDataString);
    const totalRecords = certificatesData.length;

    console.log('');
    line('=');
    log(`🚀 BULK CERTIFICATE GENERATION STARTED`);
    log(`👤 User          : ${username}`);
    log(`📄 Excel File    : ${file.name || 'N/A'}`);
    log(`📊 Total Records : ${totalRecords}`);
    log(`🆔 Job ID        : ${jobId || 'N/A'}`);
    line('=');

    // Uploaded Excel file ko public/uploads/excels mein save karna taaki archiveUrl track ho
    let archiveUrl = null;
    if (file && typeof file.arrayBuffer === 'function') {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const cleanFileName = (file.name || 'excel_upload.xlsx').replaceAll(' ', '_');
        const filename = `${Date.now()}_${cleanFileName}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/excels');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, filename), buffer);
        archiveUrl = `/uploads/excels/${filename}`;
        log(`📁 Uploaded Excel saved to: ${archiveUrl}`);
      } catch (fsErr) {
        logWarn(`Could not save Excel to disk: ${fsErr.message}`);
        archiveUrl = file.name || null;
      }
    }

    // Initialize job in store if jobId provided
    if (jobId) {
      createJob(jobId, totalRecords, archiveUrl);
    }

    const emitLog = (event) => {
      if (jobId) pushLog(jobId, event);
    };

    // DB mein permanent audit log likhne ka helper
    const writeDbLog = async ({ action, status, details, successCount = 0, errorCount = 0, skipCount = 0, executionDetails = null, customArchiveUrl = null }) => {
      try {
        await prisma.log.create({
          data: {
            action,
            user: username,
            details,
            status,       // 1=success, 0=error, 2=cancelled
            createdBy: username,
            totalRecords,
            successCount,
            skipCount,
            errorCount,
            executionDetails,
            archiveUrl: customArchiveUrl ?? archiveUrl,
          },
        });
      } catch (dbErr) {
        logWarn(`DB log write failed: ${dbErr.message}`);
      }
    };

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const archive = archiver('zip', { zlib: { level: 5 } });

    archive.on('data', (chunk) => writer.write(chunk));
    archive.on('end', () => {
      log(`📦 ZIP stream finished (total ZIP size: ${fmtKB(archive.pointer())})`);
      writer.close();
    });
    archive.on('warning', (err) => logWarn(`Archive warning: ${err.message}`));
    archive.on('error', (err) => {
      logErr(`Archive error: ${err.message}`);
      writer.abort(err);
    });

    (async () => {
      let successCount = 0;
      let errorCount = 0;
      const failedRows = [];
      const fileCache = {};

      const getFileBuffer = async (relativePath) => {
        if (!fileCache[relativePath]) {
          const absolutePath = path.join(process.cwd(), 'public', relativePath);
          log(`   📂 Reading file from disk: ${relativePath}`);
          fileCache[relativePath] = await fs.readFile(absolutePath);
        }
        return fileCache[relativePath];
      };

      try {
        // ---------- Load DB data ----------
        log('🗄️  Loading templates from database...');
        emitLog({ type: 'info', msg: 'Loading templates from database...' });
        const dbTemplates = await prisma.template.findMany({ where: { status: 1 } });
        const templateMap = {};
        dbTemplates.forEach(t => templateMap[(t.category || '').toLowerCase().trim()] = t);
        log(`✅ Templates loaded : ${dbTemplates.length} → [${Object.keys(templateMap).join(', ')}]`);
        emitLog({ type: 'info', msg: `Templates loaded: ${dbTemplates.length}` });

        log('🗄️  Loading signatories from database...');
        const dbSignatories = await prisma.signatory.findMany({ where: { status: 1 } });
        const signatoryMap = {};
        dbSignatories.forEach(s => signatoryMap[(s.name || '').toLowerCase().trim()] = {
          name: s.name,
          designation: s.designation,
          signatureUrl: s.signatureUrl
        });
        log(`✅ Signatories loaded : ${dbSignatories.length} → [${Object.keys(signatoryMap).join(', ')}]`);
        emitLog({ type: 'info', msg: `Signatories loaded: ${dbSignatories.length}` });
        line('-');

        // ---------- Row-wise PDF generation ----------
        for (const [index, row] of certificatesData.entries()) {
          const rowStart = Date.now();
          const rowNo = index + 1;
          const tag = `[${rowNo}/${totalRecords}]`;

          const empName = row['Emp Name'];
          const empCode = row['Emp Code'];
          const category = row['Award Category'];
          const bandType = row['Band Type'];
          const packetName = row['Packet Name'];
          const month = row['Month'];

          const sig1Excel = row['Signatory 1'];
          const sig2Excel = row['Signatory 2'];
          const sig1DesignationExcel = row['Signatory 1 -Designation'];

          log(`${tag} ▶️  Processing → ${empName || 'N/A'} (${empCode || 'N/A'}) | Category: ${category || 'N/A'} | Band: ${bandType || 'N/A'} | Packet: ${packetName || 'N/A'} | Month: ${month || 'N/A'}`);

          // Emit row-start event
          emitLog({
            type: 'row_start',
            rowNo,
            empName: empName || 'N/A',
            empCode: empCode || 'N/A',
            category: category || 'N/A',
            bandType: bandType || 'N/A',
            packetName: packetName || 'N/A',
            month: month || 'N/A',
          });

          try {
            const categoryFromExcel = category ? category.toLowerCase().trim() : '';
            const templateRecord = templateMap[categoryFromExcel];

            if (!templateRecord || !templateRecord.pdfUrl) {
              throw new Error(`Template missing for category "${category || ''}"`);
            }
            let templatePath = templateRecord.pdfUrl;
            if (!templatePath.startsWith('/')) templatePath = `/uploads/templates/${templatePath}`;

            log(`${tag}    📑 Template matched: ${templatePath}`);

            const mapData = templateRecord.mappingData || {};
            if (!templateRecord.mappingData) {
              logWarn(`${tag}    No mappingData found, using default positions`);
            }

            const templateBuffer = await getFileBuffer(templatePath);
            const pdfDoc = await PDFDocument.load(templateBuffer);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width } = firstPage.getSize();

            const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
            const fontNormal = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

            const hexToRgb = (hex) => {
              const cleanHex = hex.replace('#', '');
              const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
              const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
              const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
              return rgb(r, g, b);
            };

            const defaultColor = rgb(8 / 255, 48 / 255, 105 / 255);

            // ==========================================
            // 1. DYNAMIC TEXT RENDERING (PERFECT PAGE CENTER)
            // ==========================================

            if (mapData.empName) {
              const textWidth = fontBold.widthOfTextAtSize(empName || '', mapData.empName.size);
              firstPage.drawText(empName || '', {
                x: (width / 2) - (textWidth / 2),
                y: mapData.empName.y,
                size: mapData.empName.size,
                font: fontBold,
                color: mapData.empName.color ? hexToRgb(mapData.empName.color) : defaultColor
              });
            } else {
              firstPage.drawText(empName || '', {
                x: (width / 2) - (fontBold.widthOfTextAtSize(empName || '', 26) / 2),
                y: 240, size: 26, font: fontBold, color: defaultColor
              });
            }
            log(`${tag}    ✏️  Emp Name drawn`);

            if (mapData.empCode) {
              const codeText = `(${empCode || ''})`;
              const textWidth = fontNormal.widthOfTextAtSize(codeText, mapData.empCode.size);
              firstPage.drawText(codeText, {
                x: (width / 2) - (textWidth / 2),
                y: mapData.empCode.y,
                size: mapData.empCode.size,
                font: fontNormal,
                color: mapData.empCode.color ? hexToRgb(mapData.empCode.color) : defaultColor
              });
            } else {
              firstPage.drawText(`(${empCode || ''})`, {
                x: (width / 2) - (fontNormal.widthOfTextAtSize(`(${empCode || ''})`, 20) / 2),
                y: 215, size: 20, font: fontNormal, color: defaultColor
              });
            }
            log(`${tag}    ✏️  Emp Code drawn`);

            if (month) {
              if (mapData.month) {
                const textWidth = fontItalic.widthOfTextAtSize(month, mapData.month.size);
                firstPage.drawText(month, {
                  x: (width / 2) - (textWidth / 2),
                  y: mapData.month.y,
                  size: mapData.month.size,
                  font: fontItalic,
                  color: mapData.month.color ? hexToRgb(mapData.month.color) : defaultColor
                });
              } else {
                firstPage.drawText(month, {
                  x: (width / 2) - (fontItalic.widthOfTextAtSize(month, 22) / 2),
                  y: 110, size: 22, font: fontItalic, color: defaultColor
                });
              }
              log(`${tag}    ✏️  Month drawn (${month})`);
            } else {
              logWarn(`${tag}    Month is empty, skipped`);
            }

            // ==========================================
            // 2. DYNAMIC SIGNATURE LOGIC (IMAGE-BASED CENTERING)
            // ==========================================
            const drawSignatureSafely = async (sigName, mapKey, fallbackX, fallbackY, fallbackDesignation = '') => {
              if (!sigName) {
                logWarn(`${tag}    ${mapKey}: no signatory name in Excel, skipped`);
                return;
              }

              const sigNameClean = sigName.toLowerCase().trim();
              const sigData = signatoryMap[sigNameClean];

              if (!sigData) {
                logWarn(`${tag}    ${mapKey}: "${sigName}" not found in DB, printing name only (no image)`);
              }

              const sigPrintName = sigData ? sigData.name : sigName.trim();
              const sigPrintDesig = sigData && sigData.designation ? sigData.designation : fallbackDesignation;

              const sigSettings = mapData[mapKey] || { x: fallbackX, y: fallbackY, size: 12, color: '#083069' };

              const nameFontSize = sigSettings.size || 12;
              const desigFontSize = Math.max(nameFontSize - 2, 8);
              const sigColor = sigSettings.color ? hexToRgb(sigSettings.color) : defaultColor;
              const sigTextY = sigSettings.y;

              const fixedWidth = 125;
              const fixedHeight = 45;

              const signatureCenterX = sigSettings.x + (fixedWidth / 2);

              // 1. Print Center Aligned Name
              const nameWidth = fontBold.widthOfTextAtSize(sigPrintName, nameFontSize);
              firstPage.drawText(sigPrintName, {
                x: signatureCenterX - (nameWidth / 2),
                y: sigTextY,
                size: nameFontSize, font: fontBold, color: sigColor
              });

              // 2. Print Center Aligned Designation
              if (sigPrintDesig) {
                const desigWidth = fontNormal.widthOfTextAtSize(sigPrintDesig, desigFontSize);
                firstPage.drawText(sigPrintDesig, {
                  x: signatureCenterX - (desigWidth / 2),
                  y: sigTextY - 15,
                  size: desigFontSize, font: fontNormal, color: sigColor
                });
              }

              // 3. Print Center Aligned Image
              let imageStatus = 'no image';
              if (sigData && sigData.signatureUrl) {
                try {
                  let sigPath = sigData.signatureUrl;
                  if (!sigPath.startsWith('/')) sigPath = `/uploads/signatures/${sigPath}`;
                  const sigBuffer = await getFileBuffer(sigPath);
                  let sigImage = sigPath.toLowerCase().endsWith('.png')
                    ? await pdfDoc.embedPng(sigBuffer)
                    : await pdfDoc.embedJpg(sigBuffer);

                  firstPage.drawImage(sigImage, {
                    x: sigSettings.x,
                    y: sigTextY + 5,
                    width: fixedWidth, height: fixedHeight
                  });
                  imageStatus = 'image embedded';
                } catch (imgErr) {
                  imageStatus = `image FAILED (${imgErr.message})`;
                  logErr(`${tag}    Image Embed Failed for ${sigPrintName}: ${imgErr.message}`);
                }
              }

              log(`${tag}    🖊️  ${mapKey}: ${sigPrintName}${sigPrintDesig ? ` (${sigPrintDesig})` : ''} → ${imageStatus}`);
            };

            await drawSignatureSafely(sig1Excel, 'signature1', 160, 80, sig1DesignationExcel);
            await drawSignatureSafely(sig2Excel, 'signature2', width - 160, 80, '');

            const pdfBytes = await pdfDoc.save();

            const folderBand = bandType ? String(bandType).trim() : 'General_Band';
            const folderCategory = category ? String(category).trim() : 'General_Category';
            const folderPacket = packetName ? String(packetName).trim() : 'Default_Packet';

            const fileNameInZip = `${folderBand}/${folderCategory}/${folderPacket}/${empName}_${empCode}.pdf`;

            archive.append(Buffer.from(pdfBytes), { name: fileNameInZip });
            successCount++;

            const elapsed = fmtMs(Date.now() - rowStart);
            log(`${tag} ✅ SUCCESS → ${fileNameInZip} (${fmtKB(pdfBytes.length)}) in ${elapsed}`);

            // Emit success event
            emitLog({
              type: 'row_done',
              rowNo,
              status: 'success',
              empName: empName || 'N/A',
              empCode: empCode || 'N/A',
              category: category || 'N/A',
              bandType: bandType || 'N/A',
              packetName: packetName || 'N/A',
              month: month || 'N/A',
              fileSize: fmtKB(pdfBytes.length),
              elapsed,
            });

          } catch (rowErr) {
            errorCount++;
            const rowDetail = {
              rowNo,
              empName: empName || 'N/A',
              empCode: empCode || 'N/A',
              category: category || 'N/A',
              reason: rowErr.message
            };
            failedRows.push(rowDetail);
            if (jobId) failRow(jobId, rowDetail);
            logErr(`${tag} FAILED → ${empName || 'N/A'} (${empCode || 'N/A'}) | Reason: ${rowErr.message} (after ${fmtMs(Date.now() - rowStart)})`);

            // Emit error event
            emitLog({
              type: 'row_done',
              rowNo,
              status: 'error',
              empName: empName || 'N/A',
              empCode: empCode || 'N/A',
              category: category || 'N/A',
              bandType: bandType || 'N/A',
              packetName: packetName || 'N/A',
              month: month || 'N/A',
              reason: rowErr.message,
              elapsed: fmtMs(Date.now() - rowStart),
            });
          }

          // Progress update
          const done = successCount + errorCount;
          const percent = parseFloat(((done / totalRecords) * 100).toFixed(1));
          log(`${tag} 📈 Progress: ${done}/${totalRecords} (${percent}%) | ✅ ${successCount} | ❌ ${errorCount}`);
          line('-');

          if (jobId) {
            updateProgress(jobId, { successCount, errorCount, progress: percent });
          }

          // ── Yield to event loop so SSE writes can flush before next PDF render ──
          await new Promise((resolve) => setTimeout(resolve, 10));

          // ── Panic Stop check: agar cancel request aa gayi toh loop toddo ──
          if (jobId) {
            const currentJob = getJob(jobId);
            if (currentJob?.isCancelled) {
              log(`❌ [PANIC STOP] Job ${jobId} cancelled after row ${rowNo}. Stopping loop.`);
              emitLog({
                type: 'cancelled',
                msg: `Generation stopped by user after ${successCount} success, ${errorCount} failed.`,
                successCount,
                errorCount,
                progress: parseFloat(((( successCount + errorCount) / totalRecords) * 100).toFixed(1)),
              });
              break; // ← for...of loop yahan ruk jaata hai
            }
          }
        }

        log('📦 Finalizing ZIP archive...');
        emitLog({ type: 'info', msg: 'Finalizing ZIP archive...' });
        await archive.finalize();

        // ---------- Final summary ----------
        console.log('');
        line('=');
        log('🏁 BULK CERTIFICATE GENERATION COMPLETED');
        log(`👤 User          : ${username}`);
        log(`📊 Total Records : ${totalRecords}`);
        log(`✅ Successful    : ${successCount}`);
        log(`❌ Failed        : ${errorCount}`);
        log(`⏱️  Total Time    : ${fmtMs(Date.now() - requestStart)}`);

        if (failedRows.length > 0) {
          console.log('');
          log('📋 FAILED ROWS DETAIL:');
          console.table(failedRows);
        }
        line('=');
        console.log('');

        if (jobId) completeJob(jobId, 'done');

        // ── Permanent DB audit log ──
        await writeDbLog({
          action: 'BATCH_GENERATE_COMPLETE',
          status: 1,
          details: `Bulk certificate generation completed. ${successCount} success, ${errorCount} failed out of ${totalRecords} records.`,
          successCount,
          errorCount,
          executionDetails: failedRows.length > 0 ? { failedRows } : null,
        });

      } catch (globalErr) {
        logErr(`GLOBAL ERROR: ${globalErr.message}`);
        console.error(globalErr.stack);
        log(`Stopped at: ✅ ${successCount} success | ❌ ${errorCount} failed out of ${totalRecords}`);
        if (jobId) {
          emitLog({ type: 'error', msg: `Global error: ${globalErr.message}` });
          completeJob(jobId, 'error');
        }
        // ── Permanent DB audit log (error) ──
        await writeDbLog({
          action: 'BATCH_GENERATE_ERROR',
          status: 0,
          details: `Fatal error: ${globalErr.message}. Stopped at ${successCount} success, ${errorCount} failed.`,
          successCount,
          errorCount,
          executionDetails: { error: globalErr.message, stack: globalErr.stack?.slice(0, 500) },
        });
        archive.abort();
        writer.abort(globalErr);
      }
    })();

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Bulk_Certificates.zip"`,
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (error) {
    logErr(`REQUEST ERROR: ${error.message}`);
    console.error(error.stack);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}