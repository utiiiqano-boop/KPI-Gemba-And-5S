import * as XLSX from "xlsx";

/**
 * Détecte automatiquement la ligne d'en-tête réelle.
 * Renvoie l'index de la 1ère ligne qui ressemble à un en-tête
 * (au moins 3 cellules non vides ET dont au moins 1 contient "ID" ou "Date" ou "Total").
 */
function autoDetectHeaderRow(aoa) {
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const row = aoa[i];
    if (!Array.isArray(row)) continue;
    const nonEmpty = row.filter((c) => c !== "" && c !== null && c !== undefined).length;
    const asStr = row.map((c) => String(c || "")).join("|");
    if (nonEmpty >= 3 && /ID|Date|Total|Auditeur|Heure/i.test(asStr)) {
      return i;
    }
  }
  return 0;
}

export function readExcelFile(file, headerRowIndex = "auto") {
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

        // Auto-détection si headerRowIndex = "auto"
        const realIndex = headerRowIndex === "auto"
          ? autoDetectHeaderRow(aoa)
          : headerRowIndex;

        console.log("[excelParser] Detected header row index:", realIndex);
        console.log("[excelParser] Sample of that row:", aoa[realIndex]?.slice(0, 25));

        const rawHeaders = aoa[realIndex] || [];

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

        const dataRows = aoa.slice(realIndex + 1);
        const rows = dataRows
          .filter((r) => Array.isArray(r) && r.some((v) => v !== "" && v !== null && v !== undefined))
          .map((r) => {
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = normalizeCell(r[i]);
            });
            return obj;
          });

        resolve({ sheetName, sheetNames: workbook.SheetNames, rows, headers, headerRowIndex: realIndex });
      } catch (err) {
        console.error("readExcelFile error:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function normalizeCell(v) {
  if (v === null || v === undefined || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return toISODateUTC(v);
  if (typeof v === "number") {
    if (v > 32874 && v < 73415 && Number.isInteger(v)) {
      const ms = (v - 25569) * 86400 * 1000;
      const d = new Date(ms);
      if (!isNaN(d)) return toISODateUTC(d);
    }
  }
  return v;
}

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
