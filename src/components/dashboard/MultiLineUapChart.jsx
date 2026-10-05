import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, LabelList,
} from "recharts";
import { SERIES_COLORS } from "../../utils/analytics";
import "./MultiLineUapChart.css";

/**
 * Line chart with one series per UAP / zone.
 * data: [{ label: "S32", "UAP 1": 71, "UAP 2": 65, ... }, ...]
 * keys: ["UAP 1", "UAP 2", "logistique"]
 */
export default function MultiLineUapChart({ data, keys, title }) {
  return (
    <div className="mlu-wrap">
      {title && <div className="mlu-title">{title}</div>}
      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 30, right: 40, left: 10, bottom: 20 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickMargin={8} />
            <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
              formatter={(v) => `${v}%`}
            />
            {keys.map((k, i) => {
              const color = SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  name={k}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: color }}
                  connectNulls
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey={k}
                    position="top"
                    offset={10}
                    formatter={(v) => (v === null || v === undefined ? "" : `${v}%`)}
                    style={{ fill: color, fontSize: 11, fontWeight: 700 }}
                  />
                </Line>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
