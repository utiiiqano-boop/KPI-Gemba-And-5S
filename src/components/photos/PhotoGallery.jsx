import { useState } from "react";
import { thumbnailUrl, displayUrl } from "../../utils/cloudinary";
import { delete5SPhoto } from "../../utils/photoStorage";
import PhotoLightbox from "./PhotoLightbox";
import "./PhotoGallery.css";

export default function PhotoGallery({ auditId, questionIndex, photos = {}, onDeleted }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const photoList = Object.entries(photos).map(([id, p]) => ({ id, ...p }));

  if (photoList.length === 0) return null;

  async function handleDelete(photoId, e) {
    e.stopPropagation();
    if (!window.confirm("Supprimer cette photo ?")) return;
    try {
      await delete5SPhoto(auditId, questionIndex, photoId);
      onDeleted?.(photoId);
    } catch (err) {
      alert("Erreur suppression : " + err.message);
    }
  }

  return (
    <>
      <div className="photo-gallery">
        {photoList.map((p, i) => (
          <div
            key={p.id}
            className="pg-item"
            onClick={() => setLightboxIndex(i)}
          >
            <img
              src={thumbnailUrl(p.publicId, 200)}
              alt={`Photo ${i + 1}`}
              loading="lazy"
            />
            <button
              type="button"
              className="pg-delete"
              onClick={(e) => handleDelete(p.id, e)}
              title="Supprimer"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photoList}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
