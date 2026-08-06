// src/components/admin/BlacklistWarning.jsx
// Croisement côté client d'une candidature/volontaire avec la liste noire
// des volontaires bannis (GET /api/volunteer-discipline/blacklist, chargée
// une fois par le composant hôte) — email, téléphone, ou nom+prénom.
// Aucun champ ajouté côté serveur aux listes de candidatures pour ne pas
// les alourdir (voir controllers/volunteerDisciplineController.js#listBlacklist).
import { useState } from "react";

export function findBlacklistMatch(blacklist, { email, phone, firstName, lastName }) {
  if (!blacklist || blacklist.length === 0) return null;
  const emailLower = (email || "").toLowerCase().trim();
  const phoneNorm = (phone || "").trim();
  const nameLower = `${firstName || ""} ${lastName || ""}`.toLowerCase().trim();

  return blacklist.find((b) => {
    if (emailLower && b.email?.toLowerCase() === emailLower) return true;
    if (phoneNorm && b.telephone && b.telephone.trim() === phoneNorm) return true;
    const bNameLower = `${b.prenom || ""} ${b.nom || ""}`.toLowerCase().trim();
    return Boolean(nameLower && bNameLower && bNameLower === nameLower);
  }) || null;
}

export function BlacklistBadge({ entry }) {
  const [show, setShow] = useState(false);
  if (!entry) return null;

  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setShow((v) => !v); }}
        style={{
          background: "#dc2626", color: "#fff", border: "none", borderRadius: 6,
          padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
        }}
      >
        ⚠️ Voir la sanction
      </button>
      {show && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", zIndex: 20, top: "120%", left: 0, width: 260,
            background: "#fff", border: "1px solid #dc2626", borderRadius: 10,
            padding: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontSize: "0.8rem",
          }}
        >
          <strong style={{ color: "#dc2626" }}>Volontaire banni</strong>
          <p style={{ margin: "4px 0", color: "#666" }}>
            Le {new Date(entry.bannedAt).toLocaleDateString("fr-FR")}
          </p>
          <p style={{ margin: 0, whiteSpace: "pre-line" }}>{entry.reason}</p>
        </div>
      )}
    </span>
  );
}
