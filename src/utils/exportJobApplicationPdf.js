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

  // Toute ligne de texte passe par ici plutôt que par doc.text() direct —
  // un champ/libellé/valeur trop long pour tenir sur une ligne était coupé
  // net au bord de la page au lieu de revenir à la ligne (retour
  // utilisateur, 2026-09-30). splitTextToSize + une ligne à la fois, avec
  // vérification de place à chaque ligne (pas juste au bloc entier).
  const writeWrapped = (text, { size = 10, bold = false, lineHeight = 5.5 } = {}) => {
    doc.setFontSize(size);
    doc.setFont(undefined, bold ? "bold" : "normal");
    doc.splitTextToSize(String(text ?? ""), maxWidth).forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, marginX, y);
      y += lineHeight;
    });
  };

  const fullName = `${application.applicantFirstName} ${application.applicantLastName}`;

  writeWrapped("Candidature de recrutement", { size: 16, lineHeight: 8 });
  y += 2;

  writeWrapped(`Offre : ${jobTitle || "—"}`, { size: 11 });
  writeWrapped(`Candidat(e) : ${fullName}`, { size: 11 });
  writeWrapped(`Email : ${application.applicantEmail}`, { size: 11 });
  writeWrapped(`Téléphone : ${application.applicantPhone || "—"}`, { size: 11 });
  writeWrapped(`Statut : ${statusLabel}`, { size: 11 });
  writeWrapped(`Reçue le : ${application.createdAt ? new Date(application.createdAt).toLocaleString("fr-FR") : "—"}`, { size: 11 });
  y += 4;

  ensureSpace(8);
  doc.setDrawColor(200);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  const responseEntries = Object.entries(application.responses || {});
  if (responseEntries.length === 0) {
    writeWrapped("Aucune réponse personnalisée pour cette offre.");
    y += 4;
  }

  responseEntries.forEach(([key, value]) => {
    const field = fieldById?.get(key);
    const label = fieldLabelById?.get(key) || key;

    ensureSpace(11);
    writeWrapped(label, { bold: true });
    writeWrapped(formatValue(field, value));
    y += 4;
  });

  if (application.staffNotes) {
    ensureSpace(14);
    doc.setDrawColor(200);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 8;
    writeWrapped("Note interne (usage staff uniquement)", { bold: true });
    writeWrapped(application.staffNotes);
  }

  doc.save(`candidature-${slugify(fullName)}-${slugify(jobTitle)}.pdf`);
}
