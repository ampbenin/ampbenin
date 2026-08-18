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
//
// Enrichi à nouveau le 2026-08-17 (même jour) : la table "Progression par
// volontaire" gagne téléphone/email/groupe — "il faut que le superviseur
// ait les informations nécessaires des volontaires qui sont sur lui".
// Le nom du groupe vient de VolunteerApplicationGroup, résolu côté backend
// via la candidature du volontaire pour ce programme (aucun lien direct
// groupe → volontaire, uniquement groupe → candidature).
//
// Enrichi une 3e fois le 2026-08-17 : classement des volontaires par
// progression (du meilleur au moins avancé) + export PDF A4 paysage de la
// table, même besoin appliqué en parallèle sur les espaces ADMIN
// (VolunteerProgramEditor.jsx) et PARTENAIRE (PartnerDashboard.jsx).
// jsPDF + jspdf-autotable déjà utilisés dans ce projet (voir
// VolunteersManager.jsx#exportPDF) — repris tel quel, juste en orientation
// paysage ({ orientation: "landscape" }).
//
// Enrichi une 4e fois le 2026-08-17 : recherche + filtre par groupe +
// filtre par statut de mission + pagination sur la table "Progression par
// volontaire" — tout calculé côté client (décision utilisateur), les
// données sont déjà toutes chargées en un seul appel. Le rang (#1, #2...)
// reste calculé sur la liste COMPLÈTE avant filtrage, pour ne jamais se
// renuméroter selon ce qui est affiché — un volontaire filtré garde le
// même rang qu'il aurait sans filtre. L'export PDF suit la recherche/les
// filtres actifs (comme VolunteersManager.jsx#exportPDF exporte déjà
// filteredVolunteers, pas juste la page affichée).
import { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";
import ReportVolunteerButton from "@/components/admin/ReportVolunteerButton.jsx";
import { formatSmartTime } from "@/utils/formatSmartTime.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
const MISSION_STATUSES = ["Non disponible", "Mission validée", "Refusé"];
const PROGRESS_PAGE_SIZE = 10;

// Rubriques du tableau de bord (décision utilisateur, 2026-08-18) — onglets
// horizontaux, même esprit que les filtres de soumissions déjà en place.
const DASHBOARD_TABS = [
  { value: "overview", label: "Vue d'ensemble" },
  { value: "progress", label: "Progression par volontaire" },
  { value: "submissions", label: "Soumissions" },
];
const SUBMISSIONS_PAGE_SIZE = 10;

// Carte d'une soumission — extraite pour être réutilisée telle quelle en
// affichage direct (volontaire avec 1 seule soumission sur le filtre actif)
// et à l'intérieur d'un groupe déplié (volontaire avec 2+ soumissions,
// décision utilisateur 2026-08-18 : "si au moins 2 tâches sont au nom d'un
// même volontaire, on affiche le nom du volontaire" plutôt que de tout
// mélanger). hideVolunteerName évite de répéter le nom déjà affiché comme
// en-tête du groupe.
function SubmissionCard({ s, onApprove, onReject, programId, hideVolunteerName = false }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          {!hideVolunteerName && <strong>{s.volunteerName}</strong>}
          <span style={{ color: hideVolunteerName ? "inherit" : "#666" }}>{hideVolunteerName ? s.taskTitle : ` — ${s.taskTitle}`}</span>
          {s.occurrenceDate && (
            <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: 8 }}>
              ({new Date(s.occurrenceDate).toLocaleDateString("fr-FR")})
            </span>
          )}
          <span style={{ marginLeft: 8 }}>
            <span style={badgeStyle(SUBMISSION_STATUS_STYLE[s.status])}>{SUBMISSION_STATUS_LABELS[s.status]}</span>
          </span>
          <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 4 }}>
            Publiée : {s.taskPublishedAt ? formatSmartTime(s.taskPublishedAt) : "—"}
            {" · "}
            Fermeture : {s.taskDueAt ? formatSmartTime(s.taskDueAt) : "Aucune"}
            {" · "}
            Soumise : {formatSmartTime(s.submittedAt)}
          </div>
          {s.status !== "PENDING" && s.reviewedAt && (
            <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 4 }}>
              {s.status === "APPROVED" ? "Approuvée" : "Rejetée"} {formatSmartTime(s.reviewedAt)}
              {s.reviewerName && <> par <strong>{s.reviewerName}</strong></>}
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
              <button onClick={() => onApprove(s._id)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>
                Approuver
              </button>
              <button onClick={() => onReject(s._id)} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>
                Rejeter
              </button>
            </>
          )}
          <ReportVolunteerButton programId={programId} volunteerId={s.volunteerId} />
        </div>
      </div>
    </div>
  );
}

export default function SupervisorDashboard() {
  // Vrai tableau de bord à onglets (décision utilisateur, 2026-08-18) — la
  // page empilait jusqu'ici tout (infos programme, progression, soumissions)
  // sans séparation. "overview" par défaut, convention dashboard classique.
  const [activeTab, setActiveTab] = useState("overview");
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [submissionFilter, setSubmissionFilter] = useState("PENDING");
  // Regroupement par volontaire + pagination + recherche de la liste
  // "Soumissions" (décision utilisateur, 2026-08-18).
  const [submissionsSearch, setSubmissionsSearch] = useState("");
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [expandedVolunteerIds, setExpandedVolunteerIds] = useState(new Set());
  const [progress, setProgress] = useState([]);
  const [missionValidationThreshold, setMissionValidationThreshold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Recherche/filtres/pagination de la table "Progression par volontaire".
  const [progressSearch, setProgressSearch] = useState("");
  const [progressGroupFilter, setProgressGroupFilter] = useState("");
  const [progressStatutFilter, setProgressStatutFilter] = useState("");
  const [progressPage, setProgressPage] = useState(1);

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
    setProgressSearch("");
    setProgressGroupFilter("");
    setProgressStatutFilter("");
    setProgressPage(1);
    setSubmissionsSearch("");
    setSubmissionsPage(1);
    setExpandedVolunteerIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramId, submissionFilter]);
  // Revient à la page 1 dès qu'un filtre change, sinon on peut se retrouver
  // sur une page qui n'existe plus une fois le résultat rétréci.
  useEffect(() => { setProgressPage(1); }, [progressSearch, progressGroupFilter, progressStatutFilter]);
  useEffect(() => { setSubmissionsPage(1); }, [submissionsSearch]);

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
  // Classement du meilleur au moins avancé, sur la liste COMPLÈTE — le rang
  // (p.rank) ne change jamais selon les filtres actifs ensuite, seule la
  // liste affichée/paginée se rétrécit.
  const rankedProgress = [...progress]
    .sort((a, b) => b.progress.percent - a.progress.percent)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const availableGroups = [...new Set(rankedProgress.flatMap((p) => p.groupNames || []))].sort((a, b) => a.localeCompare(b));

  const filteredProgress = rankedProgress.filter((p) => {
    const q = progressSearch.trim().toLowerCase();
    const matchesSearch = !q || `${p.prenom} ${p.nom} ${p.email} ${p.telephone || ""}`.toLowerCase().includes(q);
    const matchesGroup = !progressGroupFilter || (p.groupNames || []).includes(progressGroupFilter);
    const matchesStatut = !progressStatutFilter || p.statut === progressStatutFilter;
    return matchesSearch && matchesGroup && matchesStatut;
  });
  const progressTotalPages = Math.max(1, Math.ceil(filteredProgress.length / PROGRESS_PAGE_SIZE));
  const pagedProgress = filteredProgress.slice((progressPage - 1) * PROGRESS_PAGE_SIZE, progressPage * PROGRESS_PAGE_SIZE);

  // Exporte ce qui correspond à la recherche/aux filtres actifs (comme
  // VolunteersManager.jsx#exportPDF exporte filteredVolunteers), pas
  // seulement la page actuellement affichée.
  const exportProgressPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const title = selectedProgram?.title || "Programme";
    doc.text(`Progression par volontaire — ${title}`, 14, 14);
    autoTable(doc, {
      head: [["Rang", "Nom", "Téléphone", "Email", "Groupe", "Progression", "Statut mission"]],
      body: filteredProgress.map((p) => [
        p.rank,
        `${p.prenom} ${p.nom}`,
        p.telephone || "-",
        p.email,
        p.groupNames && p.groupNames.length > 0 ? p.groupNames.join(", ") : "-",
        `${p.progress.approved}/${p.progress.totalDue} (${p.progress.percent}%)`,
        p.statut,
      ]),
      startY: 20,
    });
    doc.save(`progression-${title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-")}.pdf`);
  };

  // Petites statistiques d'ensemble — donnent du contenu à l'onglet "Vue
  // d'ensemble" même quand le programme n'a pas de description, à partir
  // des données déjà chargées (aucun appel réseau supplémentaire).
  const totalVolunteers = progress.length;
  const missionStatusCounts = MISSION_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
  progress.forEach((p) => { missionStatusCounts[p.statut] = (missionStatusCounts[p.statut] || 0) + 1; });
  const avgProgressPercent = totalVolunteers > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.progress.percent, 0) / totalVolunteers)
    : 0;

  // Regroupe les soumissions (déjà filtrées par statut) par volontaire —
  // 2+ soumissions du même volontaire => repliées sous son nom ; 1 seule
  // => affichée directement, comme avant (décision utilisateur, 2026-08-18).
  // Recherche par volontaire ou tâche (décision utilisateur, 2026-08-18) —
  // appliquée AVANT le regroupement : un volontaire dont une seule
  // soumission correspond à la recherche peut ainsi passer de "groupé" à
  // "carte isolée", cohérent avec la règle "2+ => groupé".
  const submissionsSearchQuery = submissionsSearch.trim().toLowerCase();
  const searchedSubmissions = submissionsSearchQuery
    ? submissions.filter((s) =>
        (s.volunteerName || "").toLowerCase().includes(submissionsSearchQuery) ||
        (s.taskTitle || "").toLowerCase().includes(submissionsSearchQuery)
      )
    : submissions;

  const submissionsByVolunteer = new Map();
  searchedSubmissions.forEach((s) => {
    const key = String(s.volunteerId);
    if (!submissionsByVolunteer.has(key)) submissionsByVolunteer.set(key, []);
    submissionsByVolunteer.get(key).push(s);
  });
  const submissionEntries = [...submissionsByVolunteer.entries()]
    .map(([volunteerId, subs]) => {
      const latest = Math.max(...subs.map((s) => new Date(s.submittedAt).getTime()));
      return subs.length >= 2
        ? { type: "group", volunteerId, volunteerName: subs[0].volunteerName, subs, latest }
        : { type: "single", submission: subs[0], latest };
    })
    .sort((a, b) => b.latest - a.latest);
  const submissionsTotalPages = Math.max(1, Math.ceil(submissionEntries.length / SUBMISSIONS_PAGE_SIZE));
  const pagedSubmissionEntries = submissionEntries.slice(
    (submissionsPage - 1) * SUBMISSIONS_PAGE_SIZE, submissionsPage * SUBMISSIONS_PAGE_SIZE
  );
  const toggleVolunteerExpanded = (volunteerId) => {
    setExpandedVolunteerIds((prev) => {
      const next = new Set(prev);
      if (next.has(volunteerId)) next.delete(volunteerId); else next.add(volunteerId);
      return next;
    });
  };

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

      <div style={{ display: "flex", gap: 6, borderBottom: "2px solid #e5e7eb", marginBottom: 20, flexWrap: "wrap" }}>
        {DASHBOARD_TABS.map((t) => (
          <button key={t.value} onClick={() => setActiveTab(t.value)}
            style={{
              border: "none", background: "none", cursor: "pointer", padding: "10px 16px", fontSize: "0.95rem",
              fontWeight: activeTab === t.value ? 700 : 500,
              color: activeTab === t.value ? "#1B4332" : "#6b7280",
              borderBottom: activeTab === t.value ? "3px solid #1B4332" : "3px solid transparent",
              marginBottom: -2,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div>
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

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 20px", minWidth: 140 }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1B4332" }}>{totalVolunteers}</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Volontaire(s) suivi(s)</div>
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 20px", minWidth: 140 }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1B4332" }}>{avgProgressPercent}%</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>Progression moyenne</div>
            </div>
            {MISSION_STATUSES.map((s) => (
              <div key={s} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 20px", minWidth: 140 }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1B4332" }}>{missionStatusCounts[s]}</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "progress" && (
      <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Progression par volontaire {missionValidationThreshold !== null && `(seuil de validation : ${missionValidationThreshold}%)`}</h3>
        {progress.length > 0 && (
          <button onClick={exportProgressPdf} style={{ background: "#1B4332", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 700, cursor: "pointer" }}>
            📄 Télécharger en PDF (A4 paysage)
          </button>
        )}
      </div>
      {progress.length === 0 ? (
        <p style={{ color: "#666" }}>Aucun volontaire suivi pour l'instant.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="🔍 Rechercher (nom, email, téléphone)..."
              value={progressSearch}
              onChange={(e) => setProgressSearch(e.target.value)}
              style={{ flex: "1 1 220px", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px" }}
            />
            <select value={progressGroupFilter} onChange={(e) => setProgressGroupFilter(e.target.value)}
              style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px" }}>
              <option value="">Tous les groupes</option>
              {availableGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={progressStatutFilter} onChange={(e) => setProgressStatutFilter(e.target.value)}
              style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px" }}>
              <option value="">Tous les statuts</option>
              {MISSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {filteredProgress.length === 0 ? (
            <p style={{ color: "#666" }}>Aucun volontaire ne correspond à ces critères.</p>
          ) : (
        <div style={{ overflowX: "auto", marginBottom: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
            <thead style={{ background: "#f3f4f6" }}>
              <tr>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Rang</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Nom</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Téléphone</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Email</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Groupe</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Progression</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Statut mission</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #e5e7eb" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedProgress.map((p) => (
                <tr key={p.volunteerId}>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e7eb", fontWeight: 700, color: "#6b7280" }}>{p.rank}</td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e7eb" }}>{p.prenom} {p.nom}</td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e7eb" }}>{p.telephone || "—"}</td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e7eb" }}>{p.email}</td>
                  <td style={{ padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                    {p.groupNames && p.groupNames.length > 0 ? p.groupNames.join(", ") : "—"}
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

          {filteredProgress.length > PROGRESS_PAGE_SIZE && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
              <button onClick={() => setProgressPage((p) => Math.max(1, p - 1))} disabled={progressPage <= 1}
                style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 10px", cursor: progressPage <= 1 ? "not-allowed" : "pointer", opacity: progressPage <= 1 ? 0.5 : 1 }}>
                ← Précédent
              </button>
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Page {progressPage} / {progressTotalPages} — {filteredProgress.length} volontaire(s)</span>
              <button onClick={() => setProgressPage((p) => Math.min(progressTotalPages, p + 1))} disabled={progressPage >= progressTotalPages}
                style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 10px", cursor: progressPage >= progressTotalPages ? "not-allowed" : "pointer", opacity: progressPage >= progressTotalPages ? 0.5 : 1 }}>
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
      </div>
      )}

      {activeTab === "submissions" && (
      <div>
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
      <input
        type="text"
        placeholder="🔍 Rechercher un volontaire ou une tâche..."
        value={submissionsSearch}
        onChange={(e) => setSubmissionsSearch(e.target.value)}
        style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px", marginBottom: 12 }}
      />
      {submissions.length === 0 ? (
        <p style={{ color: "#666" }}>Aucune soumission pour ce filtre.</p>
      ) : searchedSubmissions.length === 0 ? (
        <p style={{ color: "#666" }}>Aucune soumission ne correspond à cette recherche.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pagedSubmissionEntries.map((entry) =>
              entry.type === "single" ? (
                <SubmissionCard key={entry.submission._id} s={entry.submission} onApprove={approve} onReject={reject} programId={selectedProgramId} />
              ) : (
                <div key={entry.volunteerId} style={{ border: "1px solid #ddd", borderRadius: 8 }}>
                  <button onClick={() => toggleVolunteerExpanded(entry.volunteerId)}
                    style={{
                      width: "100%", textAlign: "left", background: "#f9fafb", border: "none", borderRadius: 8,
                      padding: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                    <span><strong>{entry.volunteerName}</strong> <span style={{ color: "#666", fontSize: "0.85rem" }}>— {entry.subs.length} soumissions</span></span>
                    <span style={{ color: "#6b7280" }}>{expandedVolunteerIds.has(entry.volunteerId) ? "▲" : "▼"}</span>
                  </button>
                  {expandedVolunteerIds.has(entry.volunteerId) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderTop: "1px solid #eee" }}>
                      {entry.subs.map((s) => (
                        <SubmissionCard key={s._id} s={s} onApprove={approve} onReject={reject} programId={selectedProgramId} hideVolunteerName />
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {submissionEntries.length > SUBMISSIONS_PAGE_SIZE && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <button onClick={() => setSubmissionsPage((p) => Math.max(1, p - 1))} disabled={submissionsPage <= 1}
                style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 10px", cursor: submissionsPage <= 1 ? "not-allowed" : "pointer", opacity: submissionsPage <= 1 ? 0.5 : 1 }}>
                ← Précédent
              </button>
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Page {submissionsPage} / {submissionsTotalPages} — {submissionEntries.length} entrée(s)</span>
              <button onClick={() => setSubmissionsPage((p) => Math.min(submissionsTotalPages, p + 1))} disabled={submissionsPage >= submissionsTotalPages}
                style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 10px", cursor: submissionsPage >= submissionsTotalPages ? "not-allowed" : "pointer", opacity: submissionsPage >= submissionsTotalPages ? 0.5 : 1 }}>
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
      </div>
      )}
    </div>
  );
}
