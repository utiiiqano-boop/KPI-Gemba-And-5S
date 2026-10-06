import "./PrioritiesPanel.css";

export default function PrioritiesPanel({ items, label = "priorités", showCount = true }) {
  return (
    <div className="pp-wrap">
      {items.length === 0 ? (
        <div className="pp-empty">Aucune priorité — excellent travail ! 🎉</div>
      ) : (
        items.map((item, i) => (
          <div key={i} className="pp-card">
            <div className="pp-rank">#{i + 1}</div>
            <div className="pp-body">
              <div className="pp-title">{item.title}</div>
              {item.subtitle && (
                <div className="pp-subtitle">{item.subtitle}</div>
              )}
            </div>
            {showCount && (
              <div className="pp-count">
                <span className="pp-count-value">{item.count}</span>
                <span className="pp-count-label">NOK</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
