import {
  collection, doc, writeBatch, getDocs, query,
  orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const AUDITS = 'audits';
const META = 'meta';

const META_KEYS = new Set([
  'ID','Heure de début','Heure de fin','Adresse de messagerie','Nom',
  'Total points','Quiz feedback','Heure de la dernière modification','Date',
]);

export const ALL_META_KEYS = META_KEYS;

/* ---------- Firestore CRUD ---------- */

function sanitize(obj) {
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v; continue;
    }
    out[k] = String(v);
  }
  return out;
}

export async function saveAudits(rows) {
  if (!rows?.length) throw new Error('Aucune donnée à enregistrer.');
  const CHUNK = 400;
  let saved = 0;
  const errors = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    for (const row of slice) {
      const id = String(row['ID'] || `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      const ref = doc(db, AUDITS, id);
      const clean = sanitize(row);
      delete clean._docId;
      clean._updatedAt = serverTimestamp();
      clean._savedAt = new Date().toISOString();
      batch.set(ref, clean, { merge: true });
    }
    try {
      await batch.commit();
      saved += slice.length;
    } catch (err) { errors.push(err.message); }
  }
  try {
    const metaRef = doc(db, META, 'lastImport');
    const mb = writeBatch(db);
    mb.set(metaRef, { date: serverTimestamp(), count: saved, total: rows.length });
    await mb.commit();
  } catch (_) {}
  if (errors.length) throw new Error(`${errors.length} erreur(s) : ${errors[0]}`);
  return saved;
}

export async function loadAudits() {
  const q = query(collection(db, AUDITS), orderBy('ID', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
}

/* ---------- Score d'une ligne (N/A exclus) ---------- */

export function computeRowScore(row) {
  let earned = 0, total = 0, naCount = 0, ok = 0, nok = 0;
  for (const key of Object.keys(row)) {
    if (!key || META_KEYS.has(key)) continue;
    if (key.startsWith('Points - ') || key.startsWith('Feedback - ')) continue;
    const pk = `Points - ${key}`, fk = `Feedback - ${key}`;
    if (!(pk in row) && !(fk in row)) continue;
    const value = String(row[key] ?? '').trim();
    const points = String(row[pk] ?? '').trim();
    const feedback = String(row[fk] ?? '').trim();
    if (!value && !points && !feedback) continue;
    total++;
    if (value === 'N/A') { naCount++; continue; }
    const p = Number(points);
    if (!isNaN(p)) earned += p;
    if (value === 'OK' || (!isNaN(p) && p >= 1)) ok++;
    else if (value === 'NOK' || (!isNaN(p) && p === 0)) nok++;
  }
  const denominator = total - naCount;
  return { earned, total, naCount, denominator, ok, nok, pct: denominator > 0 ? earned / denominator : 0 };
}

/* ---------- Dashboard ---------- */

export function computeDashboard(rows) {
  if (!rows?.length) {
    return {
      total: 0, avgScore: 0, avgPct: 0,
      bestZone: null, worstZone: null,
      byZone: [], byAuditeur: [], byPilot: [],
      trend: [], byMonth: [],
      topNokCriteria: [], topFeedbacks: [],
      quizFeedback: { ok: 0, nok: 0, na: 0 },
      criteriaStatus: { ok: 0, nok: 0, na: 0 },
      scoreDistribution: [], scoreByWeekday: [],
    };
  }

  let sumEarned = 0, sumDenom = 0;
  const zones = {}, auditeurs = {}, pilots = {}, dates = {}, months = {};
  const criteriaNok = {}, feedbacks = {};
  const quizFb = { ok: 0, nok: 0, na: 0 };
  const criteriaStatus = { ok: 0, nok: 0, na: 0 };
  const weekday = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const dist = {};

  for (const r of rows) {
    const s = computeRowScore(r);
    sumEarned += s.earned;
    sumDenom += s.denominator;

    const zone = r['Zone/Ligne'] || 'Non défini';
    const aud = r['Auditeur'] || 'Non défini';
    const pilot = r['Pilot de zone'] || 'Non défini';
    const dateStr = String(r['Date'] || '').slice(0, 10);
    const monthStr = dateStr.slice(0, 7);

    const push = (obj, key) => {
      if (!obj[key]) obj[key] = { count: 0, earned: 0, denom: 0 };
      obj[key].count++; obj[key].earned += s.earned; obj[key].denom += s.denominator;
    };
    push(zones, zone);
    push(auditeurs, aud);
    push(pilots, pilot);

    if (dateStr) {
      if (!dates[dateStr]) dates[dateStr] = { count: 0, earned: 0, denom: 0 };
      dates[dateStr].count++; dates[dateStr].earned += s.earned; dates[dateStr].denom += s.denominator;
      const d = new Date(dateStr);
      if (!isNaN(d)) weekday[d.getDay()].push(s.pct * 100);
    }
    if (monthStr) {
      if (!months[monthStr]) months[monthStr] = { count: 0, earned: 0, denom: 0 };
      months[monthStr].count++; months[monthStr].earned += s.earned; months[monthStr].denom += s.denominator;
    }

    for (const key of Object.keys(r)) {
      if (!key || META_KEYS.has(key)) continue;
      if (key.startsWith('Points - ') || key.startsWith('Feedback - ')) continue;
      const pk = `Points - ${key}`, fk = `Feedback - ${key}`;
      if (!(pk in r) && !(fk in r)) continue;
      const value = String(r[key] ?? '').trim();
      const pointsVal = String(r[pk] ?? '').trim();
      const fbVal = String(r[fk] ?? '').trim();
      if (value === 'N/A') criteriaStatus.na++;
      else if (pointsVal === '1' || value === 'OK') criteriaStatus.ok++;
      else if (pointsVal === '0' || value === 'NOK') criteriaStatus.nok++;

      if (pointsVal === '0' || value === 'NOK') {
        const clean = key.replace(/\s*\(.*\)\s*$/, '').trim();
        criteriaNok[clean] = (criteriaNok[clean] || 0) + 1;
      }
      if (fbVal && fbVal.length > 2 && fbVal.toLowerCase() !== 'ras' && fbVal.toLowerCase() !== 'ok') {
        const fb = fbVal.toLowerCase().slice(0, 80);
        feedbacks[fb] = (feedbacks[fb] || 0) + 1;
      }
    }

    const qf = String(r['Quiz feedback'] || '').trim().toLowerCase();
    if (qf === 'ok') quizFb.ok++;
    else if (qf === 'nok' || qf === 'n/a') quizFb.na++;
    else quizFb.nok++;

    const pct = Math.round(s.pct * 100);
    const bucket = Math.min(100, Math.floor(pct / 10) * 10);
    dist[bucket] = (dist[bucket] || 0) + 1;
  }

  const rank = (obj, key = 'pct') =>
    Object.entries(obj).map(([name, x]) => {
      const pct = x.denom > 0 ? x.earned / x.denom : 0;
      return {
        name, count: x.count, earned: x.earned, denom: x.denom,
        avg: +(x.earned / x.count).toFixed(2),
        pct, pctRounded: Math.round(pct * 100),
      };
    }).sort((a, b) => b[key] - a[key]);

  const byZone = rank(zones, 'pct');
  const byAuditeur = rank(auditeurs, 'count');
  const byPilot = rank(pilots, 'pct');

  const trend = Object.entries(dates).map(([date, d]) => ({
    date, count: d.count,
    avg: +(d.earned / d.count).toFixed(2),
    pct: Math.round((d.earned / d.denom) * 100),
  })).sort((a, b) => a.date.localeCompare(b.date));

  const byMonth = Object.entries(months).map(([month, d]) => ({
    month, count: d.count,
    avg: +(d.earned / d.count).toFixed(2),
    pct: Math.round((d.earned / d.denom) * 100),
  })).sort((a, b) => a.month.localeCompare(b.month));

  const topNokCriteria = Object.entries(criteriaNok)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count).slice(0, 12);

  const topFeedbacks = Object.entries(feedbacks)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count).slice(0, 12);

  const weekdayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const scoreByWeekday = Object.entries(weekday).map(([d, arr]) => ({
    day: weekdayLabels[Number(d)],
    count: arr.length,
    pct: arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0,
  })).filter((x) => x.count > 0);

  const scoreDistribution = Object.entries(dist).map(([b, count]) => ({
    bucket: `${b}-${Number(b) + 9}%`,
    min: Number(b), count,
  })).sort((a, b) => a.min - b.min);

  const avgPct = sumDenom > 0 ? Math.round((sumEarned / sumDenom) * 100) : 0;

  return {
    total: rows.length,
    criteriaStatus: criteriaStatus,
    avgScore: +(sumEarned / rows.length).toFixed(2),
    avgPct,
    bestZone: byZone[0] || null,
    worstZone: byZone[byZone.length - 1] || null,
    byZone, byAuditeur, byPilot, trend, byMonth,
    topNokCriteria, topFeedbacks,
    quizFeedback: quizFb,
    scoreDistribution, scoreByWeekday,
  };
}
