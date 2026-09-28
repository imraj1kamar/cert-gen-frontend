// import * as XLSX from 'xlsx';

// export const parseAndValidateExcel = async (file, dbTemplates = [], dbSignatories = []) => {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();

//     reader.onload = (e) => {
//       try {
//         const data = new Uint8Array(e.target.result);
//         const workbook = XLSX.read(data, { type: 'array' });
//         const sheetName = workbook.SheetNames[0]; 
//         const worksheet = workbook.Sheets[sheetName];
//         const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); 

//         if (rows.length === 0) {
//           throw new Error("Excel file is empty.");
//         }

//         // 1. Required Headers Check (Designation removed, only Month & Sig 1 Designation kept)
//         const requiredHeaders = [
//           "Emp Code", 
//           "Emp Name", 
//           "Month",                
//           "Award Category", 
//           "Band Type", 
//           "Signatory 1", 
//           "Signatory 1 -Designation", 
//           "Signatory 2"
//         ];
        
//         // Exact matching for headers mapping (trimming spaces to avoid errors)
//         const actualHeaders = Object.keys(rows[0]).map(h => h.trim());
//         const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h.trim()));

//         if (missingHeaders.length > 0) {
//           throw new Error(`Missing required columns: ${missingHeaders.join(", ")}. Please check your Excel column names.`);
//         }

//         // DB Data Extraction 
//         const dbCategoryNames = dbTemplates.map(t => (t.category || t.templateName || "").trim().toLowerCase());
        
//         const dbSignatoryMap = {};
//         dbSignatories.forEach(s => {
//             const name = (s.name || "").trim().toLowerCase();
//             const designation = (s.designation || "").trim().toLowerCase();
//             dbSignatoryMap[name] = designation;
//         });

//         let errors = [];
//         let warnings = [];
//         let validRecords = [];

//         // 2. Row-by-Row Tiered Validation
//         rows.forEach((row, index) => {
//           const rowNum = index + 2; 
//           let rowErrors = [];
//           let rowWarnings = [];

//           const getVal = (key) => {
//              const foundKey = Object.keys(row).find(k => k.trim() === key);
//              return foundKey ? String(row[foundKey]).trim() : "";
//           };

//           const empName = getVal("Emp Name");
//           const empCode = getVal("Emp Code");
//           const month = getVal("Month");             
//           const category = getVal("Award Category");
//           const sig1 = getVal("Signatory 1");
//           const sig1Desig = getVal("Signatory 1 -Designation"); 
//           const sig2 = getVal("Signatory 2");

//           // --- Critical Errors (Red - Halts Generation) ---
//           if (!empName) rowErrors.push(`Row ${rowNum}: Employee Name is missing.`);
//           if (!empCode) rowErrors.push(`Row ${rowNum}: Employee Code is missing.`);
//           if (!month) rowErrors.push(`Row ${rowNum}: Month is missing.`);             
          
//           if (!category) {
//             rowErrors.push(`Row ${rowNum}: Award Category is missing.`);
//           } else if (!dbCategoryNames.includes(category.toLowerCase())) {
//             rowErrors.push(`Row ${rowNum}: Category '${category}' not found in Database Templates.`);
//           }

//           // --- Soft Warnings (Yellow - Can be bypassed) ---
//           if (!sig1 && !sig2) {
//             rowWarnings.push(`Row ${rowNum}: Both Signatories are empty.`);
//           } else {
//             // Check for Signatory 1
//             if (sig1) {
//               const sig1Lower = sig1.toLowerCase();
              
//               if (!(sig1Lower in dbSignatoryMap)) {
//                 rowWarnings.push(`Row ${rowNum}: Signatory 1 '${sig1}' not found in Database.`);
//               } else {
//                 const expectedDbDesig = dbSignatoryMap[sig1Lower];
                
//                 if (!sig1Desig) {
//                    rowWarnings.push(`Row ${rowNum}: Signatory 1 -Designation is missing for '${sig1}' in Excel.`);
//                 } else if (sig1Desig.toLowerCase() !== expectedDbDesig) {
//                    rowWarnings.push(`Row ${rowNum}: Signatory 1 Designation mismatch! Excel says '${sig1Desig}', but DB says '${expectedDbDesig || "Empty"}'.`);
//                 }
//               }
//             }
            
//             // Check for Signatory 2
//             if (sig2) {
//                 if (!(sig2.toLowerCase() in dbSignatoryMap)) {
//                     rowWarnings.push(`Row ${rowNum}: Signatory 2 '${sig2}' not found in Database.`);
//                 }
//             }
//           }

//           if (rowErrors.length > 0) {
//             errors.push(...rowErrors);
//           }

//           if (rowWarnings.length > 0) {
//             warnings.push(...rowWarnings);
//           }

//           row._hasWarnings = rowWarnings.length > 0;
//           validRecords.push(row);
//         });

//         // 3. Final Decision
//         const isValid = errors.length === 0;

//         resolve({
//           isValid,
//           errors,     
//           warnings,   
//           summary: {
//             totalRecords: rows.length,
//             errorCount: errors.length,
//             warningCount: warnings.length,
//           },
//           records: validRecords,
//         });

//       } catch (error) {
//         reject(error);
//       }
//     };

//     reader.onerror = () => reject(new Error("Failed to read the file."));
//     reader.readAsArrayBuffer(file);
//   });
// };


import * as XLSX from 'xlsx';

export const parseAndValidateExcel = async (file, dbTemplates = [], dbSignatories = []) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; 
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); 

        if (rows.length === 0) {
          throw new Error("Excel file is empty.");
        }

        const requiredHeaders = [
          "Emp Code", 
          "Emp Name", 
          "Month",                
          "Award Category", 
          "Band Type", 
          "Signatory 1", 
          "Signatory 1 -Designation", 
          "Signatory 2"
        ];
        
        const actualHeaders = Object.keys(rows[0]).map(h => h.trim());
        const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h.trim()));

        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(", ")}. Please check your Excel column names.`);
        }

        const dbCategoryNames = dbTemplates.map(t => (t.category || t.templateName || "").trim().toLowerCase());
        
        const dbSignatoryMap = {};
        dbSignatories.forEach(s => {
            const name = (s.name || "").trim().toLowerCase();
            const designation = (s.designation || "").trim().toLowerCase();
            dbSignatoryMap[name] = designation;
        });

        let errors = [];
        let warnings = [];
        let validRecords = [];
        
        // ✨ Naya Logic: Bands aur Categories ko count karne ke liye
        let bandsCount = {};
        let categoriesCount = {};

        rows.forEach((row, index) => {
          const rowNum = index + 2; 
          let rowErrors = [];
          let rowWarnings = [];

          const getVal = (key) => {
             const foundKey = Object.keys(row).find(k => k.trim() === key);
             return foundKey ? String(row[foundKey]).trim() : "";
          };

          const empName = getVal("Emp Name");
          const empCode = getVal("Emp Code");
          const month = getVal("Month");             
          const category = getVal("Award Category");
          const bandType = getVal("Band Type"); // Band type fetch kiya
          const sig1 = getVal("Signatory 1");
          const sig1Desig = getVal("Signatory 1 -Designation"); 
          const sig2 = getVal("Signatory 2");

          if (!empName) rowErrors.push(`Row ${rowNum}: Employee Name is missing.`);
          if (!empCode) rowErrors.push(`Row ${rowNum}: Employee Code is missing.`);
          if (!month) rowErrors.push(`Row ${rowNum}: Month is missing.`);             
          
          if (!category) {
            rowErrors.push(`Row ${rowNum}: Award Category is missing.`);
          } else if (!dbCategoryNames.includes(category.toLowerCase())) {
            rowErrors.push(`Row ${rowNum}: Category '${category}' not found in Database Templates.`);
          } else {
             // Agar category theek hai, toh usko count karo
             categoriesCount[category] = (categoriesCount[category] || 0) + 1;
          }

          if (bandType) {
              // Band count karo
              bandsCount[bandType] = (bandsCount[bandType] || 0) + 1;
          }

          if (!sig1 && !sig2) {
            rowWarnings.push(`Row ${rowNum}: Both Signatories are empty.`);
          } else {
            if (sig1) {
              const sig1Lower = sig1.toLowerCase();
              if (!(sig1Lower in dbSignatoryMap)) {
                rowWarnings.push(`Row ${rowNum}: Signatory 1 '${sig1}' not found in Database.`);
              } else {
                const expectedDbDesig = dbSignatoryMap[sig1Lower];
                if (!sig1Desig) {
                   rowWarnings.push(`Row ${rowNum}: Signatory 1 -Designation is missing for '${sig1}' in Excel.`);
                } else if (sig1Desig.toLowerCase() !== expectedDbDesig) {
                   rowWarnings.push(`Row ${rowNum}: Signatory 1 Designation mismatch! Excel says '${sig1Desig}', but DB says '${expectedDbDesig || "Empty"}'.`);
                }
              }
            }
            
            if (sig2) {
                if (!(sig2.toLowerCase() in dbSignatoryMap)) {
                    rowWarnings.push(`Row ${rowNum}: Signatory 2 '${sig2}' not found in Database.`);
                }
            }
          }

          if (rowErrors.length > 0) errors.push(...rowErrors);
          if (rowWarnings.length > 0) warnings.push(...rowWarnings);

          row._hasWarnings = rowWarnings.length > 0;
          validRecords.push(row);
        });

        const isValid = errors.length === 0;

        resolve({
          isValid,
          errors,     
          warnings,   
          summary: {
            totalRecords: rows.length,
            errorCount: errors.length,
            warningCount: warnings.length,
            bands: bandsCount,           // ✨ UI ko bheja
            categories: categoriesCount  // ✨ UI ko bheja
          },
          records: validRecords,
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the file."));
    reader.readAsArrayBuffer(file);
  });
};