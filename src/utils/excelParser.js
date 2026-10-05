import * as XLSX from "xlsx";

/**
 * Read an Excel/CSV file.
 * headerRowIndex: which 0-based row contains the real header names.
 *   0 → use row 1 as header (default, most exports)
 *   1 → skip row 1 (garbage), use row 2 as header (5S APP.xlsx case)
 *
 * Every cell is converted:
 *   - Excel serial date numbers → "YYYY-MM-DD" string
 *   - Real Excel date objects  → "YYYY-MM-DD" string
 *   - Everything else          → original value
 */
export function readExcelFile(file, headerRowIndex = 0) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        // cellDates: true makes SheetJS return JS Date objects for date cells
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Array-of-arrays
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

        const rawHeaders = aoa[headerRowIndex] || [];

        // Deduplicate headers
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

        const dataRows = aoa.slice(headerRowIndex + 1);
        const rows = dataRows
          .filter((r) => Array.isArray(r) && r.some((v) => v !== "" && v !== null && v !== undefined))
          .map((r) => {
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = normalizeCell(r[i]);
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
 * Convert a cell value:
 *  - JS Date      → "YYYY-MM-DD"
 *  - Excel serial → "YYYY-MM-DD"  (only if it looks like a plausible date, 1990..2100)
 *  - string/number/other → unchanged
 */
function normalizeCell(v) {
  if (v === null || v === undefined || v === "") return "";

  if (v instanceof Date && !isNaN(v)) {
    return toISODate(v);
  }

  if (typeof v === "number") {
    // Excel serial date: plausible range 1990-01-01 (32874) to 2100-12-31 (73415)
    if (v > 32874 && v < 73415 && Number.isInteger(v)) {
      const ms = (v - 25569) * 86400 * 1000;
      const d = new Date(ms);
      if (!isNaN(d)) return toISODate(d);
    }
  }

  return v;
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
