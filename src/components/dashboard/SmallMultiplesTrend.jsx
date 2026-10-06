import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, LabelList,
} from "recharts";
import { scoreColor } from "../../utils/colors";
import "./SmallMultiplesTrend.css";

export default function SmallMultiplesTrend({ seriesData, columns = 2 }) {
  if (!seriesData?.length) return <div className="empty">Aucune donnée.</div>;

  return (
    <div className="smt-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {seriesData.map((s) => {
        const trendColor =
          s.trend === "up" ? "#22c55e" : s.trend === "down" ? "#ef4444" : "#94a3b8";
        const trendIcon =
          s.trend === "up" ? "↗" : s.trend === "down" ? "↘" : "→";
        const slopeLabel =
          s.slopePerStep === null || s.slopePerStep === undefined
            ? "—"
            : `${s.slopePerStep > 0 ? "+" : ""}${s.slopePerStep.toFixed(1)} pts/audit`;

        const dataWithTrend = s.points.map((p, i) => ({
          ...p,
          trendValue: s.regression
            ? +(s.regression.intercept + s.regression.slope * i).toFixed(1)
            : null,
        }));

        return (
          <div key={s.name} className="smt-card">
            <div className="smt-head">
              <div className="smt-title">{s.name}</div>
              <div
                className="smt-trend-badge"
                style={{ color: trendColor, borderColor: trendColor }}
              >
                {trendIcon} {slopeLabel}
              </div>
            </div>

            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart
                  data={dataWithTrend}
                  margin={{ top: 30, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid stroke="rgba(148,163,184,0.1)" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={10}
                    interval="preserveStartEnd"
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      color: "#e2e8f0",
                      fontSize: 12,
                    }}
                    formatter={(v) => (v === null ? "—" : `${v}%`)}
                  />
                  {s.average !== null && s.average !== undefined && (
                    <ReferenceLine
                      y={s.average}
                      stroke="#22c55e"
                      strokeDasharray="3 3"
                      strokeWidth={1.2}
                    />
                  )}
                  <Line
                    type="linear"
                    dataKey="trendValue"
                    name="Tendance"
                    stroke={trendColor}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Score"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload, index } = props;
                      const c = scoreColor(payload.value);
                      return (
                        <circle
                          key={`dot-${index}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={c}
                          stroke="#0b1020"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 7 }}
                    isAnimationActive={false}
                    connectNulls
                  >
                    <LabelList
                      dataKey="value"
                      position="top"
                      offset={8}
                      formatter={(v) => (v === null || v === undefined ? "" : `${v}%`)}
                      content={(props) => {
                        const { x, y, value } = props;
                        if (value === null || value === undefined) return null;
                        const c = scoreColor(value);
                        return (
                          <text
                            x={x}
                            y={y - 6}
                            fill={c}
                            fontSize={10}
                            fontWeight={700}
                            textAnchor="middle"
                          >
                            {value}%
                          </text>
                        );
                      }}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="smt-foot">
              <span className="smt-foot-item">
                <span className="smt-dot-blue" /> {s.points.length} audits
              </span>
              {s.average !== null && (
                <span className="smt-foot-item">
                  <span
                    className="smt-dot-trend"
                    style={{ background: scoreColor(s.average) }}
                  />
                  Moy: <strong style={{ color: scoreColor(s.average) }}>{s.average}%</strong>
                </span>
              )}
              <span className="smt-foot-item">
                <span className="smt-dot-trend" style={{ background: trendColor }} />
                {s.trend === "up" ? "Hausse" : s.trend === "down" ? "Baisse" : "Stable"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
