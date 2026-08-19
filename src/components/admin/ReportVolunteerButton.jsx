// src/components/admin/ReportVolunteerButton.jsx
// Bouton + modal de signalement d'un volontaire "indélicat", réutilisé à
// 4 endroits (VolunteerProgramEditor.jsx, SupervisorDashboard.jsx,
// PartnerDashboard.jsx, VolunteersManager.jsx) — voir
// controllers/volunteerDisciplineController.js#submitReport. Autonome
// (styles en ligne + <style> scopée) pour rester indépendant de la
// convention Tailwind/inline de chaque fichier hôte, tout en réutilisant
// les tokens de marque (var(--col-*)) chargés globalement par tokens.css.
// ADMIN/EDITOR/SUPERVISEUR/PARTENAIRE peuvent signaler ; le scope exact
// ("affecté à eux") est vérifié côté serveur, pas ici.
//
// Fournir SOIT volunteerId (volontaire déjà accepté), SOIT applicationId
// (candidature, même encore en attente — le serveur résout/crée
// l'identité Volunteer par email si besoin).
import { useState } from "react";
import { adminFetch } from "@/services/admin/api";

export default function ReportVolunteerButton({ programId, volunteerId, applicationId, label, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await adminFetch("/api/volunteer-discipline/reports", {
        method: "POST",
        body: JSON.stringify({ programId, volunteerId, applicationId, reason: reason.trim() }),
      });
      setOpen(false);
      setReason("");
      alert("Signalement envoyé — un ADMIN va l'examiner.");
      if (onSubmitted) onSubmitted();
    } catch (err) {
      alert(err.message || "Erreur lors de l'envoi du signalement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="rvb-trigger" title="Signaler ce volontaire">
        🚩 {label || "Signaler"}
      </button>

      {open && (
        <div onClick={() => setOpen(false)} className="rvb-overlay">
          <div onClick={(e) => e.stopPropagation()} className="rvb-modal">
            <h3 className="rvb-title">🚩 Signaler ce volontaire</h3>
            <p className="rvb-hint">
              Décrivez le comportement signalé. Un ADMIN examinera ce signalement et décidera d'une suite
              (avertissement, suspension, bannissement) ou le classera sans suite.
            </p>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motif du signalement..."
              className="rvb-textarea"
              autoFocus
            />
            <div className="rvb-actions">
              <button type="button" onClick={() => setOpen(false)} className="rvb-btn rvb-btn--ghost">
                Annuler
              </button>
              <button type="button" onClick={submit} disabled={submitting || !reason.trim()} className="rvb-btn rvb-btn--danger">
                {submitting ? "Envoi..." : "Envoyer le signalement"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .rvb-trigger {
          background: rgba(193, 18, 31, 0.06);
          border: 1px solid rgba(193, 18, 31, 0.35);
          color: var(--col-error, #C1121F);
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        }
        .rvb-trigger:hover {
          background: var(--col-error, #C1121F);
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(193, 18, 31, 0.28);
        }

        .rvb-overlay {
          position: fixed; inset: 0; background: rgba(15, 42, 30, 0.45);
          backdrop-filter: blur(2px); z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 16px;
          animation: rvb-fade 180ms ease;
        }
        .rvb-modal {
          background: #fff; border-radius: 16px; padding: 24px; max-width: 440px; width: 100%;
          box-shadow: 0 20px 60px rgba(15, 42, 30, 0.28); color: var(--col-text, #1A1A1A);
          animation: rvb-pop 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        /* Mode sombre — voir GestionAMPLayout.astro (bouton partagé dans
           l'en-tête, décision utilisateur 2026-08-19). Ce composant est
           aussi utilisé hors de cet espace (VolunteerProgramEditor.jsx,
           VolunteersManager.jsx) : ces règles y restent sans effet tant que
           body[data-theme="dark"] n'y est jamais posé. */
        body[data-theme="dark"] .rvb-modal,
        body[data-theme="dark"] .rvb-btn--ghost {
          background: var(--col-surface, #16241C);
        }
        .rvb-title { margin: 0 0 8px; color: var(--col-error, #C1121F); font-family: var(--font-heading, inherit); font-size: 1.15rem; }
        .rvb-hint { font-size: 0.85rem; color: var(--col-text-muted, #666); margin: 0 0 14px; line-height: 1.5; }
        .rvb-textarea {
          width: 100%; padding: 10px 12px; border: 1px solid var(--col-border, #ccc); border-radius: 10px;
          box-sizing: border-box; font-family: inherit; font-size: 0.9rem; resize: vertical;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .rvb-textarea:focus {
          outline: none; border-color: var(--col-error, #C1121F);
          box-shadow: 0 0 0 3px rgba(193, 18, 31, 0.12);
        }
        .rvb-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
        .rvb-btn {
          border-radius: 10px; padding: 9px 18px; font-weight: 700; font-size: 0.85rem;
          cursor: pointer; transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        }
        .rvb-btn--ghost {
          background: #fff; border: 1px solid var(--col-border, #ccc); color: var(--col-text-sec, #4A4A4A);
        }
        .rvb-btn--ghost:hover { background: var(--col-surface, #f5f0e8); }
        .rvb-btn--danger {
          background: var(--col-error, #C1121F); border: none; color: #fff;
        }
        .rvb-btn--danger:hover:not(:disabled) { background: #96101c; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(193, 18, 31, 0.3); }
        .rvb-btn--danger:disabled { opacity: 0.55; cursor: not-allowed; }

        @keyframes rvb-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rvb-pop { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </>
  );
}
