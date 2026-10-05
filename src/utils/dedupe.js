import { database } from "../firebase/config";
import { ref, get, push } from "firebase/database";

export function sig5S(row, normalized) {
  const date = String(
    normalized?.meta?.date ?? row["Date"] ?? row["Date "] ?? ""
  ).trim();
  const startTime = String(
    normalized?.meta?.startTime ?? row["Heure de début"] ?? ""
  ).trim();
  const zone = String(
    normalized?.meta?.zone ?? row["Zone/Ligne"] ?? row["Zone_Ligne"] ?? ""
  ).trim();
  const auditor = String(
    normalized?.meta?.auditor ?? row["Auditeur"] ?? ""
  ).trim();
  return [date, startTime, zone, auditor].join("||");
}

// NEW: signature Gemba — 11 colonnes maintenant
// [0]Date [1]Ligne [2]UAP [3]Auditeur [4]PointM [5]Question [6]Réponse ...
export function sigGemba(row, headers) {
  if (headers && headers.length) {
    const v = headers.map((h) => row[h]);
    const date     = String(v[0] ?? "").trim();
    const ligne    = String(v[1] ?? "").trim();
    const auditeur = String(v[3] ?? "").trim();
    const pointM   = String(v[4] ?? "").trim();
    const question = String(v[5] ?? "").trim();
    const reponse  = String(v[6] ?? "").trim();
    return [date, ligne, auditeur, pointM, question, reponse].join("||");
  }
  const date     = String(row["Date"] ?? "").trim();
  const ligne    = String(row["Ligne"] ?? "").trim();
  const auditeur = String(row["Auditeur"] ?? "").trim();
  const pointM   = String(row["Point M"] ?? "").trim();
  const question = String(row["Question"] ?? "").trim();
  const reponse  = String(row["Réponse"] ?? "").trim();
  return [date, ligne, auditeur, pointM, question, reponse].join("||");
}

export async function importWithDedupe({ rows, path, sigFn, transformFn }) {
  const rootRef = ref(database, path);
  const snap = await get(rootRef);
  const existing = new Set();
  const val = snap.val() || {};
  Object.values(val).forEach((rec) => {
    if (rec && rec._sig) existing.add(rec._sig);
  });
  const seenInBatch = new Set();
  let inserted = 0;
  let skipped = 0;
  const promises = [];
  rows.forEach((row) => {
    const sig = sigFn(row);
    if (existing.has(sig) || seenInBatch.has(sig)) {
      skipped++;
      return;
    }
    seenInBatch.add(sig);
    const payload = transformFn(row, sig);
    promises.push(push(rootRef, payload));
    inserted++;
  });
  await Promise.all(promises);
  return { inserted, skipped, total: rows.length };
}