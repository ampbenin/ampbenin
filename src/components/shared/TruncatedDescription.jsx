// src/components/shared/TruncatedDescription.jsx
// Description de tâche tronquée à 2 lignes + bouton "Lire tout" qui ouvre
// une boîte de dialogue avec le texte complet et les horodatages associés
// (publication/fermeture...) — décision utilisateur, 2026-08-18. Réutilisé
// tel quel sur "Mon espace" (ProgramProgress.jsx) et l'onglet Tâches Admin/
// Editor (VolunteerProgramEditor.jsx), deux systèmes de style différents
// (CSS custom / Tailwind) : ce composant reste donc en styles inline
// neutres plutôt que de dépendre de classes propres à l'un ou l'autre.
//
// "Lire tout" n'apparaît que si le texte dépasse réellement 2 lignes
// (mesuré après rendu via scrollHeight vs clientHeight, décision
// utilisateur) — les horodatages, eux, restent visibles en dehors de la
// boîte de dialogue (passés en dehors de ce composant par l'appelant) ET
// répétés dans la boîte de dialogue pour rester lisibles avec le texte
// complet sous les yeux.
import { useEffect, useRef, useState } from "react";

export default function TruncatedDescription({ text, title, times = [] }) {
  const ref = useRef(null);
  const [isClamped, setIsClamped] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    setIsClamped(ref.current.scrollHeight > ref.current.clientHeight + 1);
  }, [text]);

  if (!text) return null;

  return (
    <>
      <p
        ref={ref}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          margin: 0,
        }}
      >
        {text}
      </p>
      {isClamped && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: "none", border: "none", padding: 0, marginTop: 4,
            color: "#2563eb", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
          }}
        >
          Lire tout →
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, padding: 20, maxWidth: 480,
              width: "100%", maxHeight: "80vh", overflowY: "auto",
            }}
          >
            {title && (
              <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: "1.05rem", fontWeight: 700, color: "#111827" }}>
                {title}
              </h3>
            )}
            <p style={{ whiteSpace: "pre-line", fontSize: "0.9rem", color: "#374151", margin: 0 }}>{text}</p>
            {times.length > 0 && (
              <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 14, paddingTop: 10, fontSize: "0.8rem", color: "#6b7280" }}>
                {times.map((t) => (
                  <div key={t.label} style={{ marginBottom: 4 }}>
                    <strong>{t.label} :</strong> {t.value}
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                marginTop: 16, background: "#111827", color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer",
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
