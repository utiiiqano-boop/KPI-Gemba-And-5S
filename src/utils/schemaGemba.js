// =========================================================
// Gemba OJT schema — matches "Gemba app.xlsx"
//
// Header row 1:
//   Date | UAP | Ligne | UAP | Auditeur | Point M | Question |
//   Réponse | Action Corrective | Pilote | Date Action | Score (%)
//
// NOTE: "UAP" appears twice. SheetJS renames the second to "UAP_1".
// We keep both (uap and uap2) so nothing is lost.
// =========================================================

export const HEADER_ROW_INDEX = 0;

export const GEMBA_HEADERS = [
  "Date",
  "UAP",        // first UAP column
  "Ligne",
  "UAP_1",      // SheetJS duplicate-rename for the 2nd "UAP"
  "Auditeur",
  "Point M",
  "Question",
  "Réponse",
  "Action Corrective",
  "Pilote",
  "Date Action",
  "Score (%)",
];

export function normalizeGembaRow(rawRow) {
  const get = (name) => rawRow[name];

  return {
    date: toStr(get("Date")),
    uap: toStr(get("UAP")),
    ligne: toStr(get("Ligne")),
    uap2: toStr(get("UAP_1")),         // the 2nd UAP column (kept for reference)
    auditeur: toStr(get("Auditeur")),
    pointM: toStr(get("Point M")),
    question: toStr(get("Question")),
    reponse: toStr(get("Réponse")),
    actionCorrective: toStr(get("Action Corrective")),
    pilote: toStr(get("Pilote")),
    dateAction: toStr(get("Date Action")),
    score: toNum(get("Score (%)")),
  };
}

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function toNum(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(",", ".").replace("%", ""));
  return isNaN(n) ? 0 : n;
}
