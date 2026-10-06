import "./SinglePageReport.css";
import { parseDate } from "../../utils/analytics";

export default function SinglePage5SReport({ record, generatedAt = new Date() }) {
  if (!record) return null;
  const meta = record.meta || {};

  // ✅ Convertit le serial Excel en date lisible
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
  const pillarScores = record.pillarScores || {};

  const score = scores.percent || 0;
  const scoreClass = score <= 80 ? "red" : score <= 85 ? "orange" : "green";

  return (
    <div className="sp-report">
      {/* HEADER */}
      <div className="sp-header">
        <div className="sp-logo">
          <div className="sp-logo-mark">KPI</div>
          <div>
            <div className="sp-brand">KPI Gemba & 5S</div>
            <div className="sp-brand-sub">Rapport d'audit 5S</div>
          </div>
        </div>
        <div className="sp-meta">
          <div><strong>Audit #{meta.id || "—"}</strong></div>
          <div>Édité le {generatedAt.toLocaleDateString("fr-FR")} à {generatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>

      {/* TITLE + SCORE */}
      <div className="sp-title-row">
        <div>
          <div className="sp-title">Audit 5S — {meta.zone || "Zone"}</div>
          <div className="sp-title-sub">{dateLabel}</div>
        </div>
        <div className={`sp-score-badge ${scoreClass}`}>{score}%</div>
      </div>

      {/* KPI ROW */}
      <div className="sp-kpis">
        <div className="sp-kpi">
          <div className="sp-kpi-label">OK</div>
          <div className="sp-kpi-value" style={{ color: "#22c55e" }}>{scores.ok || 0}</div>
        </div>
        <div className="sp-kpi">
          <div className="sp-kpi-label">NOK</div>
          <div className="sp-kpi-value" style={{ color: "#ef4444" }}>{scores.nok || 0}</div>
        </div>
        <div className="sp-kpi">
          <div className="sp-kpi-label">N/A</div>
          <div className="sp-kpi-value" style={{ color: "#64748b" }}>{scores.na || 0}</div>
        </div>
        <div className="sp-kpi">
          <div className="sp-kpi-label">Applicable</div>
          <div className="sp-kpi-value">{scores.applicable || 0}</div>
        </div>
      </div>

      {/* INFO GRID */}
      <div className="sp-info">
        <div className="sp-info-item">
          <span className="sp-info-label">Auditeur</span>
          <span className="sp-info-value">{meta.auditor || "—"}</span>
        </div>
        <div className="sp-info-item">
          <span className="sp-info-label">Pilot de zone</span>
          <span className="sp-info-value">{meta.zoneLeader || "—"}</span>
        </div>
        <div className="sp-info-item">
          <span className="sp-info-label">Zone / Ligne</span>
          <span className="sp-info-value">{meta.zone || "—"}</span>
        </div>
        <div className="sp-info-item">
          <span className="sp-info-label">Total points</span>
          <span className="sp-info-value">{meta.totalPoints || 0} / {scores.applicable || 26}</span>
        </div>
      </div>

      {/* PILLARS */}
      <div className="sp-section-title">Scores par pilier 5S</div>
      <div className="sp-pillars">
        {["1S", "2S", "3S", "4S", "5S"].map((p) => {
          const s = pillarScores[p] || {};
          const c = s.score <= 80 ? "#ef4444" : s.score <= 85 ? "#f59e0b" : "#22c55e";
          return (
            <div key={p} className="sp-pillar">
              <div className="sp-pillar-label">{p}</div>
              <div className="sp-pillar-score" style={{ color: c }}>{s.score || 0}%</div>
              <div className="sp-pillar-sub">{s.ok || 0} OK · {s.nok || 0} NOK</div>
            </div>
          );
        })}
      </div>

      {/* QUESTIONS — 2 columns */}
      <div className="sp-section-title">Détail des 26 questions</div>
      <div className="sp-questions">
        {answers.map((a) => {
          const status = a.status === "OK" ? "pass" : a.status === "NOK" ? "fail" : "na";
          return (
            <div key={a.index} className={`sp-q ${status}`}>
              <span className="sp-q-num">Q{a.index}</span>
              <span className="sp-q-text">{a.short || a.question}</span>
              <span className={`sp-q-pill ${status}`}>{a.status}</span>
            </div>
          );
        })}
      </div>

      {/* ACTIONS (si présentes) */}
      {answers.some((a) => a.action && a.action.trim()) && (
        <>
          <div className="sp-section-title">Actions identifiées ({answers.filter((a) => a.action && a.action.trim()).length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px" }}>
            {answers
              .filter((a) => a.action && a.action.trim())
              .map((a) => (
                <div key={a.index} className="sp-notes">
                  <strong>Q{a.index} :</strong> {a.action}
                </div>
              ))}
          </div>
        </>
      )}

      {/* SIGNATURES */}
      <div className="sp-signatures">
        <div className="sp-sig">
          <div className="sp-sig-line" />
          <div className="sp-sig-label">Auditeur</div>
          <div className="sp-sig-name">{meta.auditor || ""}</div>
        </div>
        <div className="sp-sig">
          <div className="sp-sig-line" />
          <div className="sp-sig-label">Pilot de zone</div>
          <div className="sp-sig-name">{meta.zoneLeader || ""}</div>
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
        <div>Audit #{meta.id || "—"} · {meta.zone || "—"} · {meta.date || "—"}</div>
      </div>
    </div>
  );
}
