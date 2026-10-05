// =========================================================
// Aggregation helpers for 5S + Gemba dashboards
// Tolerant to records missing normalized fields — falls back
// to _raw Excel columns when needed.
// =========================================================

export const PILLARS = ["1S", "2S", "3S", "4S", "5S"];

/** Parse the many date formats we see. Returns null if unparseable. */
export function parseDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

export function yyyymm(d) {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ---------------------------------------------------------
// Tolerant accessors for 5S records
// ---------------------------------------------------------

export function get5SDate(r) {
  return (
    parseDate(r?.meta?.date) ||
    parseDate(r?.meta?.startTime) ||
    parseDate(r?._raw?.Date) ||
    parseDate(r?._raw?.["Date "]) ||
    parseDate(r?._raw?.["Heure_de_début"]) ||
    parseDate(r?._raw?.["Heure de début"]) ||
    null
  );
}

export function get5SZone(r) {
  return (
    r?.meta?.zone ||
    r?._raw?.["Zone_Ligne"] ||
    r?._raw?.["Zone/Ligne"] ||
    r?._raw?.Zone ||
    "—"
  );
}

export function get5SAuditor(r) {
  return (
    r?.meta?.auditor ||
    r?._raw?.Auditeur ||
    r?._raw?.Auditor ||
    "—"
  );
}

export function get5SZoneLeader(r) {
  return (
    r?.meta?.zoneLeader ||
    r?._raw?.["Pilot_de_zone"] ||
    r?._raw?.["Pilot de zone"] ||
    "—"
  );
}

export function get5STotal(r) {
  const v = r?.meta?.totalPoints;
  if (v !== undefined && v !== null && v !== "") return Number(v);
  const raw = r?._raw?.["Total_points"] ?? r?._raw?.["Total points"];
  return Number(raw ?? 0) || 0;
}

/** Tolerant 5S answers — reads from meta.answers, or _raw if missing. */
export function get5SAnswers(r) {
  if (Array.isArray(r?.answers) && r.answers.length) return r.answers;
  return [];
}

export function has5SPillarScores(r) {
  return r?.pillarScores && typeof r.pillarScores === "object";
}

// ---------------------------------------------------------
// 5S aggregations
// ---------------------------------------------------------

export function fiveSRadarByMonth(records, month) {
  const filtered = records.filter((r) => {
    const d = get5SDate(r);
    return d && yyyymm(d) === month;
  });
  return PILLARS.map((p) => {
    const sums = filtered.map((r) => r?.pillarScores?.[p]?.average ?? 0);
    const avg = sums.length ? sums.reduce((a, b) => a + b, 0) / sums.length : 0;
    return { pillar: p, average: +avg.toFixed(2), count: sums.length };
  });
}

/** Fallback radar: derive from answers directly if pillarScores missing. */
export function fiveSRadarFromAnswers(records, month) {
  const filtered = records.filter((r) => {
    const d = get5SDate(r);
    return d && yyyymm(d) === month;
  });
  return PILLARS.map((p) => {
    const points = [];
    filtered.forEach((r) => {
      const ans = get5SAnswers(r);
      ans.filter((a) => a.pillar === p).forEach((a) => {
        if (a.points !== undefined && a.points !== null) {
          points.push(Number(a.points));
        }
      });
    });
    const avg = points.length ? points.reduce((a, b) => a + b, 0) / points.length : 0;
    return { pillar: p, average: +avg.toFixed(2), count: points.length };
  });
}

export function fiveSTrend(records) {
  return records
    .map((r) => {
      const d = get5SDate(r);
      if (!d) return null;
      return {
        date: d,
        ts: d.getTime(),
        total: get5STotal(r),
        zone: get5SZone(r),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts)
    .map((x, i) => ({ ...x, idx: i, label: x.date.toLocaleDateString("fr-FR") }));
}

export function fiveSByZone(records) {
  const map = new Map();
  records.forEach((r) => {
    const zone = get5SZone(r);
    const pts = get5STotal(r);
    if (!map.has(zone)) map.set(zone, { zone, total: 0, count: 0 });
    const cur = map.get(zone);
    cur.total += pts;
    cur.count += 1;
  });
  return [...map.values()]
    .map((z) => ({ zone: z.zone, avg: +(z.total / z.count).toFixed(2), count: z.count }))
    .sort((a, b) => b.avg - a.avg);
}

export function fiveSTopFailures(records, limit = 10) {
  const map = new Map();
  records.forEach((r) => {
    get5SAnswers(r).forEach((a) => {
      const key = a.index;
      if (!map.has(key)) {
        map.set(key, {
          index: a.index,
          pillar: a.pillar,
          short: a.short || a.question || `Q${a.index}`,
          question: a.question,
          nok: 0,
          total: 0,
        });
      }
      const cur = map.get(key);
      cur.total += 1;
      if (Number(a.points) === 0) cur.nok += 1;
    });
  });
  return [...map.values()]
    .map((x) => ({ ...x, rate: x.total ? +((x.nok / x.total) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.nok - a.nok)
    .slice(0, limit);
}

export function fiveSActions(records) {
  const out = [];
  records.forEach((r) => {
    get5SAnswers(r).forEach((a) => {
      if (a.action && String(a.action).trim()) {
        out.push({
          date: r?.meta?.date || r?._raw?.Date || r?._raw?.["Heure de début"] || "",
          zone: get5SZone(r),
          auditor: get5SAuditor(r),
          pillar: a.pillar,
          qIndex: a.index,
          short: a.short || a.question,
          action: a.action,
        });
      }
    });
  });
  return out.sort((a, b) => {
    const da = parseDate(a.date)?.getTime() ?? 0;
    const db = parseDate(b.date)?.getTime() ?? 0;
    return db - da;
  });
}

export function available5SMonths(records) {
  const set = new Set();
  records.forEach((r) => {
    const d = get5SDate(r);
    if (d) set.add(yyyymm(d));
  });
  return [...set].sort().reverse();
}

// ---------------------------------------------------------
// Gemba aggregations (unchanged)
// ---------------------------------------------------------

export function gembaTrend(records) {
  const map = new Map();
  records.forEach((r) => {
    const d = parseDate(r.date);
    if (!d) return;
    const key = `${yyyymm(d)}|${r.date}|${r.ligne || r.uap || "?"}`;
    if (!map.has(key)) {
      map.set(key, {
        date: d,
        ts: d.getTime(),
        ligne: r.ligne || "",
        uap: r.uap || "",
        score: Number(r.score ?? 0),
      });
    }
  });
  return [...map.values()]
    .sort((a, b) => a.ts - b.ts)
    .map((x) => ({ ...x, label: x.date.toLocaleDateString("fr-FR") }));
}

export function gembaByLigne(records) {
  const map = new Map();
  records.forEach((r) => {
    const key = r.ligne || r.uap || "—";
    if (!map.has(key)) map.set(key, { ligne: key, sum: 0, count: 0 });
    const cur = map.get(key);
    cur.sum += Number(r.score ?? 0);
    cur.count += 1;
  });
  return [...map.values()]
    .map((x) => ({ ligne: x.ligne, avg: +(x.sum / x.count).toFixed(2), count: x.count }))
    .sort((a, b) => b.avg - a.avg);
}

export function gembaTopFailures(records, limit = 10) {
  const map = new Map();
  records.forEach((r) => {
    const q = (r.question || r.pointM || "—").trim();
    if (!map.has(q)) map.set(q, { question: q, nok: 0, total: 0 });
    const cur = map.get(q);
    cur.total += 1;
    if (String(r.reponse || "").toUpperCase() === "NOK") cur.nok += 1;
  });
  return [...map.values()]
    .map((x) => ({ ...x, rate: x.total ? +((x.nok / x.total) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.nok - a.nok)
    .slice(0, limit);
}

export function gembaActions(records) {
  return records
    .filter((r) => {
      const a = String(r.actionCorrective ?? "").trim();
      return a && a !== "-" && a !== "—";
    })
    .map((r) => ({
      date: r.date,
      uap: r.uap,
      ligne: r.ligne,
      auditeur: r.auditeur,
      question: r.question || r.pointM,
      action: r.actionCorrective,
      pilote: r.pilote,
      dateAction: r.dateAction,
      score: Number(r.score ?? 0),
    }))
    .sort((a, b) => {
      const da = parseDate(a.dateAction)?.getTime() ?? parseDate(a.date)?.getTime() ?? 0;
      const db = parseDate(b.dateAction)?.getTime() ?? parseDate(b.date)?.getTime() ?? 0;
      return db - da;
    });
}
