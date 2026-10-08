import { useEffect, useState } from "react";
import { displayUrl } from "../../utils/cloudinary";
import "./PhotoLightbox.css";

export default function PhotoLightbox({ photos, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const current = photos[index];

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, photos.length]);

  if (!current) return null;

  return (
    <div className="plb-overlay" onClick={onClose}>
      <button className="plb-close" onClick={onClose} aria-label="Fermer">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
          <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
        </svg>
      </button>

      {index > 0 && (
        <button
          className="plb-nav plb-prev"
          onClick={(e) => { e.stopPropagation(); setIndex((i) => i - 1); }}
          aria-label="Précédente"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <div className="plb-content" onClick={(e) => e.stopPropagation()}>
        <img src={displayUrl(current.publicId, 1600)} alt={`Photo ${index + 1}`} />
        <div className="plb-info">
          <div className="plb-counter">{index + 1} / {photos.length}</div>
          {current.addedBy && <div className="plb-meta">Ajoutée par {current.addedBy}</div>}
        </div>
      </div>

      {index < photos.length - 1 && (
        <button
          className="plb-nav plb-next"
          onClick={(e) => { e.stopPropagation(); setIndex((i) => i + 1); }}
          aria-label="Suivante"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}
