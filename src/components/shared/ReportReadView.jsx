// src/components/shared/ReportReadView.jsx
// Vue de lecture soignée d'un rapport de fin de mission — outil de
// traitement demandé côté admin (décision utilisateur, 2026-08-19 : "vue
// de lecture soignée", "note interne", "export PDF"), remplace la liste
// compacte dt/dd habituelle des soumissions normales pour ces rapports-là.
// Styles entièrement en ligne (même convention que LoadingSpinner.jsx/
// TruncatedDescription.jsx) pour fonctionner à l'identique dans
// SupervisorDashboard.jsx (CSS var(--sd-*)) et VolunteerProgramEditor.jsx
// (Tailwind) — aucune classe partagée à faire coexister avec les deux.
import { useState } from "react";

export default function ReportReadView({ proofFields, responses, internalNote, onSaveNote, onExportPdf }) {
  const [noteDraft, setNoteDraft] = useState(internalNote || "");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const saveNote = async () => {
    if (!onSaveNote) return;
    setSavingNote(true);
    setNoteSaved(false);
    try {
      await onSaveNote(noteDraft);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {onExportPdf && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={onExportPdf}
            style={{
              background: "transparent", border: "1px solid currentColor", borderRadius: 6,
              padding: "6px 12px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", color: "inherit",
            }}>
            📄 Exporter en PDF
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(proofFields || []).map((field) => {
          const value = responses?.[field.id];
          const isEmpty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
          return (
            <div key={field.id} style={{ paddingBottom: 14, borderBottom: "1px solid currentColor", borderBottomColor: "rgba(128,128,128,0.2)" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, opacity: 0.65, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {field.label}
              </div>
              {isEmpty ? (
                <div style={{ fontSize: "0.95rem", opacity: 0.5, fontStyle: "italic" }}>— Sans réponse —</div>
              ) : field.type === "URL" ? (
                <a href={value} target="_blank" rel="noreferrer" style={{ fontSize: "0.95rem", wordBreak: "break-all", color: "inherit", textDecoration: "underline" }}>
                  {value}
                </a>
              ) : field.type === "IMAGE" ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {value.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" style={{ height: 96, width: 96, objectFit: "cover", borderRadius: 8 }} />
                    </a>
                  ))}
                </div>
              ) : field.type === "CHECKBOX" ? (
                <div style={{ fontSize: "0.95rem" }}>{value ? "Oui" : "Non"}</div>
              ) : (
                <div style={{ fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>{String(value)}</div>
              )}
            </div>
          );
        })}
      </div>

      {onSaveNote && (
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, opacity: 0.65, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            📝 Note interne (jamais visible du volontaire)
          </label>
          <textarea rows={3} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Notes de suivi pour l'équipe..."
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid rgba(128,128,128,0.3)", background: "transparent", color: "inherit", fontFamily: "inherit", fontSize: "0.9rem", resize: "vertical" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <button type="button" onClick={saveNote} disabled={savingNote || noteDraft === internalNote}
              style={{
                background: "transparent", border: "1px solid currentColor", borderRadius: 6, padding: "5px 12px",
                fontSize: "0.8rem", fontWeight: 600, cursor: savingNote ? "not-allowed" : "pointer", color: "inherit",
                opacity: savingNote || noteDraft === internalNote ? 0.5 : 1,
              }}>
              {savingNote ? "Enregistrement..." : "Enregistrer la note"}
            </button>
            {noteSaved && <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>✓ Enregistrée</span>}
          </div>
        </div>
      )}
    </div>
  );
}
