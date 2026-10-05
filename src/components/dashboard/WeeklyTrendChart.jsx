import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, LabelList,
} from "recharts";
import { SERIES_COLORS } from "../../utils/analytics";
import "./WeeklyTrendChart.css";

/**
 * Multi-line trend chart: one line per entity (ligne or zone),
 * with visible data-point labels so no hover is needed.
 *
 * Props:
 *   series    : [{ ligne|zone, values: [{ week, label, count, avg }] }]
 *   weeks     : [{ key, label }]        X axis
 *   dataKey   : "avg" | "count"         Which value to plot
 *   yDomain   : e.g. [0, 100]           Y axis domain
 *   valueSuffix: "%" or ""
 *   emptyLabel: string
 */
export default function WeeklyTrendChart({
  series,
  weeks,
  dataKey = "avg",
  yDomain = [0, 100],
  valueSuffix = "%",
  emptyLabel = "Aucune donnée.",
}) {
  if (!series?.length || !weeks?.length) {
    return <div className="empty">{emptyLabel}</div>;
  }

  // Pivot: [{ label: "W42", "L 77": 80.0, "F 01": 90.0 }, ...]
  const data = weeks.map((w) => {
    const row = { label: w.label };
    series.forEach((s) => {
      const key = s.ligne || s.zone;
      const v = s.values.find((x) => x.week === w.key);
      row[key] = v && v[dataKey] !== null && v[dataKey] !== undefined ? v[dataKey] : null;
    });
    return row;
  });

  return (
    <div className="weekly-trend-wrap">
      <div style={{ width: "100%", height: Math.max(340, series.length * 10 + 260) }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 30, right: 40, left: 10, bottom: 20 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.1)" />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={12}
              tickMargin={10}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              domain={yDomain}
              tickFormatter={(v) => `${v}${valueSuffix}`}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 12,
              }}
              formatter={(v) => `${v}${valueSuffix}`}
            />
            <Legend
              wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
              iconType="circle"
            />
            {series.map((s, i) => {
              const key = s.ligne || s.zone;
              const color = SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: color, strokeWidth: 2, stroke: "#0b1020" }}
                  activeDot={{ r: 7 }}
                  connectNulls
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey={key}
                    position="top"
                    offset={10}
                    style={{ fill: color, fontSize: 10, fontWeight: 600 }}
                    formatter={(v) => (v === null || v === undefined ? "" : `${v}`)}
                  />
                </Line>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detail table under the chart — no hover needed */}
      <div className="weekly-trend-table-wrap">
        <table className="weekly-trend-table">
          <thead>
            <tr>
              <th>Ligne</th>
              {weeks.map((w) => <th key={w.key}>{w.label}</th>)}
              <th>Total</th>
              <th>Moyenne</th>
            </tr>
          </thead>
          <tbody>
            {series.map((s, i) => {
              const key = s.ligne || s.zone;
              const color = SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <tr key={key}>
                  <td>
                    <span className="dot" style={{ background: color }} />
                    <strong>{key}</strong>
                  </td>
                  {weeks.map((w) => {
                    const v = s.values.find((x) => x.week === w.key);
                    return (
                      <td key={w.key} className="num">
                        {v && v[dataKey] !== null && v[dataKey] !== undefined
                          ? `${v[dataKey]}${valueSuffix}`
                          : "—"}
                      </td>
                    );
                  })}
                  <td className="num">{s.totalAudits}</td>
                  <td className="num">
                    <strong style={{
                      color: s.avg === null ? "#64748b" :
                             s.avg >= 80 ? "#86efac" :
                             s.avg >= 60 ? "#fde047" : "#fca5a5"
                    }}>
                      {s.avg === null ? "—" : `${s.avg}${valueSuffix}`}
                    </strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
