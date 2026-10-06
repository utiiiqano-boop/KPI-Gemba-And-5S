import "./ReportTemplate.css";
import { get5SZone, get5SAuditor, get5SScore, get5SDate, fiveSTopFailures, fiveSActions, avg5SByPillar } from "../../utils/analytics";

export default function Period5SReport({ records, periodLabel, generatedAt = new Date() }) {
  if (!records?.length) return null;
  const audits = records;
  const avg = +(audits.reduce((a, r) => a + get5SScore(r).percent, 0) / audits.length).toFixed(1);
  const totalNok = audits.reduce((a, r) => a + (get5SScore(r).nok || 0), 0);
  const totalOk = audits.reduce((a, r) => a + (get5SScore(r).ok || 0), 0);
  const topFailures = fiveSTopFailures(records, 10);
  const actions = fiveSActions(records);
  const pillars = avg5SByPillar(records);

  const byZone = {};
  audits.forEach((r) => {
    const z = get5SZone(r);
    if (!byZone[z]) byZone[z] = { zone: z, sum: 0, count: 0 };
    byZone[z].sum += get5SScore(r).percent;
    byZone[z].count++;
  });
  const zones = Object.values(byZone).map((z) => ({
    zone: z.zone, avg: +(z.sum / z.count).toFixed(1), count: z.count,
  })).sort((a, b) => b.avg - a.avg);

  const scoreClass = avg <= 80 ? "red" : avg <= 85 ? "orange" : "green";

  return (
    <div className="report-root">
      <div className="report-header">
        <div className="report-logo">
          <div className="report-logo-mark">KPI</div>
          <div>
            <div className="report-brand-title">KPI Gemba & 5S</div>
            <div className="report-brand-sub">Rapport de période — 5S</div>
          </div>
        </div>
        <div className="report-meta">
          <div><strong>{periodLabel}</strong></div>
          <div>Généré le {generatedAt.toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      <div className="report-title">Rapport 5S — {periodLabel}</div>
      <div className="report-subtitle">{audits.length} audits · {new Set(audits.map(get5SZone)).size} zones</div>
      <div className={`report-score-badge ${scoreClass}`}>Score moyen : {avg}%</div>

      <div className="report-section">
        <div className="report-section-title">Résumé exécutif</div>
        <div className="report-kpi-grid">
          <div className="report-kpi"><div className="report-kpi-label">Audits</div><div className="report-kpi-value">{audits.length}</div></div>
          <div className="report-kpi"><div className="report-kpi-label">OK</div><div className="report-kpi-value" style={{ color: "#22c55e" }}>{totalOk}</div></div>
          <div className="report-kpi"><div className="report-kpi-label">NOK</div><div className="report-kpi-value" style={{ color: "#ef4444" }}>{totalNok}</div></div>
          <div className="report-kpi"><div className="report-kpi-label">Actions</div><div className="report-kpi-value">{actions.length}</div></div>
        </div>
      </div>

      <div className="report-section">
        <div className="report-section-title">Scores par pilier</div>
        <table className="report-table">
          <thead><tr><th>Pilier</th><th className="num">Score</th></tr></thead>
          <tbody>
            {pillars.map((p) => {
              const c = p.avg <= 80 ? "#ef4444" : p.avg <= 85 ? "#f59e0b" : "#22c55e";
              return <tr key={p.pillar}><td><strong>{p.pillar}</strong></td><td className="num" style={{ color: c, fontWeight: 700 }}>{p.avg}%</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <div className="report-section-title">Score par zone</div>
        <table className="report-table">
          <thead><tr><th>Zone</th><th className="num">Audits</th><th className="num">Score</th></tr></thead>
          <tbody>
            {zones.map((z) => {
              const c = z.avg <= 80 ? "#ef4444" : z.avg <= 85 ? "#f59e0b" : "#22c55e";
              return <tr key={z.zone}><td><strong>{z.zone}</strong></td><td className="num">{z.count}</td><td className="num" style={{ color: c, fontWeight: 700 }}>{z.avg}%</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <div className="report-section-title">Top 10 questions NOK</div>
        <table className="report-table">
          <thead><tr><th>#</th><th>Question</th><th>Pilier</th><th className="num">NOK</th></tr></thead>
          <tbody>
            {topFailures.map((f) => (
              <tr key={f.index}>
                <td>{f.index}</td>
                <td className="wrap">{f.short}</td>
                <td><span className="report-pill s">{f.pillar}</span></td>
                <td className="num" style={{ color: "#ef4444", fontWeight: 700 }}>{f.nok}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {actions.length > 0 && (
        <div className="report-section">
          <div className="report-section-title">Actions ouvertes ({actions.length})</div>
          <table className="report-table">
            <thead><tr><th>Date</th><th>Zone</th><th>Pilier</th><th>Action</th></tr></thead>
            <tbody>
              {actions.slice(0, 50).map((a, i) => (
                <tr key={i}>
                  <td>{String(a.date).slice(0, 10)}</td>
                  <td>{a.zone}</td>
                  <td><span className="report-pill s">{a.pillar}</span></td>
                  <td className="wrap">{a.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="report-section">
        <div className="report-section-title">Détail des audits</div>
        <table className="report-table">
          <thead><tr><th>Date</th><th>Zone</th><th>Auditeur</th><th className="num">OK</th><th className="num">NOK</th><th className="num">Score</th></tr></thead>
          <tbody>
            {audits.map((r, i) => {
              const s = get5SScore(r);
              const c = s.percent <= 80 ? "#ef4444" : s.percent <= 85 ? "#f59e0b" : "#22c55e";
              const d = get5SDate(r);
              return (
                <tr key={i}>
                  <td>{d ? d.toLocaleDateString("fr-FR") : "—"}</td>
                  <td>{get5SZone(r)}</td>
                  <td>{get5SAuditor(r)}</td>
                  <td className="num" style={{ color: "#22c55e" }}>{s.ok}</td>
                  <td className="num" style={{ color: "#ef4444" }}>{s.nok}</td>
                  <td className="num" style={{ color: c, fontWeight: 700 }}>{s.percent}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="report-footer">
        <div>KPI Gemba & 5S — Rapport 5S</div>
        <div>{periodLabel} · {audits.length} audits</div>
      </div>
    </div>
  );
}
