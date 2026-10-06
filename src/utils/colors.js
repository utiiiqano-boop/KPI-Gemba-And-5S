// =========================================================
// Helper de couleur pour les scores
//   0-80%  → ROUGE
//   81-85% → ORANGE
//   86%+   → VERT
// =========================================================

export const SCORE_COLORS = {
  red:    "#ef4444",   // <= 80
  orange: "#f59e0b",   // 81-85
  green:  "#22c55e",   // >= 86
};

export function scoreColor(score) {
  const s = Number(score ?? 0);
  if (s <= 80) return SCORE_COLORS.red;
  if (s <= 85) return SCORE_COLORS.orange;
  return SCORE_COLORS.green;
}
