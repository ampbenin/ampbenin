// src/utils/formatSmartTime.js
// Format d'horodatage "style WhatsApp/Messenger" (décision utilisateur,
// 2026-08-18), réutilisé partout où un horodatage de tâche est affiché
// (publication, fermeture, soumission, validation/rejet) — espace
// Volontaire ("Mon espace"), Superviseur et Admin/Editor.
//
// Règles (aujourd'hui, hier/demain, cette semaine, plus loin) — symétrique
// passé/futur, car certains horodatages sont des échéances futures (date
// limite d'une tâche) et pas seulement des événements déjà survenus :
//   - aujourd'hui        → "14:32"
//   - hier                → "Hier à 14:32"
//   - demain              → "Demain à 14:32"
//   - ±2 à 6 jours        → "lundi à 14:32" (nom du jour)
//   - au-delà d'une semaine → "12/08/2026" (date complète, sans heure)

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatSmartTime(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((startOfDate - startOfToday) / 86400000); // + futur, - passé

  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) return time;
  if (diffDays === -1) return `Hier à ${time}`;
  if (diffDays === 1) return `Demain à ${time}`;
  if (diffDays > 1 && diffDays < 7) return `${capitalize(date.toLocaleDateString("fr-FR", { weekday: "long" }))} à ${time}`;
  if (diffDays < -1 && diffDays > -7) return `${capitalize(date.toLocaleDateString("fr-FR", { weekday: "long" }))} à ${time}`;
  return date.toLocaleDateString("fr-FR");
}
