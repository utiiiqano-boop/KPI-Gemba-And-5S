import { useMemo } from "react";
import {
  ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { useRealtimeList } from "../hooks/useFirebaseData";
import {
  currentMonth, prevMonth,
  get5SZone, get5SScore, get5SUap,
  lastCompleteWeek,
  filter5SByWeek, filterGembaByWeek,
  avg5SByPillar, avgGembaBy5M,
  monthly5SAgg, monthlyGembaAgg,
  gembaAuditKey,
  buildPlanVsRealised,
  buildUapWeeklySeries,
  buildWeekPerGroupScores,
  buildSmallMultiples,
} from "../utils/analytics";
import { PLAN, normalizeUapGemba } from "../config/dashboardConfig";
import Panel from "../components/dashboard/Panel";
import KpiCard from "../components/dashboard/KpiCard";
import PlanVsRealiseChart from "../components/dashboard/PlanVsRealiseChart";
import MultiLineUapChart from "../components/dashboard/MultiLineUapChart";
import WeekBarChart from "../components/dashboard/WeekBarChart";
import SmallMultiplesTrend from "../components/dashboard/SmallMultiplesTrend";
import "./Dashboard.css";

export default function Dashboard() {
  const { data: fiveS } = useRealtimeList("5s_audits");
  const { data: gemba } = useRealtimeList("gemba_ojt");

  const thisMonth = currentMonth();
  const lastMonth = prevMonth(thisMonth);

  // ---------- KPI cards ----------
  const m5S = useMemo(() => monthly5SAgg(fiveS), [fiveS]);
  const mGemba = useMemo(() => monthlyGembaAgg(gemba), [gemba]);
  const thisMonth5S = m5S.find((x) => x.month === thisMonth) || { avg: 0, count: 0 };
  const lastMonth5S = m5S.find((x) => x.month === lastMonth) || { avg: 0, count: 0 };
  const thisMonthG = mGemba.find((x) => x.month === thisMonth) || { avg: 0, count: 0 };
  const lastMonthG = mGemba.find((x) => x.month === lastMonth) || { avg: 0, count: 0 };
  const delta5S = +(thisMonth5S.avg - lastMonth5S.avg).toFixed(1);
  const deltaG = +(thisMonthG.avg - lastMonthG.avg).toFixed(1);

  // ---------- S-1 (semaine dernière) ----------
  const week5S = useMemo(() => lastCompleteWeek(fiveS, "5S"), [fiveS]);
  const weekGemba = useMemo(() => lastCompleteWeek(gemba, "GEMBA"), [gemba]);

  const fiveSS1 = useMemo(() => filter5SByWeek(fiveS, week5S), [fiveS, week5S]);
  const gembaS1 = useMemo(() => filterGembaByWeek(gemba, weekGemba), [gemba, weekGemba]);

  const avg5SS1 = fiveSS1.length
    ? +(fiveSS1.reduce((a, r) => a + get5SScore(r).percent, 0) / fiveSS1.length).toFixed(1)
    : 0;

  const gembaAuditsS1 = new Set(gembaS1.map(gembaAuditKey)).size;

  const avgGembaS1 = (() => {
    const seen = new Set();
    let sum = 0, n = 0;
    gembaS1.forEach((r) => {
      const sig = gembaAuditKey(r);
      if (seen.has(sig)) return;
      seen.add(sig);
      sum += Number(r.score ?? 0);
      n++;
    });
    return n ? +(sum / n).toFixed(1) : 0;
  })();

  // ---------- UAP 5S actifs en S-1 ----------
  const uaps5SS1 = useMemo(() => {
    const s = new Set();
    fiveSS1.forEach((r) => {
      const u = get5SUap(r);
      if (u && u !== "Autre") s.add(u);
    });
    return s;
  }, [fiveSS1]);

  // ---------- UAP Gemba actifs en S-1 ----------
  const uapsGembaS1 = useMemo(() => {
    const s = new Set();
    gembaS1.forEach((r) => {
      const u = normalizeUapGemba(r.uap) || r.uap;
      if (u && u !== "—") s.add(u);
    });
    return s;
  }, [gembaS1]);

  // ---------- Planifié vs Réalisé ----------
  const plan5S = useMemo(() => buildPlanVsRealised(fiveS, "5S", 24, PLAN["5S"]), [fiveS]);
  const planGemba = useMemo(() => buildPlanVsRealised(gemba, "GEMBA", 24, PLAN.GEMBA), [gemba]);

  // ---------- Moyenne par UAP (8 semaines) ----------
  const uap5SSeries = useMemo(
    () => buildUapWeeklySeries(fiveS, "5S", 8, "uap", uaps5SS1),
    [fiveS, uaps5SS1]
  );
  const uapGembaSeries = useMemo(
    () => buildUapWeeklySeries(gemba, "GEMBA", 8, "uap", uapsGembaS1),
    [gemba, uapsGembaS1]
  );

  // ---------- Résultat S-1 (barres rouges) ----------
  const s1Bars5S = useMemo(() => buildWeekPerGroupScores(fiveS, week5S, "5S", "zone"), [fiveS, week5S]);
  const s1BarsGemba = useMemo(() => buildWeekPerGroupScores(gemba, weekGemba, "GEMBA", "ligne"), [gemba, weekGemba]);

  // ---------- Tendance historique + régression (uniquement les zones/lignes S-1) ----------
  const zonesS1 = useMemo(() => {
    const s = new Set();
    fiveSS1.forEach((r) => {
      const z = get5SZone(r);
      if (z && z !== "—") s.add(z);
    });
    return s;
  }, [fiveSS1]);

  const lignesS1 = useMemo(() => {
    const s = new Set();
    gembaS1.forEach((r) => {
      const l = r.ligne || r.uap;
      if (l && l !== "—") s.add(l);
    });
    return s;
  }, [gembaS1]);

  const small5S = useMemo(
    () => buildSmallMultiples(fiveS, "5S", "zone", zonesS1),
    [fiveS, zonesS1]
  );
  const smallGemba = useMemo(
    () => buildSmallMultiples(gemba, "GEMBA", "ligne", lignesS1),
    [gemba, lignesS1]
  );

  // ---------- 5S axes + Gemba 5M ----------
  const pillars5S = useMemo(() => avg5SByPillar(fiveS), [fiveS]);
  const points5M = useMemo(() => avgGembaBy5M(gemba), [gemba]);

  return (
    <div className="dashboard">
      {/* ============ KPI CARDS ============ */}
      <div className="kpi-grid">
        <KpiCard
          label="5S ce mois"
          value={`${thisMonth5S.count} audits`}
          sub={`M-1: ${lastMonth5S.count} audits`}
          accent="linear-gradient(135deg,#6366f1,#8b5cf6)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
        />
        <KpiCard
          label="Score 5S moyen"
          value={`${thisMonth5S.avg}%`}
          sub={delta5S >= 0 ? `▲ +${delta5S} pts vs M-1` : `▼ ${delta5S} pts vs M-1`}
          accent="linear-gradient(135deg,#f97316,#ef4444)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>}
        />
        <KpiCard
          label="Gemba ce mois"
          value={`${thisMonthG.count} audits`}
          sub={`M-1: ${lastMonthG.count} audits`}
          accent="linear-gradient(135deg,#06b6d4,#6366f1)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>}
        />
        <KpiCard
          label="Score Gemba moyen"
          value={`${thisMonthG.avg}%`}
          sub={deltaG >= 0 ? `▲ +${deltaG} pts vs M-1` : `▼ ${deltaG} pts vs M-1`}
          accent="linear-gradient(135deg,#22c55e,#06b6d4)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        />
      </div>

      {/* ============================================================ */}
      {/* ====================== SECTION 5S ========================= */}
      {/* ============================================================ */}
      <div className="section-header">
        <span className="section-badge" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>5S</span>
        <span className="section-title">Résultats 5S</span>
      </div>

      <Panel title="5S — Planifié vs Réalisé" subtitle={`Plan: ${PLAN["5S"]} audits/semaine · 24 semaines`}>
        <PlanVsRealiseChart data={plan5S} />
      </Panel>

      <Panel title="5S — Semaine S-1" subtitle={`${week5S} · ${fiveSS1.length} audits`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="stat-box">
            <div className="stat-value" style={{ color: "#a5b4fc" }}>{fiveSS1.length}</div>
            <div className="stat-label">Audits 5S</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: avg5SS1 >= 80 ? "#86efac" : avg5SS1 >= 60 ? "#fde047" : "#fca5a5" }}>{avg5SS1}%</div>
            <div className="stat-label">Score moyen</div>
          </div>
        </div>
      </Panel>

      <Panel title={`5S — Résultat ${week5S} par zone`} subtitle={`${s1Bars5S.length} zones auditées`}>
        <WeekBarChart data={s1Bars5S} barColor="#dc2626" />
      </Panel>

      <Panel title="5S — Moyenne par UAP (8 semaines)" subtitle={`${uap5SSeries.keys.length} UAP audité(s) en S-1`}>
        <MultiLineUapChart data={uap5SSeries.data} keys={uap5SSeries.keys} />
      </Panel>

      <Panel
        title="5S — Tendance par zone (historique complet)"
        subtitle={`${small5S.length} zones auditées en S-1 · tendance ↗/↘/→`}
      >
        <SmallMultiplesTrend seriesData={small5S} columns={2} />
      </Panel>

      <Panel title="5S — Résultats par axe (5 piliers)" subtitle="Score moyen">
        <ResponsiveContainer width="100%" height={360}>
          <RadarChart data={pillars5S}>
            <PolarGrid stroke="rgba(148,163,184,0.2)" />
            <PolarAngleAxis dataKey="pillar" stroke="#94a3b8" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#475569" />
            <Radar name="Score %" dataKey="avg" stroke="#a855f7" fill="#a855f7" fillOpacity={0.45} />
          </RadarChart>
        </ResponsiveContainer>
      </Panel>

      {/* ============================================================ */}
      {/* ==================== SECTION GEMBA ======================== */}
      {/* ============================================================ */}
      <div className="section-header">
        <span className="section-badge" style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)" }}>GEMBA</span>
        <span className="section-title">Résultats Gemba OJT</span>
      </div>

      <Panel title="Gemba — Planifié vs Réalisé" subtitle={`Plan: ${PLAN.GEMBA} audits/semaine · 24 semaines`}>
        <PlanVsRealiseChart data={planGemba} />
      </Panel>

      <Panel title="Gemba — Semaine S-1" subtitle={`${weekGemba} · ${gembaAuditsS1} audits`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="stat-box">
            <div className="stat-value" style={{ color: "#a5b4fc" }}>{gembaAuditsS1}</div>
            <div className="stat-label">Audits Gemba</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: avgGembaS1 >= 80 ? "#86efac" : avgGembaS1 >= 60 ? "#fde047" : "#fca5a5" }}>{avgGembaS1}%</div>
            <div className="stat-label">Score moyen</div>
          </div>
        </div>
      </Panel>

      <Panel title={`Gemba — Résultat ${weekGemba} par ligne`} subtitle={`${s1BarsGemba.length} lignes auditées`}>
        <WeekBarChart data={s1BarsGemba} barColor="#dc2626" />
      </Panel>

      <Panel title="Gemba — Moyenne par UAP (8 semaines)" subtitle={`${uapGembaSeries.keys.length} UAP audité(s) en S-1`}>
        <MultiLineUapChart data={uapGembaSeries.data} keys={uapGembaSeries.keys} />
      </Panel>

      <Panel
        title="Gemba — Tendance par ligne (historique complet)"
        subtitle={`${smallGemba.length} lignes auditées en S-1 · tendance ↗/↘/→`}
      >
        <SmallMultiplesTrend seriesData={smallGemba} columns={2} />
      </Panel>

      <Panel title="Gemba — Résultats par 5M" subtitle="Taux OK % par catégorie">
        <WeekBarChart
          data={points5M.map((p) => ({ name: p.m, score: p.rate }))}
          barColor="#2563eb"
        />
      </Panel>
    </div>
  );
}
