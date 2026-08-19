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
import { useIsMobile } from "@/hooks/useIsMobile";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SUBMISSION_FILTERS = [
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvées" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "", label: "Toutes" },
];
const SUBMISSION_STATUS_LABELS = { PENDING: "En attente", APPROVED: "Approuvée", REJECTED: "Rejetée" };
// Couleurs en var(--sd-*) — définies plus bas dans le <style> du composant,
// avec une valeur différente en mode sombre (voir data-theme). Ces objets
// ne changent jamais eux-mêmes selon le thème : c'est le navigateur qui
// résout la variable CSS au bon moment.
const SUBMISSION_STATUS_STYLE = {
  PENDING: { background: "var(--sd-status-pending-bg)", color: "var(--sd-status-pending-text)" },
  APPROVED: { background: "var(--sd-status-approved-bg)", color: "var(--sd-status-approved-text)" },
  REJECTED: { background: "var(--sd-status-rejected-bg)", color: "var(--sd-status-rejected-text)" },
};
const MISSION_STATUS_STYLE = {
  "Mission validée": { background: "var(--sd-status-approved-bg)", color: "var(--sd-status-approved-text)" },
  "Refusé": { background: "var(--sd-status-rejected-bg)", color: "var(--sd-status-rejected-text)" },
  "Non disponible": { background: "var(--sd-status-neutral-bg)", color: "var(--sd-status-neutral-text)" },
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
    <div style={{ border: "1px solid var(--sd-border)", borderRadius: 8, padding: 12, maxWidth: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ minWidth: 0, flex: "1 1 260px", overflowWrap: "anywhere" }}>
          {!hideVolunteerName && <strong>{s.volunteerName}</strong>}
          <span style={{ color: hideVolunteerName ? "inherit" : "var(--sd-text-secondary)" }}>{hideVolunteerName ? s.taskTitle : ` — ${s.taskTitle}`}</span>
          {s.occurrenceDate && (
            <span style={{ fontSize: "0.75rem", color: "var(--sd-text-faint)", marginLeft: 8 }}>
              ({new Date(s.occurrenceDate).toLocaleDateString("fr-FR")})
            </span>
          )}
          <span style={{ marginLeft: 8 }}>
            <span style={badgeStyle(SUBMISSION_STATUS_STYLE[s.status])}>{SUBMISSION_STATUS_LABELS[s.status]}</span>
          </span>
          <div style={{ fontSize: "0.75rem", color: "var(--sd-text-faint)", marginTop: 4 }}>
            Publiée : {s.taskPublishedAt ? formatSmartTime(s.taskPublishedAt) : "—"}
            {" · "}
            Fermeture : {s.taskDueAt ? formatSmartTime(s.taskDueAt) : "Aucune"}
            {" · "}
            Soumise : {formatSmartTime(s.submittedAt)}
          </div>
          {s.status !== "PENDING" && s.reviewedAt && (
            <div style={{ fontSize: "0.75rem", color: "var(--sd-text-faint)", marginTop: 4 }}>
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
                      <a href={value} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>{value}</a>
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
  // Mode sombre/clair : un seul bouton partagé désormais dans l'en-tête
  // (GestionAMPLayout.astro, décision utilisateur 2026-08-19 — "au niveau
  // du header", tout l'espace Gestion) — ce composant lit juste
  // body[data-theme="dark"] via CSS (voir <style> plus bas), plus besoin
  // de son propre bouton/état local.
  const isMobile = useIsMobile();
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
          <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)}
            style={{
              background: "var(--sd-surface)", color: "var(--sd-text)", border: "1px solid var(--sd-border-strong)",
              borderRadius: 6, padding: "4px 8px",
              // Un titre de programme long ne doit jamais faire déborder la
              // page (signalé le 2026-08-19) — un <select> natif ne peut
              // pas envelopper le texte de l'option sélectionnée, donc on
              // le plafonne et on tronque avec "...".
              maxWidth: "22rem", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
            {programs.map((p) => (
              <option key={p.programId} value={p.programId}>{p.title} ({p.volunteerCount} volontaire(s))</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: 6, borderBottom: "2px solid var(--sd-border)", marginBottom: 20, flexWrap: "wrap" }}>
        {DASHBOARD_TABS.map((t) => (
          <button key={t.value} onClick={() => setActiveTab(t.value)}
            style={{
              border: "none", background: "none", cursor: "pointer", padding: "10px 16px", fontSize: "0.95rem",
              fontWeight: activeTab === t.value ? 700 : 500,
              color: activeTab === t.value ? "var(--sd-primary)" : "var(--sd-text-muted)",
              borderBottom: activeTab === t.value ? "3px solid var(--sd-primary)" : "3px solid transparent",
              marginBottom: -2,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div>
          {selectedProgram && (selectedProgram.description || selectedProgram.location || selectedProgram.startDate || selectedProgram.endDate) && (
            <div style={{ border: "1px solid var(--sd-border)", borderRadius: 8, padding: 12, marginBottom: 20, background: "var(--sd-surface-alt)" }}>
              {selectedProgram.description && <p style={{ margin: "0 0 6px", color: "var(--sd-text-strong)" }}>{selectedProgram.description}</p>}
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--sd-text-muted)" }}>
                {selectedProgram.location && <>📍 {selectedProgram.location}   </>}
                {selectedProgram.startDate && <>Début : {new Date(selectedProgram.startDate).toLocaleDateString("fr-FR")}   </>}
                {selectedProgram.endDate && <>Fin : {new Date(selectedProgram.endDate).toLocaleDateString("fr-FR")}</>}
              </p>
            </div>
          )}

          <div className="sd-stats" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ border: "1px solid var(--sd-border)", borderRadius: 8, padding: "14px 20px", minWidth: 140, flex: "1 1 140px" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sd-primary)" }}>{totalVolunteers}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--sd-text-muted)" }}>Volontaire(s) suivi(s)</div>
            </div>
            <div style={{ border: "1px solid var(--sd-border)", borderRadius: 8, padding: "14px 20px", minWidth: 140, flex: "1 1 140px" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sd-primary)" }}>{avgProgressPercent}%</div>
              <div style={{ fontSize: "0.8rem", color: "var(--sd-text-muted)" }}>Progression moyenne</div>
            </div>
            {MISSION_STATUSES.map((s) => (
              <div key={s} style={{ border: "1px solid var(--sd-border)", borderRadius: 8, padding: "14px 20px", minWidth: 140, flex: "1 1 140px" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--sd-primary)" }}>{missionStatusCounts[s]}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--sd-text-muted)" }}>{s}</div>
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
          <button onClick={exportProgressPdf} style={{ background: "var(--sd-primary-btn)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontWeight: 700, cursor: "pointer" }}>
            📄 Télécharger en PDF (A4 paysage)
          </button>
        )}
      </div>
      {progress.length === 0 ? (
        <p style={{ color: "var(--sd-text-secondary)" }}>Aucun volontaire suivi pour l'instant.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="🔍 Rechercher (nom, email, téléphone)..."
              value={progressSearch}
              onChange={(e) => setProgressSearch(e.target.value)}
              style={{ flex: "1 1 220px", border: "1px solid var(--sd-border-strong)", borderRadius: 6, padding: "6px 10px", background: "var(--sd-surface)", color: "var(--sd-text)" }}
            />
            <select value={progressGroupFilter} onChange={(e) => setProgressGroupFilter(e.target.value)}
              style={{ border: "1px solid var(--sd-border-strong)", borderRadius: 6, padding: "6px 10px", background: "var(--sd-surface)", color: "var(--sd-text)" }}>
              <option value="">Tous les groupes</option>
              {availableGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={progressStatutFilter} onChange={(e) => setProgressStatutFilter(e.target.value)}
              style={{ border: "1px solid var(--sd-border-strong)", borderRadius: 6, padding: "6px 10px", background: "var(--sd-surface)", color: "var(--sd-text)" }}>
              <option value="">Tous les statuts</option>
              {MISSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {filteredProgress.length === 0 ? (
            <p style={{ color: "var(--sd-text-secondary)" }}>Aucun volontaire ne correspond à ces critères.</p>
          ) : isMobile ? (
            // Cartes empilées sur mobile (décision utilisateur, 2026-08-18) —
            // un tableau à 8 colonnes est illisible sur petit écran, même
            // avec défilement horizontal.
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {pagedProgress.map((p) => (
                <div key={p.volunteerId} style={{ border: "1px solid var(--sd-border)", borderRadius: 8, padding: 12, maxWidth: "100%", overflowWrap: "anywhere" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: "var(--sd-text-muted)", marginRight: 6 }}>#{p.rank}</span>
                      <strong>{p.prenom} {p.nom}</strong>
                    </div>
                    <span style={badgeStyle(MISSION_STATUS_STYLE[p.statut])}>{p.statut}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--sd-text-secondary)", marginTop: 6 }}>
                    {p.telephone || "—"} · {p.email}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--sd-text-secondary)", marginTop: 2 }}>
                    Groupe : {p.groupNames && p.groupNames.length > 0 ? p.groupNames.join(", ") : "—"}
                  </div>
                  <div style={{ fontSize: "0.85rem", marginTop: 2 }}>
                    Progression : {p.progress.approved}/{p.progress.totalDue} ({p.progress.percent}%)
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ReportVolunteerButton programId={selectedProgramId} volunteerId={p.volunteerId} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
        <div style={{ overflowX: "auto", marginBottom: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid var(--sd-border)" }}>
            <thead style={{ background: "var(--sd-surface-alt)" }}>
              <tr>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid var(--sd-border)" }}>Rang</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid var(--sd-border)" }}>Nom</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid var(--sd-border)" }}>Téléphone</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid var(--sd-border)" }}>Email</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid var(--sd-border)" }}>Groupe</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid var(--sd-border)" }}>Progression</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid var(--sd-border)" }}>Statut mission</th>
                <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid var(--sd-border)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedProgress.map((p) => (
                <tr key={p.volunteerId}>
                  <td style={{ padding: "8px 12px", border: "1px solid var(--sd-border)", fontWeight: 700, color: "var(--sd-text-muted)" }}>{p.rank}</td>
                  <td style={{ padding: "8px 12px", border: "1px solid var(--sd-border)" }}>{p.prenom} {p.nom}</td>
                  <td style={{ padding: "8px 12px", border: "1px solid var(--sd-border)" }}>{p.telephone || "—"}</td>
                  <td style={{ padding: "8px 12px", border: "1px solid var(--sd-border)" }}>{p.email}</td>
                  <td style={{ padding: "8px 12px", border: "1px solid var(--sd-border)" }}>
                    {p.groupNames && p.groupNames.length > 0 ? p.groupNames.join(", ") : "—"}
                  </td>
                  <td style={{ padding: "8px 12px", border: "1px solid var(--sd-border)" }}>
                    {p.progress.approved}/{p.progress.totalDue} ({p.progress.percent}%)
                  </td>
                  <td style={{ padding: "8px 12px", border: "1px solid var(--sd-border)" }}>
                    <span style={badgeStyle(MISSION_STATUS_STYLE[p.statut])}>{p.statut}</span>
                  </td>
                  <td style={{ padding: "8px 12px", border: "1px solid var(--sd-border)" }}>
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
                style={{ border: "1px solid var(--sd-border-strong)", borderRadius: 6, padding: "4px 10px", cursor: progressPage <= 1 ? "not-allowed" : "pointer", opacity: progressPage <= 1 ? 0.5 : 1, background: "var(--sd-surface)", color: "var(--sd-text)" }}>
                ← Précédent
              </button>
              <span style={{ fontSize: "0.85rem", color: "var(--sd-text-muted)" }}>Page {progressPage} / {progressTotalPages} — {filteredProgress.length} volontaire(s)</span>
              <button onClick={() => setProgressPage((p) => Math.min(progressTotalPages, p + 1))} disabled={progressPage >= progressTotalPages}
                style={{ border: "1px solid var(--sd-border-strong)", borderRadius: 6, padding: "4px 10px", cursor: progressPage >= progressTotalPages ? "not-allowed" : "pointer", opacity: progressPage >= progressTotalPages ? 0.5 : 1, background: "var(--sd-surface)", color: "var(--sd-text)" }}>
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
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SUBMISSION_FILTERS.map((f) => (
            <button key={f.value || "ALL"} onClick={() => setSubmissionFilter(f.value)}
              style={{
                border: "1px solid var(--sd-border-strong)", borderRadius: 999, padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer",
                background: submissionFilter === f.value ? "var(--sd-primary-btn)" : "var(--sd-surface)",
                color: submissionFilter === f.value ? "#fff" : "var(--sd-text-strong)",
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
        style={{ width: "100%", border: "1px solid var(--sd-border-strong)", borderRadius: 6, padding: "6px 10px", marginBottom: 12, background: "var(--sd-surface)", color: "var(--sd-text)" }}
      />
      {submissions.length === 0 ? (
        <p style={{ color: "var(--sd-text-secondary)" }}>Aucune soumission pour ce filtre.</p>
      ) : searchedSubmissions.length === 0 ? (
        <p style={{ color: "var(--sd-text-secondary)" }}>Aucune soumission ne correspond à cette recherche.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pagedSubmissionEntries.map((entry) =>
              entry.type === "single" ? (
                <SubmissionCard key={entry.submission._id} s={entry.submission} onApprove={approve} onReject={reject} programId={selectedProgramId} />
              ) : (
                <div key={entry.volunteerId} style={{ border: "1px solid var(--sd-border)", borderRadius: 8 }}>
                  <button onClick={() => toggleVolunteerExpanded(entry.volunteerId)}
                    style={{
                      width: "100%", maxWidth: "100%", textAlign: "left", background: "var(--sd-surface-alt)", border: "none", borderRadius: 8,
                      padding: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                      color: "var(--sd-text)", flexWrap: "wrap",
                    }}>
                    <span style={{ minWidth: 0, flex: "1 1 200px", overflowWrap: "anywhere" }}>
                      <strong>{entry.volunteerName}</strong> <span style={{ color: "var(--sd-text-secondary)", fontSize: "0.85rem" }}>— {entry.subs.length} soumissions</span>
                    </span>
                    <span style={{ color: "var(--sd-text-muted)", flexShrink: 0 }}>{expandedVolunteerIds.has(entry.volunteerId) ? "▲" : "▼"}</span>
                  </button>
                  {expandedVolunteerIds.has(entry.volunteerId) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderTop: "1px solid var(--sd-border-light)" }}>
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
                style={{ border: "1px solid var(--sd-border-strong)", borderRadius: 6, padding: "4px 10px", cursor: submissionsPage <= 1 ? "not-allowed" : "pointer", opacity: submissionsPage <= 1 ? 0.5 : 1, background: "var(--sd-surface)", color: "var(--sd-text)" }}>
                ← Précédent
              </button>
              <span style={{ fontSize: "0.85rem", color: "var(--sd-text-muted)" }}>Page {submissionsPage} / {submissionsTotalPages} — {submissionEntries.length} entrée(s)</span>
              <button onClick={() => setSubmissionsPage((p) => Math.min(submissionsTotalPages, p + 1))} disabled={submissionsPage >= submissionsTotalPages}
                style={{ border: "1px solid var(--sd-border-strong)", borderRadius: 6, padding: "4px 10px", cursor: submissionsPage >= submissionsTotalPages ? "not-allowed" : "pointer", opacity: submissionsPage >= submissionsTotalPages ? 0.5 : 1, background: "var(--sd-surface)", color: "var(--sd-text)" }}>
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
      </div>
      )}

      <style>{`
        /* .dashboard-section (carte blanche avec padding/ombre, définie dans
           GestionAMPLayout.astro — partagée par TOUS les rôles) entoure ce
           composant sur CETTE page précise. On la neutralise ici plutôt que
           de toucher le layout partagé : cette règle ne vit que dans le
           <style> de SupervisorDashboard.jsx, donc n'existe dans le DOM que
           sur la page qui monte ce composant — zéro risque pour les autres
           tableaux de bord (ADMIN, EC, IS, PARTENAIRE) qui réutilisent la
           même classe sur leurs propres pages. Sans ça, la carte blanche
           restait visible comme un cadre clair autour du fond sombre
           (signalé le 2026-08-18).  */
        .dashboard-section { background: transparent; border: none; box-shadow: none; padding: 0; }
        /* Signalé le 2026-08-19 : le contenu passait bien en sombre mais pas
           le pied de page du site (amp-footer, GestionAMPLayout.astro) —
           il vit hors de l'arbre React, dans le layout partagé. Ciblé
           directement ici (jamais en redéfinissant les tokens var(--col-*)
           au niveau de body : .dashboard-header au-dessus de ce composant
           utilise ces mêmes tokens sur un fond qui, lui, reste clair — les
           redéfinir globalement l'aurait rendu illisible). amp-header,
           déjà un bandeau vert foncé fixe dans les deux thèmes, n'a besoin
           d'aucun changement. Cette règle ne vit que dans le <style> de
           SupervisorDashboard.jsx, donc sans effet sur les autres rôles. */
        body[data-theme="dark"] .amp-footer { background: #1E3226; color: #9CA89C; }
        .supervisor-dashboard {
          --sd-bg: transparent;
          --sd-surface: #ffffff;
          --sd-surface-alt: #f5f5f5;
          --sd-border: #e5e7eb;
          --sd-border-strong: #d1d5db;
          --sd-border-light: #eeeeee;
          --sd-text: #111827;
          --sd-text-strong: #374151;
          --sd-text-secondary: #666666;
          --sd-text-muted: #6b7280;
          --sd-text-faint: #888888;
          --sd-primary: #1B4332;
          --sd-primary-btn: #1B4332;
          --sd-status-pending-bg: #fef3c7;
          --sd-status-pending-text: #92400e;
          --sd-status-approved-bg: #dcfce7;
          --sd-status-approved-text: #15803d;
          --sd-status-rejected-bg: #fee2e2;
          --sd-status-rejected-text: #b91c1c;
          --sd-status-neutral-bg: #e5e7eb;
          --sd-status-neutral-text: #374151;
          background: var(--sd-bg);
          color: var(--sd-text);
          min-height: 100vh;
          transition: background 0.2s ease, color 0.2s ease;
          /* Échappe le padding de .amp-content (GestionAMPLayout.astro,
             partagé par tous les rôles — jamais modifié directement) pour
             que le fond de CETTE page aille jusqu'aux bords de la colonne
             1280px plutôt que de laisser un cadre clair visible en mode
             sombre (signalé le 2026-08-18). Marge négative = exactement le
             padding qu'on compense, avec le même padding repris à
             l'intérieur pour que le contenu garde la même position visuelle
             qu'avant. */
          margin: calc(-1 * var(--sp-8));
          width: calc(100% + 2 * var(--sp-8));
          padding: var(--sp-8);
          overflow-x: hidden; /* filet de sécurité — rien ne doit jamais faire défiler la page horizontalement */
        }
        /* Mode sombre — piloté par le bouton partagé de l'en-tête
           (GestionAMPLayout.astro, décision utilisateur 2026-08-19),
           jamais un état local à ce composant : body[data-theme="dark"]
           est posé par ce bouton, ce sélecteur ancêtre suffit. */
        body[data-theme="dark"] .supervisor-dashboard {
          --sd-bg: #0F1A14;
          --sd-surface: #16241C;
          --sd-surface-alt: #1E3226;
          --sd-border: #2A4234;
          --sd-border-strong: #3A5240;
          --sd-border-light: #22362A;
          --sd-text: #F0EDE6;
          --sd-text-strong: #F0EDE6;
          --sd-text-secondary: #C7C2B8;
          --sd-text-muted: #9CA89C;
          --sd-text-faint: #8F9A8F;
          --sd-primary: #74C69D;
          --sd-primary-btn: #2D6A4F;
          --sd-status-pending-bg: rgba(245, 158, 11, 0.18);
          --sd-status-pending-text: #fbbf24;
          --sd-status-approved-bg: rgba(34, 197, 94, 0.18);
          --sd-status-approved-text: #4ade80;
          --sd-status-rejected-bg: rgba(239, 68, 68, 0.18);
          --sd-status-rejected-text: #f87171;
          --sd-status-neutral-bg: rgba(255, 255, 255, 0.08);
          --sd-status-neutral-text: #C7C2B8;
        }

        /* 100% responsive mobile (décision utilisateur, 2026-08-18) */
        @media (max-width: 640px) {
          .supervisor-dashboard .sd-stats > div { flex: 1 1 45% !important; min-width: 0 !important; }
        }
        /* Signalé le 2026-08-19 ("le problème... déborde toujours la page") :
           l'échappement du padding de .amp-content ci-dessus est calibré sur
           --sp-8, mais .amp-content lui-même réduit son padding à --sp-4 en
           dessous de 720px (GestionAMPLayout.astro, même seuil repris ici à
           l'identique). Sans ce correctif, la marge négative de
           .supervisor-dashboard "surcompensait" un padding qui n'était plus
           là, et débordait la page d'exactement --sp-8 - --sp-4 de chaque
           côté — un débordement fixe, présent sur TOUTE soumission sur
           mobile (pas seulement les noms longs, qui ne faisaient que le
           rendre visible/gênant). */
        @media (max-width: 720px) {
          .supervisor-dashboard {
            margin: calc(-1 * var(--sp-4));
            width: calc(100% + 2 * var(--sp-4));
            padding: var(--sp-4);
          }
        }
      `}</style>
    </div>
  );
}
