import React, { useMemo, useState } from 'react';
import { C, shadow, scoreColor, FONT } from '../theme';
import { computeRowScore, ALL_META_KEYS } from '../dataStore';

const cardStyle = {
  backgroundColor: C.surface, borderRadius: 12, padding: 20,
  borderWidth: 1, borderStyle: 'solid', borderColor: C.border,
  boxShadow: shadow.sm,
};

export default function AuditDetail({ row, onBack }) {
  const st = computeRowScore(row);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const color = scoreColor(st.pct);

  const crit = useMemo(() => {
    const out = [];
    for (const key of Object.keys(row)) {
      if (!key || ALL_META_KEYS.has(key)) continue;
      if (key.startsWith('Points - ') || key.startsWith('Feedback - ')) continue;
      const pk = `Points - ${key}`, fk = `Feedback - ${key}`;
      if (!(pk in row) && !(fk in row)) continue;
      const value = String(row[key] ?? '').trim();
      const points = String(row[pk] ?? '').trim();
      const feedback = String(row[fk] ?? '').trim();
      if (!value && !points && !feedback) continue;
      const p = Number(points);
      let status = 'na';
      if (value === 'N/A') status = 'na';
      else if (value === 'OK' || (!isNaN(p) && p >= 1)) status = 'ok';
      else if (value === 'NOK' || (!isNaN(p) && p === 0)) status = 'nok';
      out.push({ name: key, value, points, feedback, status });
    }
    return out;
  }, [row]);

  const visible = useMemo(() => {
    let list = crit;
    if (filter === 'ok') list = list.filter(c => c.status === 'ok');
    if (filter === 'nok') list = list.filter(c => c.status === 'nok');
    if (filter === 'na') list = list.filter(c => c.status === 'na');
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(s) || c.feedback.toLowerCase().includes(s));
    }
    return list;
  }, [crit, filter, q]);

  const meta = [
    ['ID', row['ID']],
    ['Date', String(row['Date'] || '').slice(0, 10)],
    ['Heure', `${row['Heure de début'] || ''} — ${row['Heure de fin'] || ''}`],
    ['Auditeur', row['Auditeur']],
    ['Zone / Ligne', row['Zone/Ligne']],
    ['Pilote de zone', row['Pilot de zone']],
    ['Email', row['Adresse de messagerie']],
    ['Quiz feedback', row['Quiz feedback']],
  ].filter(([, v]) => v);

  const tabs = [
    ['all', 'Tous', crit.length, C.primary],
    ['ok', 'OK', crit.filter(c => c.status === 'ok').length, C.success],
    ['nok', 'NOK', crit.filter(c => c.status === 'nok').length, C.danger],
    ['na', 'N/A', crit.filter(c => c.status === 'na').length, C.neutral],
  ];

  return (
    <>
      <button onClick={onBack} style={{
        padding: '8px 16px', borderRadius: 8,
        borderWidth: 1, borderStyle: 'solid', borderColor: C.border,
        backgroundColor: C.surface, color: C.textSoft,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit', marginBottom: 16,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>← Retour aux audits</button>

      {/* Hero */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: 110, height: 110, borderRadius: 999,
            borderWidth: 6, borderStyle: 'solid', borderColor: color,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1, letterSpacing: -1 }}>
              {Math.round(st.pct * 100)}%
            </div>
            <div style={{ fontSize: 11, color: C.textSoft, fontWeight: 600, marginTop: 2 }}>
              {st.earned}/{st.denominator}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>
              {row['Zone/Ligne'] || `Audit #${row['ID']}`}
            </h2>
            <div style={{ fontSize: 13, color: C.textSoft, marginTop: 4 }}>
              #{row['ID']} · {String(row['Date'] || '').slice(0, 10)} · {row['Auditeur'] || '—'}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <span style={{
                padding: '5px 12px', borderRadius: 999,
                backgroundColor: C.successLt, color: C.success,
                fontSize: 13, fontWeight: 700,
              }}>✅ {st.ok} OK</span>
              <span style={{
                padding: '5px 12px', borderRadius: 999,
                backgroundColor: C.dangerLt, color: C.danger,
                fontSize: 13, fontWeight: 700,
              }}>❌ {st.nok} NOK</span>
              {st.naCount > 0 && (
                <span style={{
                  padding: '5px 12px', borderRadius: 999,
                  backgroundColor: C.neutralLt, color: C.neutral,
                  fontSize: 13, fontWeight: 700,
                }}>⏸️ {st.naCount} N/A</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div style={{ marginTop: 20, marginBottom: 8, fontSize: 14, fontWeight: 700, color: C.text }}>
        Informations
      </div>
      <div style={{ ...cardStyle, padding: 0 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}>
          {meta.map(([l, v], i) => (
            <div key={i} style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${C.borderLight}`,
            }}>
              <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {l}
              </div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginTop: 4, wordBreak: 'break-word' }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Criteria */}
      <div style={{
        marginTop: 24, marginBottom: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
          Critères d'évaluation ({crit.length})
        </div>
        <input
          type="text"
          placeholder="Rechercher un critère…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: 13,
            borderWidth: 1, borderStyle: 'solid', borderColor: C.border,
            borderRadius: 8, outline: 'none', minWidth: 240, fontFamily: FONT,
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {tabs.map(([k, l, n, c]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{
              padding: '8px 16px', borderRadius: 999,
              backgroundColor: filter === k ? c : C.surface,
              color: filter === k ? '#fff' : C.textSoft,
              borderWidth: 1, borderStyle: 'solid',
              borderColor: filter === k ? c : C.border,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >{l} · {n}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {visible.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: C.textSoft }}>
            Aucun critère dans ce filtre.
          </div>
        )}
        {visible.map((c, i) => {
          const cfg = {
            ok:  { bg: C.successLt, border: C.success, icon: '✅', text: C.success },
            nok: { bg: C.dangerLt,  border: C.danger,  icon: '❌', text: C.danger  },
            na:  { bg: C.neutralLt, border: C.neutral, icon: '⏸️', text: C.neutral },
          }[c.status] || { bg: C.neutralLt, border: C.neutral, icon: '•', text: C.neutral };

          const isAction = /^Action\d*$/.test(c.name);
          const displayName = isAction ? (c.feedback || c.name) : c.name;

          return (
            <div key={i} style={{
              ...cardStyle, padding: 14,
              borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: cfg.border,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span>{cfg.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
                    {displayName}
                  </span>
                </div>
                {!isAction && c.value && (
                  <span style={{
                    display: 'inline-block', padding: '2px 8px',
                    borderRadius: 999, fontSize: 11, fontWeight: 800,
                    backgroundColor: cfg.bg, color: cfg.text, marginTop: 4,
                  }}>{c.value}</span>
                )}
                {c.feedback && !isAction && (
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 6, fontStyle: 'italic' }}>
                    💬 {c.feedback}
                  </div>
                )}
              </div>
              {c.points !== '' && (
                <div style={{
                  minWidth: 30, padding: '5px 10px', borderRadius: 999,
                  backgroundColor: cfg.border, color: '#fff',
                  fontWeight: 800, fontSize: 12, textAlign: 'center', flexShrink: 0,
                }}>{c.points}</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
