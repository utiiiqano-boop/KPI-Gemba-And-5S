import "./SinglePageReport.css";

export default function SinglePageGembaReport({ audit, generatedAt = new Date() }) {
  if (!audit) return null;
  const questions = audit.questions || [];
  const score = audit.score || 0;
  const scoreClass = score <= 80 ? "red" : score <= 85 ? "orange" : "green";

  const ok = questions.filter((q) => String(q.reponse).toUpperCase() === "OK").length;
  const nok = questions.filter((q) => String(q.reponse).toUpperCase() === "NOK").length;
  const na = questions.filter((q) => String(q.reponse).toUpperCase() === "N/A").length;

  const actionsList = questions.filter((q) => q.action && q.action !== "-" && q.action !== "—");

  // Liste UNIQUE des auditeurs (un audit Gemba peut avoir plusieurs auditeurs)
  const uniqueAuditeurs = [...new Set(
    questions
      .map((q) => (q.auditeur || "").trim())
      .filter((a) => a && a !== "-" && a !== "—")
  )];

  return (
    <div className="sp-report">
      {/* HEADER */}
      <div className="sp-header">
        <div className="sp-logo">
          <div className="sp-logo-mark">KPI</div>
          <div>
            <div className="sp-brand">KPI Gemba & 5S</div>
            <div className="sp-brand-sub">Rapport Gemba OJT</div>
          </div>
        </div>
        <div className="sp-meta">
          <div><strong>Gemba — {audit.ligne || "—"}</strong></div>
          <div>Édité le {generatedAt.toLocaleDateString("fr-FR")} à {generatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>

      {/* TITLE + SCORE */}
      <div className="sp-title-row">
        <div>
          <div className="sp-title">Audit Gemba — {audit.ligne || "Ligne"}</div>
          <div className="sp-title-sub">{audit.date || ""}</div>
        </div>
        <div className={`sp-score-badge ${scoreClass}`}>{score}%</div>
      </div>

      {/* KPI ROW */}
      <div className="sp-kpis">
        <div className="sp-kpi">
          <div className="sp-kpi-label">OK</div>
          <div className="sp-kpi-value" style={{ color: "#22c55e" }}>{ok}</div>
        </div>
        <div className="sp-kpi">
          <div className="sp-kpi-label">NOK</div>
          <div className="sp-kpi-value" style={{ color: "#ef4444" }}>{nok}</div>
        </div>
        <div className="sp-kpi">
          <div className="sp-kpi-label">N/A</div>
          <div className="sp-kpi-value" style={{ color: "#64748b" }}>{na}</div>
        </div>
        <div className="sp-kpi">
          <div className="sp-kpi-label">Questions</div>
          <div className="sp-kpi-value">{questions.length}</div>
        </div>
      </div>

      {/* INFO GRID */}
      <div className="sp-info">
        <div className="sp-info-item">
          <span className="sp-info-label">Ligne</span>
          <span className="sp-info-value">{audit.ligne || "—"}</span>
        </div>
        <div className="sp-info-item">
          <span className="sp-info-label">UAP</span>
          <span className="sp-info-value">{audit.uap || "—"}</span>
        </div>
        <div className="sp-info-item">
          <span className="sp-info-label">Date</span>
          <span className="sp-info-value">{audit.date || "—"}</span>
        </div>
        <div className="sp-info-item">
          <span className="sp-info-label">Score global</span>
          <span className="sp-info-value">{score}%</span>
        </div>
        <div className="sp-info-item" style={{ gridColumn: "span 2" }}>
          <span className="sp-info-label">Auditeurs ({uniqueAuditeurs.length})</span>
          <span className="sp-info-value" style={{ fontSize: 10, textAlign: "right", maxWidth: "70%" }}>
            {uniqueAuditeurs.join(", ") || "—"}
          </span>
        </div>
      </div>

      {/* QUESTIONS TABLE */}
      <div className="sp-section-title">Détail des questions ({questions.length})</div>
      <table className="sp-table">
        <thead>
          <tr>
            <th style={{ width: "16%" }}>Point M</th>
            <th style={{ width: "48%" }}>Question</th>
            <th className="num" style={{ width: "10%" }}>Rép.</th>
            <th style={{ width: "13%" }}>Pilote</th>
            <th style={{ width: "13%" }}>Échéance</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => {
            const rep = String(q.reponse || "").toUpperCase();
            const cls = rep === "OK" ? "pass" : rep === "NOK" ? "fail" : "na";
            return (
              <tr key={i}>
                <td><strong>{q.pointM || "—"}</strong></td>
                <td className="wrap">{q.question || "—"}</td>
                <td className="num">
                  <span className={`pill ${cls}`}>{q.reponse || "—"}</span>
                </td>
                <td>{q.pilote && q.pilote !== "-" ? q.pilote : "—"}</td>
                <td>{q.dateAction && q.dateAction !== "-" ? q.dateAction : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ACTIONS */}
      {actionsList.length > 0 && (
        <>
          <div className="sp-section-title">Actions correctives ({actionsList.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px" }}>
            {actionsList.map((q, i) => (
              <div key={i} className="sp-notes">
                <strong>{q.pointM} :</strong> {q.action}
                {q.pilote && q.pilote !== "-" && (
                  <span style={{ color: "#92400e", marginLeft: 8 }}>
                    → <strong>{q.pilote}</strong> ({q.dateAction || "—"})
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* SIGNATURES */}
      <div className="sp-signatures">
        <div className="sp-sig">
          <div className="sp-sig-line" />
          <div className="sp-sig-label">Visa</div>
          <div className="sp-sig-name">&nbsp;</div>
        </div>
        <div className="sp-sig">
          <div className="sp-sig-line" />
          <div className="sp-sig-label">Pilot de ligne</div>
          <div className="sp-sig-name">&nbsp;</div>
        </div>
        <div className="sp-sig">
          <div className="sp-sig-line" />
          <div className="sp-sig-label">Resp. Amélioration</div>
          <div className="sp-sig-name">&nbsp;</div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="sp-footer">
        <div>KPI Gemba & 5S — Document confidentiel</div>
        <div>{audit.ligne || "—"} · {audit.uap || "—"} · {audit.date || "—"}</div>
      </div>
    </div>
  );
}
