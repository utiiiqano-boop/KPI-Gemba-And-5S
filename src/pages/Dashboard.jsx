import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, Cell,
} from "recharts";
import { useRealtimeList } from "../hooks/useFirebaseData";
import {
  PILLARS,
  available5SMonths,
  fiveSRadarByMonth,
  fiveSTrend,
  fiveSByZone,
  fiveSTopFailures,
  fiveSActions,
  gembaTrend,
  gembaByLigne,
  gembaTopFailures,
  gembaActions,
} from "../utils/analytics";
import KpiCard from "../components/dashboard/KpiCard";
import Panel from "../components/dashboard/Panel";
import "./Dashboard.css";

const PILLAR_COLORS = { "1S": "#ef4444", "2S": "#f97316", "3S": "#eab308", "4S": "#22c55e", "5S": "#3b82f6" };

export default function Dashboard() {
  const { data: fiveS, loading: loading5S } = useRealtimeList("5s_audits");
  const { data: gemba, loading: loadingGemba } = useRealtimeList("gemba_ojt");

  const months = useMemo(() => available5SMonths(fiveS), [fiveS]);
  const [month, setMonth] = useState("");
  const activeMonth = month || months[0] || "";

  // ---------- KPIs ----------
  const total5S = fiveS.length;
  const totalGemba = gemba.length;
  const avg5S = useMemo(() => {
    if (!fiveS.length) return 0;
    const s = fiveS.reduce((acc, r) => acc + Number(r?.meta?.totalPoints ?? 0), 0);
    return +(s / fiveS.length).toFixed(2);
  }, [fiveS]);

  const avgGemba = useMemo(() => {
    if (!gemba.length) return 0;
    const s = gemba.reduce((acc, r) => acc + Number(r.score ?? 0), 0);
    return +(s / gemba.length).toFixed(1);
  }, [gemba]);

  // Distinct "5S audits" = unique (date + zone)
  const distinct5SAudits = useMemo(() => {
    const set = new Set();
    fiveS.forEach((r) => {
      set.add(`${r?.meta?.date}|${r?.meta?.zone}`);
    });
    return set.size;
  }, [fiveS]);

  // ---------- Radar (current month) ----------
  const radarData = useMemo(
    () => fiveSRadarByMonth(fiveS, activeMonth),
    [fiveS, activeMonth]
  );

  // ---------- Trend ----------
  const trend5S = useMemo(() => fiveSTrend(fiveS), [fiveS]);
  const trendGemba = useMemo(() => gembaTrend(gemba), [gemba]);

  // ---------- Per-zone / per-ligne ----------
  const byZone = useMemo(() => fiveSByZone(fiveS), [fiveS]);
  const byLigne = useMemo(() => gembaByLigne(gemba), [gemba]);

  // ---------- Failures ----------
  const topFail5S = useMemo(() => fiveSTopFailures(fiveS, 10), [fiveS]);
  const topFailGemba = useMemo(() => gembaTopFailures(gemba, 10), [gemba]);

  // ---------- Actions ----------
  const actions5S = useMemo(() => fiveSActions(fiveS), [fiveS]);
  const actionsGemba = useMemo(() => gembaActions(gemba), [gemba]);

  return (
    <div className="dashboard">
      {/* Row 1 — KPI cards */}
      <div className="kpi-grid">
        <KpiCard
          label="5S Audits"
          value={total5S}
          sub={`${distinct5SAudits} sessions distinctes`}
          accent="linear-gradient(135deg,#6366f1,#8b5cf6)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
        />
        <KpiCard
          label="Score 5S moyen"
          value={`${avg5S} / 26`}
          sub="Points totaux par audit"
          accent="linear-gradient(135deg,#f97316,#ef4444)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>}
        />
        <KpiCard
          label="Gemba OJT"
          value={totalGemba}
          sub="Lignes auditées"
          accent="linear-gradient(135deg,#06b6d4,#6366f1)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>}
        />
        <KpiCard
          label="Score Gemba moyen"
          value={`${avgGemba}%`}
          sub="Toutes lignes confondues"
          accent="linear-gradient(135deg,#22c55e,#06b6d4)"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        />
      </div>

      {/* Row 2 — Radar + Trend */}
      <div className="chart-grid-2">
        <Panel
          title="Profil 5S du mois"
          subtitle={activeMonth || "Aucune donnée"}
          right={
            months.length > 0 && (
              <select
                className="month-select"
                value={activeMonth}
                onChange={(e) => setMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )
          }
        >
          {radarData.some((r) => r.average > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.2)" />
                <PolarAngleAxis dataKey="pillar" stroke="#94a3b8" />
                <PolarRadiusAxis angle={90} domain={[0, 5]} stroke="#475569" />
                <Radar name="Moyenne" dataKey="average" stroke="#a855f7" fill="#a855f7" fillOpacity={0.45} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">Aucune donnée pour ce mois.</div>
          )}
        </Panel>

        <Panel title="Évolution du score 5S" subtitle="Points totaux par audit">
          {trend5S.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend5S} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} hide={trend5S.length > 15} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 26]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Line type="monotone" dataKey="total" name="Points" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">Aucune donnée 5S.</div>
          )}
        </Panel>
      </div>

      {/* Row 3 — 5S by zone + Gemba trend */}
      <div className="chart-grid-2">
        <Panel title="Score 5S moyen par zone" subtitle={`${byZone.length} zones`}>
          {byZone.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byZone} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 26]} />
                <YAxis type="category" dataKey="zone" stroke="#94a3b8" fontSize={10} width={100} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Bar dataKey="avg" name="Moyenne" radius={[0, 6, 6, 0]}>
                  {byZone.map((z, i) => (
                    <Cell key={i} fill={`hsl(${260 - (z.avg / 26) * 120}, 70%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">Aucune donnée 5S.</div>
          )}
        </Panel>

        <Panel title="Évolution du score Gemba" subtitle="Score (%) par audit">
          {trendGemba.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendGemba} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} hide={trendGemba.length > 15} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Line type="monotone" dataKey="score" name="Score %" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">Aucune donnée Gemba.</div>
          )}
        </Panel>
      </div>

      {/* Row 4 — Gemba by ligne */}
      <div className="chart-grid-1">
        <Panel title="Score Gemba moyen par ligne" subtitle={`${byLigne.length} lignes`}>
          {byLigne.length ? (
            <ResponsiveContainer width="100%" height={Math.max(260, byLigne.length * 26)}>
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
          ) : (
            <div className="empty">Aucune donnée Gemba.</div>
          )}
        </Panel>
      </div>

      {/* Row 5 — Top failures */}
      <div className="chart-grid-2">
        <Panel title="Top 10 questions 5S échouées" subtitle="Basé sur Points = 0">
          {topFail5S.length ? (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Question</th><th>Pilier</th><th>NOK / Total</th></tr>
              </thead>
              <tbody>
                {topFail5S.map((f) => (
                  <tr key={f.index}>
                    <td>{f.index}</td>
                    <td className="wrap">{f.short}</td>
                    <td><span className={`pill pill-${f.pillar}`}>{f.pillar}</span></td>
                    <td>{f.nok} / {f.total} <span style={{ color: "#f87171" }}>({f.rate}%)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">Aucune donnée 5S.</div>
          )}
        </Panel>

        <Panel title="Top 10 questions Gemba NOK" subtitle="Réponse = NOK">
          {topFailGemba.length ? (
            <table className="data-table">
              <thead>
                <tr><th>Question</th><th>NOK / Total</th></tr>
              </thead>
              <tbody>
                {topFailGemba.map((f, i) => (
                  <tr key={i}>
                    <td className="wrap">{String(f.question).slice(0, 60)}{String(f.question).length > 60 ? "…" : ""}</td>
                    <td>{f.nok} / {f.total} <span style={{ color: "#f87171" }}>({f.rate}%)</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">Aucune donnée Gemba.</div>
          )}
        </Panel>
      </div>

      {/* Row 6 — Actions */}
      <div className="chart-grid-2">
        <Panel title="Actions 5S ouvertes" subtitle={`${actions5S.length} actions avec feedback`}>
          {actions5S.length ? (
            <div className="scroll-list">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Zone</th><th>Pilier</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {actions5S.slice(0, 25).map((a, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: "nowrap" }}>{String(a.date).slice(0, 10)}</td>
                      <td>{a.zone}</td>
                      <td><span className={`pill pill-${a.pillar}`}>{a.pillar}</span></td>
                      <td className="wrap">{a.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Aucune action 5S.</div>
          )}
        </Panel>

        <Panel title="Actions correctives Gemba" subtitle={`${actionsGemba.length} actions ouvertes`}>
          {actionsGemba.length ? (
            <div className="scroll-list">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Ligne</th><th>Pilote</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {actionsGemba.slice(0, 25).map((a, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: "nowrap" }}>{String(a.date).slice(0, 10)}</td>
                      <td>{a.ligne || a.uap}</td>
                      <td>{a.pilote}</td>
                      <td className="wrap">{a.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Aucune action Gemba.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
