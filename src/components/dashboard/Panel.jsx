import "./Panel.css";

export default function Panel({ title, subtitle, right, children, full }) {
  return (
    <div className={`panel ${full ? "panel-full" : ""}`}>
      <div className="panel-head">
        <div>
          <div className="panel-title">{title}</div>
          {subtitle && <div className="panel-subtitle">{subtitle}</div>}
        </div>
        {right}
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}
