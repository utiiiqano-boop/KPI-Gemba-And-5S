import { database } from "../firebase/config";
import { ref, push, remove, update, onValue } from "firebase/database";

/**
 * Structure Firebase :
 *   /photos/5s/{auditId}/{questionIndex}/{photoId} = {
 *     url, publicId, width, height, bytes, addedAt, addedBy
 *   }
 */

/** Ajoute une photo à un audit 5S (Q1..Q26) */
export async function add5SPhoto(auditId, questionIndex, photo, userEmail) {
  const photoRef = ref(database, `photos/5s/${auditId}/${questionIndex}`);
  const newRef = push(photoRef);
  await update(newRef, {
    url: photo.url,
    publicId: photo.publicId,
    width: photo.width || 0,
    height: photo.height || 0,
    bytes: photo.bytes || 0,
    addedAt: Date.now(),
    addedBy: userEmail || "—",
  });
  return newRef.key;
}

/** Supprime une photo */
export async function delete5SPhoto(auditId, questionIndex, photoId) {
  const photoRef = ref(database, `photos/5s/${auditId}/${questionIndex}/${photoId}`);
  await remove(photoRef);
}

/** Écoute les photos d'un audit (temps réel) */
export function listen5SPhotos(auditId, callback) {
  const photosRef = ref(database, `photos/5s/${auditId}`);
  return onValue(photosRef, (snap) => {
    const val = snap.val() || {};
    callback(val);
  });
}

/** Compte les photos par question pour un audit */
export function countPhotosByQuestion(photosObj) {
  if (!photosObj) return {};
  const out = {};
  Object.entries(photosObj).forEach(([qIndex, photos]) => {
    out[qIndex] = Object.keys(photos || {}).length;
  });
  return out;
}
