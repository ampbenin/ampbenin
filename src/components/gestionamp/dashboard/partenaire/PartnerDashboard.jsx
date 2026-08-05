// src/components/gestionamp/dashboard/partenaire/PartnerDashboard.jsx
// Tableau de bord PARTENAIRE : lecture seule des statistiques/impact d'un
// ou plusieurs programmes suivis — jamais les tâches rejetées/en attente,
// uniquement les volontaires à "Mission validée" et leurs tâches
// APPROUVÉES (voir controllers/volunteerProgramPartnerController.js).
// Utilise adminFetch (chemins complets) — ces routes vivent hors du
// sous-système gestionamp (/api/volunteer-partner, pas /gestionamp/api).
import { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";

export default function PartnerDashboard() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSent, setCommentSent] = useState(false);

  const loadPrograms = async () => {
    try {
      const res = await adminFetch("/api/volunteer-partner/my-programs");
      setPrograms(res?.items || []);
      if (res?.items?.length > 0) setSelectedProgramId(res.items[0]._id);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (programId) => {
    if (!programId) return;
    try {
      const res = await adminFetch(`/api/volunteer-partner/programs/${programId}/stats`);
      setData(res);
      setCommentSent(false);
      setComment("");
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    }
  };

  useEffect(() => { loadPrograms(); }, []);
  useEffect(() => { if (selectedProgramId) loadStats(selectedProgramId); }, [selectedProgramId]);

  const submitComment = async () => {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      await adminFetch(`/api/volunteer-partner/programs/${selectedProgramId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: comment.trim() }),
      });
      setCommentSent(true);
      setComment("");
    } catch (err) {
      alert(err.message || "Erreur lors de l'envoi du commentaire");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "#dc2626" }}>{error}</p>;
  if (programs.length === 0) return <p>Aucun programme ne vous est associé pour l'instant.</p>;
  if (!data) return <p>Chargement des statistiques...</p>;

  const { program, stats, validatedVolunteers } = data;

  return (
    <div className="partner-dashboard">
      <div style={{ marginBottom: 16 }}>
        <label>
          Programme suivi :{" "}
          <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}>
            {programs.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </label>
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 4 }}>{program.title}</h2>
        {program.description && <p style={{ color: "#555", marginBottom: 4 }}>{program.description}</p>}
        <p style={{ fontSize: "0.85rem", color: "#777" }}>
          {program.location && <>📍 {program.location} · </>}
          {program.startDate && <>Début : {new Date(program.startDate).toLocaleDateString("fr-FR")}</>}
          {program.endDate && <> · Fin : {new Date(program.endDate).toLocaleDateString("fr-FR")}</>}
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>Chiffres clés</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            ["Volontaires acceptés", stats.totalVolunteers],
            ["Mission validée", `${stats.validatedVolunteers} (${stats.percentValidated}%)`],
            ["Progression moyenne", `${stats.averageProgress}%`],
            ["Tâches approuvées", stats.totalApprovedTasks],
          ].map(([label, value]) => (
            <div key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "12px 16px", minWidth: 140 }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3>Volontaires à mission validée ({validatedVolunteers.length})</h3>
        {validatedVolunteers.length === 0 ? (
          <p style={{ color: "#666" }}>Aucun volontaire n'a encore validé sa mission sur ce programme.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {validatedVolunteers.map((v) => (
              <details key={v.volunteerId} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  {v.prenom} {v.nom} — {v.approvedTasks.length} tâche(s) approuvée(s)
                </summary>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  {v.approvedTasks.map((t, i) => (
                    <div key={i} style={{ borderTop: "1px solid #eee", paddingTop: 8 }}>
                      <strong>{t.taskTitle}</strong>
                      {t.occurrenceDate && (
                        <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: 8 }}>
                          ({new Date(t.occurrenceDate).toLocaleDateString("fr-FR")})
                        </span>
                      )}
                      <dl style={{ fontSize: "0.9rem", marginTop: 4 }}>
                        {(t.proofFields || []).map((f) => {
                          const value = t.responses?.[f.id];
                          if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
                          return (
                            <div key={f.id}>
                              <dt style={{ display: "inline", fontWeight: 600 }}>{f.label} : </dt>
                              <dd style={{ display: "inline" }}>
                                {f.type === "URL" ? (
                                  <a href={value} target="_blank" rel="noreferrer">{value}</a>
                                ) : f.type === "IMAGE" ? (
                                  <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                                    {value.map((url, idx) => (
                                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                                        <img src={url} alt="" style={{ height: 56, width: 56, objectFit: "cover", borderRadius: 6 }} />
                                      </a>
                                    ))}
                                  </span>
                                ) : f.type === "CHECKBOX" ? (value ? "Oui" : "Non") : String(value)}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3>Votre avis sur ce programme</h3>
        {commentSent && <p style={{ color: "#16a34a", marginBottom: 8 }}>Commentaire envoyé, merci !</p>}
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Suggestion, remarque, question..."
          style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button onClick={submitComment} disabled={submittingComment || !comment.trim()}
          style={{ marginTop: 8, background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>
          {submittingComment ? "Envoi..." : "Envoyer"}
        </button>
      </section>
    </div>
  );
}
