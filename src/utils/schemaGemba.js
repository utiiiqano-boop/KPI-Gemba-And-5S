// =========================================================
// Gemba OJT schema — mapping POSITIONNEL (par index)
//
// Structure vérifiée du fichier "Gemba app.xlsx" :
//   [0] A: Date
//   [1] B: Ligne
//   [2] C: UAP
//   [3] D: Auditeur
//   [4] E: Point M
//   [5] F: Question
//   [6] G: Réponse
//   [7] H: Action Corrective
//   [8] I: Pilote
//   [9] J: Date Action
//   [10] K: Score (%)
// =========================================================

export const HEADER_ROW_INDEX = 0;

export const GEMBA_HEADERS = [
  "Date",
  "Ligne",
  "UAP",
  "Auditeur",
  "Point M",
  "Question",
  "Réponse",
  "Action Corrective",
  "Pilote",
  "Date Action",
  "Score (%)",
];

export function normalizeGembaRow(rawRow, headers = GEMBA_HEADERS) {
  const v = headers.map((h) => rawRow[h]);

  return {
    date:             toStr(v[0]),
    ligne:            toStr(v[1]),
    uap:              toStr(v[2]),
    auditeur:         toStr(v[3]),
    pointM:           toStr(v[4]),
    question:         toStr(v[5]),
    reponse:          toStr(v[6]),
    actionCorrective: toStr(v[7]),
    pilote:           toStr(v[8]),
    dateAction:       toStr(v[9]),
    score:            toNum(v[10]),
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