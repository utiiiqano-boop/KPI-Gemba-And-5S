import { QUESTIONS_5S } from "../../utils/schema5S";
import "./Heatmap.css";

export default function Heatmap({ rows, matrix, questions }) {
  const qList = questions || QUESTIONS_5S;
  if (!rows || !rows.length) return <div className="empty">Aucune donnée.</div>;

  const colorFor = (p) => {
    if (p === null || p === undefined) return "rgba(148,163,184,0.08)";
    const t = Math.max(0, Math.min(1, p / 100));
    const r = Math.round(255 * t);
    const g = Math.round(200 * (1 - t) + 60 * t);
    const b = Math.round(60 * (1 - t));
    return `rgba(${r}, ${g}, ${b}, 0.85)`;
  };

  return (
    <div className="heatmap-wrap">
      <table className="heatmap">
        <thead>
          <tr>
            <th className="hm-corner">Ligne / Question</th>
            {qList.map((q) => (
              <th key={q.index ?? q} title={q.short || q.question || String(q)}>
                {q.index ? `Q${q.index}` : String(q).slice(0, 12)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="hm-label">{row.label}</td>
              {qList.map((q) => {
                const key = q.index ?? q;
                const p = matrix[row.key]?.[key];
                return (
                  <td
                    key={key}
                    className="hm-cell"
                    style={{ background: colorFor(p) }}
                    title={`${row.label} · ${q.index ? "Q" + q.index : q}: ${p === undefined ? "—" : p.toFixed(0) + "% NOK"}`}
                  >
                    {p === undefined ? "" : p.toFixed(0)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
