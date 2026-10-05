// =========================================================
// Uniqueness checks against Firebase RTDB before import
// =========================================================
import { database } from "../firebase/config";
import { ref, get, push, serverTimestamp } from "firebase/database";

/**
 * Compute a stable signature for a 5S record.
 * Prefers the normalized meta fields; falls back to raw Excel columns.
 */
export function sig5S(row, normalized) {
  const id = String(
    normalized?.meta?.id ??
    row["ID"] ??
    ""
  ).trim();

  const date = String(
    normalized?.meta?.date ??
    row["Date"] ??
    row["Date "] ??
    row["Heure de début"] ??
    ""
  ).trim();

  const zone = String(
    normalized?.meta?.zone ??
    row["Zone/Ligne"] ??
    row["Zone_Ligne"] ??
    ""
  ).trim();

  const auditor = String(
    normalized?.meta?.auditor ??
    row["Auditeur"] ??
    ""
  ).trim();

  return [id, date, zone, auditor].join("||");
}

/** Signature for a Gemba record. */
export function sigGemba(row) {
  const date = String(row["Date"] ?? "").trim();
  const uap = String(row["UAP"] ?? "").trim();
  const ligne = String(row["Ligne"] ?? "").trim();
  const auditeur = String(row["Auditeur"] ?? "").trim();
  const pointM = String(row["Point M"] ?? "").trim();
  const question = String(row["Question"] ?? "").trim();
  return [date, uap, ligne, auditeur, pointM, question].join("||");
}

/**
 * Load all existing signatures for a collection.
 * Reads the entire node once (fine for a few thousand records).
 */
export async function loadExistingSignatures(path, sigFn, keyField = "_sig") {
  const snap = await get(ref(database, path));
  const val = snap.val() || {};
  const set = new Set();
  Object.values(val).forEach((rec) => {
    if (rec && rec[keyField]) set.add(rec[keyField]);
  });
  return set;
}

/**
 * Import rows skipping duplicates.
 *
 * rows        : the normalized-or-raw rows to import
 * path        : "5s_audits" | "gemba_ojt"
 * sigFn       : (row) => string       — signature builder
 * transformFn : (row) => object       — returns the object to push (must include _sig)
 *
 * Returns { inserted, skipped, total }
 */
export async function importWithDedupe({ rows, path, sigFn, transformFn }) {
  const rootRef = ref(database, path);

  // 1. Fetch existing signatures (single read)
  const snap = await get(rootRef);
  const existing = new Set();
  const val = snap.val() || {};
  Object.values(val).forEach((rec) => {
    if (rec && rec._sig) existing.add(rec._sig);
  });

  // 2. Also dedupe within the incoming batch itself
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
