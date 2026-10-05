// =========================================================
// 5S Excel schema — aligned to "5S APP.xlsx"
// Le fichier a 2 lignes d'en-tête : ligne 1 = lettres, ligne 2 = vrais noms
// Les colonnes Points/Feedback varient d'ordre selon la question → on
// identifie chaque colonne PAR SON NOM dans chaque bloc de 6.
// =========================================================

export const HEADER_ROW_INDEX = 1;

export const META_HEADERS = [
  "ID",
  "Heure de début",
  "Heure de fin",
  "Adresse de messagerie",
  "Nom",
  "Total points",
  "Quiz feedback",
  "Heure de la dernière modification",
  "Date",
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

export const QUESTIONS_5S = [
  { index: 1,  pillar: "1S", pillarName: "Seiri (Trier)",           short: "Pas d'objets inutiles" },
  { index: 2,  pillar: "1S", pillarName: "Seiri (Trier)",           short: "Pas d'affichages inutiles" },
  { index: 3,  pillar: "1S", pillarName: "Seiri (Trier)",           short: "Équipements partagés espace commun" },
  { index: 4,  pillar: "1S", pillarName: "Seiri (Trier)",           short: "Pas de risque sécurité" },
  { index: 5,  pillar: "1S", pillarName: "Seiri (Trier)",           short: "Emplacement éléments mobiles" },
  { index: 6,  pillar: "2S", pillarName: "Seiton (Ranger)",         short: "Objets fréquents à proximité" },
  { index: 7,  pillar: "2S", pillarName: "Seiton (Ranger)",         short: "Chaque chose à sa place" },
  { index: 8,  pillar: "2S", pillarName: "Seiton (Ranger)",         short: "État standard des objets" },
  { index: 9,  pillar: "2S", pillarName: "Seiton (Ranger)",         short: "Marquage au sol" },
  { index: 10, pillar: "2S", pillarName: "Seiton (Ranger)",         short: "Accès libre incendie" },
  { index: 11, pillar: "3S", pillarName: "Seiso (Nettoyer)",        short: "Zone de travail propre" },
  { index: 12, pillar: "3S", pillarName: "Seiso (Nettoyer)",        short: "Sources de saleté détectées" },
  { index: 13, pillar: "3S", pillarName: "Seiso (Nettoyer)",        short: "Kit de nettoyage dispo" },
  { index: 14, pillar: "3S", pillarName: "Seiso (Nettoyer)",        short: "Tri sélectif respecté" },
  { index: 15, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Lieu de stockage identifié" },
  { index: 16, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Standards Visuel 5S" },
  { index: 17, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Objets/contenants identifiés" },
  { index: 18, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Instructions nettoyage/tri" },
  { index: 19, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Marquage zones/canalisations" },
  { index: 20, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Standard kit nettoyage" },
  { index: 21, pillar: "4S", pillarName: "Seiketsu (Standardiser)", short: "Affichage standard EPI" },
  { index: 22, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Standards connus/respectés" },
  { index: 23, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Planning 5S respecté" },
  { index: 24, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Port des EPI" },
  { index: 25, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Tableau de marche à jour" },
  { index: 26, pillar: "5S", pillarName: "Shitsuke (Respecter)",    short: "Flux de production respecté" },
];

function toDateOnly(v) {
  if (!v) return "";
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s;
}

export function normalize5SRow(rawRow, headers) {
  const values = headers.map((h) => rawRow[h]);

  const dateFromStart = toDateOnly(values[1]);
  const dateFromDate  = toDateOnly(values[8]);

  const meta = {
    id:              toStr(values[0]),
    startTime:       toStr(values[1]),
    endTime:         toStr(values[2]),
    email:           toStr(values[3]),
    name:            toStr(values[4]),
    totalPoints:     toNum(values[5]),
    quizFeedback:    toStr(values[6]),
    lastModified:    toStr(values[7]),
    date:            dateFromStart || dateFromDate,
    auditor:         toStr(values[11]),
    zone:            toStr(values[14]),
    zoneLeader:      toStr(values[17]),
  };

  const FIRST_Q = 20;
  const BLOCK = 6;

  const answers = QUESTIONS_5S.map((q, idx) => {
    const base = FIRST_Q + idx * BLOCK;
    const blockHeaders = headers.slice(base, base + BLOCK);
    const blockValues = values.slice(base, base + BLOCK);

    // On lit CHAQUE colonne par son NOM dans le bloc (l'ordre varie selon Q)
    let questionText = "";
    let points = 0;
    let feedback = "";
    let action = "";
    let actionPoints = 0;
    let actionFeedback = "";
    let status = "N/A";

    for (let j = 0; j < BLOCK; j++) {
      const h = String(blockHeaders[j] || "").trim();
      const v = blockValues[j];

      if (h.startsWith("Points - Action")) {
        actionPoints = toNum(v);
      } else if (h.startsWith("Feedback - Action")) {
        actionFeedback = toStr(v);
      } else if (h.startsWith("Action")) {
        action = toStr(v);
      } else if (h.startsWith("Points - ")) {
        points = toNum(v);
        if (v !== "" && v !== null && v !== undefined) {
          const n = Number(String(v).replace(",", "."));
          if (!isNaN(n)) status = n > 0 ? "OK" : "NOK";
        }
      } else if (h.startsWith("Feedback - ")) {
        feedback = toStr(v);
      } else {
        // Colonne sans préfixe = texte de la question
        questionText = toStr(v);
      }
    }

    return {
      index: q.index,
      pillar: q.pillar,
      pillarName: q.pillarName,
      short: q.short,
      question: questionText || q.short,
      points,
      status,
      feedback,
      action,
      actionPoints,
      actionFeedback,
    };
  });

  const pillarScores = {};
  ["1S", "2S", "3S", "4S", "5S"].forEach((p) => {
    const items = answers.filter((a) => a.pillar === p);
    const pts = items.reduce((s, a) => s + (a.points || 0), 0);
    const ok  = items.filter((a) => a.status === "OK").length;
    const nok = items.filter((a) => a.status === "NOK").length;
    const na  = items.filter((a) => a.status === "N/A").length;
    pillarScores[p] = {
      points: pts,
      count: items.length,
      ok, nok, na,
      applicable: ok + nok,
      score: (ok + nok) ? +((ok / (ok + nok)) * 100).toFixed(1) : 0,
    };
  });

  const ok  = answers.filter((a) => a.status === "OK").length;
  const nok = answers.filter((a) => a.status === "NOK").length;
  const na  = answers.filter((a) => a.status === "N/A").length;
  const applicable = ok + nok;

  return {
    meta,
    answers,
    pillarScores,
    scores: {
      ok, nok, na,
      applicable,
      total: answers.length,
      percent: applicable ? +((ok / applicable) * 100).toFixed(1) : 0,
      rawTotal: meta.totalPoints,
    },
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