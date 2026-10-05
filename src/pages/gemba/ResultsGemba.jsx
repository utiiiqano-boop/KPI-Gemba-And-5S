import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie, Legend,
} from "recharts";
import { useRealtimeList } from "../../hooks/useFirebaseData";
import { parseDate, gembaTrend, gembaByLigne, gembaTopFailures, gembaActions } from "../../utils/analytics";
import Panel from "../../components/dashboard/Panel";
import StatsRow from "../../components/results/StatsRow";
import ResultFilters, { Select, DateRange, ResetButton } from "../../components/results/ResultFilters";
import "../../pages/Results.css";

const PIE_COLORS = ["#22c55e", "#ef4444", "#eab308", "#3b82f6", "#a855f7"];

export default function ResultsGemba() {
  const { data: records, loading } = useRealtimeList("gemba_ojt");

  const [uap, setUap] = useState("");
  const [ligne, setLigne] = useState("");
  const [auditeur, setAuditeur] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const uaps = useMemo(() => [...new Set(records.map((r) => r.uap).filter(Boolean))].sort(), [records]);
  const lignes = useMemo(() => [...new Set(records.map((r) => r.ligne).filter(Boolean))].sort(), [records]);
  const auditeurs = useMemo(() => [...new Set(records.map((r) => r.auditeur).filter(Boolean))].sort(), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const d = parseDate(r.date);
      if (uap && r.uap !== uap) return false;
      if (ligne && r.ligne !== ligne) return false;
      if (auditeur && r.auditeur !== auditeur) return false;
      if (from && d && d < new Date(from)) return false;
      if (to && d && d > new Date(to)) return false;
      return true;
    });
  }, [records, uap, ligne, auditeur, from, to]);

  const trend = useMemo(() => gembaTrend(filtered), [filtered]);
  const byLigne = useMemo(() => gembaByLigne(filtered), [filtered]);
  const topFailures = useMemo(() => gembaTopFailures(filtered, 12), [filtered]);
  const actions = useMemo(() => gembaActions(filtered), [filtered]);

  const avgScore = filtered.length
    ? +(filtered.reduce((a, r) => a + Number(r.score ?? 0), 0) / filtered.length).toFixed(1)
    : 0;

  const okCount = filtered.filter((r) => String(r.reponse).toUpperCase() === "OK").length;
  const nokCount = filtered.filter((r) => String(r.reponse).toUpperCase() === "NOK").length;
  const naCount = filtered.filter((r) => String(r.reponse).toUpperCase() === "N/A").length;
  const okRate = filtered.length ? +((okCount / filtered.length) * 100).toFixed(1) : 0;

  const pieData = [
    { name: "OK", value: okCount },
    { name: "NOK", value: nokCount },
    ...(naCount ? [{ name: "N/A", value: naCount }] : []),
  ].filter((x) => x.value > 0);

  // Heatmap: UAP × Question (short label)
  const heatmapQuestions = useMemo(() => {
    const set = new Set();
    filtered.forEach((r) => set.add((r.question || r.pointM || "—").trim()));
    return [...set].sort();
  }, [filtered]);

  const heatmapRows = useMemo(() => {
    const keys = uap ? [uap] : uaps;
    return keys.map((k) => ({ key: k, label: k }));
  }, [uaps, uap]);

  const heatmapMatrix = useMemo(() => {
    const m = {};
    heatmapRows.forEach(({ key }) => {
      m[key] = {};
      const recs = filtered.filter((r) => r.uap === key);
      heatmapQuestions.forEach((q) => {
        const vals = recs.filter((r) => (r.question || r.pointM || "—").trim() === q);
        if (!vals.length) return;
        const nok = vals.filter((r) => String(r.reponse).toUpperCase() === "NOK").length;
        m[key][q] = +((nok / vals.length) * 100).toFixed(1);
      });
    });
    return m;
  }, [filtered, heatmapRows, heatmapQuestions]);

  const reset = () => { setUap(""); setLigne(""); setAuditeur(""); setFrom(""); setTo(""); };
  const hasFilter = uap || ligne || auditeur || from || to;

  return (
    <div className="results-page">
      <ResultFilters>
        <Select label="UAP" value={uap} onChange={setUap} options={uaps} />
        <Select label="Ligne" value={ligne} onChange={setLigne} options={lignes} />
        <Select label="Auditeur" value={auditeur} onChange={setAuditeur} options={auditeurs} />
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <ResetButton onClick={reset} disabled={!hasFilter} />
      </ResultFilters>

      <StatsRow
        items={[
          { label: "Lignes auditées", value: filtered.length, color: "#a5b4fc" },
          { label: "Score moyen", value: `${avgScore}%`, color: "#06b6d4" },
          { label: "Taux OK", value: `${okRate}%`, color: "#22c55e" },
          { label: "NOK", value: nokCount, color: "#ef4444" },
          { label: "Actions ouvertes", value: actions.length, color: "#fbbf24" },
        ]}
      />

      {/* Trend + Pie */}
      <div className="results-grid-2">
        <Panel title="Évolution du score Gemba" subtitle="Score (%) par audit">
          {trend.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} hide={trend.length > 12} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Line type="monotone" dataKey="score" name="Score %" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>

        <Panel title="Répartition OK / NOK / N/A" subtitle="Sur toutes les réponses">
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label={(e) => `${e.name} (${e.value})`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>
      </div>

      {/* By Ligne + Top failures */}
      <div className="results-grid-2">
        <Panel title="Score moyen par ligne" subtitle={`${byLigne.length} lignes`}>
          {byLigne.length ? (
            <ResponsiveContainer width="100%" height={Math.max(300, byLigne.length * 24)}>
              <BarChart data={byLigne} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <YAxis type="category" dataKey="ligne" stroke="#94a3b8" fontSize={10} width={110} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Bar dataKey="avg" name="Score %" radius={[0, 6, 6, 0]}>
                  {byLigne.map((z, i) => (
                    <Cell key={i} fill={`hsl(${190 + (z.avg / 100) * 60}, 70%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>

        <Panel title="Top questions NOK" subtitle="Les points à corriger en priorité">
          {topFailures.length ? (
            <table className="data-table">
              <thead>
                <tr><th>Question</th><th>NOK / Total</th></tr>
              </thead>
              <tbody>
                {topFailures.map((f, i) => (
                  <tr key={i}>
                    <td className="wrap">{String(f.question).slice(0, 70)}{String(f.question).length > 70 ? "…" : ""}</td>
                    <td>{f.nok} / {f.total} <span style={{ color: "#f87171" }}>({f.rate}%)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">Aucune donnée.</div>}
        </Panel>
      </div>

      {/* Heatmap UAP × Question */}
      <Panel title="Heatmap NOK par UAP et question" subtitle="% de NOK — vert = bon, rouge = à corriger">
        {heatmapRows.length && heatmapQuestions.length ? (
          <div className="heatmap-wrap">
            <table className="heatmap">
              <thead>
                <tr>
                  <th className="hm-corner">UAP / Question</th>
                  {heatmapQuestions.map((q) => (
                    <th key={q} title={q}>{q.slice(0, 14)}{q.length > 14 ? "…" : ""}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapRows.map((row) => (
                  <tr key={row.key}>
                    <td className="hm-label">{row.label}</td>
                    {heatmapQuestions.map((q) => {
                      const p = heatmapMatrix[row.key]?.[q];
                      const colorFor = (p) => {
                        if (p === undefined) return "rgba(148,163,184,0.08)";
                        const t = Math.max(0, Math.min(1, p / 100));
                        const r = Math.round(255 * t);
                        const g = Math.round(200 * (1 - t) + 60 * t);
                        return `rgba(${r}, ${g}, 60, 0.85)`;
                      };
                      return (
                        <td key={q} className="hm-cell" style={{ background: colorFor(p) }} title={`${row.label} · ${q}: ${p === undefined ? "—" : p.toFixed(0) + "%"}`}>
                          {p === undefined ? "" : p.toFixed(0)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty">Aucune donnée.</div>}
      </Panel>

      {/* Actions */}
      <Panel title="Actions correctives Gemba" subtitle={`${actions.length} actions ouvertes`}>
        {actions.length ? (
          <div className="scroll-list">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>UAP</th><th>Ligne</th><th>Auditeur</th><th>Pilote</th><th>Échéance</th><th>Action</th></tr>
              </thead>
              <tbody>
                {actions.map((a, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>{String(a.date).slice(0, 10)}</td>
                    <td>{a.uap}</td>
                    <td>{a.ligne}</td>
                    <td>{a.auditeur}</td>
                    <td>{a.pilote}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{String(a.dateAction).slice(0, 10)}</td>
                    <td className="wrap">{a.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty">Aucune action Gemba.</div>}
      </Panel>

      {/* Detail table */}
      <Panel title="Détail des audits" subtitle={`${filtered.length} lignes`}>
        <div className="scroll-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>UAP</th><th>Ligne</th><th>Auditeur</th>
                <th>Point M</th><th>Question</th><th>Réponse</th><th>Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 300).map((r, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: "nowrap" }}>{String(r.date).slice(0, 10)}</td>
                  <td>{r.uap}</td>
                  <td>{r.ligne}</td>
                  <td>{r.auditeur}</td>
                  <td>{r.pointM}</td>
                  <td className="wrap">{String(r.question).slice(0, 60)}{String(r.question).length > 60 ? "…" : ""}</td>
                  <td>
                    <span className={`pill ${String(r.reponse).toUpperCase() === "OK" ? "pill-OK" : String(r.reponse).toUpperCase() === "NOK" ? "pill-NOK" : "pill-NA"}`}>
                      {r.reponse}
                    </span>
                  </td>
                  <td>{r.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
