// =========================================================
// Aggregation helpers — 5S + Gemba (version propre)
// =========================================================
import { zoneToUap, normalizeUapGemba } from "../config/dashboardConfig";

export const PILLARS = ["1S", "2S", "3S", "4S", "5S"];

export function parseDate(v) {
  if (v === null || v === undefined || v === "") return null;
  const asNum = typeof v === "number" ? v : (/^\d+(\.\d+)?$/.test(String(v)) ? Number(v) : NaN);
  if (!isNaN(asNum) && asNum > 32874 && asNum < 73415) {
    const ms = (asNum - 25569) * 86400 * 1000;
    const d = new Date(ms);
    return isNaN(d) ? null : d;
  }
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

export function isoWeekKey(d) {
  if (!d) return "";
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function weekKeyMinus(n) {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return isoWeekKey(d);
}

// ---------- 5S accessors ----------
export function get5SDate(r) {
  return (
    parseDate(r?.meta?.date) ||
    parseDate(r?._raw?.Date) ||
    parseDate(r?._raw?.["Date "]) ||
    parseDate(r?.meta?.startTime) ||
    null
  );
}
export function get5SZone(r) {
  return r?.meta?.zone || r?._raw?.["Zone_Ligne"] || r?._raw?.["Zone/Ligne"] || "—";
}
export function get5SUap(r) { return zoneToUap(get5SZone(r)); }
export function get5SAuditor(r) { return r?.meta?.auditor || r?._raw?.Auditeur || "—"; }
export function get5SZoneLeader(r) {
  return r?.meta?.zoneLeader || r?._raw?.["Pilot_de_zone"] || r?._raw?.["Pilot de zone"] || "—";
}
export function get5STotal(r) {
  const v = r?.meta?.totalPoints;
  if (v !== undefined && v !== null && v !== "") return Number(v);
  return Number(r?._raw?.["Total_points"] ?? r?._raw?.["Total points"] ?? 0) || 0;
}
export function get5SAnswers(r) { return Array.isArray(r?.answers) ? r.answers : []; }
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
    ok, nok, na, applicable, total: 26,
    percent: applicable ? +((ok / applicable) * 100).toFixed(1) : 0,
    rawTotal: get5STotal(r),
  };
}

// ---------- 5S aggregations ----------
export function fiveSRadarByMonth(records, month) {
  const filtered = records.filter((r) => {
    const d = get5SDate(r); return d && yyyymm(d) === month;
  });
  return PILLARS.map((p) => {
    const sums = filtered.map((r) => r?.pillarScores?.[p]?.score).filter((v) => v !== undefined);
    const avg = sums.length ? sums.reduce((a, b) => a + b, 0) / sums.length : 0;
    return { pillar: p, average: +avg.toFixed(2), count: sums.length };
  });
}

export function fiveSTrend(records) {
  return records.map((r) => {
    const d = get5SDate(r); if (!d) return null;
    const s = get5SScore(r);
    return { date: d, ts: d.getTime(), percent: s.percent, zone: get5SZone(r) };
  }).filter(Boolean).sort((a, b) => a.ts - b.ts)
    .map((x, i) => ({ ...x, idx: i, label: x.date.toLocaleDateString("fr-FR") }));
}

export function fiveSByZone(records) {
  const map = new Map();
  records.forEach((r) => {
    const zone = get5SZone(r);
    const s = get5SScore(r);
    if (!map.has(zone)) map.set(zone, { zone, sum: 0, count: 0 });
    const cur = map.get(zone);
    cur.sum += s.percent; cur.count += 1;
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
        map.set(a.index, { index: a.index, pillar: a.pillar, short: a.short || a.question, ok: 0, nok: 0, na: 0 });
      }
      const cur = map.get(a.index);
      if (a.status === "OK") cur.ok++;
      else if (a.status === "NOK") cur.nok++;
      else cur.na++;
    });
  });
  return [...map.values()].map((x) => {
    const app = x.ok + x.nok;
    return { ...x, total: app, rate: app ? +((x.nok / app) * 100).toFixed(1) : 0 };
  }).sort((a, b) => b.nok - a.nok).slice(0, limit);
}

export function fiveSActions(records) {
  const out = [];
  records.forEach((r) => {
    get5SAnswers(r).forEach((a) => {
      if (a.action && String(a.action).trim()) {
        out.push({
          date: r?.meta?.date || r?._raw?.Date || "",
          zone: get5SZone(r), auditor: get5SAuditor(r),
          pillar: a.pillar, qIndex: a.index, short: a.short, action: a.action,
        });
      }
    });
  });
  return out.sort((a, b) => (parseDate(b.date)?.getTime() ?? 0) - (parseDate(a.date)?.getTime() ?? 0));
}

export function available5SMonths(records) {
  const set = new Set();
  records.forEach((r) => { const d = get5SDate(r); if (d) set.add(yyyymm(d)); });
  return [...set].sort().reverse();
}

export function avg5SByZone(records) {
  return fiveSByZone(records).map((z) => ({ zone: z.zone, avg: z.avg, count: z.count }));
}

export function avg5SByPillar(records) {
  return PILLARS.map((p) => {
    const vals = records.map((r) => r?.pillarScores?.[p]?.score).filter((v) => v !== undefined);
    const avg = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    return { pillar: p, avg, count: vals.length };
  });
}

// ---------- Gemba aggregations ----------
export function gembaAuditKey(r) {
  return [String(r.date ?? "").trim(), String(r.uap ?? "").trim(), String(r.ligne ?? "").trim()].join("|");
}
export function gembaTrend(records) {
  const map = new Map();
  records.forEach((r) => {
    const d = parseDate(r.date); if (!d) return;
    const key = `${yyyymm(d)}|${r.date}|${r.ligne || r.uap || "?"}`;
    if (!map.has(key)) map.set(key, { date: d, ts: d.getTime(), ligne: r.ligne || "", uap: r.uap || "", score: Number(r.score ?? 0) });
  });
  return [...map.values()].sort((a, b) => a.ts - b.ts)
    .map((x) => ({ ...x, label: x.date.toLocaleDateString("fr-FR") }));
}
export function gembaByLigne(records) {
  const map = new Map();
  records.forEach((r) => {
    const key = r.ligne || r.uap || "—";
    if (!map.has(key)) map.set(key, { ligne: key, sum: 0, count: 0 });
    const cur = map.get(key);
    cur.sum += Number(r.score ?? 0); cur.count += 1;
  });
  return [...map.values()].map((x) => ({ ligne: x.ligne, avg: +(x.sum / x.count).toFixed(2), count: x.count }))
    .sort((a, b) => b.avg - a.avg);
}
export function gembaTopFailures(records, limit = 10) {
  const map = new Map();
  records.forEach((r) => {
    const q = (r.question || r.pointM || "—").trim();
    if (!map.has(q)) map.set(q, { question: q, nok: 0, total: 0 });
    const cur = map.get(q); cur.total += 1;
    if (String(r.reponse || "").toUpperCase() === "NOK") cur.nok += 1;
  });
  return [...map.values()].map((x) => ({ ...x, rate: x.total ? +((x.nok / x.total) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.nok - a.nok).slice(0, limit);
}
export function gembaActions(records) {
  return records.filter((r) => {
    const a = String(r.actionCorrective ?? "").trim();
    return a && a !== "-" && a !== "—";
  }).map((r) => ({
    date: r.date, uap: r.uap, ligne: r.ligne, auditeur: r.auditeur,
    question: r.question || r.pointM, action: r.actionCorrective,
    pilote: r.pilote, dateAction: r.dateAction, score: Number(r.score ?? 0),
  })).sort((a, b) => {
    const da = parseDate(a.dateAction)?.getTime() ?? parseDate(a.date)?.getTime() ?? 0;
    const db = parseDate(b.dateAction)?.getTime() ?? parseDate(b.date)?.getTime() ?? 0;
    return db - da;
  });
}
export function groupGembaAudits(records) {
  const map = new Map();
  records.forEach((r) => {
    const key = gembaAuditKey(r);
    if (!map.has(key)) map.set(key, { key, date: r.date, uap: r.uap, ligne: r.ligne, score: Number(r.score ?? 0), questions: [] });
    map.get(key).questions.push({ pointM: r.pointM, question: r.question, reponse: r.reponse, action: r.actionCorrective, pilote: r.pilote, dateAction: r.dateAction, auditeur: r.auditeur });
  });
  return [...map.values()].sort((a, b) => (parseDate(b.date)?.getTime() ?? 0) - (parseDate(a.date)?.getTime() ?? 0));
}
export function countGembaAudits(records) { return new Set(records.map(gembaAuditKey)).size; }
export function avgGembaScore(records) {
  const audits = groupGembaAudits(records);
  if (!audits.length) return 0;
  return +(audits.reduce((a, x) => a + x.score, 0) / audits.length).toFixed(1);
}
export function avgGembaByUap(records) {
  const map = new Map();
  records.forEach((r) => {
    const uap = r.uap || "—";
    if (!map.has(uap)) map.set(uap, { uap, sum: 0, count: 0, seen: new Set() });
    const cur = map.get(uap);
    const sig = gembaAuditKey(r);
    if (cur.seen.has(sig)) return;
    cur.seen.add(sig);
    cur.sum += Number(r.score ?? 0); cur.count += 1;
  });
  return [...map.values()].map((x) => ({ uap: x.uap, avg: x.count ? +(x.sum / x.count).toFixed(1) : 0, count: x.count }))
    .sort((a, b) => b.avg - a.avg);
}
export function normalize5M(pointM) {
  const s = String(pointM || "").trim();
  if (/^méthode/i.test(s) || /formulaire|dossier|hse|instructions|stockage|ok démarrage/i.test(s)) return "Méthode";
  if (/^milieu/i.test(s)) return "Milieu";
  if (/^matière/i.test(s)) return "Matière";
  if (/^main\s*d/i.test(s)) return "Main d'œuvre";
  if (/maintenance/i.test(s)) return "Maintenance";
  if (/chariot/i.test(s)) return "Chariot élévateur";
  if (/identification/i.test(s)) return "Identification";
  return s || "—";
}
export function avgGembaBy5M(records) {
  const map = new Map();
  records.forEach((r) => {
    const m = normalize5M(r.pointM || r.question);
    if (!map.has(m)) map.set(m, { m, ok: 0, nok: 0, na: 0, total: 0 });
    const cur = map.get(m); cur.total += 1;
    const rep = String(r.reponse || "").toUpperCase();
    if (rep === "OK") cur.ok++;
    else if (rep === "NOK") cur.nok++;
    else cur.na++;
  });
  return [...map.values()].map((x) => {
    const app = x.ok + x.nok;
    return { ...x, rate: app ? +((x.ok / app) * 100).toFixed(1) : 0 };
  }).sort((a, b) => a.rate - b.rate);
}

// ---------- Month helpers ----------
export function monthly5SAgg(records) {
  const map = new Map();
  records.forEach((r) => {
    const d = get5SDate(r); if (!d) return;
    const k = yyyymm(d);
    if (!map.has(k)) map.set(k, { month: k, sum: 0, count: 0 });
    const cur = map.get(k);
    cur.sum += get5SScore(r).percent; cur.count += 1;
  });
  return [...map.values()].map((x) => ({ month: x.month, avg: +(x.sum / x.count).toFixed(1), count: x.count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
export function monthlyGembaAgg(records) {
  const seen = new Set(); const map = new Map();
  records.forEach((r) => {
    const d = parseDate(r.date); if (!d) return;
    const k = yyyymm(d);
    const sig = gembaAuditKey(r);
    if (seen.has(sig)) return;
    seen.add(sig);
    if (!map.has(k)) map.set(k, { month: k, sum: 0, count: 0 });
    const cur = map.get(k);
    cur.sum += Number(r.score ?? 0); cur.count += 1;
  });
  return [...map.values()].map((x) => ({ month: x.month, avg: +(x.sum / x.count).toFixed(1), count: x.count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
export function prevMonth(month) {
  if (!month) return "";
  const [y, m] = month.split("-").map(Number);
  return yyyymm(new Date(y, m - 2, 1));
}
export function currentMonth() { return yyyymm(new Date()); }

// ---------- Weekly ----------
export function count5SPerWeek(records) {
  const map = new Map();
  records.forEach((r) => {
    const d = get5SDate(r); if (!d) return;
    const k = isoWeekKey(d);
    map.set(k, (map.get(k) || 0) + 1);
  });
  return map;
}
export function countGembaPerWeek(records) {
  const seen = new Set(); const map = new Map();
  records.forEach((r) => {
    const d = parseDate(r.date); if (!d) return;
    const k = isoWeekKey(d);
    const sig = gembaAuditKey(r);
    if (seen.has(sig)) return;
    seen.add(sig);
    map.set(k, (map.get(k) || 0) + 1);
  });
  return map;
}
export function lastCompleteWeek(records, type) {
  const counter = type === "5S" ? count5SPerWeek(records) : countGembaPerWeek(records);
  const keys = [...counter.keys()].sort();
  return keys.length ? keys[keys.length - 1] : weekKeyMinus(1);
}
export function filter5SByWeek(records, weekKey) {
  return records.filter((r) => { const d = get5SDate(r); return d && isoWeekKey(d) === weekKey; });
}
export function filterGembaByWeek(records, weekKey) {
  return records.filter((r) => { const d = parseDate(r.date); return d && isoWeekKey(d) === weekKey; });
}

// ---------- Monthly filters ----------
export function filter5SByMonth(records, month) {
  return records.filter((r) => { const d = get5SDate(r); return d && yyyymm(d) === month; });
}
export function filterGembaByMonth(records, month) {
  return records.filter((r) => { const d = parseDate(r.date); return d && yyyymm(d) === month; });
}

// ---------- Period stats ----------
export function stats5S(records) {
  if (!records.length) return { audits: 0, avg: 0, ok: 0, nok: 0, na: 0 };
  let ok = 0, nok = 0, na = 0, sum = 0;
  records.forEach((r) => {
    const s = get5SScore(r);
    ok += s.ok; nok += s.nok; na += s.na;
    sum += s.percent;
  });
  return { audits: records.length, avg: +(sum / records.length).toFixed(1), ok, nok, na };
}
export function statsGemba(records) {
  const seen = new Set();
  let sum = 0, n = 0;
  let ok = 0, nok = 0, na = 0;
  records.forEach((r) => {
    const rep = String(r.reponse || "").toUpperCase();
    if (rep === "OK") ok++;
    else if (rep === "NOK") nok++;
    else if (rep === "N/A") na++;
    const sig = gembaAuditKey(r);
    if (seen.has(sig)) return;
    seen.add(sig);
    sum += Number(r.score ?? 0); n++;
  });
  return { audits: n, avg: n ? +(sum / n).toFixed(1) : 0, ok, nok, na };
}
export function byZone5S(records) {
  const map = new Map();
  records.forEach((r) => {
    const z = get5SZone(r);
    const s = get5SScore(r);
    if (!map.has(z)) map.set(z, { sum: 0, count: 0 });
    const cur = map.get(z);
    cur.sum += s.percent; cur.count += 1;
  });
  return [...map.entries()].map(([name, x]) => ({ name, avg: +(x.sum / x.count).toFixed(1), count: x.count }))
    .sort((a, b) => b.avg - a.avg);
}
export function byLigneGemba(records) {
  const seen = new Set(); const map = new Map();
  records.forEach((r) => {
    const key = r.ligne || r.uap || "—";
    if (!map.has(key)) map.set(key, { sum: 0, count: 0 });
    const sig = gembaAuditKey(r);
    if (seen.has(sig)) return;
    seen.add(sig);
    const cur = map.get(key);
    cur.sum += Number(r.score ?? 0); cur.count += 1;
  });
  return [...map.entries()].map(([name, x]) => ({ name, avg: x.count ? +(x.sum / x.count).toFixed(1) : 0, count: x.count }))
    .sort((a, b) => b.avg - a.avg);
}

// ---------- Chart builders ----------
function weekMinusKey(baseKey, n) {
  const [y, w] = baseKey.split("-W").map(Number);
  const simple = new Date(y, 0, 1 + (w - 1) * 7);
  const day = simple.getDay() || 7;
  const thursday = new Date(simple);
  thursday.setDate(simple.getDate() + (4 - day));
  thursday.setDate(thursday.getDate() - n * 7);
  return isoWeekKey(thursday);
}

export function buildPlanVsRealised(records, type, weeks = 24, plannedPerWeek = 5) {
  const counter = type === "5S" ? count5SPerWeek(records) : countGembaPerWeek(records);
  const latest = [...counter.keys()].sort().pop() || weekKeyMinus(0);
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const k = weekMinusKey(latest, i);
    out.push({ week: k, label: k.replace(/^\d{4}-/, ""), planned: plannedPerWeek, realised: counter.get(k) || 0 });
  }
  return out;
}

export function buildUapWeeklySeries(records, type, weeks = 8, groupKey = "uap", entitiesFilter = null) {
  const filterSet = entitiesFilter instanceof Set ? entitiesFilter : (entitiesFilter ? new Set(entitiesFilter) : null);
  const counter = type === "5S" ? count5SPerWeek(records) : countGembaPerWeek(records);
  const latest = [...counter.keys()].sort().pop() || weekKeyMinus(0);
  const weekList = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const k = weekMinusKey(latest, i);
    weekList.push({ key: k, label: k.replace(/^\d{4}-/, "") });
  }
  const groups = new Set();
  records.forEach((r) => {
    const g = type === "5S"
      ? (groupKey === "uap" ? get5SUap(r) : get5SZone(r))
      : (groupKey === "uap" ? (normalizeUapGemba(r.uap) || r.uap || "—") : (r.ligne || r.uap || "—"));
    if (!g || g === "—" || g === "Autre") return;
    if (filterSet && !filterSet.has(g)) return;
    groups.add(g);
  });
  const data = weekList.map((w) => {
    const row = { label: w.label };
    groups.forEach((g) => { row[g] = null; });
    if (type === "5S") {
      const sums = {}, counts = {};
      records.forEach((r) => {
        const d = get5SDate(r);
        if (!d || isoWeekKey(d) !== w.key) return;
        const g = groupKey === "uap" ? get5SUap(r) : get5SZone(r);
        if (!g || g === "—" || g === "Autre") return;
        if (filterSet && !filterSet.has(g)) return;
        sums[g] = (sums[g] || 0) + get5SScore(r).percent;
        counts[g] = (counts[g] || 0) + 1;
      });
      Object.keys(sums).forEach((g) => { row[g] = +(sums[g] / counts[g]).toFixed(1); });
    } else {
      const seen = new Set(); const sumByGroup = {}, cntByGroup = {};
      records.forEach((r) => {
        const d = parseDate(r.date);
        if (!d || isoWeekKey(d) !== w.key) return;
        const g = groupKey === "uap"
          ? (normalizeUapGemba(r.uap) || r.uap || "—")
          : (r.ligne || r.uap || "—");
        if (!g || g === "—") return;
        if (filterSet && !filterSet.has(g)) return;
        const sig = gembaAuditKey(r);
        if (seen.has(sig)) return;
        seen.add(sig);
        sumByGroup[g] = (sumByGroup[g] || 0) + Number(r.score ?? 0);
        cntByGroup[g] = (cntByGroup[g] || 0) + 1;
      });
      Object.keys(sumByGroup).forEach((g) => { row[g] = +(sumByGroup[g] / cntByGroup[g]).toFixed(1); });
    }
    return row;
  });
  return { data, keys: [...groups] };
}

export function buildWeekPerGroupScores(records, weekKey, type, groupKey = "ligne") {
  const out = new Map();
  if (type === "5S") {
    const sums = {}, counts = {};
    records.forEach((r) => {
      const d = get5SDate(r);
      if (!d || isoWeekKey(d) !== weekKey) return;
      const g = groupKey === "zone" ? get5SZone(r) : (r.uap || "—");
      if (!g || g === "—") return;
      sums[g] = (sums[g] || 0) + get5SScore(r).percent;
      counts[g] = (counts[g] || 0) + 1;
    });
    Object.keys(sums).forEach((g) => { out.set(g, +(sums[g] / counts[g]).toFixed(1)); });
  } else {
    const seen = new Set(); const sumByGroup = {}, cntByGroup = {};
    records.forEach((r) => {
      const d = parseDate(r.date);
      if (!d || isoWeekKey(d) !== weekKey) return;
      const g = r.ligne || r.uap || "—";
      if (!g || g === "—") return;
      const sig = gembaAuditKey(r);
      if (seen.has(sig)) return;
      seen.add(sig);
      sumByGroup[g] = (sumByGroup[g] || 0) + Number(r.score ?? 0);
      cntByGroup[g] = (cntByGroup[g] || 0) + 1;
    });
    Object.keys(sumByGroup).forEach((g) => { out.set(g, +(sumByGroup[g] / cntByGroup[g]).toFixed(1)); });
  }
  return [...out.entries()].map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score);
}

export function buildSmallMultiples(records, type, groupKey = "ligne", entitiesFilter = null) {
  let filterSet = null;
  if (entitiesFilter) {
    if (entitiesFilter instanceof Set) filterSet = entitiesFilter;
    else if (Array.isArray(entitiesFilter)) filterSet = new Set(entitiesFilter);
  }
  const groups = new Map();
  records.forEach((r) => {
    let name, dateObj, value;
    if (type === "5S") {
      name = groupKey === "zone" ? get5SZone(r) : (r.uap || "—");
      dateObj = get5SDate(r);
      value = dateObj ? get5SScore(r).percent : null;
    } else {
      name = groupKey === "zone" ? (r.uap || "—") : (r.ligne || r.uap || "—");
      dateObj = parseDate(r.date);
      value = dateObj ? Number(r.score ?? 0) : null;
    }
    if (!name || name === "—" || !dateObj || value === null) return;
    if (filterSet && !filterSet.has(name)) return;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({ date: dateObj, value });
  });
  const out = [];
  groups.forEach((items, name) => {
    const byDay = new Map();
    items.forEach((it) => {
      const k = it.date.toISOString().slice(0, 10);
      if (!byDay.has(k)) byDay.set(k, it.value);
    });
    const points = [...byDay.entries()].map(([k, v]) => {
      const d = new Date(k);
      return { date: d, label: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), value: +Number(v).toFixed(1) };
    }).sort((a, b) => a.date - b.date);
    if (!points.length) return;
    const values = points.map((p) => p.value);
    const average = +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    let slope = 0, intercept = values[0] ?? 0;
    if (values.length >= 2) {
      const n = values.length;
      const xs = values.map((_, i) => i);
      const mx = xs.reduce((a, b) => a + b, 0) / n;
      const my = values.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) {
        num += (xs[i] - mx) * (values[i] - my);
        den += (xs[i] - mx) ** 2;
      }
      slope = den !== 0 ? num / den : 0;
      intercept = my - slope * mx;
    }
    const slopePerStep = +slope.toFixed(2);
    let trend = "stable";
    if (slopePerStep > 0.5) trend = "up";
    else if (slopePerStep < -0.5) trend = "down";
    out.push({ name, points, average, regression: { slope, intercept }, slopePerStep, trend, latest: values[values.length - 1] });
  });
  out.sort((a, b) => b.points[b.points.length - 1].date - a.points[a.points.length - 1].date);
  return out;
}

export const SERIES_COLORS = [
  "#a855f7", "#06b6d4", "#f59e0b", "#22c55e", "#ef4444",
  "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
  "#eab308", "#3b82f6", "#8b5cf6", "#10b981", "#f43f5e",
];
