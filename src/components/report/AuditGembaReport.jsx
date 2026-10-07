import "./ReportTemplate.css";

export default function AuditGembaReport({ audit, generatedAt = new Date() }) {
  if (!audit) return null;
  const questions = audit.questions || [];
  const score = audit.score || 0;
  const scoreClass = score <= 80 ? "red" : score <= 85 ? "orange" : "green";
  const ok = questions.filter((q) => String(q.reponse).toUpperCase() === "OK").length;
  const nok = questions.filter((q) => String(q.reponse).toUpperCase() === "NOK").length;
  const na = questions.filter((q) => String(q.reponse).toUpperCase() === "N/A").length;

  return (
    <div className="report-root">
      <div className="report-header">
        <div className="report-logo">
          <div className="report-logo-mark"><img src="/logo-wkw.png" alt="WKW" style={{width:"70%",height:"70%",objectFit:"contain"}} /></div>
          <div>
            <div className="report-brand-title">KPI Gemba & 5S</div>
            <div className="report-brand-sub">Rapport Gemba OJT</div>
          </div>
        </div>
        <div className="report-meta">
          <div><strong>Gemba — {audit.ligne || "Ligne"}</strong></div>
          <div>Généré le {generatedAt.toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      <div className="report-title">Audit Gemba — {audit.ligne || "Ligne"}</div>
      <div className="report-subtitle">{audit.date || ""}</div>
      <div className={`report-score-badge ${scoreClass}`}>Score : {score}%</div>

      <div className="report-section">
        <div className="report-section-title">Informations générales</div>
        <div className="report-info-grid">
          <div className="report-info-item">
            <div className="report-info-label">Ligne</div>
            <div className="report-info-value">{audit.ligne || "—"}</div>
          </div>
          <div className="report-info-item">
            <div className="report-info-label">UAP</div>
            <div className="report-info-value">{audit.uap || "—"}</div>
          </div>
          <div className="report-info-item">
            <div className="report-info-label">Date</div>
            <div className="report-info-value">{audit.date || "—"}</div>
          </div>
          <div className="report-info-item">
            <div className="report-info-label">Questions</div>
            <div className="report-info-value">{questions.length}</div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="report-section-title">Résumé</div>
        <div className="report-kpi-grid">
          <div className="report-kpi">
            <div className="report-kpi-label">OK</div>
            <div className="report-kpi-value" style={{ color: "#22c55e" }}>{ok}</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-label">NOK</div>
            <div className="report-kpi-value" style={{ color: "#ef4444" }}>{nok}</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-label">N/A</div>
            <div className="report-kpi-value" style={{ color: "#6b7280" }}>{na}</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-label">Total</div>
            <div className="report-kpi-value">{questions.length}</div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="report-section-title">Détail des questions</div>
        <table className="report-table">
          <thead>
            <tr><th style={{ width: "18%" }}>Point M</th><th style={{ width: "42%" }}>Question</th><th className="num" style={{ width: "10%" }}>Réponse</th><th style={{ width: "15%" }}>Pilote</th><th style={{ width: "15%" }}>Échéance</th></tr>
          </thead>
          <tbody>
            {questions.map((q, i) => {
              const rep = String(q.reponse || "").toUpperCase();
              const cls = rep === "OK" ? "ok" : rep === "NOK" ? "nok" : "na";
              return (
                <tr key={i}>
                  <td><strong>{q.pointM || "—"}</strong></td>
                  <td className="wrap">{q.question || "—"}</td>
                  <td className="num"><span className={`report-pill ${cls}`}>{q.reponse || "—"}</span></td>
                  <td>{q.pilote && q.pilote !== "-" ? q.pilote : "—"}</td>
                  <td>{q.dateAction && q.dateAction !== "-" ? q.dateAction : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {questions.some((q) => q.action && q.action !== "-" && q.action !== "—") && (
        <div className="report-section">
          <div className="report-section-title">Actions correctives</div>
          {questions.filter((q) => q.action && q.action !== "-" && q.action !== "—").map((q, i) => (
            <div key={i} className="report-q-block">
              <div className="report-q-header">
                <div className="report-q-title">{q.pointM || "—"} — {q.question || "—"}</div>
                <span className="report-pill nok">Action</span>
              </div>
              <div className="report-q-action"><strong>Action :</strong> {q.action}</div>
              {q.pilote && q.pilote !== "-" && (
                <div className="report-q-text" style={{ marginTop: 4 }}>
                  <strong>Pilote :</strong> {q.pilote} · <strong>Échéance :</strong> {q.dateAction || "—"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="report-section">
        <div className="report-section-title">Signatures</div>
        <div className="report-signatures">
          <div className="report-sig-box">Auditeur<br />{questions[0]?.auditeur || ""}</div>
          <div className="report-sig-box">Pilot de ligne</div>
          <div className="report-sig-box">Responsable Amélioration</div>
        </div>
      </div>

      <div className="report-footer">
        <div>KPI Gemba & 5S — Document généré automatiquement</div>
        <div>{audit.ligne || "—"} · {audit.date || "—"}</div>
      </div>
    </div>
  );
}
