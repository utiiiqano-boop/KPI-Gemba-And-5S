import { scoreColor } from "../../utils/colors";
import "./TopBottomPanel.css";

export default function TopBottomPanel({ top, bottom, label = "Zone", suffix = "%" }) {
  return (
    <div className="tb-wrap">
      {/* TOP 3 */}
      <div className="tb-column">
        <div className="tb-header">
          <span className="tb-icon tb-icon-top">🏆</span>
          <span className="tb-title">Top 3 {label}</span>
        </div>
        {top.length === 0 ? (
          <div className="tb-empty">Aucune donnée</div>
        ) : (
          top.map((item, i) => (
            <div key={i} className="tb-row">
              <div className="tb-rank" data-rank={i + 1}>
                {i + 1}
              </div>
              <div className="tb-name">{item.name}</div>
              <div className="tb-score" style={{ color: scoreColor(item.avg) }}>
                {item.avg}{suffix}
              </div>
            </div>
          ))
        )}
      </div>

      {/* BOTTOM 3 */}
      <div className="tb-column">
        <div className="tb-header">
          <span className="tb-icon tb-icon-bottom">⚠️</span>
          <span className="tb-title">Bottom 3 {label}</span>
        </div>
        {bottom.length === 0 ? (
          <div className="tb-empty">Aucune donnée</div>
        ) : (
          bottom.map((item, i) => (
            <div key={i} className="tb-row">
              <div className="tb-rank tb-rank-bottom" data-rank={i + 1}>
                {i + 1}
              </div>
              <div className="tb-name">{item.name}</div>
              <div className="tb-score" style={{ color: scoreColor(item.avg) }}>
                {item.avg}{suffix}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
