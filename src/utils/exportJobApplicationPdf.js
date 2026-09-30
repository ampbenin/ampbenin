// src/utils/exportJobApplicationPdf.js
// Export PDF d'UNE candidature de recrutement — même principe que
// exportReportPdf.js (portrait A4, texte simple plutôt qu'un tableau : une
// candidature est un document à lire, pas des données à comparer en
// colonnes), demandé pour la page de détail d'une candidature
// (JobRecruitmentManager.jsx, décision utilisateur 2026-09-30 : "une vraie
// page" au lieu d'une boîte modale, avec téléchargement PDF).
import jsPDF from "jspdf";

const slugify = (str) =>
  (str || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const formatValue = (field, value) => {
  if (value === undefined || value === null || value === "") return "— Sans réponse —";
  if (value === true) return "Oui";
  if (value === false) return "Non";
  if (field?.type === "FILE") return String(value); // URL du fichier joint, lisible tel quel sur papier
  return String(value);
};

export function exportJobApplicationPdf({ jobTitle, application, fieldLabelById, fieldById, statusLabel }) {
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

  const fullName = `${application.applicantFirstName} ${application.applicantLastName}`;

  doc.setFontSize(16);
  doc.text("Candidature de recrutement", marginX, y);
  y += 8;

  doc.setFontSize(11);
  doc.text(`Offre : ${jobTitle || "—"}`, marginX, y);
  y += 6;
  doc.text(`Candidat(e) : ${fullName}`, marginX, y);
  y += 6;
  doc.text(`Email : ${application.applicantEmail}`, marginX, y);
  y += 6;
  doc.text(`Téléphone : ${application.applicantPhone || "—"}`, marginX, y);
  y += 6;
  doc.text(`Statut : ${statusLabel}`, marginX, y);
  y += 6;
  doc.text(`Reçue le : ${application.createdAt ? new Date(application.createdAt).toLocaleString("fr-FR") : "—"}`, marginX, y);
  y += 10;

  doc.setDrawColor(200);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  const responseEntries = Object.entries(application.responses || {});
  if (responseEntries.length === 0) {
    doc.setFontSize(10);
    doc.text("Aucune réponse personnalisée pour cette offre.", marginX, y);
    y += 8;
  }

  responseEntries.forEach(([key, value]) => {
    const field = fieldById?.get(key);
    const label = fieldLabelById?.get(key) || key;

    ensureSpace(14);
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text(label, marginX, y);
    y += 5.5;

    doc.setFont(undefined, "normal");
    const lines = doc.splitTextToSize(formatValue(field, value), maxWidth);
    lines.forEach((line) => {
      ensureSpace(6);
      doc.text(line, marginX, y);
      y += 5.5;
    });
    y += 4;
  });

  if (application.staffNotes) {
    ensureSpace(14);
    doc.setDrawColor(200);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Note interne (usage staff uniquement)", marginX, y);
    y += 5.5;
    doc.setFont(undefined, "normal");
    doc.splitTextToSize(application.staffNotes, maxWidth).forEach((line) => {
      ensureSpace(6);
      doc.text(line, marginX, y);
      y += 5.5;
    });
  }

  doc.save(`candidature-${slugify(fullName)}-${slugify(jobTitle)}.pdf`);
}
