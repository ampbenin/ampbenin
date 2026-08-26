// src/utils/exportReportPdf.js
// Export PDF d'UN rapport de fin de mission — outil de traitement demandé
// côté admin (décision utilisateur, 2026-08-19). Portrait A4, texte simple
// (doc.text()/splitTextToSize()) plutôt qu'un tableau — contrairement à
// l'export "Progression par volontaire" (SupervisorDashboard.jsx#exportProgressPdf,
// jsPDF + jspdf-autotable, paysage), un rapport est un document à lire, pas
// des données à comparer en colonnes.
import jsPDF from "jspdf";

const slugify = (str) =>
  (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function exportReportPdf({ programTitle, volunteerName, submittedAt, proofFields, responses }) {
  const doc = new jsPDF({ orientation: "portrait", format: "a4" });
  const marginX = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - marginX * 2;
  let y = 20;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFontSize(16);
  doc.text("Rapport de fin de mission", marginX, y);
  y += 8;

  doc.setFontSize(11);
  doc.text(`Programme : ${programTitle || "—"}`, marginX, y);
  y += 6;
  doc.text(`Volontaire : ${volunteerName || "—"}`, marginX, y);
  y += 6;
  doc.text(`Soumis le : ${submittedAt ? new Date(submittedAt).toLocaleString("fr-FR") : "—"}`, marginX, y);
  y += 10;

  doc.setDrawColor(200);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  (proofFields || []).forEach((field) => {
    const value = responses?.[field.id];
    const isEmpty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    const displayValue = isEmpty
      ? "— Sans réponse —"
      : field.type === "CHECKBOX" ? (value ? "Oui" : "Non")
      : field.type === "IMAGE" ? value.join(", ")
      : String(value);

    ensureSpace(14);
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text(field.label, marginX, y);
    y += 5.5;

    doc.setFont(undefined, "normal");
    const lines = doc.splitTextToSize(displayValue, maxWidth);
    lines.forEach((line) => {
      ensureSpace(6);
      doc.text(line, marginX, y);
      y += 5.5;
    });
    y += 4;
  });

  doc.save(`rapport-${slugify(volunteerName)}-${slugify(programTitle)}.pdf`);
}
