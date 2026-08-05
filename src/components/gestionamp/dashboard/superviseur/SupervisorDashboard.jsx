// src/components/gestionamp/dashboard/superviseur/SupervisorDashboard.jsx
// Tableau de bord SUPERVISEUR : uniquement le suivi des tâches des
// volontaires qui lui sont affectés (jamais tout un programme, jamais les
// candidatures) — voir controllers/volunteerTaskController.js#canSuperviseVolunteer.
// Utilise adminFetch (chemins complets, /api/...) et non apiFetch
// (/gestionamp/api/...) car ces routes vivent hors du sous-système gestionamp.
import { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";

export default function SupervisorDashboard() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPrograms = async () => {
    try {
      const data = await adminFetch("/api/volunteer-tasks/my-supervised-programs");
      setPrograms(data?.items || []);
      if (data?.items?.length > 0) setSelectedProgramId(data.items[0].programId);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (programId) => {
    if (!programId) return;
    try {
      const data = await adminFetch(`/api/volunteer-tasks/submissions?programId=${programId}&status=PENDING`);
      setSubmissions(data?.items || []);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    }
  };

  useEffect(() => { loadPrograms(); }, []);
  useEffect(() => { if (selectedProgramId) loadSubmissions(selectedProgramId); }, [selectedProgramId]);

  const approve = async (id) => {
    try {
      await adminFetch(`/api/volunteer-tasks/submissions/${id}/accept`, { method: "PATCH", body: JSON.stringify({}) });
      loadSubmissions(selectedProgramId);
    } catch (err) {
      alert(err.message || "Erreur lors de l'approbation");
    }
  };

  const reject = async (id) => {
    const reviewNote = window.prompt("Motif du rejet (obligatoire) :");
    if (reviewNote === null) return;
    if (!reviewNote.trim()) { alert("Un motif de rejet est requis."); return; }
    try {
      await adminFetch(`/api/volunteer-tasks/submissions/${id}/reject`, {
        method: "PATCH", body: JSON.stringify({ reviewNote: reviewNote.trim() }),
      });
      loadSubmissions(selectedProgramId);
    } catch (err) {
      alert(err.message || "Erreur lors du rejet");
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "#dc2626" }}>{error}</p>;
  if (programs.length === 0) return <p>Aucun programme ne vous est affecté pour l'instant.</p>;

  return (
    <div className="supervisor-dashboard">
      <div style={{ marginBottom: 16 }}>
        <label>
          Programme :{" "}
          <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}>
            {programs.map((p) => (
              <option key={p.programId} value={p.programId}>{p.title} ({p.volunteerCount} volontaire(s))</option>
            ))}
          </select>
        </label>
      </div>

      <h3>Soumissions en attente ({submissions.length})</h3>
      {submissions.length === 0 ? (
        <p style={{ color: "#666" }}>Aucune soumission en attente pour vos volontaires assignés.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {submissions.map((s) => (
            <div key={s._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <strong>{s.volunteerName}</strong> <span style={{ color: "#666" }}>— {s.taskTitle}</span>
                  {s.occurrenceDate && (
                    <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: 8 }}>
                      ({new Date(s.occurrenceDate).toLocaleDateString("fr-FR")})
                    </span>
                  )}
                  <dl style={{ fontSize: "0.9rem", marginTop: 4 }}>
                    {(s.proofFields || []).map((f) => {
                      const value = s.responses?.[f.id];
                      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
                      return (
                        <div key={f.id}>
                          <dt style={{ display: "inline", fontWeight: 600 }}>{f.label} : </dt>
                          <dd style={{ display: "inline" }}>
                            {f.type === "URL" ? (
                              <a href={value} target="_blank" rel="noreferrer">{value}</a>
                            ) : f.type === "IMAGE" ? (
                              <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                                {value.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noreferrer">
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
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => approve(s._id)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>
                    Approuver
                  </button>
                  <button onClick={() => reject(s._id)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>
                    Rejeter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
