import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, LabelList,
} from "recharts";
import "./PlanVsRealiseChart.css";

/**
 * Stacked bars: Planifié (blue base = plan) + Réalisé on top.
 * Looks like the reference image where blue = plan level, orange = extra realized.
 *
 * data: [{ week, label, planned, realised }]
 */
export default function PlanVsRealiseChart({ data, title, plan }) {
  return (
    <div className="pvr-wrap">
      {title && <div className="pvr-title">{title}</div>}
      <div style={{ width: "100%", height: 420 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 30, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickMargin={8} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="planned" name="Planifié" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]}>
              <LabelList dataKey="planned" position="center" fill="#ffffff" fontSize={11} fontWeight={700} />
            </Bar>
            <Bar dataKey="realised" name="Réalisé" stackId="a" fill="#f97316" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="realised" position="center" fill="#ffffff" fontSize={11} fontWeight={700} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
