import "./StatsRow.css";

export default function StatsRow({ items }) {
  return (
    <div className="stats-row">
      {items.map((s, i) => (
        <div key={i} className="stat-box">
          <div className="stat-value" style={{ color: s.color || "#f1f5f9" }}>
            {s.value}
          </div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
