// =========================================================
// Aggregation helpers — 5S + Gemba
// =========================================================

export const PILLARS = ["1S", "2S", "3S", "4S", "5S"];

/**
 * Parse a date from:
 *   - "YYYY-MM-DD HH:mm:ss"
 *   - "DD/MM/YYYY"
 *   - Excel serial number (e.g. 46066 → 2026-09-01)
 *   - ISO string
 * Returns null if unparseable.
 */
export function parseDate(v) {
  if (v === null || v === undefined || v === "") return null;

  // Excel serial number (a number, or numeric string)
  const asNum = typeof v === "number" ? v : (/^\d+(\.\d+)?$/.test(String(v)) ? Number(v) : NaN);
  if (!isNaN(asNum) && asNum > 32874 && asNum < 73415) {
    const ms = (asNum - 25569) * 86400 * 1000;
    const d = new Date(ms);
    return isNaN(d) ? null : d;
  }

  const s = String(v).trim();

  // "YYYY-MM-DD ..."
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  // "DD/MM/YYYY"
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);

  // Fallback
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

export function yyyymm(d) {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ---------- 5S tolerant accessors ----------

export function get5SDate(r) {
  return (
    parseDate(r?.meta?.date) ||
    parseDate(r?._raw?.Date) ||
    parseDate(r?._raw?.["Date "]) ||
    parseDate(r?.meta?.startTime) ||
    parseDate(r?._raw?.["Heure de début"]) ||
    null
  );
}
export function get5SZone(r) {
  return r?.meta?.zone || r?._raw?.["Zone_Ligne"] || r?._raw?.["Zone/Ligne"] || "—";
}
export function get5SAuditor(r) {
  return r?.meta?.auditor || r?._raw?.Auditeur || "—";
}
export function get5SZoneLeader(r) {
  return r?.meta?.zoneLeader || r?._raw?.["Pilot_de_zone"] || r?._raw?.["Pilot de zone"] || "—";
}
export function get5STotal(r) {
  const v = r?.meta?.totalPoints;
  if (v !== undefined && v !== null && v !== "") return Number(v);
  return Number(r?._raw?.["Total_points"] ?? r?._raw?.["Total points"] ?? 0) || 0;
}
export function get5SAnswers(r) {
  return Array.isArray(r?.answers) ? r.answers : [];
}

export function get5SScore(r) {
  if (r?.scores && typeof r.scores === "object") return r.scores;
  const ans = get5SAnswers(r);
  let ok = 0, nok = 0, na = 0;
  ans.forEach((a) => {
    if (a.status === "OK") ok++;
    else if (a.status === "NOK") nok++;
    else if (a.status === "N/A") na++;
    else {
      const p = Number(a.points);
      if (!isNaN(p)) { p > 0 ? ok++ : nok++; } else na++;
    }
  });
  const applicable = ok + nok;
  return {
    ok, nok, na, applicable,
    total: 26,
    percent: applicable ? +((ok / applicable) * 100).toFixed(1) : 0,
    rawTotal: get5STotal(r),
  };
}

// ---------- 5S aggregations ----------

export function fiveSRadarByMonth(records, month) {
  const filtered = records.filter((r) => {
    const d = get5SDate(r);
    return d && yyyymm(d) === month;
  });
  return PILLARS.map((p) => {
    const sums = filtered.map((r) => r?.pillarScores?.[p]?.score).filter((v) => v !== undefined);
    const avg = sums.length ? sums.reduce((a, b) => a + b, 0) / sums.length : 0;
    return { pillar: p, average: +avg.toFixed(2), count: sums.length };
  });
}

export function fiveSTrend(records) {
  return records
    .map((r) => {
      const d = get5SDate(r);
      if (!d) return null;
      const s = get5SScore(r);
      return {
        date: d, ts: d.getTime(),
        percent: s.percent, ok: s.ok, nok: s.nok, na: s.na,
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
    const s = get5SScore(r);
    if (!map.has(zone)) map.set(zone, { zone, sum: 0, count: 0 });
    const cur = map.get(zone);
    cur.sum += s.percent;
    cur.count += 1;
  });
  return [...map.values()]
    .map((z) => ({ zone: z.zone, avg: +(z.sum / z.count).toFixed(2), count: z.count }))
    .sort((a, b) => b.avg - a.avg);
}

export function fiveSTopFailures(records, limit = 10) {
  const map = new Map();
  records.forEach((r) => {
    get5SAnswers(r).forEach((a) => {
      if (!map.has(a.index)) {
        map.set(a.index, {
          index: a.index, pillar: a.pillar,
          short: a.short || a.question, question: a.question,
          ok: 0, nok: 0, na: 0,
        });
      }
      const cur = map.get(a.index);
      if (a.status === "OK") cur.ok++;
      else if (a.status === "NOK") cur.nok++;
      else cur.na++;
    });
  });
  return [...map.values()]
    .map((x) => {
      const app = x.ok + x.nok;
      return { ...x, total: app, rate: app ? +((x.nok / app) * 100).toFixed(1) : 0 };
    })
    .sort((a, b) => b.nok - a.nok)
    .slice(0, limit);
}

export function fiveSActions(records) {
  const out = [];
  records.forEach((r) => {
    get5SAnswers(r).forEach((a) => {
      if (a.action && String(a.action).trim()) {
        out.push({
          date: r?.meta?.date || r?._raw?.Date || "",
          zone: get5SZone(r),
          auditor: get5SAuditor(r),
          pillar: a.pillar,
          qIndex: a.index,
          short: a.short,
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

// ---------- Gemba ----------

export function gembaTrend(records) {
  const map = new Map();
  records.forEach((r) => {
    const d = parseDate(r.date);
    if (!d) return;
    const key = `${yyyymm(d)}|${r.date}|${r.ligne || r.uap || "?"}`;
    if (!map.has(key)) {
      map.set(key, {
        date: d, ts: d.getTime(),
        ligne: r.ligne || "", uap: r.uap || "",
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
      date: r.date, uap: r.uap, ligne: r.ligne, auditeur: r.auditeur,
      question: r.question || r.pointM,
      action: r.actionCorrective,
      pilote: r.pilote, dateAction: r.dateAction,
      score: Number(r.score ?? 0),
    }))
    .sort((a, b) => {
      const da = parseDate(a.dateAction)?.getTime() ?? parseDate(a.date)?.getTime() ?? 0;
      const db = parseDate(b.dateAction)?.getTime() ?? parseDate(b.date)?.getTime() ?? 0;
      return db - da;
    });
}
