// src/components/admin/ReportVolunteerButton.jsx
// Bouton + modal de signalement d'un volontaire "indélicat", réutilisé à
// 4 endroits (VolunteerProgramEditor.jsx, SupervisorDashboard.jsx,
// PartnerDashboard.jsx, VolunteersManager.jsx) — voir
// controllers/volunteerDisciplineController.js#submitReport. Autonome
// (styles en ligne) pour rester indépendant de la convention Tailwind/
// inline de chaque fichier hôte. ADMIN/EDITOR/SUPERVISEUR/PARTENAIRE
// peuvent signaler ; le scope exact ("affecté à eux") est vérifié côté
// serveur, pas ici.
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
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Signaler ce volontaire"
        style={{
          background: "none", border: "1px solid #dc2626", color: "#dc2626", borderRadius: 6,
          padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
        }}
      >
        🚩 {label || "Signaler"}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 12, padding: 20, maxWidth: 420, width: "100%",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}>
            <h3 style={{ margin: "0 0 8px", color: "#dc2626" }}>🚩 Signaler ce volontaire</h3>
            <p style={{ fontSize: "0.85rem", color: "#666", margin: "0 0 12px" }}>
              Décrivez le comportement signalé. Un ADMIN examinera ce signalement et décidera d'une suite
              (avertissement, suspension, bannissement) ou le classera sans suite.
            </p>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motif du signalement..."
              style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8, boxSizing: "border-box" }}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button onClick={() => setOpen(false)} style={{
                background: "#fff", border: "1px solid #ccc", borderRadius: 8, padding: "8px 16px", cursor: "pointer",
              }}>
                Annuler
              </button>
              <button onClick={submit} disabled={submitting || !reason.trim()} style={{
                background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px",
                fontWeight: 700, cursor: "pointer", opacity: submitting || !reason.trim() ? 0.6 : 1,
              }}>
                {submitting ? "Envoi..." : "Envoyer le signalement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
