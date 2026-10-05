// =========================================================
// Dashboard configuration
// =========================================================

export const PLAN = {
  "5S": 5,
  GEMBA: 5,
};

// UAP 1 — zones fixes
export const ZONES_UAP1 = new Set([
  "F01", "F02", "F83", "F99", "F86", "F85", "L76", "L77",
]);

// Logistique — toute zone contenant "magasin" (insensible à la casse)
export function isLogistique(zone) {
  return /magasin/i.test(String(zone || ""));
}

// Détermine l'UAP d'une zone 5S
export function zoneToUap(zone) {
  const z = String(zone || "").trim();
  if (!z || z === "—") return null;
  if (ZONES_UAP1.has(z)) return "UAP 1";
  if (isLogistique(z)) return "Logistique";
  return "UAP 2";   // tout le reste → UAP 2
}

export const PILLARS_5S = ["1S", "2S", "3S", "4S", "5S"];

export const POINTS_5M = [
  "Méthode", "Matière", "Main d'oeuvre",
  "Milieu", "Maintenance Machine",
  "Identification", "Chariot élévateur",
];

export const UAPS = ["UAP 1", "UAP 2", "Logistique"];

// Normalise a Gemba UAP string → "UAP 1" | "UAP 2" | "Logistique"
export function normalizeUapGemba(uap) {
  const u = String(uap || "").trim().toLowerCase();
  if (!u) return null;
  if (u.includes("logist")) return "Logistique";
  if (u.includes("uap 1") || u.includes("uap1")) return "UAP 1";
  if (u.includes("uap 2") || u.includes("uap2")) return "UAP 2";
  return null;
}
