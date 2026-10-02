import React, { useState } from 'react';
import { C, shadow, FONT } from '../theme';

const cardStyle = {
  backgroundColor: C.surface, borderRadius: 12, padding: 24,
  borderWidth: 1, borderStyle: 'solid', borderColor: C.border,
  boxShadow: shadow.sm,
};

export default function Import({ onImport, rows, saving, onSave, onClear, dirty }) {
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.onchange = async (e) => {
      const f = e.target.files && e.target.files[0];
      try { document.body.removeChild(input); } catch (_) {}
      if (f) onImport(f);
    };
    input.click();
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: C.text }}>
          Importer un fichier Excel
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textSoft, lineHeight: 1.5 }}>
          Sélectionnez votre fichier <strong>5S.xlsx</strong>. Les données seront parsées puis vous
          pourrez les synchroniser avec Firestore.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onImport(f);
          }}
          onClick={openPicker}
          style={{
            padding: 40, textAlign: 'center', cursor: 'pointer',
            borderWidth: 2, borderStyle: 'dashed',
            borderColor: dragOver ? C.primary : C.border,
            backgroundColor: dragOver ? C.primaryLt : C.bg,
            borderRadius: 12, transition: 'all 0.15s ease',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }}>📥</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
            Cliquez ou déposez un fichier .xlsx ici
          </div>
          <div style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>
            Formats acceptés : .xlsx, .xls
          </div>
        </div>

        {rows.length > 0 && (
          <>
            <div style={{
              marginTop: 20, padding: 14, borderRadius: 10,
              backgroundColor: C.successLt, color: C.success,
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600,
            }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span>{rows.length} audit(s) chargé(s) en mémoire</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                onClick={onSave}
                disabled={saving || !dirty}
                style={{
                  flex: 1, minWidth: 200,
                  padding: '14px 20px', borderRadius: 10, border: 'none',
                  backgroundColor: dirty ? C.success : C.textMuted,
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: (saving || !dirty) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: dirty ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                }}
              >
                {saving ? '⏳ Enregistrement…' : (dirty ? '💾 Enregistrer dans Firestore' : '☁️ Déjà synchronisé')}
              </button>

              <button
                onClick={onClear}
                style={{
                  padding: '14px 20px', borderRadius: 10,
                  borderWidth: 1, borderStyle: 'solid', borderColor: C.danger,
                  backgroundColor: C.surface, color: C.danger,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >🗑️ Vider la mémoire</button>
            </div>
          </>
        )}
      </div>

      <div style={{ ...cardStyle, marginTop: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: C.text }}>
          ℹ️ Comment ça fonctionne
        </h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: C.textSoft, fontSize: 13, lineHeight: 1.8 }}>
          <li>Importez votre fichier <strong>5S.xlsx</strong></li>
          <li>Les données sont parsées et affichées dans <strong>Audits</strong></li>
          <li>Cliquez sur <strong>Enregistrer dans Firestore</strong> pour synchroniser</li>
          <li>Le <strong>Tableau de bord</strong> se met à jour automatiquement</li>
        </ol>
      </div>
    </div>
  );
}
