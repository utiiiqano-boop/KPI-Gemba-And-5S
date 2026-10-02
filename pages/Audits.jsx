import React, { useMemo, useState } from 'react';
import { C, shadow, scoreColor, scoreBg, FONT } from '../theme';
import { computeRowScore, ALL_META_KEYS } from '../dataStore';

const cardStyle = {
  backgroundColor: C.surface, borderRadius: 12, padding: 20,
  borderWidth: 1, borderStyle: 'solid', borderColor: C.border,
  boxShadow: shadow.sm,
};

const inputStyle = {
  width: '100%', padding: '9px 11px', fontSize: 13,
  borderWidth: 1, borderStyle: 'solid', borderColor: C.border,
  borderRadius: 8, backgroundColor: '#fff', outline: 'none',
  fontFamily: FONT, color: C.text, boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: C.textSoft,
  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  display: 'block',
};

export function FilterBar({ rows, filters, setFilters }) {
  const zones = useMemo(() => {
    const s = new Set();
    rows.forEach(r => { if (r['Zone/Ligne']) s.add(String(r['Zone/Ligne'])); });
    return Array.from(s).sort();
  }, [rows]);

  const upd = (k, v) => setFilters({ ...filters, [k]: v });
  const reset = () => setFilters({
    dateFrom: '', dateTo: '', zone: '',
    scoreMin: '', scoreMax: '', okMin: '', nokMax: '', search: '',
  });
  const hasAny = Object.values(filters).some(v => v !== '');

  return (
    <div style={{ ...cardStyle, padding: 16, marginBottom: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 800, color: C.textSoft,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>🔎 Filtres</div>
        {hasAny && (
          <button onClick={reset} style={{
            padding: '4px 10px', borderRadius: 6, border: 'none',
            backgroundColor: C.dangerLt, color: C.danger,
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>✕ Réinitialiser</button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10,
      }}>
        <div>
          <label style={labelStyle}>Date de</label>
          <input type="date" value={filters.dateFrom}
            onChange={e => upd('dateFrom', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Date à</label>
          <input type="date" value={filters.dateTo}
            onChange={e => upd('dateTo', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Zone / Ligne</label>
          <select value={filters.zone} onChange={e => upd('zone', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Toutes ({zones.length})</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Score min (%)</label>
          <input type="number" min="0" max="100" placeholder="0"
            value={filters.scoreMin} onChange={e => upd('scoreMin', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Score max (%)</label>
          <input type="number" min="0" max="100" placeholder="100"
            value={filters.scoreMax} onChange={e => upd('scoreMax', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>OK min</label>
          <input type="number" min="0" placeholder="—"
            value={filters.okMin} onChange={e => upd('okMin', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>NOK max</label>
          <input type="number" min="0" placeholder="—"
            value={filters.nokMax} onChange={e => upd('nokMax', e.target.value)} style={inputStyle} />
        </div>
        <div style={{ gridColumn: 'span 2', minWidth: 220 }}>
          <label style={labelStyle}>Remarque (feedback)</label>
          <input type="text" placeholder="Rechercher dans les feedbacks…"
            value={filters.search} onChange={e => upd('search', e.target.value)} style={inputStyle} />
        </div>
      </div>
    </div>
  );
}

export function applyFilters(rows, filters) {
  return rows.filter(r => {
    const st = computeRowScore(r);
    const pct = st.pct * 100;
    const date = String(r['Date'] || '').slice(0, 10);

    if (filters.dateFrom && date && date < filters.dateFrom) return false;
    if (filters.dateTo && date && date > filters.dateTo) return false;
    if (filters.zone && String(r['Zone/Ligne'] || '') !== filters.zone) return false;
    if (filters.scoreMin !== '' && pct < Number(filters.scoreMin)) return false;
    if (filters.scoreMax !== '' && pct > Number(filters.scoreMax)) return false;
    if (filters.okMin !== '' && st.ok < Number(filters.okMin)) return false;
    if (filters.nokMax !== '' && st.nok > Number(filters.nokMax)) return false;

    if (filters.search) {
      const needle = filters.search.toLowerCase();
      let found = false;
      for (const k of Object.keys(r)) {
        if (!k.startsWith('Feedback - ')) continue;
        if (String(r[k] || '').toLowerCase().includes(needle)) { found = true; break; }
      }
      if (!found) return false;
    }
    return true;
  });
}

const rowTitle = (r) => r['Nom'] || r['Auditeur'] || r['Zone/Ligne'] || `Audit #${r['ID'] || '?'}`;

export default function Audits({ rows, filtered, filters, setFilters, onSelect }) {
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va, vb;
      if (sortKey === 'date') {
        va = String(a['Date'] || ''); vb = String(b['Date'] || '');
      } else if (sortKey === 'zone') {
        va = String(a['Zone/Ligne'] || ''); vb = String(b['Zone/Ligne'] || '');
      } else if (sortKey === 'auditeur') {
        va = String(a['Auditeur'] || ''); vb = String(b['Auditeur'] || '');
      } else if (sortKey === 'score') {
        va = computeRowScore(a).pct; vb = computeRowScore(b).pct;
      } else {
        va = String(a['ID'] || ''); vb = String(b['ID'] || '');
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const Th = ({ label, k, align = 'left' }) => (
    <th
      onClick={() => k && toggleSort(k)}
      style={{
        textAlign: align, padding: '10px 12px',
        fontSize: 11, fontWeight: 700, color: C.textSoft,
        textTransform: 'uppercase', letterSpacing: 0.5,
        borderBottom: `1px solid ${C.border}`,
        cursor: k ? 'pointer' : 'default',
        whiteSpace: 'nowrap', userSelect: 'none',
        backgroundColor: C.bg,
      }}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <>
      <FilterBar rows={rows} filters={filters} setFilters={setFilters} />

      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
            Résultats — <span style={{ color: C.primary }}>{filtered.length}</span> / {rows.length}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ color: C.textSoft }}>Aucun audit ne correspond aux filtres.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
              <thead>
                <tr>
                  <Th label="ID" k="id" />
                  <Th label="Date" k="date" />
                  <Th label="Zone / Ligne" k="zone" />
                  <Th label="Auditeur" k="auditeur" />
                  <Th label="Score" k="score" align="right" />
                  <Th label="OK" align="right" />
                  <Th label="NOK" align="right" />
                  <Th label="N/A" align="right" />
                  <Th label="" align="right" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((item, i) => {
                  const st = computeRowScore(item);
                  const color = scoreColor(st.pct);
                  const bg = scoreBg(st.pct);
                  const pct = Math.round(st.pct * 100);

                  return (
                    <tr
                      key={item._docId || item.ID || i}
                      onClick={() => onSelect(item)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.1s ease' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = C.primaryLt}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px', fontSize: 12, color: C.textMuted, fontWeight: 600, borderBottom: `1px solid ${C.borderLight}` }}>
                        #{item['ID']}
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.borderLight}`, whiteSpace: 'nowrap' }}>
                        {String(item['Date'] || '').slice(0, 10)}
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.borderLight}` }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6,
                          backgroundColor: C.primaryLt, color: C.primary,
                          fontSize: 12, fontWeight: 600,
                        }}>{item['Zone/Ligne'] || '—'}</span>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: C.textSoft, borderBottom: `1px solid ${C.borderLight}` }}>
                        {item['Auditeur'] || '—'}
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${C.borderLight}`, textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px', borderRadius: 999,
                          backgroundColor: bg, color,
                          fontSize: 13, fontWeight: 800,
                        }}>{pct}%</span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${C.borderLight}`, textAlign: 'right' }}>
                        <span style={{ color: C.success, fontWeight: 700, fontSize: 13 }}>{st.ok}</span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${C.borderLight}`, textAlign: 'right' }}>
                        <span style={{ color: C.danger, fontWeight: 700, fontSize: 13 }}>{st.nok}</span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${C.borderLight}`, textAlign: 'right' }}>
                        <span style={{ color: C.neutral, fontWeight: 600, fontSize: 13 }}>{st.naCount || '—'}</span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: `1px solid ${C.borderLight}`, textAlign: 'right', color: C.textMuted }}>
                        →
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
