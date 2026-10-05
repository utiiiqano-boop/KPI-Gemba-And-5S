import { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import { useRealtimeList } from "../../hooks/useFirebaseData";
import {
  PILLARS, yyyymm, available5SMonths,
  get5SDate, get5SZone, get5SAuditor, get5SZoneLeader, get5STotal, get5SAnswers,
  fiveSRadarByMonth, fiveSTrend, fiveSByZone, fiveSTopFailures, fiveSActions,
} from "../../utils/analytics";
import { QUESTIONS_5S } from "../../utils/schema5S";
import Panel from "../../components/dashboard/Panel";
import Heatmap from "../../components/results/Heatmap";
import StatsRow from "../../components/results/StatsRow";
import ResultFilters, { Select, DateRange, ResetButton } from "../../components/results/ResultFilters";
import "../../pages/Results.css";

export default function Results5S() {
  const { data: records, loading, error } = useRealtimeList("5s_audits");

  // Debug (safe to keep — helps if data ever looks empty again)
  useEffect(() => {
    if (!loading) {
      console.log("[5S Results] records:", records.length, "error:", error);
      console.log("[5S Results] first:", records[0]);
    }
  }, [records, loading, error]);

  // ----- Filters -----
  const [zone, setZone] = useState("");
  const [auditor, setAuditor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState("");

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
      if (from) {
        if (!d || d < new Date(from)) return false;
      }
      if (to) {
        if (!d || d > new Date(to)) return false;
      }
      return true;
    });
  }, [records, zone, auditor, month, from, to]);

  const activeMonth = month || months[0] || "";

  // ----- Analytics -----
  const radarData = useMemo(() => fiveSRadarByMonth(filtered, activeMonth), [filtered, activeMonth]);
  const trend = useMemo(() => fiveSTrend(filtered), [filtered]);
  const byZone = useMemo(() => fiveSByZone(filtered), [filtered]);
  const topFailures = useMemo(() => fiveSTopFailures(filtered, 10), [filtered]);
  const actions = useMemo(() => fiveSActions(filtered), [filtered]);

  // ----- Heatmap (rows = zones, cols = Q1..Q26) -----
  const heatmapData = useMemo(() => {
    const rowKeys = zones.filter((z) => !zone || z === zone);
    const matrix = {};
    rowKeys.forEach((z) => {
      matrix[z] = {};
      const recs = filtered.filter((r) => get5SZone(r) === z);
      for (let i = 1; i <= 26; i++) {
        const vals = [];
        recs.forEach((r) => {
          const a = get5SAnswers(r).find((x) => x.index === i);
          if (a && a.points !== undefined && a.points !== null) vals.push(Number(a.points));
        });
        if (!vals.length) continue;
        const nok = vals.filter((v) => v === 0).length;
        matrix[z][i] = +((nok / vals.length) * 100).toFixed(1);
      }
    });
    return { rows: rowKeys.map((z) => ({ key: z, label: z })), matrix };
  }, [filtered, zones, zone]);

  const avg5S = filtered.length
    ? +(filtered.reduce((a, r) => a + get5STotal(r), 0) / filtered.length).toFixed(2)
    : 0;

  const bestPillar = radarData.reduce((b, r) => (r.average > (b?.average ?? -1) ? r : b), null);
  const worstPillar = radarData.reduce((b, r) => (r.average < (b?.average ?? 999) ? r : b), null);

  const reset = () => { setZone(""); setAuditor(""); setFrom(""); setTo(""); setMonth(""); };
  const hasFilter = zone || auditor || from || to || month;

  return (
    <div className="results-page">
      <ResultFilters>
        <Select label="Zone / Ligne" value={zone} onChange={setZone} options={zones} />
        <Select label="Auditeur" value={auditor} onChange={setAuditor} options={auditors} />
        <Select label="Mois" value={month} onChange={setMonth} options={months} />
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ResetButton onClick={reset} disabled={!hasFilter} />
      </ResultFilters>

      <StatsRow
        items={[
          { label: "Audits", value: filtered.length, color: "#a5b4fc" },
          { label: "Score moyen / 26", value: avg5S, color: "#f97316" },
          { label: "Meilleur pilier", value: bestPillar ? `${bestPillar.pillar} (${bestPillar.average})` : "—", color: "#22c55e" },
          { label: "Pilier faible", value: worstPillar ? `${worstPillar.pillar} (${worstPillar.average})` : "—", color: "#ef4444" },
          { label: "Actions ouvertes", value: actions.length, color: "#fbbf24" },
        ]}
      />

      {/* Radar + Trend */}
      <div className="results-grid-2">
        <Panel title={`Radar 5S — ${activeMonth || "—"}`} subtitle="Moyenne par pilier">
          {radarData.some((r) => r.average > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.2)" />
                <PolarAngleAxis dataKey="pillar" stroke="#94a3b8" />
                <PolarRadiusAxis angle={90} domain={[0, 5]} stroke="#475569" />
                <Radar name="Moyenne" dataKey="average" stroke="#a855f7" fill="#a855f7" fillOpacity={0.45} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="empty">Aucune donnée pour ce mois.</div>}
        </Panel>

        <Panel title="Évolution des scores" subtitle="Points totaux par audit">
          {trend.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} hide={trend.length > 12} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 26]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Line type="monotone" dataKey="total" name="Points" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>
      </div>

      {/* By zone + Top failures */}
      <div className="results-grid-2">
        <Panel title="Score 5S moyen par zone" subtitle={`${byZone.length} zones`}>
          {byZone.length ? (
            <ResponsiveContainer width="100%" height={Math.max(280, byZone.length * 26)}>
              <BarChart data={byZone} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 26]} />
                <YAxis type="category" dataKey="zone" stroke="#94a3b8" fontSize={10} width={120} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Bar dataKey="avg" name="Moyenne" radius={[0, 6, 6, 0]}>
                  {byZone.map((z, i) => (
                    <Cell key={i} fill={`hsl(${260 - (z.avg / 26) * 120}, 70%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>

        <Panel title="Top 10 questions échouées" subtitle="Basé sur Points = 0">
          {topFailures.length ? (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Question</th><th>Pilier</th><th>NOK / Total</th></tr>
              </thead>
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

      {/* Heatmap */}
      <Panel title="Heatmap NOK par zone et question" subtitle="% de NOK — vert = bon, rouge = à corriger">
        <Heatmap rows={heatmapData.rows} matrix={heatmapData.matrix} />
      </Panel>

      {/* All actions */}
      <Panel title="Toutes les actions 5S" subtitle={`${actions.length} actions identifiées`}>
        {actions.length ? (
          <div className="scroll-list">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Zone</th><th>Auditeur</th><th>Pilier</th><th>Q#</th><th>Action</th></tr>
              </thead>
              <tbody>
                {actions.map((a, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>{String(a.date).slice(0, 10)}</td>
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

      {/* Audits detail */}
      <Panel title="Détail des audits" subtitle={`${filtered.length} audits`}>
        <div className="scroll-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Zone</th><th>Auditeur</th><th>Pilote zone</th>
                <th>Total</th>
                <th>1S</th><th>2S</th><th>3S</th><th>4S</th><th>5S</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((r, i) => {
                const d = get5SDate(r);
                return (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {d ? d.toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td>{get5SZone(r)}</td>
                    <td>{get5SAuditor(r)}</td>
                    <td>{get5SZoneLeader(r)}</td>
                    <td><strong>{get5STotal(r)}</strong></td>
                    {PILLARS.map((p) => (
                      <td key={p}>{r?.pillarScores?.[p]?.points ?? "—"}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
