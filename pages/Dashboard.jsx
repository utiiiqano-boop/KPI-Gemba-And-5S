import React, { useState, useMemo, useEffect } from 'react';
import { C, scoreColor, FONT, MOBILE_BREAKPOINT } from '../theme';
import { AreaChart, DonutChart, Sparkline, RadialGauge } from '../components/Charts';
import { computeDashboard, loadAudits } from '../dataStore';

const WD = {
  border: '#e5e7eb', borderLight: '#f1f5f9', headerBg: '#f9fafb',
  text: '#111827', textSoft: '#6b7280', textMuted: '#9ca3af',
  card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' },
  cardHeader: { padding: '10px 14px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 11, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardSubtitle: { fontSize: 10, fontWeight: 500, color: '#9ca3af' },
  cardBody: { padding: 14 },
};

function useIsMobile() {
  const [m, setM] = React.useState(typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = () => setM(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}

const PERIODS = [
  { id: '7d', label: '7J' }, { id: '30d', label: '30J' },
  { id: '90d', label: '90J' }, { id: 'all', label: 'Tout' },
];

function PeriodTabs({ value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid ' + WD.border, borderRadius: 4, overflow: 'hidden', backgroundColor: '#fff' }}>
      {PERIODS.map((p, i) => {
        const active = p.id === value;
        return (
          <button key={p.id} onClick={() => onChange(p.id)} style={{
            padding: '5px 11px', border: 'none',
            borderLeft: i > 0 ? '1px solid ' + WD.border : 'none',
            backgroundColor: active ? '#111827' : 'transparent',
            color: active ? '#fff' : WD.textSoft,
            fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}>{p.label}</button>
        );
      })}
    </div>
  );
}

function KPIStrip({ items, isMobile }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(' + items.length + ', minmax(0, 1fr))',
      backgroundColor: '#fff', border: '1px solid ' + WD.border, borderRadius: 6, overflow: 'hidden',
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          padding: isMobile ? '10px 12px' : '12px 14px',
          borderRight: i < items.length - 1 ? '1px solid ' + WD.border : 'none',
          position: 'relative', minWidth: 0,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: WD.textMuted, textTransform: 'uppercase',
            letterSpacing: 0.5, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            <span style={{ fontSize: 11 }}>{it.icon}</span>
            <span>{it.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
            <span style={{
              fontSize: isMobile ? 18 : 22, fontWeight: 800,
              color: it.color || WD.text, letterSpacing: -0.5, lineHeight: 1,
            }}>{it.value}</span>
            {it.unit && <span style={{ fontSize: 11, fontWeight: 600, color: WD.textMuted }}>{it.unit}</span>}
          </div>
          {it.spark && !isMobile && (
            <div style={{ position: 'absolute', top: 10, right: 10, opacity: 0.8 }}>
              <Sparkline data={it.spark} width={52} height={18} color={it.color} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WCard({ title, subtitle, badge, children, style }) {
  return (
    <div style={{ ...WD.card, ...style }}>
      {(title || badge) && (
        <div style={WD.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span style={WD.cardTitle}>{title}</span>
            {subtitle && <span style={WD.cardSubtitle}>· {subtitle}</span>}
          </div>
          {badge}
        </div>
      )}
      <div style={WD.cardBody}>{children}</div>
    </div>
  );
}

const thStyle = { padding: '8px 10px', fontSize: 10, fontWeight: 700, color: WD.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left', borderBottom: '1px solid ' + WD.border };
const tdStyle = { padding: '8px 10px', fontSize: 11, verticalAlign: 'middle' };

function ZoneTable({ zones, max = 10 }) {
  const maxPct = Math.max.apply(null, zones.slice(0, max).map(z => z.pctRounded).concat([1]));
  return (
    <div style={{ marginTop: -14, marginLeft: -14, marginRight: -14, marginBottom: -14 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
        <thead>
          <tr style={{ backgroundColor: WD.headerBg }}>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Zone</th>
            <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>Audits</th>
            <th style={{ ...thStyle, width: 140 }}>Score</th>
            <th style={{ ...thStyle, textAlign: 'right', width: 55 }}>%</th>
          </tr>
        </thead>
        <tbody>
          {zones.slice(0, max).map((z, i) => {
            const color = scoreColor(z.pct);
            return (
              <tr key={i} style={{ borderTop: '1px solid ' + WD.borderLight }}>
                <td style={{ ...tdStyle, color: WD.textMuted, fontWeight: 600 }}>{i + 1}</td>
                <td style={tdStyle}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: WD.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }} title={z.name}>{z.name}</div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', color: WD.textSoft, fontSize: 11 }}>{z.count}</td>
                <td style={tdStyle}>
                  <div style={{ height: 4, backgroundColor: WD.borderLight, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: ((z.pctRounded / maxPct) * 100) + '%', backgroundColor: color }} />
                  </div>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color, fontSize: 12 }}>{z.pctRounded}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DenseList({ items, color, max = 8 }) {
  const maxV = Math.max.apply(null, items.slice(0, max).map(x => x.count).concat([1]));
  return (
    <div style={{ marginTop: -14, marginLeft: -14, marginRight: -14, marginBottom: -14 }}>
      {items.slice(0, max).map((it, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '28px 1fr 60px 44px',
          gap: 8, alignItems: 'center', padding: '8px 14px',
          borderTop: i > 0 ? '1px solid ' + WD.borderLight : 'none', fontSize: 11,
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: WD.textMuted, textAlign: 'center' }}>{i + 1}</span>
          <span title={it.name || it.text} style={{ color: WD.text, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name || it.text}</span>
          <div style={{ height: 3, backgroundColor: WD.borderLight, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: ((it.count / maxV) * 100) + '%', backgroundColor: color }} />
          </div>
          <span style={{ fontWeight: 800, color, textAlign: 'right' }}>{it.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard(props) {
  const isMobile = useIsMobile();
  const [period, setPeriod] = useState('all');
  const [rows, setRows] = useState(Array.isArray(props.rows) ? props.rows : []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Array.isArray(props.rows) && props.rows.length > 0) {
      setRows(props.rows);
      return;
    }
    setLoading(true);
    loadAudits()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => console.warn('[Dashboard] load error', e))
      .finally(() => setLoading(false));
  }, [props.rows]);

  const filteredRows = useMemo(() => {
    if (period === 'all' || rows.length === 0) return rows;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return rows.filter(r => {
      const dateStr = String(r['Date'] || '').slice(0, 10);
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d)) return false;
      return d >= cutoff;
    });
  }, [rows, period]);

  const data = useMemo(() => computeDashboard(filteredRows), [filteredRows]);

  if (loading) {
    return (
      <div style={{ ...WD.card, padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <div style={{ color: WD.textSoft }}>Chargement…</div>
      </div>
    );
  }

  if (rows.length === 0 || data.total === 0) {
    return (
      <div style={{ ...WD.card, padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: WD.text }}>Aucune donnée</div>
        <div style={{ color: WD.textSoft, marginTop: 6, fontSize: 13 }}>
          Importez un fichier Excel pour commencer.
        </div>
      </div>
    );
  }

  const pct = data.avgPct;
  const pctColor = scoreColor(pct / 100);
  const sparkScore = data.trend.map(t => ({ value: t.pct }));

  const kpis = [
    { icon: '📋', label: 'Audits', value: data.total, color: WD.text },
    { icon: '🎯', label: 'Taux moyen', value: pct, unit: '%', color: pctColor, spark: sparkScore },
    { icon: '📍', label: 'Zones', value: data.byZone.length, color: WD.text },
    { icon: '⚠️', label: 'NOK', value: (data.criteriaStatus && data.criteriaStatus.nok) || 0, color: '#dc2626' },
  ];

  const critOk = (data.criteriaStatus && data.criteriaStatus.ok) || 0;
  const critNok = (data.criteriaStatus && data.criteriaStatus.nok) || 0;
  const critNa = (data.criteriaStatus && data.criteriaStatus.na) || 0;

  const grid3 = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 12, marginTop: 12 };
  const grid2 = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: 12 };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 800, color: WD.text, letterSpacing: -0.4 }}>Tableau de bord</h2>
          <span style={{ fontSize: 11, color: WD.textMuted, fontWeight: 600 }}>
            {data.total} audits · {data.byZone.length} zones
            {period !== 'all' ? ' · filtre : ' + period : ''}
          </span>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      <KPIStrip items={kpis} isMobile={isMobile} />

      <div style={grid3}>
        <WCard title="Évolution du score" subtitle={data.trend.length + ' points'}>
          {data.trend.length > 1 ? (
            <AreaChart data={data.trend.map(t => ({ date: t.date, value: t.pct }))} height={isMobile ? 160 : 200} color={C.primary} />
          ) : (
            <div style={{ height: isMobile ? 160 : 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WD.textMuted, fontSize: 12 }}>
              Pas assez de données
            </div>
          )}
        </WCard>
        <WCard title="Répartition des critères">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <RadialGauge value={pct} size={isMobile ? 110 : 130} thickness={10} />
            <div style={{ width: '100%' }}>
              <DonutChart
                segments={[
                  { label: 'OK', value: critOk, color: C.success },
                  { label: 'NOK', value: critNok, color: C.danger },
                  { label: 'N/A', value: critNa, color: C.neutral },
                ]}
                size={isMobile ? 100 : 110} thickness={16}
                centerValue={critOk + critNok + critNa} centerLabel="critères"
              />
            </div>
          </div>
        </WCard>
      </div>

      <div style={grid3}>
        <WCard title="Performance par zone" subtitle={'Top ' + Math.min(10, data.byZone.length)}>
          <ZoneTable zones={data.byZone} max={10} />
        </WCard>
        <WCard title="Top NOK" badge={<span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: 3 }}>À traiter</span>}>
          {data.topNokCriteria.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: WD.textSoft, fontSize: 12 }}>Aucun NOK</div>
          ) : (
            <DenseList items={data.topNokCriteria} color="#dc2626" max={7} />
          )}
        </WCard>
      </div>

      <div style={grid2}>
        <WCard title="Distribution des scores">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: isMobile ? 120 : 140, paddingTop: 6 }}>
            {data.scoreDistribution.map((d, i) => {
              const maxD = Math.max.apply(null, data.scoreDistribution.map(x => x.count).concat([1]));
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: WD.textSoft }}>{d.count}</span>
                  <div style={{ width: '100%', height: Math.max((d.count / maxD) * (isMobile ? 70 : 95), 4) + 'px', backgroundColor: scoreColor(d.min / 100), borderRadius: '2px 2px 0 0' }} />
                  <span style={{ fontSize: 9, color: WD.textMuted, whiteSpace: 'nowrap' }}>{d.bucket.split('-')[0]}</span>
                </div>
              );
            })}
          </div>
        </WCard>
        {data.scoreByWeekday.length > 0 && (
          <WCard title="Score par jour de semaine">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.scoreByWeekday.map((d, i) => {
                const color = scoreColor(d.pct / 100);
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 44px 40px', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: WD.textSoft }}>{d.day}</span>
                    <div style={{ height: 6, backgroundColor: WD.borderLight, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: d.pct + '%', backgroundColor: color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color, textAlign: 'right' }}>{d.pct}%</span>
                    <span style={{ fontSize: 10, color: WD.textMuted, textAlign: 'right' }}>({d.count})</span>
                  </div>
                );
              })}
            </div>
          </WCard>
        )}
      </div>

      <div style={grid2}>
        <WCard title="Feedbacks fréquents" badge={<span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', backgroundColor: '#fffbeb', padding: '2px 6px', borderRadius: 3 }}>À analyser</span>}>
          {data.topFeedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: WD.textSoft, fontSize: 12 }}>Aucun feedback.</div>
          ) : (
            <div style={{ marginTop: -14, marginLeft: -14, marginRight: -14, marginBottom: -14 }}>
              {data.topFeedbacks.slice(0, 6).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 14px', borderTop: i > 0 ? '1px solid ' + WD.borderLight : 'none' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#d97706', flexShrink: 0, marginTop: 1, minWidth: 22 }}>{f.count}×</span>
                  <span style={{ fontSize: 11, color: WD.text, lineHeight: 1.4, flex: 1 }}>{f.text}</span>
                </div>
              ))}
            </div>
          )}
        </WCard>
        <WCard title="Zones à surveiller">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.bestZone && (
              <div style={{ padding: '10px 12px', backgroundColor: '#f0fdf4', borderLeft: '3px solid #10b981', borderRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5 }}>🏆 Meilleure</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: WD.text, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.bestZone.name}</div>
                <div style={{ fontSize: 11, color: WD.textSoft, marginTop: 2 }}>
                  <strong style={{ color: '#059669' }}>{data.bestZone.pctRounded}%</strong> · {data.bestZone.count} audits
                </div>
              </div>
            )}
            {data.worstZone && data.bestZone && data.worstZone.name !== data.bestZone.name && (
              <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', borderLeft: '3px solid #dc2626', borderRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 0.5 }}>⚠️ Critique</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: WD.text, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.worstZone.name}</div>
                <div style={{ fontSize: 11, color: WD.textSoft, marginTop: 2 }}>
                  <strong style={{ color: '#dc2626' }}>{data.worstZone.pctRounded}%</strong> · {data.worstZone.count} audits
                </div>
              </div>
            )}
            {data.byAuditeur.slice(0, 3).map((a, i) => (
              <div key={i} style={{ padding: '8px 12px', backgroundColor: WD.headerBg, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 11, color: WD.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>{a.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: WD.text }}>{a.count}</span>
                  <span style={{ fontSize: 10, color: WD.textMuted }}>· {a.pctRounded}%</span>
                </div>
              </div>
            ))}
          </div>
        </WCard>
      </div>
    </div>
  );
}
