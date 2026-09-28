// app/api/generate/route.js
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
const archiver = require('archiver');

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const certificatesDataString = formData.get('data');
    const username = formData.get('user') || 'System Admin';

    if (!file || !certificatesDataString) {
      return NextResponse.json({ success: false, message: "File and data are required" }, { status: 400 });
    }

    const certificatesData = JSON.parse(certificatesDataString);
    const totalRecords = certificatesData.length;

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const archive = archiver('zip', { zlib: { level: 5 } });

    archive.on('data', (chunk) => writer.write(chunk));
    archive.on('end', () => writer.close());
    archive.on('error', (err) => writer.abort(err));

    (async () => {
      let successCount = 0;
      let errorCount = 0;
      const fileCache = {};

      const getFileBuffer = async (relativePath) => {
        if (!fileCache[relativePath]) {
          const absolutePath = path.join(process.cwd(), 'public', relativePath);
          fileCache[relativePath] = await fs.readFile(absolutePath);
        }
        return fileCache[relativePath];
      };

      try {
        const dbTemplates = await prisma.template.findMany({ where: { status: 1 } });
        const templateMap = {};
        dbTemplates.forEach(t => templateMap[(t.category || '').toLowerCase().trim()] = t);

        const dbSignatories = await prisma.signatory.findMany({ where: { status: 1 } });
        const signatoryMap = {};
        dbSignatories.forEach(s => signatoryMap[(s.name || '').toLowerCase().trim()] = {
          name: s.name,
          designation: s.designation,
          signatureUrl: s.signatureUrl
        });

        for (const [index, row] of certificatesData.entries()) {
          const empName = row['Emp Name'];
          const empCode = row['Emp Code'];
          const category = row['Award Category'];
          const bandType = row['Band Type'];
          const packetName = row['Packet Name'];
          const month = row['Month'];

          const sig1Excel = row['Signatory 1'];
          const sig2Excel = row['Signatory 2'];
          const sig1DesignationExcel = row['Signatory 1 -Designation'];

          try {
            const categoryFromExcel = category ? category.toLowerCase().trim() : '';
            const templateRecord = templateMap[categoryFromExcel];

            if (!templateRecord || !templateRecord.pdfUrl) throw new Error(`Template missing`);
            let templatePath = templateRecord.pdfUrl;
            if (!templatePath.startsWith('/')) templatePath = `/uploads/templates/${templatePath}`;
            
            const mapData = templateRecord.mappingData || {};

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
            }

            // ==========================================
            // 2. DYNAMIC SIGNATURE LOGIC (IMAGE-BASED CENTERING)
            // ==========================================
            const drawSignatureSafely = async (sigName, mapKey, fallbackX, fallbackY, fallbackDesignation = '') => {
              if (!sigName) return; 

              const sigNameClean = sigName.toLowerCase().trim();
              const sigData = signatoryMap[sigNameClean];

              const sigPrintName = sigData ? sigData.name : sigName.trim();
              const sigPrintDesig = sigData && sigData.designation ? sigData.designation : fallbackDesignation;

              const sigSettings = mapData[mapKey] || { x: fallbackX, y: fallbackY, size: 12, color: '#083069' };

              const nameFontSize = sigSettings.size || 12;
              const desigFontSize = Math.max(nameFontSize - 2, 8);
              const sigColor = sigSettings.color ? hexToRgb(sigSettings.color) : defaultColor;
              const sigTextY = sigSettings.y;

              const fixedWidth = 125;
              const fixedHeight = 45;

              // DB wale X ko left edge maan kar, 125px image ke exact center ka point nikala
              const signatureCenterX = sigSettings.x + (fixedWidth / 2);

              // 1. Print Center Aligned Name (Relative to Signature Box)
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
              if (sigData && sigData.signatureUrl) {
                try {
                  let sigPath = sigData.signatureUrl;
                  if (!sigPath.startsWith('/')) sigPath = `/uploads/signatures/${sigPath}`;
                  const sigBuffer = await getFileBuffer(sigPath);
                  let sigImage = sigPath.toLowerCase().endsWith('.png')
                    ? await pdfDoc.embedPng(sigBuffer)
                    : await pdfDoc.embedJpg(sigBuffer);
                  
                  firstPage.drawImage(sigImage, {
                    x: sigSettings.x, // DB ka original X yahan image start karne ke liye use hoga
                    y: sigTextY + 5,
                    width: fixedWidth, height: fixedHeight
                  });
                } catch (imgErr) {
                  console.error(`Image Embed Failed for ${sigPrintName}`);
                }
              }
            };

            await drawSignatureSafely(sig1Excel, 'signature1', 160, 80, sig1DesignationExcel);
            await drawSignatureSafely(sig2Excel, 'signature2', width - 160, 80, '');

            const pdfBytes = await pdfDoc.save();

            const folderBand = bandType ? String(bandType).trim() : 'General_Band';
            const folderCategory = category ? String(category).trim() : 'General_Category';
            const folderPacket = packetName ? String(packetName).trim() : 'Default_Packet';

            const fileNameInZip = `${folderBand}/${folderCategory}/${folderPacket}/${empName}_${empCode}.pdf`;

            // Note: Generate PDFs in memory only, without saving to database
            archive.append(Buffer.from(pdfBytes), { name: fileNameInZip });
            successCount++;

          } catch (rowErr) {
            errorCount++;
          }
        }

        await archive.finalize();

      } catch (globalErr) {
        archive.abort();
        writer.abort(globalErr);
      }
    })();

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Bulk_Certificates.zip"`,
      },
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}