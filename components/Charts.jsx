import React from 'react';
import { C, scoreColor, FONT } from '../theme';

/* ================================================================ */
/*   LINE / AREA CHART (SVG)                                         */
/* ================================================================ */

export function AreaChart({ data, height = 180, color = C.primary, showGrid = true }) {
  /* data = [{ date, value }] */
  if (!data || data.length < 2) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontSize: 12 }}>Pas assez de données</div>;
  }

  const W = 600, H = height, PAD = { top: 16, right: 16, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = data.map(d => d.value);
  const maxV = Math.max(...values, 100);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  const x = (i) => PAD.left + (i / (data.length - 1)) * innerW;
  const y = (v) => PAD.top + innerH - ((v - minV) / range) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1)} ${PAD.top + innerH} L ${x(0)} ${PAD.top + innerH} Z`;

  const gradId = 'grad-' + Math.random().toString(36).slice(2, 8);

  /* Grid lines */
  const gridYs = [0, 25, 50, 75, 100].map(p => PAD.top + innerH - (p / 100) * innerH);

  /* Sample x labels */
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block', fontFamily: FONT }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {showGrid && gridYs.map((gy, i) => (
        <line key={i} x1={PAD.left} x2={W - PAD.right} y1={gy} y2={gy}
          stroke={C.borderLight} strokeWidth="1" strokeDasharray="3 4" />
      ))}

      {showGrid && [0, 25, 50, 75, 100].map((p, i) => (
        <text key={i} x={PAD.left - 6} y={gridYs[i] + 3}
          fontSize="9" fill={C.textMuted} textAnchor="end">{p}</text>
      ))}

      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {data.map((d, i) => (
        i % labelEvery === 0 || i === data.length - 1 ? (
          <text key={i} x={x(i)} y={H - 8} fontSize="9" fill={C.textMuted} textAnchor="middle">
            {String(d.date).slice(5)}
          </text>
        ) : null
      ))}

      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="2.5" fill={C.surface} stroke={color} strokeWidth="2" />
      ))}
    </svg>
  );
}

/* ================================================================ */
/*   DONUT CHART                                                     */
/* ================================================================ */

export function DonutChart({ segments, size = 180, thickness = 26, centerLabel, centerValue }) {
  /* segments = [{ value, color, label }] */
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = size / 2;
  const r = R - thickness;
  const cx = R, cy = R;

  let acc = 0;
  const arcs = segments.map((s) => {
    const start = acc / total * 2 * Math.PI - Math.PI / 2;
    acc += s.value;
    const end = acc / total * 2 * Math.PI - Math.PI / 2;
    const large = (end - start) > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(start);
    const y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end);
    const y2 = cy + R * Math.sin(end);
    const x3 = cx + r * Math.cos(end);
    const y3 = cy + r * Math.sin(end);
    const x4 = cx + r * Math.cos(start);
    const y4 = cy + r * Math.sin(start);
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
    return { d, color: s.color, label: s.label, value: s.value };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill={a.color} />
        ))}
        {centerValue !== undefined && (
          <g>
            <text x={cx} y={cy - 2} fontSize="24" fontWeight="800" fill={C.text} textAnchor="middle">
              {centerValue}
            </text>
            {centerLabel && (
              <text x={cx} y={cy + 16} fontSize="10" fill={C.textMuted} textAnchor="middle" fontWeight="600">
                {centerLabel}
              </text>
            )}
          </g>
        )}
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 120 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 3, backgroundColor: s.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: C.textSoft, flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textMuted, minWidth: 38, textAlign: 'right' }}>
              {total > 0 ? Math.round((s.value / total) * 1000) / 10 : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================ */
/*   SPARKLINE                                                       */
/* ================================================================ */

export function Sparkline({ data, width = 80, height = 28, color = C.primary }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const values = data.map(d => d.value ?? d);
  const maxV = Math.max(...values);
  const minV = Math.min(...values);
  const range = maxV - minV || 1;
  const x = (i) => (i / (data.length - 1)) * width;
  const y = (v) => height - ((v - minV) / range) * height;
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ================================================================ */
/*   RADIAL PROGRESS (pour score global)                             */
/* ================================================================ */

export function RadialGauge({ value = 0, size = 160, thickness = 14, color }) {
  const pct = Math.max(0, Math.min(100, value));
  const R = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * R;
  const offset = circumference - (pct / 100) * circumference;
  const strokeColor = color || scoreColor(pct / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.borderLight} strokeWidth={thickness} />
      <circle
        cx={cx} cy={cy} r={R} fill="none"
        stroke={strokeColor} strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      <text x={cx} y={cy + 4} fontSize="28" fontWeight="800" fill={strokeColor} textAnchor="middle">
        {pct}%
      </text>
    </svg>
  );
}

/* ================================================================ */
/*   MINI BAR (heatmap cells)                                        */
/* ================================================================ */

export function MiniHeatmap({ cells, cols = 10 }) {
  /* cells = [{ value, count }] où value = 0-100 */
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 3,
    }}>
      {cells.map((c, i) => {
        const color = scoreColor(c.value / 100);
        const opacity = Math.max(0.15, Math.min(1, (c.count || 1) / 5));
        return (
          <div
            key={i}
            title={`${c.label || ''} — ${c.value}% (${c.count})`}
            style={{
              aspectRatio: '1',
              borderRadius: 4,
              backgroundColor: color,
              opacity,
              cursor: 'pointer',
            }}
          />
        );
      })}
    </div>
  );
}
