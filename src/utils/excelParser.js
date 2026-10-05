import * as XLSX from "xlsx";

/**
 * Read an Excel/CSV file.
 * headerRowIndex: which 0-based row contains the real header names.
 *   0 → use row 1 as header (default, most exports)
 *   1 → skip row 1 (garbage), use row 2 as header (5S APP.xlsx case)
 */
export function readExcelFile(file, headerRowIndex = 0) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 1. Convert the whole sheet to array-of-arrays
        const aoa = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          blankrows: false,
          raw: true,
        });

        if (!aoa.length) {
          resolve({ sheetName, sheetNames: workbook.SheetNames, rows: [], headers: [] });
          return;
        }

        // 2. Extract the raw header row
        const rawHeaders = aoa[headerRowIndex] || [];

        // 3. De-duplicate header names  (UAP, UAP_1, UAP_2, …)
        //    NOTE: use rawHeaders.length here — `headers` isn't built yet.
        const seen = {};
        const headers = rawHeaders.map((h, idx) => {
          let key = String(h ?? "").trim();
          if (key === "") key = `_col_${idx}`;
          if (seen[key] === undefined) {
            seen[key] = 0;
            return key;
          }
          seen[key] += 1;
          return `${key}_${seen[key]}`;
        });

        // 4. Build row objects from every row AFTER the header
        const dataRows = aoa.slice(headerRowIndex + 1);
        const rows = dataRows
          .filter((r) => Array.isArray(r) && r.some((v) => v !== "" && v !== null && v !== undefined))
          .map((r) => {
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = r[i] ?? "";
            });
            return obj;
          });

        resolve({
          sheetName,
          sheetNames: workbook.SheetNames,
          rows,
          headers,
        });
      } catch (err) {
        console.error("readExcelFile error:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download rows as an Excel file.
 */
export function downloadExcel(rows, filename = "export.xlsx", sheetName = "Sheet1") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
