import "./PeriodComparison.css";

export default function PeriodComparison({
  title,
  currentLabel,
  previousLabel,
  currentStats,
  previousStats,
  byGroupCurrent = [],
  byGroupPrevious = [],
  groupLabel = "Zone",
  suffix = "%",
}) {
  const delta = +(currentStats.avg - previousStats.avg).toFixed(1);
  const deltaAudits = currentStats.audits - previousStats.audits;
  const trendColor = delta >= 0 ? "#22c55e" : "#ef4444";
  const trendIcon = delta > 0 ? "▲" : delta < 0 ? "▼" : "=";

  const allGroups = [...new Set([
    ...byGroupCurrent.map((x) => x.name),
    ...byGroupPrevious.map((x) => x.name),
  ])].sort();

  const merged = allGroups.map((name) => {
    const c = byGroupCurrent.find((x) => x.name === name) || { avg: null, count: 0 };
    const p = byGroupPrevious.find((x) => x.name === name) || { avg: null, count: 0 };
    const d = c.avg !== null && p.avg !== null ? +(c.avg - p.avg).toFixed(1) : null;
    return { name, current: c, previous: p, delta: d };
  }).sort((a, b) => {
    if (a.delta === null && b.delta === null) return 0;
    if (a.delta === null) return 1;
    if (b.delta === null) return -1;
    return Math.abs(b.delta) - Math.abs(a.delta);
  });

  return (
    <div className="pc-wrap">
      {title && (
        <div className="pc-head">
          <span className="pc-title">{title}</span>
        </div>
      )}

      <div className="pc-cards">
        <div className="pc-card pc-card-prev">
          <div className="pc-card-period">{previousLabel}</div>
          <div className="pc-card-value" style={{ color: "#94a3b8" }}>
            {previousStats.avg}{suffix}
          </div>
          <div className="pc-card-sub">
            {previousStats.audits} audit{previousStats.audits > 1 ? "s" : ""}
          </div>
        </div>

        <div className="pc-arrow" style={{ color: trendColor }}>
          {trendIcon}
        </div>

        <div className="pc-card pc-card-curr">
          <div className="pc-card-period">{currentLabel}</div>
          <div className="pc-card-value" style={{ color: trendColor }}>
            {currentStats.avg}{suffix}
          </div>
          <div className="pc-card-sub">
            {currentStats.audits} audit{currentStats.audits > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="pc-delta" style={{ color: trendColor }}>
        {delta >= 0 ? `+${delta}` : delta} pts
        <span className="pc-delta-sub">
          {" "}({deltaAudits >= 0 ? "+" : ""}{deltaAudits} audits)
        </span>
      </div>

      {merged.length > 0 && (
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr>
                <th>{groupLabel}</th>
                <th>{previousLabel}</th>
                <th>{currentLabel}</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((row) => {
                const d = row.delta;
                const c = d === null ? "#64748b" : d > 0 ? "#22c55e" : d < 0 ? "#ef4444" : "#94a3b8";
                return (
                  <tr key={row.name}>
                    <td><strong>{row.name}</strong></td>
                    <td className="num" style={{ color: "#94a3b8" }}>
                      {row.previous.avg !== null ? `${row.previous.avg}${suffix}` : "—"}
                      {row.previous.count ? <span className="pc-count"> ({row.previous.count})</span> : null}
                    </td>
                    <td className="num">
                      {row.current.avg !== null ? `${row.current.avg}${suffix}` : "—"}
                      {row.current.count ? <span className="pc-count"> ({row.current.count})</span> : null}
                    </td>
                    <td className="num" style={{ color: c, fontWeight: 700 }}>
                      {d === null ? "—" : `${d > 0 ? "+" : ""}${d}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
