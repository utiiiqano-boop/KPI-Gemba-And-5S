import { useRef, useState } from "react";
import { uploadPhoto } from "../../utils/cloudinary";
import "./PhotoUpload.css";

export default function PhotoUpload({ onUploaded, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  async function handleFiles(files) {
    setError("");
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      // Upload une seule photo à la fois (simplicité)
      const file = files[0];
      const result = await uploadPhoto(file, (p) => setProgress(p));
      await onUploaded(result);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur d'upload");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="photo-upload">
      <div
        className={`pu-dropzone ${dragging ? "dragging" : ""} ${disabled ? "disabled" : ""}`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <div className="pu-progress-circle">
              <svg viewBox="0 0 36 36">
                <path
                  className="pu-progress-track"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="pu-progress-bar"
                  strokeDasharray={`${progress}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="pu-progress-text">{progress}%</span>
            </div>
            <div className="pu-title">Upload en cours…</div>
          </>
        ) : (
          <>
            <div className="pu-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5-11 11" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="pu-title">Ajouter une photo</div>
            <div className="pu-sub">Glisse une image ou clique ici</div>
          </>
        )}
      </div>

      {/* Bouton "Prendre photo" (mobile) */}
      <div className="pu-actions">
        <button
          type="button"
          className="pu-btn pu-btn-camera"
          onClick={() => cameraRef.current?.click()}
          disabled={disabled || uploading}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="13" r="4" />
          </svg>
          Prendre une photo
        </button>
      </div>

      {error && <div className="pu-error">⚠️ {error}</div>}

      {/* Input file (drag & drop) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        hidden
      />

      {/* Input caméra (mobile) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        hidden
      />
    </div>
  );
}
