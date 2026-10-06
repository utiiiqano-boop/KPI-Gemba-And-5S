import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LabelList, Cell,
} from "recharts";
import { scoreColor } from "../../utils/colors";
import "./WeekBarChart.css";

export default function WeekBarChart({ data, title }) {
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
              <LabelList
                dataKey="score"
                position="top"
                fill="#f1f5f9"
                fontSize={12}
                fontWeight={700}
                formatter={(v) => `${v}%`}
              />
              {data.map((d, i) => (
                <Cell key={i} fill={scoreColor(d.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
