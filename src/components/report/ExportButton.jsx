import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/jpeg", 0.9),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => reject(new Error(`Erreur: ${url}`));
    img.src = url;
  });
}

export default function ExportButton({ fileName = "audit-5S", label = "Télécharger PDF" }) {
  const handleDownload = async () => {
    const container = document.getElementById("report-container");
    if (!container) {
      alert("Rapport introuvable.");
      return;
    }

    console.log("📄 Génération du PDF professionnel...");

    // ⭐ 1. Récupérer les photos AVANT de masquer la section
    const photoRows = Array.from(container.querySelectorAll(".sp-photo-row")).map((row) => ({
      qnum: row.querySelector(".sp-photo-qnum")?.textContent || "",
      status: row.querySelector(".sp-photo-status")?.textContent || "",
      title: row.querySelector(".sp-photo-qtitle")?.textContent || "",
      photos: Array.from(row.querySelectorAll(".sp-photo-thumb img")).map((img) => img.src),
    }));

    // ⭐ 2. Masquer la section photos (pour la capture page 1)
    const photosSection = container.querySelector(".sp-photos-section");
    const photosSectionDisplay = photosSection ? photosSection.style.display : "";
    if (photosSection) photosSection.style.display = "none";

    // ⭐ 3. Convertir les images restantes (logo) en base64
    const images = Array.from(container.querySelectorAll("img"));
    const originalSrcs = images.map((img) => img.src);
    for (let i = 0; i < images.length; i++) {
      try {
        const res = await fetch(images[i].src, { mode: "cors" });
        const blob = await res.blob();
        const b64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        images[i].src = b64;
      } catch (err) {
        console.warn(`Image ${i+1} non convertie:`, err);
      }
    }

    await new Promise((r) => setTimeout(r, 800));

    // ⭐ 4. Désactiver l'overflow des parents
    const parents = [];
    let p = container.parentElement;
    while (p && p !== document.body) {
      const st = window.getComputedStyle(p);
      if (st.overflow === "auto" || st.overflow === "scroll" ||
          st.overflowY === "auto" || st.overflowY === "scroll") {
        parents.push({ el: p, o: p.style.overflow, oy: p.style.overflowY });
        p.style.overflow = "visible";
        p.style.overflowY = "visible";
      }
      p = p.parentElement;
    }

    try {
      // ⭐ 5. Charger les photos Cloudinary en parallèle
      console.log("📸 Chargement des photos...");
      const photosLoaded = [];
      for (const row of photoRows) {
        const loaded = [];
        for (const url of row.photos) {
          try {
            const imgData = await loadImage(url);
            loaded.push(imgData);
            console.log(`  ✅ ${row.qnum} chargée`);
          } catch (err) {
            console.error(`  ❌ ${row.qnum}:`, err);
          }
        }
        photosLoaded.push({ ...row, photos: loaded });
      }

      // ⭐ 6. CAPTURE PAGE 1 : html2canvas du rapport sans photos
      console.log("📸 Capture du rapport HTML...");
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        scrollY: 0,
        scrollX: 0,
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
      });

      // ⭐ 7. Créer le PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Ajouter la capture page 1 (UNE SEULE PAGE)
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

      // ⭐ Ajuster la hauteur pour tenir sur une seule page A4
      const finalHeight = Math.min(imgHeight, pageHeight);
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, finalHeight);

      // Si l'image dépasse la page, on la coupe (pas de page vide)

      // ⭐ 8. PAGE PHOTOS : Ajouter les photos manuellement
      if (photosLoaded.length > 0) {
        pdf.addPage();
        let py = 10;
        const margin = 10;

        // Titre
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(15, 23, 42);
        pdf.text("PHOTOS DES NON-CONFORMITÉS", margin, py);
        py += 6;

        // Badge count
        const totalPhotos = photosLoaded.reduce((sum, r) => sum + r.photos.length, 0);
        pdf.setFillColor(15, 23, 42);
        pdf.roundedRect(pageWidth - margin - 15, py - 5, 15, 7, 3, 3, "F");
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text(String(totalPhotos), pageWidth - margin - 7.5, py, { align: "center" });
        pdf.setTextColor(15, 23, 42);

        py += 8;

        for (const row of photosLoaded) {
          if (py + 60 > pageHeight - margin) {
            pdf.addPage();
            py = margin;
          }

          // En-tête de ligne
          pdf.setFillColor(238, 242, 255);
          pdf.rect(margin, py, pageWidth - 2 * margin, 7, "F");

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(67, 56, 202);
          pdf.text(row.qnum, margin + 2, py + 5);

          pdf.setFillColor(220, 38, 38);
          pdf.roundedRect(margin + 15, py + 1.5, 10, 4, 0.5, 0.5, "F");
          pdf.setFontSize(7);
          pdf.setTextColor(255, 255, 255);
          pdf.text(row.status, margin + 20, py + 4.5, { align: "center" });

          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(15, 23, 42);
          pdf.text(row.title.substring(0, 60), margin + 28, py + 5);

          py += 9;

          const photoWidth = 55;
          const photoHeight = 42;
          const gap = 4;
          let x = margin;

          for (const photo of row.photos) {
            if (x + photoWidth > pageWidth - margin) {
              x = margin;
              py += photoHeight + gap;
              if (py + photoHeight > pageHeight - margin) {
                pdf.addPage();
                py = margin;
              }
            }
            try {
              pdf.addImage(photo.dataUrl, "JPEG", x, py, photoWidth, photoHeight);
              pdf.setDrawColor(203, 213, 225);
              pdf.rect(x, py, photoWidth, photoHeight);
            } catch (err) {
              console.error("Erreur image:", err);
            }
            x += photoWidth + gap;
          }
          py += photoHeight + 6;
        }
      }

      pdf.save(`${fileName}.pdf`);
      console.log("✅ PDF généré !");
    } catch (err) {
      console.error("❌ Erreur PDF:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      if (photosSection) photosSection.style.display = photosSectionDisplay;
      images.forEach((img, i) => {
        if (originalSrcs[i]) img.src = originalSrcs[i];
      });
      parents.forEach(({ el, o, oy }) => {
        el.style.overflow = o || "";
        el.style.overflowY = oy || "";
      });
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="no-print export-btn"
      style={{
        padding: "10px 20px",
        background: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px"
      }}
    >
      📥 {label}
    </button>
  );
}
