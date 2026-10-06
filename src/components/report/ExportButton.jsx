import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ExportButton({ renderContent, fileName, label = "Exporter PDF" }) {
  const containerRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  async function handleExport() {
    if (generating) return;
    setGenerating(true);
    try {
      const host = containerRef.current;
      if (!host) throw new Error("Conteneur introuvable");
      await new Promise((r) => setTimeout(r, 400));
      const target = host.firstElementChild;
      if (!target) throw new Error("Contenu du rapport introuvable");

      const canvas = await html2canvas(target, {
        scale: 3,                      // ↑ haute résolution
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: true,
        letterRendering: true,
        removeContainer: true,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Force toutes les couleurs en mode clair
          const style = clonedDoc.createElement("style");
          style.textContent = `
            * {
              -webkit-font-smoothing: auto !important;
              -moz-osx-font-smoothing: auto !important;
              text-rendering: geometricPrecision !important;
              opacity: 1 !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageW = 210;
      const pageH = 297;
      const margin = 6;
      const imgW = pageW - 2 * margin;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (imgH <= (pageH - 2 * margin)) {
        // 1 seule page
        pdf.addImage(imgData, "PNG", margin, margin, imgW, imgH, undefined, "FAST");
      } else {
        // Multi-pages
        let heightLeft = imgH;
        let position = margin;
        pdf.addImage(imgData, "PNG", margin, position, imgW, imgH, undefined, "FAST");
        heightLeft -= (pageH - 2 * margin);
        while (heightLeft > 0) {
          position = heightLeft - imgH + margin;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", margin, position, imgW, imgH, undefined, "FAST");
          heightLeft -= (pageH - 2 * margin);
        }
      }

      pdf.save(fileName);
    } catch (err) {
      console.error("Export PDF error:", err);
      alert("Erreur lors de l'export PDF : " + err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <button className="export-pdf-btn" onClick={handleExport} disabled={generating} type="button">
        {generating ? (
          <>
            <span className="spinner-pdf" />
            Génération...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
              <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 15V3" strokeLinecap="round" />
            </svg>
            {label}
          </>
        )}
      </button>
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          pointerEvents: "none",
          zIndex: -1,
          background: "#ffffff",
        }}
      >
        {renderContent()}
      </div>
    </>
  );
}
