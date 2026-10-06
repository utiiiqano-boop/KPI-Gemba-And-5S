import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { useRealtimeList } from "../hooks/useFirebaseData";
import {
  currentMonth, prevMonth,
  get5SZone, get5SScore, get5SDate, parseDate, get5SUap,
  lastCompleteWeek, isoWeekKey,
  filter5SByWeek, filterGembaByWeek,
  filterByPeriod, filterByDateRange, availableAllMonths, availableAllWeeks, prevWeekKey,
  buildUapSeriesByDates,
  avg5SByPillar, avgGembaBy5M,
  monthly5SAgg, monthlyGembaAgg,
  gembaAuditKey,
  buildPlanVsRealised,
  buildUapWeeklySeries,
  buildWeekPerGroupScores,
  buildPeriodPerGroupScores,
  buildSmallMultiples,
} from "../utils/analytics";
import { PLAN, normalizeUapGemba } from "../config/dashboardConfig";
import Panel from "../components/dashboard/Panel";
import KpiCard from "../components/dashboard/KpiCard";
import PlanVsRealiseChart from "../components/dashboard/PlanVsRealiseChart";
import MultiLineUapChart from "../components/dashboard/MultiLineUapChart";
import WeekBarChart from "../components/dashboard/WeekBarChart";
import SmallMultiplesTrend from "../components/dashboard/SmallMultiplesTrend";
import DashboardFilters from "../components/dashboard/DashboardFilters";
import "./Dashboard.css";

export default function Dashboard() {
  const { data: fiveSRaw } = useRealtimeList("5s_audits");
  const { data: gembaRaw } = useRealtimeList("gemba_ojt");

  // ---- Filtres période ----
  const [periodType, setPeriodType] = useState("all");
  const [monthValue, setMonthValue] = useState("");
  const [weekValue, setWeekValue] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const months = useMemo(() => availableAllMonths(fiveSRaw, gembaRaw), [fiveSRaw, gembaRaw]);
  const weeks  = useMemo(() => availableAllWeeks(fiveSRaw, gembaRaw), [fiveSRaw, gembaRaw]);

  // ---- Semaines à afficher selon le filtre ----
  const weeksList = useMemo(() => {
    if (periodType === "week" && weekValue) {
      const list = [];
      let cur = weekValue;
      for (let i = 0; i < 8; i++) {
        list.unshift(cur);
        cur = prevWeekKey(cur);
      }
      return list;
    }
    if (periodType === "month" && monthValue) {
      const [y, m] = monthValue.split("-").map(Number);
      const set = new Set();
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0);
      for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
        set.add(isoWeekKey(d));
      }
      return [...set].sort();
    }
    return null;
  }, [periodType, monthValue, weekValue]);

  // ---- Données filtrées ----
  const fiveS = useMemo(() => {
    if (periodType === "range") {
      return filterByDateRange(fiveSRaw, dateFrom, dateTo, "5S");
    }
    return filterByPeriod(fiveSRaw, periodType, periodType === "month" ? monthValue : weekValue, "5S");
  }, [fiveSRaw, periodType, monthValue, weekValue, dateFrom, dateTo]);

  const gemba = useMemo(() => {
    if (periodType === "range") {
      return filterByDateRange(gembaRaw, dateFrom, dateTo, "GEMBA");
    }
    return filterByPeriod(gembaRaw, periodType, periodType === "month" ? monthValue : weekValue, "GEMBA");
  }, [gembaRaw, periodType, monthValue, weekValue, dateFrom, dateTo]);

  const thisMonth = currentMonth();
  const lastMonth = prevMonth(thisMonth);

  // ---------- KPI cards ----------
  const m5S = useMemo(() => monthly5SAgg(fiveSRaw), [fiveSRaw]);
  const mGemba = useMemo(() => monthlyGembaAgg(gembaRaw), [gembaRaw]);
  const thisMonth5S = m5S.find((x) => x.month === thisMonth) || { avg: 0, count: 0 };
  const lastMonth5S = m5S.find((x) => x.month === lastMonth) || { avg: 0, count: 0 };
  const thisMonthG = mGemba.find((x) => x.month === thisMonth) || { avg: 0, count: 0 };
  const lastMonthG = mGemba.find((x) => x.month === lastMonth) || { avg: 0, count: 0 };
  const delta5S = +(thisMonth5S.avg - lastMonth5S.avg).toFixed(1);
  const deltaG = +(thisMonthG.avg - lastMonthG.avg).toFixed(1);

  // ---------- S-1 (semaine dernière) ----------
  const week5S = useMemo(() => lastCompleteWeek(fiveSRaw, "5S"), [fiveSRaw]);
  const weekGemba = useMemo(() => lastCompleteWeek(gembaRaw, "GEMBA"), [gembaRaw]);

  const fiveSS1 = useMemo(() => filter5SByWeek(fiveSRaw, week5S), [fiveSRaw, week5S]);
  const gembaS1 = useMemo(() => filterGembaByWeek(gembaRaw, weekGemba), [gembaRaw, weekGemba]);

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
  // Tous les UAP 5S présents dans le dataset complet
  const uaps5SAll = useMemo(() => {
    const s = new Set();
    fiveSRaw.forEach((r) => {
      const u = get5SUap ? get5SUap(r) : null;
      if (u && u !== "Autre") s.add(u);
    });
    return s;
  }, [fiveSRaw]);

  // ---------- UAP Gemba actifs en S-1 ----------
  // Tous les UAP Gemba présents dans le dataset complet
  const uapsGembaAll = useMemo(() => {
    const s = new Set();
    gembaRaw.forEach((r) => {
      const u = normalizeUapGemba ? normalizeUapGemba(r.uap) : r.uap;
      if (u && u !== "—") s.add(u);
    });
    return s;
  }, [gembaRaw]);

  // ---------- Stats filtrées selon la période ----------
  const stats5SFiltered = useMemo(() => {
    if (!fiveS.length) return { count: 0, avg: 0 };
    const avg = +(fiveS.reduce((a, r) => a + get5SScore(r).percent, 0) / fiveS.length).toFixed(1);
    return { count: fiveS.length, avg };
  }, [fiveS]);

  const statsGembaFiltered = useMemo(() => {
    const seen = new Set();
    let sum = 0, n = 0;
    gemba.forEach((r) => {
      const sig = gembaAuditKey(r);
      if (seen.has(sig)) return;
      seen.add(sig);
      sum += Number(r.score ?? 0);
      n++;
    });
    return { count: n, avg: n ? +(sum / n).toFixed(1) : 0 };
  }, [gemba]);

  // ---------- Libellés KPI dynamiques ----------
  const kpiLabel5S = periodType === "all"
    ? "5S ce mois"
    : periodType === "month"
      ? `5S · ${monthValue || "—"}`
      : periodType === "week"
        ? `5S · ${weekValue || "—"}`
        : periodType === "range"
          ? `5S · ${dateFrom || "…"} → ${dateTo || "…"}`
          : "5S";

  const kpiLabelGemba = periodType === "all"
    ? "Gemba ce mois"
    : periodType === "month"
      ? `Gemba · ${monthValue || "—"}`
      : periodType === "week"
        ? `Gemba · ${weekValue || "—"}`
        : periodType === "range"
          ? `Gemba · ${dateFrom || "…"} → ${dateTo || "…"}`
          : "Gemba";

  const kpiValue5S = periodType === "all" ? thisMonth5S.count : stats5SFiltered.count;
  const kpiAvg5S   = periodType === "all" ? thisMonth5S.avg   : stats5SFiltered.avg;
  const kpiValueG  = periodType === "all" ? thisMonthG.count  : statsGembaFiltered.count;
  const kpiAvgG    = periodType === "all" ? thisMonthG.avg    : statsGembaFiltered.avg;

  // ---------- Planifié vs Réalisé ----------
  const plan5S = useMemo(() => buildPlanVsRealised(fiveSRaw, "5S", 24, PLAN["5S"]), [fiveSRaw]);
  const planGemba = useMemo(() => buildPlanVsRealised(gembaRaw, "GEMBA", 24, PLAN.GEMBA), [gembaRaw]);

  // ---------- Moyenne par UAP (8 semaines) ----------
  const uap5SSeries = useMemo(() => {
    if (periodType === "range") {
      return buildUapSeriesByDates(fiveS, "5S", "uap", uaps5SAll.size ? uaps5SAll : null);
    }
    return buildUapWeeklySeries(fiveSRaw, "5S", weeksList || 8, "uap", uaps5SAll.size ? uaps5SAll : null);
  }, [fiveS, fiveSRaw, periodType, uaps5SAll, weeksList]);

  const uapGembaSeries = useMemo(() => {
    if (periodType === "range") {
      return buildUapSeriesByDates(gemba, "GEMBA", "uap", uapsGembaAll.size ? uapsGembaAll : null);
    }
    return buildUapWeeklySeries(gembaRaw, "GEMBA", weeksList || 8, "uap", uapsGembaAll.size ? uapsGembaAll : null);
  }, [gemba, gembaRaw, periodType, uapsGembaAll, weeksList]);

  // ---------- Résultat S-1 (barres rouges) ----------
  // Barres "Résultat par zone/ligne" :
  // - Filtre = "all"  → dernière semaine complète (S-1)
  // - Filtre = semaine/mois → agrégation sur la période filtrée
  const s1Bars5S = useMemo(() => {
    if (periodType === "all") {
      return buildWeekPerGroupScores(fiveSRaw, week5S, "5S", "zone");
    }
    return buildPeriodPerGroupScores(fiveS, "5S", "zone");
  }, [periodType, fiveSRaw, week5S, fiveS]);

  const s1BarsGemba = useMemo(() => {
    if (periodType === "all") {
      return buildWeekPerGroupScores(gembaRaw, weekGemba, "GEMBA", "ligne");
    }
    return buildPeriodPerGroupScores(gemba, "GEMBA", "ligne");
  }, [periodType, gembaRaw, weekGemba, gemba]);

  // Label dynamique pour les titres
  const resultPeriodLabel5S = periodType === "all"
    ? week5S
    : periodType === "month"
      ? monthValue
      : weekValue;

  const resultPeriodLabelGemba = periodType === "all"
    ? weekGemba
    : periodType === "month"
      ? monthValue
      : weekValue;

  // ---------- Tendance historique + régression ----------
  // Entités à afficher dans les tendances :
  // - Si filtre = "all"  → entités auditées en S-1 (par défaut)
  // - Si filtre = "month" ou "week" → entités auditées sur la période filtrée
  const zonesToTrend = useMemo(() => {
    const s = new Set();
    const source = periodType === "all" ? fiveSS1 : fiveS;
    source.forEach((r) => {
      const z = get5SZone(r);
      if (z && z !== "—") s.add(z);
    });
    return s;
  }, [fiveSS1, fiveS, periodType]);

  const lignesToTrend = useMemo(() => {
    const s = new Set();
    const source = periodType === "all" ? gembaS1 : gemba;
    source.forEach((r) => {
      const l = r.ligne || r.uap;
      if (l && l !== "—") s.add(l);
    });
    return s;
  }, [gembaS1, gemba, periodType]);

  const small5S = useMemo(
    () => buildSmallMultiples(fiveSRaw, "5S", "zone", zonesToTrend),
    [fiveSRaw, zonesToTrend]
  );
  const smallGemba = useMemo(
    () => buildSmallMultiples(gembaRaw, "GEMBA", "ligne", lignesToTrend),
    [gembaRaw, lignesToTrend]
  );

  // ---------- 5S axes + Gemba 5M ----------
  const pillars5S = useMemo(() => avg5SByPillar(fiveS), [fiveS]);
  const points5M = useMemo(() => avgGembaBy5M(gemba), [gemba]);

  // ---------- Label période ----------
  const periodLabel = periodType === "all"
    ? "Toutes les périodes"
    : periodType === "month"
      ? `Mois : ${monthValue || "—"}`
      : `Semaine : ${weekValue || "—"}`;

  return (
    <div className="dashboard">
      {/* ============ FILTRES ============ */}
      <DashboardFilters
        periodType={periodType}
        setPeriodType={setPeriodType}
        monthValue={monthValue}
        setMonthValue={setMonthValue}
        weekValue={weekValue}
        setWeekValue={setWeekValue}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        months={months}
        weeks={weeks}
      />

      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, paddingLeft: 4 }}>
        Période active : <strong style={{ color: "#c7d2fe" }}>{periodLabel}</strong>
        {" · "}
        {fiveS.length} audits 5S · {new Set(gemba.map(gembaAuditKey)).size} audits Gemba
        <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>
          ℹ️ Les courbes de tendance (par zone/ligne) affichent l'<strong>historique complet</strong> des entités auditées sur la période.
        </div>
      </div>

      {/* ============ KPI CARDS ============ */}
      <div className="kpi-grid">
        <KpiCard
          label={kpiLabel5S}
          value={`${kpiValue5S} audits`}
          sub={periodType === "all" ? `M-1: ${lastMonth5S.count} audits` : `${fiveS.length} lignes au total`}
          accent="linear-gradient(135deg,#6366f1,#8b5cf6)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
        />
        <KpiCard
          label="Score 5S moyen"
          value={`${kpiAvg5S}%`}
          sub={periodType === "all"
            ? (delta5S >= 0 ? `▲ +${delta5S} pts vs M-1` : `▼ ${delta5S} pts vs M-1`)
            : `${stats5SFiltered.count} audits sur la période`}
          accent="linear-gradient(135deg,#f97316,#ef4444)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>}
        />
        <KpiCard
          label={kpiLabelGemba}
          value={`${kpiValueG} audits`}
          sub={periodType === "all" ? `M-1: ${lastMonthG.count} audits` : `${gemba.length} lignes au total`}
          accent="linear-gradient(135deg,#06b6d4,#6366f1)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>}
        />
        <KpiCard
          label="Score Gemba moyen"
          value={`${kpiAvgG}%`}
          sub={periodType === "all"
            ? (deltaG >= 0 ? `▲ +${deltaG} pts vs M-1` : `▼ ${deltaG} pts vs M-1`)
            : `${statsGembaFiltered.count} audits sur la période`}
          accent="linear-gradient(135deg,#22c55e,#06b6d4)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        />
      </div>

      {/* ============ SECTION 5S ============ */}
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

      <Panel title={`5S — Résultat ${resultPeriodLabel5S} par zone`} subtitle={`${s1Bars5S.length} zones · ${fiveS.length} audits`}>
        <WeekBarChart data={s1Bars5S} barColor="#dc2626" />
      </Panel>

      <Panel title={periodType === "week" && weekValue
    ? `5S — Moyenne par UAP · Semaine ${weekValue}`
    : periodType === "month" && monthValue
      ? `5S — Moyenne par UAP · Mois ${monthValue}`
      : periodType === "range" && (dateFrom || dateTo)
        ? `5S — Moyenne par UAP · ${dateFrom || "…"} → ${dateTo || "…"}`
        : "5S — Moyenne par UAP (8 semaines)"} subtitle={`${uap5SSeries.keys.length} UAP au total`}>
        <MultiLineUapChart data={uap5SSeries.data} keys={uap5SSeries.keys} />
      </Panel>

      <Panel
        title="5S — Tendance par zone (historique complet)"
        subtitle={`${small5S.length} zones auditées sur la période · historique complet`}
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

      {/* ============ SECTION GEMBA ============ */}
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

      <Panel title={`Gemba — Résultat ${resultPeriodLabelGemba} par ligne`} subtitle={`${s1BarsGemba.length} lignes · ${new Set(gemba.map(gembaAuditKey)).size} audits`}>
        <WeekBarChart data={s1BarsGemba} barColor="#dc2626" />
      </Panel>

      <Panel title={periodType === "week" && weekValue
    ? `Gemba — Moyenne par UAP · Semaine ${weekValue}`
    : periodType === "month" && monthValue
      ? `Gemba — Moyenne par UAP · Mois ${monthValue}`
      : periodType === "range" && (dateFrom || dateTo)
        ? `Gemba — Moyenne par UAP · ${dateFrom || "…"} → ${dateTo || "…"}`
        : "Gemba — Moyenne par UAP (8 semaines)"} subtitle={`${uapGembaSeries.keys.length} UAP au total`}>
        <MultiLineUapChart data={uapGembaSeries.data} keys={uapGembaSeries.keys} />
      </Panel>

      <Panel
        title="Gemba — Tendance par ligne (historique complet)"
        subtitle={`${smallGemba.length} lignes auditées sur la période · historique complet`}
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
