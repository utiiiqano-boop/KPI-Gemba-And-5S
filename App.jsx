import React, { useState, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Audits, { applyFilters } from './pages/Audits';
import AuditDetail from './pages/AuditDetail';
import Import from './pages/Import';
import { C, FONT } from './theme';
import {
  loadAudits, saveAudits, computeDashboard, computeRowScore,
} from './dataStore';

/* ---------- Scroll fix ---------- */
function WebScrollFix() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.id = '5s-scroll-fix';
    style.innerHTML = `
      html, body, #root {
        overflow: auto !important; height: auto !important;
        min-height: 100% !important; margin: 0 !important; padding: 0 !important;
        font-family: ${FONT};
      }
      * { box-sizing: border-box; }
      body { background: ${C.bg}; }
      button { font-family: inherit; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: ${C.bg}; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: ${C.textMuted}; }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById('5s-scroll-fix'); if (el) el.remove(); };
  }, []);
  return null;
}

/* ---------- Excel parsing ---------- */
const META_KEYS = new Set([
  'ID','Heure de début','Heure de fin','Adresse de messagerie','Nom',
  'Total points','Quiz feedback','Heure de la dernière modification','Date',
]);

function parseWorkbook(ab) {
  const wb = XLSX.read(ab, { type: 'array', cellDates: true });
  const sh = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '', raw: false });
  let h = -1;
  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i].map((c) => String(c ?? '').trim());
    if (r.includes('ID') && r.includes('Nom')) { h = i; break; }
  }
  if (h === -1) throw new Error('Colonnes "ID" et "Nom" introuvables.');
  const headers = rawRows[h].map((x) => String(x ?? '').trim());
  const data = [];
  for (let i = h + 1; i < rawRows.length; i++) {
    const r = rawRows[i] || [];
    const o = {}; let has = false;
    for (let j = 0; j < headers.length; j++) {
      const k = headers[j]; if (!k) continue;
      const v = r[j] == null ? '' : String(r[j]).trim();
      o[k] = v; if (v) has = true;
    }
    if (has) data.push(o);
  }
  return data;
}

function normalizeRows(data) {
  return data
    .map((r) => { const o = {}; for (const k of Object.keys(r)) o[String(k).trim()] = r[k]; return o; })
    .filter((r) => r['ID'] || r['Auditeur'] || r['Zone/Ligne'])
    .sort((a, b) => Number(b['ID'] || 0) - Number(a['ID'] || 0));
}

/* ================================================================ */
/*   NATIVE fallback                                                 */
/* ================================================================ */
function NativeFallback() {
  return (
    <div style={{
      display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
      padding: 40, fontFamily: FONT, textAlign: 'center',
      backgroundColor: C.bg,
    }}>
      <div>
        <div style={{ fontSize: 60, marginBottom: 20 }}>📱</div>
        <h1 style={{ fontSize: 22, color: C.text, marginBottom: 8 }}>Version Web uniquement</h1>
        <p style={{ color: C.textSoft, fontSize: 14, maxWidth: 400 }}>
          Cette application est optimisée pour le web. Ouvrez-la dans votre navigateur.
        </p>
      </div>
    </div>
  );
}

/* ================================================================ */
/*   MAIN APP                                                        */
/* ================================================================ */

const EMPTY_FILTERS = {
  dateFrom: '', dateTo: '', zone: '',
  scoreMin: '', scoreMax: '', okMin: '', nokMax: '', search: '',
};

export default function App() {
  if (Platform.OS !== 'web') return <NativeFallback />;

  const [page, setPage] = useState('dashboard');
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await loadAudits();
        setRows(data);
      } catch (e) {
        showToast('error', 'Firestore : ' + e.message);
      } finally { setLoading(false); }
    })();
  }, []);

  const filteredRows = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const dashboard = useMemo(() => computeDashboard(filteredRows), [filteredRows]);

  const handleImportFile = async (file) => {
    try {
      const ab = await file.arrayBuffer();
      const clean = normalizeRows(parseWorkbook(ab));
      setRows(clean);
      setDirty(true);
      showToast('success', `${clean.length} audit(s) importés — cliquez sur Enregistrer`);
      setPage('audits');
    } catch (e) {
      showToast('error', String(e.message || e));
    }
  };

  const handleSave = async () => {
    if (!rows.length) { showToast('error', 'Aucune donnée.'); return; }
    setSaving(true);
    try {
      const n = await saveAudits(rows);
      setDirty(false);
      showToast('success', `✅ ${n} audit(s) enregistrés dans Firestore`);
      const data = await loadAudits();
      setRows(data);
    } catch (e) {
      showToast('error', '❌ ' + (e.message || e));
    } finally { setSaving(false); }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await loadAudits();
      setRows(data);
      showToast('success', `${data.length} audit(s) rechargés`);
    } catch (e) { showToast('error', e.message); }
    finally { setLoading(false); }
  };

  const handleNavigate = (id) => {
    setSelected(null);
    setPage(id);
  };

  const TITLES = {
    dashboard: ['Tableau de bord', `${filteredRows.length} audits ${Object.values(filters).some(v => v) ? 'filtrés' : 'totaux'}`],
    audits:    ['Audits', `${filteredRows.length} résultat(s) sur ${rows.length}`],
    import:    ['Importer', 'Charger un fichier Excel dans Firestore'],
  };

  const [title, subtitle] = TITLES[page] || ['', ''];

  return (
    <>
      <WebScrollFix />
      <Layout
        current={page}
        onNavigate={handleNavigate}
        auditCount={rows.length}
        title={selected ? `Audit #${selected.ID}` : title}
        subtitle={selected ? 'Détail complet' : subtitle}
        onRefresh={handleRefresh}
        refreshing={loading}
      >
        {loading && rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <div style={{ color: C.textSoft, fontFamily: FONT }}>Chargement depuis Firestore…</div>
          </div>
        ) : selected ? (
          <AuditDetail row={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {page === 'dashboard' && <Dashboard rows={rows} />}
            {page === 'audits' && (
              <Audits
                rows={rows}
                filtered={filteredRows}
                filters={filters}
                setFilters={setFilters}
                onSelect={setSelected}
              />
            )}
            {page === 'import' && (
              <Import
                rows={rows}
                saving={saving}
                dirty={dirty}
                onImport={handleImportFile}
                onSave={handleSave}
                onClear={() => { setRows([]); setDirty(true); }}
              />
            )}
          </>
        )}
      </Layout>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '14px 20px', borderRadius: 10,
          backgroundColor: toast.type === 'success' ? C.success : C.danger,
          color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: FONT,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          maxWidth: 400,
          animation: 'slideIn 0.2s ease',
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
}
