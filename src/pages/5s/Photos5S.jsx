import { useMemo, useState, useEffect } from "react";
import { useRealtimeList } from "../../hooks/useFirebaseData";
import { get5SDate, get5SZone, get5SAuditor, get5SScore } from "../../utils/analytics";
import { QUESTIONS_5S } from "../../utils/schema5S";
import { listen5SPhotos, add5SPhoto } from "../../utils/photoStorage";
import PhotoUpload from "../../components/photos/PhotoUpload";
import PhotoGallery from "../../components/photos/PhotoGallery";
import { useAuth } from "../../contexts/AuthContext";
import "../../pages/Photos.css";

export default function Photos5S() {
  const { data: records, loading } = useRealtimeList("5s_audits");
  const { currentUser } = useAuth();

  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [photos, setPhotos] = useState({});
  const [onlyNok, setOnlyNok] = useState(true);

  // Trie les audits par date desc
  const sortedAudits = useMemo(() => {
    return [...records].sort((a, b) => {
      const da = get5SDate(a)?.getTime() ?? 0;
      const db = get5SDate(b)?.getTime() ?? 0;
      return db - da;
    });
  }, [records]);

  // Audit sélectionné
  const selected = useMemo(
    () => sortedAudits.find((r) => r._id === selectedAuditId) || null,
    [sortedAudits, selectedAuditId]
  );

  // Écoute les photos quand un audit est sélectionné
  useEffect(() => {
    if (!selectedAuditId) {
      setPhotos({});
      return;
    }
    const unsub = listen5SPhotos(selectedAuditId, (val) => setPhotos(val));
    return unsub;
  }, [selectedAuditId]);

  // Compte photos par question
  const photoCounts = useMemo(() => {
    const out = {};
    Object.entries(photos || {}).forEach(([q, list]) => {
      out[q] = Object.keys(list || {}).length;
    });
    return out;
  }, [photos]);

  // Filtre les questions à afficher
  const visibleQuestions = useMemo(() => {
    if (!selected) return [];
    const answers = selected.answers || [];
    return QUESTIONS_5S.filter((q) => {
      const a = answers.find((x) => x.index === q.index);
      if (!a) return false;
      if (onlyNok && a.status !== "NOK") return false;
      return true;
    });
  }, [selected, onlyNok]);

  async function handleUploaded(questionIndex, photo) {
    await add5SPhoto(selectedAuditId, questionIndex, photo, currentUser?.email);
  }

  return (
    <div className="photos-page">
      <div className="photos-page-header">
        <div>
          <h2>📷 Photos des audits 5S</h2>
          <p className="photos-page-sub">
            Ajoutez des photos aux questions NOK pour documenter les non-conformités.
          </p>
        </div>
        <label className="photos-toggle">
          <input
            type="checkbox"
            checked={onlyNok}
            onChange={(e) => setOnlyNok(e.target.checked)}
          />
          <span>Voir seulement les questions NOK</span>
        </label>
      </div>

      <div className="photos-layout">
        {/* ============ COLONNE GAUCHE : LISTE DES AUDITS ============ */}
        <aside className="photos-sidebar">
          <div className="photos-sidebar-title">
            Audits ({sortedAudits.length})
          </div>
          <div className="photos-audit-list">
            {loading && <div className="photos-empty">Chargement…</div>}
            {!loading && sortedAudits.length === 0 && (
              <div className="photos-empty">Aucun audit importé</div>
            )}
            {sortedAudits.map((r) => {
              const d = get5SDate(r);
              const s = get5SScore(r);
              const active = r._id === selectedAuditId;
              return (
                <button
                  key={r._id}
                  type="button"
                  className={`photos-audit-item ${active ? "active" : ""}`}
                  onClick={() => setSelectedAuditId(r._id)}
                >
                  <div className="pai-top">
                    <span className="pai-date">
                      {d ? d.toLocaleDateString("fr-FR") : "—"}
                    </span>
                    <span
                      className="pai-score"
                      style={{
                        color:
                          s.percent <= 80 ? "#ef4444" : s.percent <= 85 ? "#f59e0b" : "#22c55e",
                      }}
                    >
                      {s.percent}%
                    </span>
                  </div>
                  <div className="pai-zone">{get5SZone(r)}</div>
                  <div className="pai-auditor">{get5SAuditor(r)}</div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ============ COLONNE DROITE : DÉTAIL QUESTIONS ============ */}
        <section className="photos-detail">
          {!selected && (
            <div className="photos-placeholder">
              <div className="pp-icon">📷</div>
              <div className="pp-text">Sélectionne un audit à gauche</div>
              <div className="pp-hint">Tu pourras ajouter des photos aux questions</div>
            </div>
          )}

          {selected && (
            <>
              <div className="photos-selected-header">
                <div>
                  <div className="psh-zone">{get5SZone(selected)}</div>
                  <div className="psh-meta">
                    {get5SDate(selected)?.toLocaleDateString("fr-FR")} ·{" "}
                    {get5SAuditor(selected)} · Score{" "}
                    <strong>{get5SScore(selected).percent}%</strong>
                  </div>
                </div>
                <div className="psh-stats">
                  {visibleQuestions.length} question{visibleQuestions.length > 1 ? "s" : ""}
                </div>
              </div>

              <div className="photos-questions">
                {visibleQuestions.length === 0 && (
                  <div className="photos-empty-large">
                    ✅ Aucune question {onlyNok ? "NOK" : ""} — rien à photographier
                  </div>
                )}

                {visibleQuestions.map((q) => {
                  const a = selected.answers.find((x) => x.index === q.index);
                  const count = photoCounts[q.index] || 0;
                  return (
                    <div key={q.index} className="photo-question-card">
                      <div className="pqc-head">
                        <div className="pqc-left">
                          <span className="pqc-index">Q{q.index}</span>
                          <span className={`pqc-pill pqc-${a.status.toLowerCase().replace("/", "")}`}>
                            {a.status}
                          </span>
                          <span className="pqc-pillar">{q.pillar}</span>
                        </div>
                        {count > 0 && (
                          <span className="pqc-count">
                            📸 {count} photo{count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <div className="pqc-question">{q.short || a.question}</div>

                      {a.feedback && (
                        <div className="pqc-feedback">💬 {a.feedback}</div>
                      )}

                      {a.action && (
                        <div className="pqc-action">🎯 {a.action}</div>
                      )}

                      {/* Photos existantes */}
                      <PhotoGallery
                        auditId={selectedAuditId}
                        questionIndex={q.index}
                        photos={photos[q.index] || {}}
                      />

                      {/* Upload */}
                      <div className="pqc-upload">
                        <PhotoUpload
                          onUploaded={(photo) => handleUploaded(q.index, photo)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
