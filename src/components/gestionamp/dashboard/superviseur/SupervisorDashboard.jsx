// src/components/gestionamp/dashboard/superviseur/SupervisorDashboard.jsx
// Tableau de bord SUPERVISEUR : uniquement le suivi des tâches des
// volontaires qui lui sont affectés (jamais tout un programme, jamais les
// candidatures) — voir controllers/volunteerTaskController.js#canSuperviseVolunteer.
// Utilise adminFetch (chemins complets, /api/...) et non apiFetch
// (/gestionamp/api/...) car ces routes vivent hors du sous-système gestionamp.
//
// Enrichi le 2026-08-17 (signalé : il manquait la progression par
// volontaire, le statut de mission, l'historique des soumissions déjà
// traitées, et les infos du programme — tout existait déjà côté backend
// pour le premier et le second point, jamais appelé par cette page) :
// - Infos programme (description, lieu, dates) — listMySupervisedPrograms
//   étendu côté backend pour les fournir (un superviseur n'a pas accès à
//   GET /api/volunteer-programs/:id, réservé ADMIN/EDITOR).
// - Progression par volontaire + statut de mission — GET
//   /api/volunteer-tasks/programs/:programId/progress, déjà scopé
//   correctement aux volontaires affectés à CE superviseur côté serveur.
// - Historique des soumissions — filtre de statut (En attente/Approuvées/
//   Rejetées/Toutes) au lieu du seul status=PENDING codé en dur ;
//   /api/volunteer-tasks/submissions accepte déjà un status optionnel.
import { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";
import ReportVolunteerButton from "@/components/admin/ReportVolunteerButton.jsx";

const SUBMISSION_FILTERS = [
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvées" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "", label: "Toutes" },
];
const SUBMISSION_STATUS_LABELS = { PENDING: "En attente", APPROVED: "Approuvée", REJECTED: "Rejetée" };
const SUBMISSION_STATUS_STYLE = {
  PENDING: { background: "#fef3c7", color: "#92400e" },
  APPROVED: { background: "#dcfce7", color: "#15803d" },
  REJECTED: { background: "#fee2e2", color: "#b91c1c" },
};
const MISSION_STATUS_STYLE = {
  "Mission validée": { background: "#dcfce7", color: "#15803d" },
  "Refusé": { background: "#fee2e2", color: "#b91c1c" },
  "Non disponible": { background: "#e5e7eb", color: "#374151" },
};
const badgeStyle = (style) => ({
  display: "inline-block", fontSize: "0.75rem", fontWeight: 700, padding: "2px 10px",
  borderRadius: 999, ...style,
});

export default function SupervisorDashboard() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [submissionFilter, setSubmissionFilter] = useState("PENDING");
  const [progress, setProgress] = useState([]);
  const [missionValidationThreshold, setMissionValidationThreshold] = useState(null);
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

  const loadSubmissions = async (programId, status) => {
    if (!programId) return;
    try {
      const qs = status ? `&status=${status}` : "";
      const data = await adminFetch(`/api/volunteer-tasks/submissions?programId=${programId}${qs}`);
      setSubmissions(data?.items || []);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    }
  };

  const loadProgress = async (programId) => {
    if (!programId) return;
    try {
      const data = await adminFetch(`/api/volunteer-tasks/programs/${programId}/progress`);
      setProgress(data?.items || []);
      setMissionValidationThreshold(data?.missionValidationThreshold ?? null);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    }
  };

  useEffect(() => { loadPrograms(); }, []);
  useEffect(() => {
    if (!selectedProgramId) return;
    loadSubmissions(selectedProgramId, submissionFilter);
    loadProgress(selectedProgramId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramId, submissionFilter]);

  const approve = async (id) => {
    try {
      await adminFetch(`/api/volunteer-tasks/submissions/${id}/accept`, { method: "PATCH", body: JSON.stringify({}) });
      loadSubmissions(selectedProgramId, submissionFilter);
      loadProgress(selectedProgramId);
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
      loadSubmissions(selectedProgramId, submissionFilter);
      loadProgress(selectedProgramId);
    } catch (err) {
      alert(err.message || "Erreur lors du rejet");
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "#dc2626" }}>{error}</p>;
  if (programs.length === 0) return <p>Aucun programme ne vous est affecté pour l'instant.</p>;

  const selectedProgram = programs.find((p) => p.programId === selectedProgramId);

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

      {selectedProgram && (selectedProgram.description || selectedProgram.location || selectedProgram.startDate || selectedProgram.endDate) && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, marginBottom: 20, background: "#fafafa" }}>
          {selectedProgram.description && <p style={{ margin: "0 0 6px", color: "#374151" }}>{selectedProgram.description}</p>}
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280" }}>
            {selectedProgram.location && <>📍 {selectedProgram.location}   </>}
            {selectedProgram.startDate && <>Début : {new Date(selectedProgram.startDate).toLocaleDateString("fr-FR")}   </>}
            {selectedProgram.endDate && <>Fin : {new Date(selectedProgram.endDate).toLocaleDateString("fr-FR")}</>}
          </p>
        </div>
      )}

      <h3>Progression par volontaire {missionValidationThreshold !== null && `(seuil de validation : ${missionValidationThreshold}%)`}</h3>
      {progress.length === 0 ? (
        <p style={{ color: "#666" }}>Aucun volontaire suivi pour l'instant.</p>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: 28 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
            <thead style={{ background: "#f3f4f6" }}>
              <tr>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Volontaire</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Progression</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Statut mission</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {progress.map((p) => (
                <tr key={p.volunteerId}>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                    {p.prenom} {p.nom}
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{p.email}</div>
                  </td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                    {p.progress.approved}/{p.progress.totalDue} ({p.progress.percent}%)
                  </td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                    <span style={badgeStyle(MISSION_STATUS_STYLE[p.statut])}>{p.statut}</span>
                  </td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                    <ReportVolunteerButton programId={selectedProgramId} volunteerId={p.volunteerId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Soumissions ({submissions.length})</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {SUBMISSION_FILTERS.map((f) => (
            <button key={f.value || "ALL"} onClick={() => setSubmissionFilter(f.value)}
              style={{
                border: "1px solid #d1d5db", borderRadius: 999, padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer",
                background: submissionFilter === f.value ? "#1B4332" : "#fff",
                color: submissionFilter === f.value ? "#fff" : "#374151",
                fontWeight: submissionFilter === f.value ? 700 : 400,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {submissions.length === 0 ? (
        <p style={{ color: "#666" }}>Aucune soumission pour ce filtre.</p>
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
                  <span style={{ marginLeft: 8 }}>
                    <span style={badgeStyle(SUBMISSION_STATUS_STYLE[s.status])}>{SUBMISSION_STATUS_LABELS[s.status]}</span>
                  </span>
                  {s.status !== "PENDING" && s.reviewedAt && (
                    <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 4 }}>
                      Traitée le {new Date(s.reviewedAt).toLocaleDateString("fr-FR")}
                      {s.status === "REJECTED" && s.reviewNote && <> — Motif : {s.reviewNote}</>}
                    </div>
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
                <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "flex-start" }}>
                  {s.status === "PENDING" && (
                    <>
                      <button onClick={() => approve(s._id)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>
                        Approuver
                      </button>
                      <button onClick={() => reject(s._id)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>
                        Rejeter
                      </button>
                    </>
                  )}
                  <ReportVolunteerButton programId={selectedProgramId} volunteerId={s.volunteerId} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
