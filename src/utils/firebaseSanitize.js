// =========================================================
// Firebase Realtime Database requires keys to be non-empty
// strings without: . # $ / [ ] and no control chars.
// This helper recursively sanitizes an object's keys.
// =========================================================

const FORBIDDEN = /[.#$\/\[\]]/g;

export function sanitizeKey(key) {
  if (key === null || key === undefined) return "_";
  let k = String(key);
  // Replace forbidden chars with underscore
  k = k.replace(FORBIDDEN, "_");
  // Replace control characters
  k = k.replace(/[\u0000-\u001F\u007F]/g, "");
  // Trim (leading/trailing spaces are allowed in RTDB but ugly)
  k = k.trim();
  // Firebase requires non-empty key
  if (!k) k = "_";
  // Optional: cap length so the DB stays tidy
  if (k.length > 200) k = k.slice(0, 200);
  return k;
}

export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj !== "object") return obj;

  const out = {};
  const usedKeys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    let sk = sanitizeKey(k);
    // Handle collisions after sanitization (e.g. "A/B" and "A_B")
    if (usedKeys.has(sk)) {
      let i = 2;
      while (usedKeys.has(`${sk}_${i}`)) i++;
      sk = `${sk}_${i}`;
    }
    usedKeys.add(sk);
    out[sk] = sanitizeObject(v);
  }
  return out;
}
