import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

async function toBase64(url) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("❌ Conversion échouée :", url, err);
    return null;
  }
}

export default function ExportPhotosButton({ fileName = "photos-5S", label = "Télécharger Photos" }) {
  const handleDownload = async () => {
    // 1. Récupérer la section photos dans la modale
    const section = document.querySelector("#report-modal .sp-photos-section")
                 || document.querySelector(".sp-photos-section");

    if (!section) {
      alert("Aucune section photos trouvée. Vérifie que le rapport est ouvert.");
      return;
    }

    console.log("📸 Section photos trouvée, préparation...");

    // 2. Convertir toutes les images en base64
    const images = Array.from(section.querySelectorAll("img"));
    const originalSrcs = images.map((img) => img.src);
    let converted = 0;
    for (let i = 0; i < images.length; i++) {
      const b64 = await toBase64(images[i].src);
      if (b64) {
        images[i].src = b64;
        converted++;
      }
    }
    console.log(`✅ ${converted}/${images.length} images converties`);

    // 3. Attendre un peu
    await new Promise((r) => setTimeout(r, 500));

    // 4. Créer un clone ISOLÉ dans le body (sans parent avec overflow)
    const clone = section.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.left = "-99999px";
    clone.style.top = "0";
    clone.style.width = "210mm"; // Largeur A4
    clone.style.background = "#ffffff";
    clone.style.padding = "10mm";
    document.body.appendChild(clone);

    await new Promise((r) => setTimeout(r, 300));

    // 5. Générer le PDF
    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${fileName}.pdf`);
      console.log("✅ PDF photos généré !");
    } catch (err) {
      console.error("❌ Erreur PDF photos :", err);
      alert("Erreur lors de la génération du PDF photos.");
    } finally {
      // Nettoyer
      document.body.removeChild(clone);
      images.forEach((img, i) => {
        if (originalSrcs[i]) img.src = originalSrcs[i];
      });
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="no-print export-btn"
      style={{
        padding: "10px 20px",
        background: "#059669",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px"
      }}
    >
      📷 {label}
    </button>
  );
}
