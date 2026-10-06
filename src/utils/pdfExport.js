import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportElementToPDF(element, filename = "rapport.pdf") {
  if (!element) throw new Error("Element introuvable");
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = 210;
  const pageH = 297;
  const margin = 8;
  const imgW = pageW - 2 * margin;
  const imgH = (canvas.height * imgW) / canvas.width;
  let heightLeft = imgH;
  let position = margin;
  pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
  heightLeft -= (pageH - 2 * margin);
  while (heightLeft > 0) {
    position = heightLeft - imgH + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
    heightLeft -= (pageH - 2 * margin);
  }
  pdf.save(filename);
}
