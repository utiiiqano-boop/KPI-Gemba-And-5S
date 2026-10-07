import "./ReportTemplate.css";
import { parseDate } from "../../utils/analytics";

export default function Audit5SReport({ record, generatedAt = new Date() }) {
  if (!record) return null;
  const meta = record.meta || {};

  const parsedDate =
    parseDate(meta.date) ||
    parseDate(meta.startTime) ||
    parseDate(record?._raw?.Date) ||
    parseDate(record?._raw?.["Heure de début"]);
  const dateLabel = parsedDate
    ? parsedDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "";
  const scores = record.scores || {};
  const answers = record.answers || [];
  const scoreClass = scores.percent <= 80 ? "red" : scores.percent <= 85 ? "orange" : "green";
  const pillarScores = record.pillarScores || {};

  return (
    <div className="report-root">
      <div className="report-header">
        <div className="report-logo">
          <div className="report-logo-mark"><img src="/logo-wkw.png" alt="WKW" style={{width:"70%",height:"70%",objectFit:"contain"}} /></div>
          <div>
            <div className="report-brand-title">KPI Gemba & 5S</div>
            <div className="report-brand-sub">Rapport d'audit 5S</div>
          </div>
        </div>
        <div className="report-meta">
          <div><strong>Audit #{meta.id || "—"}</strong></div>
          <div>Généré le {generatedAt.toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      <div className="report-title">Audit 5S — {meta.zone || "Zone"}</div>
      <div className="report-subtitle">{dateLabel}</div>
      <div className={`report-score-badge ${scoreClass}`}>Score : {scores.percent || 0}%</div>

      <div className="report-section">
        <div className="report-section-title">Informations générales</div>
        <div className="report-info-grid">
          <div className="report-info-item">
            <div className="report-info-label">Auditeur</div>
            <div className="report-info-value">{meta.auditor || "—"}</div>
          </div>
          <div className="report-info-item">
            <div className="report-info-label">Pilot de zone</div>
            <div className="report-info-value">{meta.zoneLeader || "—"}</div>
          </div>
          <div className="report-info-item">
            <div className="report-info-label">Zone / Ligne</div>
            <div className="report-info-value">{meta.zone || "—"}</div>
          </div>
          <div className="report-info-item">
            <div className="report-info-label">Total points / Applicable</div>
            <div className="report-info-value">{meta.totalPoints || 0} / {scores.applicable || 26}</div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="report-section-title">Résumé</div>
        <div className="report-kpi-grid">
          <div className="report-kpi">
            <div className="report-kpi-label">OK</div>
            <div className="report-kpi-value" style={{ color: "#22c55e" }}>{scores.ok || 0}</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-label">NOK</div>
            <div className="report-kpi-value" style={{ color: "#ef4444" }}>{scores.nok || 0}</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-label">N/A</div>
            <div className="report-kpi-value" style={{ color: "#6b7280" }}>{scores.na || 0}</div>
          </div>
          <div className="report-kpi">
            <div className="report-kpi-label">Applicable</div>
            <div className="report-kpi-value">{scores.applicable || 0}</div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="report-section-title">Scores par pilier</div>
        <table className="report-table">
          <thead>
            <tr><th>Pilier</th><th className="num">OK</th><th className="num">NOK</th><th className="num">N/A</th><th className="num">Score</th></tr>
          </thead>
          <tbody>
            {["1S", "2S", "3S", "4S", "5S"].map((p) => {
              const s = pillarScores[p] || {};
              const c = s.score <= 80 ? "#ef4444" : s.score <= 85 ? "#f59e0b" : "#22c55e";
              return (
                <tr key={p}>
                  <td><strong>{p}</strong></td>
                  <td className="num" style={{ color: "#22c55e", fontWeight: 700 }}>{s.ok || 0}</td>
                  <td className="num" style={{ color: "#ef4444", fontWeight: 700 }}>{s.nok || 0}</td>
                  <td className="num" style={{ color: "#6b7280" }}>{s.na || 0}</td>
                  <td className="num" style={{ color: c, fontWeight: 700 }}>{s.score || 0}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <div className="report-section-title">Détail des 26 questions</div>
        {answers.map((a) => {
          const cls = a.status === "OK" ? "ok" : a.status === "NOK" ? "nok" : "na";
          return (
            <div key={a.index} className="report-q-block">
              <div className="report-q-header">
                <div className="report-q-title">Q{a.index} · {a.pillar} — {a.short || a.question}</div>
                <span className={`report-pill ${cls}`}>{a.status}</span>
              </div>
              {a.question && a.question !== a.short && (
                <div className="report-q-text">{a.question}</div>
              )}
              {a.feedback && <div className="report-q-feedback"><strong>Feedback :</strong> {a.feedback}</div>}
              {a.action && <div className="report-q-action"><strong>Action :</strong> {a.action}</div>}
            </div>
          );
        })}
      </div>

      <div className="report-section">
        <div className="report-section-title">Signatures</div>
        <div className="report-signatures">
          <div className="report-sig-box">Auditeur<br />{meta.auditor || ""}</div>
          <div className="report-sig-box">Pilot de zone<br />{meta.zoneLeader || ""}</div>
          <div className="report-sig-box">Responsable Amélioration</div>
        </div>
      </div>

      <div className="report-footer">
        <div>KPI Gemba & 5S — Document généré automatiquement</div>
        <div>Audit #{meta.id || "—"}</div>
      </div>
    </div>
  );
}
