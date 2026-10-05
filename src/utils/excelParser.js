import * as XLSX from "xlsx";

/**
 * Read an Excel/CSV file.
 * headerRowIndex : index 0-based de la ligne d'en-tête
 *   0 → ligne 1 = en-tête (Gemba)
 *   1 → ligne 2 = en-tête (5S, ligne 1 = lettres A B C)
 */
export function readExcelFile(file, headerRowIndex = 0) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

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
 * Convertit un nombre de série Excel en date ISO (UTC, pas de décalage).
 * Corrige le bug : "2026-10-04" au lieu de "2026-10-05".
 */
function normalizeCell(v) {
  if (v === null || v === undefined || v === "") return "";

  if (v instanceof Date && !isNaN(v)) {
    return toISODateUTC(v);
  }

  if (typeof v === "number") {
    // Plage 1990-2100
    if (v > 32874 && v < 73415 && Number.isInteger(v)) {
      const ms = (v - 25569) * 86400 * 1000;
      const d = new Date(ms);
      if (!isNaN(d)) return toISODateUTC(d);
    }
  }

  return v;
}

/**
 * Format ISO en UTC pour éviter tout décalage de fuseau horaire.
 * C'est LE fix qui règle le décalage d'un jour (2026-10-04 → 2026-10-05).
 */
function toISODateUTC(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function downloadExcel(rows, filename = "export.xlsx", sheetName = "Sheet1") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}