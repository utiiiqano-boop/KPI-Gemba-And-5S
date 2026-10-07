import "./ReportTemplate.css";
import { parseDate, groupGembaAudits, gembaTopFailures, gembaActions } from "../../utils/analytics";

export default function PeriodGembaReport({ records, periodLabel, generatedAt = new Date() }) {
  if (!records?.length) return null;
  const audits = groupGembaAudits(records);
  const avg = audits.length ? +(audits.reduce((a, x) => a + x.score, 0) / audits.length).toFixed(1) : 0;
  const okCount = records.filter((r) => String(r.reponse).toUpperCase() === "OK").length;
  const nokCount = records.filter((r) => String(r.reponse).toUpperCase() === "NOK").length;
  const topFailures = gembaTopFailures(records, 12);
  const actions = gembaActions(records);

  const byLigne = {};
  audits.forEach((a) => {
    const l = a.ligne || a.uap || "—";
    if (!byLigne[l]) byLigne[l] = { ligne: l, sum: 0, count: 0 };
    byLigne[l].sum += a.score;
    byLigne[l].count++;
  });
  const lignes = Object.values(byLigne).map((l) => ({
    ligne: l.ligne, avg: +(l.sum / l.count).toFixed(1), count: l.count,
  })).sort((a, b) => b.avg - a.avg);

  const scoreClass = avg <= 80 ? "red" : avg <= 85 ? "orange" : "green";

  return (
    <div className="report-root">
      <div className="report-header">
        <div className="report-logo">
          <div className="report-logo-mark"><img src="/logo-wkw.png" alt="WKW" style={{width:"70%",height:"70%",objectFit:"contain"}} /></div>
          <div>
            <div className="report-brand-title">KPI Gemba & 5S</div>
            <div className="report-brand-sub">Rapport de période — Gemba OJT</div>
          </div>
        </div>
        <div className="report-meta">
          <div><strong>{periodLabel}</strong></div>
          <div>Généré le {generatedAt.toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      <div className="report-title">Rapport Gemba — {periodLabel}</div>
      <div className="report-subtitle">{audits.length} audits · {lignes.length} lignes</div>
      <div className={`report-score-badge ${scoreClass}`}>Score moyen : {avg}%</div>

      <div className="report-section">
        <div className="report-section-title">Résumé exécutif</div>
        <div className="report-kpi-grid">
          <div className="report-kpi"><div className="report-kpi-label">Audits</div><div className="report-kpi-value">{audits.length}</div></div>
          <div className="report-kpi"><div className="report-kpi-label">OK</div><div className="report-kpi-value" style={{ color: "#22c55e" }}>{okCount}</div></div>
          <div className="report-kpi"><div className="report-kpi-label">NOK</div><div className="report-kpi-value" style={{ color: "#ef4444" }}>{nokCount}</div></div>
          <div className="report-kpi"><div className="report-kpi-label">Actions</div><div className="report-kpi-value">{actions.length}</div></div>
        </div>
      </div>

      <div className="report-section">
        <div className="report-section-title">Score par ligne</div>
        <table className="report-table">
          <thead><tr><th>Ligne</th><th className="num">Audits</th><th className="num">Score</th></tr></thead>
          <tbody>
            {lignes.map((l) => {
              const c = l.avg <= 80 ? "#ef4444" : l.avg <= 85 ? "#f59e0b" : "#22c55e";
              return <tr key={l.ligne}><td><strong>{l.ligne}</strong></td><td className="num">{l.count}</td><td className="num" style={{ color: c, fontWeight: 700 }}>{l.avg}%</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <div className="report-section-title">Top questions NOK</div>
        <table className="report-table">
          <thead><tr><th>Question</th><th className="num">NOK</th><th className="num">Total</th></tr></thead>
          <tbody>
            {topFailures.map((f, i) => (
              <tr key={i}>
                <td className="wrap">{String(f.question).slice(0, 80)}{String(f.question).length > 80 ? "…" : ""}</td>
                <td className="num" style={{ color: "#ef4444", fontWeight: 700 }}>{f.nok}</td>
                <td className="num">{f.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {actions.length > 0 && (
        <div className="report-section">
          <div className="report-section-title">Actions correctives ({actions.length})</div>
          <table className="report-table">
            <thead><tr><th>Date</th><th>Ligne</th><th>Pilote</th><th>Échéance</th><th>Action</th></tr></thead>
            <tbody>
              {actions.slice(0, 50).map((a, i) => (
                <tr key={i}>
                  <td>{String(a.date).slice(0, 10)}</td>
                  <td>{a.ligne || a.uap}</td>
                  <td>{a.pilote && a.pilote !== "-" ? a.pilote : "—"}</td>
                  <td>{a.dateAction && a.dateAction !== "-" ? a.dateAction : "—"}</td>
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
          <thead><tr><th>Date</th><th>Ligne</th><th>UAP</th><th className="num">Questions</th><th className="num">Score</th></tr></thead>
          <tbody>
            {audits.map((a, i) => {
              const c = a.score <= 80 ? "#ef4444" : a.score <= 85 ? "#f59e0b" : "#22c55e";
              const d = parseDate(a.date);
              return (
                <tr key={i}>
                  <td>{d ? d.toLocaleDateString("fr-FR") : a.date}</td>
                  <td>{a.ligne || "—"}</td>
                  <td>{a.uap || "—"}</td>
                  <td className="num">{a.questions.length}</td>
                  <td className="num" style={{ color: c, fontWeight: 700 }}>{a.score}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="report-footer">
        <div>KPI Gemba & 5S — Rapport Gemba</div>
        <div>{periodLabel} · {audits.length} audits</div>
      </div>
    </div>
  );
}
