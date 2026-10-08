import { useEffect, useState } from "react";
import { database } from "../firebase/config";
import { ref, onValue } from "firebase/database";

/**
 * Charge les photos d'un audit 5S en temps réel.
 * @param {string} auditId - L'ID Firebase du record 5S
 * @returns { photos, loading } - photos = { [questionIndex]: { [photoId]: {...} } }
 */
export function use5SPhotos(auditId) {
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auditId) {
      setPhotos({});
      setLoading(false);
      return;
    }

    const photosRef = ref(database, `photos/5s/${auditId}`);
    const unsub = onValue(
      photosRef,
      (snap) => {
        setPhotos(snap.val() || {});
        setLoading(false);
      },
      (err) => {
        console.error("Photos load error:", err);
        setPhotos({});
        setLoading(false);
      }
    );

    return () => unsub();
  }, [auditId]);

  return { photos, loading };
}
