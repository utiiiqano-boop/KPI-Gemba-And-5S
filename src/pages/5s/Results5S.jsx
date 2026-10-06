import { useMemo, useState } from "react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import { useRealtimeList } from "../../hooks/useFirebaseData";
import {
  
  PILLARS, yyyymm, available5SMonths,
  get5SDate, get5SZone, get5SScore, get5SAuditor, get5SZoneLeader, get5STotal, get5SAnswers,
  fiveSRadarByMonth, fiveSTrend, fiveSByZone, fiveSTopFailures, fiveSActions,
  currentMonth, prevMonth, lastCompleteWeek, isoWeekKey,
  filter5SByMonth, filter5SByWeek,
  stats5S, byZone5S, topBottom5S, topPriorities5S,
} from "../../utils/analytics";
import Panel from "../../components/dashboard/Panel";
import Heatmap from "../../components/results/Heatmap";
import StatsRow from "../../components/results/StatsRow";
import ResultFilters, { Select, DateRange, ResetButton } from "../../components/results/ResultFilters";
import PeriodComparison from "../../components/results/PeriodComparison";
import ActionDateFilter from "../../components/results/ActionDateFilter";
import TopBottomPanel from "../../components/results/TopBottomPanel";
import PrioritiesPanel from "../../components/results/PrioritiesPanel";
import ExportButton from "../../components/report/ExportButton";
import Period5SReport from "../../components/report/Period5SReport";
import { scoreColor } from "../../utils/colors";
import "../../pages/Results.css";

export default function Results5S() {
  const { data: records, loading } = useRealtimeList("5s_audits");

  const [zone, setZone] = useState("");
  const [auditor, setAuditor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const zones = useMemo(
    () => [...new Set(records.map(get5SZone).filter((z) => z && z !== "—"))].sort(),
    [records]
  );
  const auditors = useMemo(
    () => [...new Set(records.map(get5SAuditor).filter((a) => a && a !== "—"))].sort(),
    [records]
  );
  const months = useMemo(() => available5SMonths(records), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const z = get5SZone(r);
      const a = get5SAuditor(r);
      const d = get5SDate(r);
      if (zone && z !== zone) return false;
      if (auditor && a !== auditor) return false;
      if (month) {
        if (!d || yyyymm(d) !== month) return false;
      }
      if (dateFrom) {
        if (!d || d < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        if (!d || d > new Date(dateTo + "T23:59:59")) return false;
      }
      return true;
    });
  }, [records, zone, auditor, month, dateFrom, dateTo]);

  const activeMonth = month || months[0] || "";

  const radarData = useMemo(() => fiveSRadarByMonth(filtered, activeMonth), [filtered, activeMonth]);
  const trend = useMemo(() => fiveSTrend(filtered), [filtered]);
  const byZone = useMemo(() => fiveSByZone(filtered), [filtered]);
  const topFailures = useMemo(() => fiveSTopFailures(filtered, 10), [filtered]);
  const actions = useMemo(() => fiveSActions(filtered), [filtered]);
  const [actionsFiltered, setActionsFiltered] = useState(actions);

  const avg5S = filtered.length
    ? +(filtered.reduce((a, r) => a + get5SScore(r).percent, 0) / filtered.length).toFixed(1)
    : 0;

  const bestPillar = radarData.reduce((b, r) => (r.average > (b?.average ?? -1) ? r : b), null);
  const worstPillar = radarData.reduce((b, r) => (r.average < (b?.average ?? 999) ? r : b), null);

  // ============ Heatmap : zones × questions ============
  const heatmapData = useMemo(() => {
    // Row keys = zones distinctes (ou filtrées)
    const rowKeys = [...new Set(filtered.map(get5SZone).filter((z) => z && z !== "—"))].sort();

    const matrix = {};
    rowKeys.forEach((zone) => {
      matrix[zone] = {};
      const recs = filtered.filter((r) => get5SZone(r) === zone);
      for (let i = 1; i <= 26; i++) {
        let nok = 0;
        let total = 0;
        recs.forEach((r) => {
          const a = (r?.answers || []).find((x) => x.index === i);
          if (!a) return;
          // On ignore les N/A
          if (a.status === "N/A" || a.points === "" || a.points === undefined) return;
          total++;
          if (Number(a.points) === 0) nok++;
        });
        if (total > 0) {
          matrix[zone][i] = +((nok / total) * 100).toFixed(1);
        }
      }
    });

    return {
      rows: rowKeys.map((z) => ({ key: z, label: z })),
      matrix,
    };
  }, [filtered]);

  // ============ Top/Bottom 3 + Priorités ============
  const tb5S = useMemo(() => topBottom5S(filtered, "zone", 3), [filtered]);
  const priorities5S = useMemo(() => topPriorities5S(filtered, 3), [filtered]);

  const reset = () => { setZone(""); setAuditor(""); setDateFrom(""); setDateTo(""); setMonth(""); };
  const hasFilter = zone || auditor || dateFrom || dateTo || month;

  // ---------- M-1 comparison ----------
  const thisM = currentMonth();
  const lastM = prevMonth(thisM);

  const currMRecs = useMemo(() => filter5SByMonth(records, thisM), [records, thisM]);
  const prevMRecs = useMemo(() => filter5SByMonth(records, lastM), [records, lastM]);
  const currMStats = useMemo(() => stats5S(currMRecs), [currMRecs]);
  const prevMStats = useMemo(() => stats5S(prevMRecs), [prevMRecs]);
  const currMByZone = useMemo(() => byZone5S(currMRecs), [currMRecs]);
  const prevMByZone = useMemo(() => byZone5S(prevMRecs), [prevMRecs]);

  // ---------- S-1 comparison ----------
  const s1 = useMemo(() => lastCompleteWeek(records, "5S"), [records]);
  const s2 = useMemo(() => {
    const [y, w] = s1.split("-W").map(Number);
    const d = new Date(y, 0, 1 + (w - 1) * 7);
    d.setDate(d.getDate() - 7);
    return isoWeekKey(d);
  }, [s1]);

  const s1Recs = useMemo(() => filter5SByWeek(records, s1), [records, s1]);
  const s2Recs = useMemo(() => filter5SByWeek(records, s2), [records, s2]);
  const s1Stats = useMemo(() => stats5S(s1Recs), [s1Recs]);
  const s2Stats = useMemo(() => stats5S(s2Recs), [s2Recs]);
  const s1ByZone = useMemo(() => byZone5S(s1Recs), [s1Recs]);
  const s2ByZone = useMemo(() => byZone5S(s2Recs), [s2Recs]);

  return (
    <div className="results-page">
      <ResultFilters>
        <Select label="Zone / Ligne" value={zone} onChange={setZone} options={zones} />
        <Select label="Auditeur" value={auditor} onChange={setAuditor} options={auditors} />
        <Select label="Mois" value={month} onChange={setMonth} options={months} />
        <div className="filter-field">
          <label>Du</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="filter-field">
          <label>Au</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <ResetButton onClick={reset} disabled={!hasFilter} />
      </ResultFilters>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <ExportButton
          fileName={`rapport-5S-${activeMonth || "global"}.pdf`}
          label="Rapport PDF 5S"
          renderContent={() => (
            <Period5SReport
              records={filtered}
              periodLabel={activeMonth || "Toutes périodes"}
            />
          )}
        />
      </div>

      <StatsRow
        items={[
          { label: "Audits", value: filtered.length, color: "#a5b4fc" },
          { label: "Score moyen", value: `${avg5S}%`, color: "#f97316" },
          { label: "Meilleur axe", value: bestPillar ? `${bestPillar.pillar} (${bestPillar.average})` : "—", color: "#22c55e" },
          { label: "Axe faible", value: worstPillar ? `${worstPillar.pillar} (${worstPillar.average})` : "—", color: "#ef4444" },
          { label: "Actions ouvertes", value: actions.length, color: "#fbbf24" },
        ]}
      />

      <div className="results-grid-2">
        <Panel title={`Radar 5S — ${activeMonth || "—"}`} subtitle="Moyenne par axe">
          {radarData.some((r) => r.average > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.2)" />
                <PolarAngleAxis dataKey="pillar" stroke="#94a3b8" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#475569" />
                <Radar name="Score %" dataKey="average" stroke="#a855f7" fill="#a855f7" fillOpacity={0.45} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>

        <Panel title="Évolution des scores" subtitle="Score % par audit">
          {trend.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} hide={trend.length > 12} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Line type="monotone" dataKey="percent" name="Score %" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>
      </div>

      <div className="results-grid-2">
        <Panel title="Score 5S moyen par zone" subtitle={`${byZone.length} zones`}>
          {byZone.length ? (
            <ResponsiveContainer width="100%" height={Math.max(280, byZone.length * 26)}>
              <BarChart data={byZone} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <YAxis type="category" dataKey="zone" stroke="#94a3b8" fontSize={10} width={120} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Bar dataKey="avg" name="Score %" radius={[0, 6, 6, 0]}>
                  {byZone.map((z, i) => (
                    <Cell key={i} fill={`hsl(${260 - (z.avg / 100) * 120}, 70%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>

        <Panel title="Top 10 questions échouées" subtitle="Basé sur NOK">
          {topFailures.length ? (
            <table className="data-table">
              <thead><tr><th>#</th><th>Question</th><th>Pilier</th><th>NOK / Applicable</th></tr></thead>
              <tbody>
                {topFailures.map((f) => (
                  <tr key={f.index}>
                    <td>{f.index}</td>
                    <td className="wrap">{f.short}</td>
                    <td><span className={`pill pill-${f.pillar}`}>{f.pillar}</span></td>
                    <td>{f.nok} / {f.total} <span style={{ color: "#f87171" }}>({f.rate}%)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>
      </div>

      {/* ============ COMPARAISON M-1 + S-1 ============ */}
      <div className="results-grid-2">
        <Panel title="5S — Comparaison M-1" subtitle="Mois en cours vs mois précédent">
          <PeriodComparison
            currentLabel={thisM}
            previousLabel={lastM}
            currentStats={currMStats}
            previousStats={prevMStats}
            byGroupCurrent={currMByZone}
            byGroupPrevious={prevMByZone}
            groupLabel="Zone"
          />
        </Panel>

        <Panel title="5S — Comparaison S-1" subtitle="Semaine dernière vs avant-dernière">
          <PeriodComparison
            currentLabel={s1}
            previousLabel={s2}
            currentStats={s1Stats}
            previousStats={s2Stats}
            byGroupCurrent={s1ByZone}
            byGroupPrevious={s2ByZone}
            groupLabel="Zone"
          />
        </Panel>
      </div>

      {/* ============ TOP/BOTTOM 3 ZONES ============ */}
      <Panel
        title="🏆 Top 3 & Bottom 3 zones"
        subtitle={`${tb5S.top.length + tb5S.bottom.length} zones classées par score`}
      >
        <TopBottomPanel
          top={tb5S.top}
          bottom={tb5S.bottom}
          label="zones"
          suffix="%"
        />
      </Panel>

      {/* ============ TOP 3 PRIORITÉS ============ */}
      <Panel
        title="🎯 Top 3 actions à prioriser"
        subtitle="Les 3 questions avec le plus de NOK"
      >
        <PrioritiesPanel
          items={priorities5S}
          label="priorités"
          showCount={true}
        />
      </Panel>

      <Panel title="Heatmap NOK par zone et question" subtitle="% de NOK — vert = bon, rouge = à corriger">
        <Heatmap rows={heatmapData.rows} matrix={heatmapData.matrix} />
      </Panel>

      <Panel title="Toutes les actions 5S" subtitle={`${actionsFiltered.length} / ${actions.length} actions`}>
        <ActionDateFilter
          actions={actions}
          onFiltered={setActionsFiltered}
          label="actions 5S"
        />
        {actionsFiltered.length ? (
          <div className="scroll-list">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Zone</th><th>Auditeur</th><th>Pilier</th><th>Q#</th><th>Action</th></tr></thead>
              <tbody>
                {actionsFiltered.map((a, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>{a.date || "—"}</td>
                    <td>{a.zone}</td>
                    <td>{a.auditor}</td>
                    <td><span className={`pill pill-${a.pillar}`}>{a.pillar}</span></td>
                    <td>{a.qIndex}</td>
                    <td className="wrap">{a.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty">Aucune action 5S.</div>}
      </Panel>
    </div>
  );
}
