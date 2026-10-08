import { Cloudinary } from "@cloudinary/url-gen";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "xfn4hweg";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "kpi_gemba_unsigned";
const FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || "kpi-gemba-5s";

export const cld = new Cloudinary({ cloud: { cloudName: CLOUD_NAME } });

/**
 * Upload un fichier vers Cloudinary (unsigned)
 */
export function uploadPhoto(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Le fichier doit être une image"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("L'image est trop lourde (max 5 MB)"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", FOLDER);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            format: data.format,
            bytes: data.bytes,
          });
        } catch (err) {
          reject(new Error("Réponse invalide de Cloudinary"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || "Erreur d'upload"));
        } catch {
          reject(new Error(`Erreur HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Erreur réseau"));
    xhr.send(formData);
  });
}

/** URL Cloudinary optimisée pour miniature carrée */
export function thumbnailUrl(publicId, size = 200) {
  if (!publicId) return "";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,g_auto,w_${size},h_${size},q_auto,f_auto/${publicId}`;
}

/** URL Cloudinary optimisée pour affichage normal */
export function displayUrl(publicId, maxWidth = 1200) {
  if (!publicId) return "";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_limit,w_${maxWidth},q_auto,f_auto/${publicId}`;
}

/** URL Cloudinary originale */
export function originalUrl(publicId) {
  if (!publicId) return "";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
}

export { CLOUD_NAME, UPLOAD_PRESET, FOLDER };
