// =========================================================
// 5S Excel schema — matches "5S APP.xlsx" exactly.
//
// The raw file layout:
//   Row 1 : column letters (garbage from Excel export) → SKIP
//   Row 2 : real header names                            → HEADER ROW
//   Row 3+: data
//
// The real header is 20 metadata columns + 26 blocks of:
//   [Question] [Points - Q] [Feedback - Q] [Action] [Points - Action] [Feedback - Action]
// with small order variations on Q1 and a few others — we ignore those
// by reading header names positionally.
// =========================================================

// 20 metadata columns, in the exact order of the file
export const META_HEADERS = [
  "ID",
  "Heure de début",
  "Heure de fin",
  "Adresse de messagerie",
  "Nom",
  "Total points",
  "Quiz feedback",
  "Heure de la dernière modification",
  "Date",                       // ← no trailing space in the real file
  "Points - Date",
  "Feedback - Date",
  "Auditeur",
  "Points - Auditeur",
  "Feedback - Auditeur",
  "Zone/Ligne",
  "Points - Zone/Ligne",
  "Feedback - Zone/Ligne",
  "Pilot de zone",
  "Points - Pilot de zone",
  "Feedback - Pilot de zone",
];

// The 26 questions in order, with their pillar and short label.
// Column positions are computed dynamically at parse time.
export const QUESTIONS_5S = [
  { index: 1,  pillar: "1S", pillarName: "Seiri (Trier)",          short: "Pas d'objets inutiles" },
  { index: 2,  pillar: "1S", pillarName: "Seiri (Trier)",          short: "Pas d'affichages inutiles" },
  { index: 3,  pillar: "1S", pillarName: "Seiri (Trier)",          short: "Équipements partagés dans espace commun" },
  { index: 4,  pillar: "1S", pillarName: "Seiri (Trier)",          short: "Pas de risque sécurité" },
  { index: 5,  pillar: "1S", pillarName: "Seiri (Trier)",          short: "Emplacement des éléments mobiles" },

  { index: 6,  pillar: "2S", pillarName: "Seiton (Ranger)",        short: "Objets fréquents à proximité" },
  { index: 7,  pillar: "2S", pillarName: "Seiton (Ranger)",        short: "Chaque chose à sa place" },
  { index: 8,  pillar: "2S", pillarName: "Seiton (Ranger)",        short: "État standard des objets" },
  { index: 9,  pillar: "2S", pillarName: "Seiton (Ranger)",        short: "Marquage au sol" },
  { index: 10, pillar: "2S", pillarName: "Seiton (Ranger)",        short: "Accès libre matériel incendie" },

  { index: 11, pillar: "3S", pillarName: "Seiso (Nettoyer)",       short: "Zone de travail propre" },
  { index: 12, pillar: "3S", pillarName: "Seiso (Nettoyer)",       short: "Sources de saleté détectées" },
  { index: 13, pillar: "3S", pillarName: "Seiso (Nettoyer)",       short: "Kit de nettoyage disponible" },
  { index: 14, pillar: "3S", pillarName: "Seiso (Nettoyer)",       short: "Tri sélectif respecté" },

  { index: 15, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Lieu de stockage identifié" },
  { index: 16, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Standards Visuel 5S respectés" },
  { index: 17, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Objets/contenants identifiés" },
  { index: 18, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Instructions nettoyage/tri" },
  { index: 19, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Marquage zones/canalisations" },
  { index: 20, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Standard kit nettoyage" },
  { index: 21, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Affichage standard EPI" },

  { index: 22, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Standards connus et respectés" },
  { index: 23, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Planning 5S respecté" },
  { index: 24, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Port des EPI" },
  { index: 25, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Tableau de marche à jour" },
  { index: 26, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Flux de production respecté" },
];

// =========================================================
// Header row offset — the real headers live on row 2 in the 5S file
// =========================================================
export const HEADER_ROW_INDEX = 1; // 0 = first row = garbage column letters

// =========================================================
// Parse one raw 5S row using *positional* header lookup.
//
// rawRow      : the object produced by XLSX.utils.sheet_to_json
// headers     : the array of real headers (in order)
// =========================================================
export function normalize5SRow(rawRow, headers) {
  // Build a positional lookup: for each header string, find its column index
  const colOf = {};
  headers.forEach((h, i) => {
    if (colOf[h] === undefined) colOf[h] = i;
  });

  // Grab the row values in positional order
  const values = headers.map((h) => rawRow[h]);

  // ----- Metadata -----
  const get = (name) => {
    const i = colOf[name];
    return i === undefined ? "" : values[i];
  };

  const meta = {
    id: toStr(get("ID")),
    startTime: toStr(get("Heure de début")),
    endTime: toStr(get("Heure de fin")),
    email: toStr(get("Adresse de messagerie")),
    name: toStr(get("Nom")),
    totalPoints: toNum(get("Total points")),
    quizFeedback: toStr(get("Quiz feedback")),
    lastModified: toStr(get("Heure de la dernière modification")),
    date: toStr(get("Date")),
    auditor: toStr(get("Auditeur")),
    zone: toStr(get("Zone/Ligne")),
    zoneLeader: toStr(get("Pilot de zone")),
  };

  // ----- Answers: read 26 blocks starting at column 20 -----
  // Each block is 6 columns:
  //   Question | Points - Q | Feedback - Q | Action | Points - Action | Feedback - Action
  // We only need Points, Feedback, Action, Action Points (Feedback of action is dropped).
  const FIRST_QUESTION_COL = 20;
  const BLOCK = 6;

  const answers = QUESTIONS_5S.map((q, idx) => {
    const base = FIRST_QUESTION_COL + idx * BLOCK;
    const questionCol = values[base];             // raw question text
    const points = toNum(values[base + 1]);       // Points - Q
    const feedback = toStr(values[base + 2]);     // Feedback - Q
    const action = toStr(values[base + 3]);       // Action
    const actionPoints = toNum(values[base + 4]); // Points - Action

    return {
      index: q.index,
      pillar: q.pillar,
      pillarName: q.pillarName,
      short: q.short,
      question: questionCol ? String(questionCol) : q.short,
      points,
      feedback,
      action,
      actionPoints,
    };
  });

  // ----- Per-pillar aggregation -----
  const pillarScores = {};
  ["1S", "2S", "3S", "4S", "5S"].forEach((p) => {
    const items = answers.filter((a) => a.pillar === p);
    const total = items.reduce((s, a) => s + (a.points || 0), 0);
    pillarScores[p] = {
      points: total,
      count: items.length,
      average: items.length ? +(total / items.length).toFixed(2) : 0,
    };
  });

  return { meta, answers, pillarScores };
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
