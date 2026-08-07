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
    <span className="bkl-wrap">
      <button type="button" onClick={(e) => { e.stopPropagation(); setShow((v) => !v); }} className="bkl-trigger">
        ⚠️ Voir la sanction
      </button>
      {show && (
        <div onClick={(e) => e.stopPropagation()} className="bkl-popover">
          <strong className="bkl-popover__title">Volontaire banni</strong>
          <p className="bkl-popover__date">Le {new Date(entry.bannedAt).toLocaleDateString("fr-FR")}</p>
          <p className="bkl-popover__reason">{entry.reason}</p>
        </div>
      )}

      <style>{`
        .bkl-wrap { position: relative; display: inline-block; margin-left: 6px; }
        .bkl-trigger {
          background: var(--col-error, #C1121F); color: #fff; border: none; border-radius: 999px;
          padding: 3px 10px; font-size: 0.7rem; font-weight: 700; cursor: pointer;
          transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        }
        .bkl-trigger:hover { background: #96101c; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(193, 18, 31, 0.3); }
        .bkl-popover {
          position: absolute; z-index: 20; top: 130%; left: 0; width: 260px;
          background: #fff; border: 1px solid rgba(193, 18, 31, 0.35); border-radius: 12px;
          padding: 14px; box-shadow: 0 12px 32px rgba(15, 42, 30, 0.2); font-size: 0.8rem;
          animation: bkl-pop 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .bkl-popover__title { color: var(--col-error, #C1121F); display: block; margin-bottom: 4px; }
        .bkl-popover__date { margin: 4px 0; color: var(--col-text-muted, #666); }
        .bkl-popover__reason { margin: 0; color: var(--col-text, #1A1A1A); white-space: pre-line; }
        @keyframes bkl-pop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </span>
  );
}
