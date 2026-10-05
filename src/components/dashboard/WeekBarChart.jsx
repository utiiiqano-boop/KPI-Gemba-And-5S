import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LabelList, Cell,
} from "recharts";
import "./WeekBarChart.css";

/**
 * Red bars with % labels on top — for a specific week's per-zone/per-ligne scores.
 * data: [{ name: "L76", score: 81 }, ...]
 */
export default function WeekBarChart({ data, title, barColor }) {
  const color = barColor || "#dc2626";
  return (
    <div className="wbc-wrap">
      {title && <div className="wbc-title">{title}</div>}
      <div style={{ width: "100%", height: 360 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 40, right: 20, left: 10, bottom: 30 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickMargin={8} />
            <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
              formatter={(v) => `${v}%`}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="score" position="top" fill="#f1f5f9" fontSize={12} fontWeight={700}
                formatter={(v) => `${v}%`} />
              {data.map((_, i) => <Cell key={i} fill={color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
