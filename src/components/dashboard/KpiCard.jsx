import "./KpiCard.css";

export default function KpiCard({ label, value, sub, accent = "#6366f1", icon }) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: accent }}>
        {icon}
      </div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}
