// src/components/admin/VolunteerProgramEditor.jsx
// Gestion détaillée d'un programme de volontariat : informations générales,
// constructeur de formulaire de candidature (champs conditionnels
// réordonnables, import/export de modèles), et file de candidatures.
// Port de numsal-site/src/components/formateur/CourseEditor.jsx, adapté au
// style Tailwind de ce site et à l'absence de "leçons"/"progression"
// (concepts propres à NumSAL, sans équivalent pour un programme de
// volontariat).
import React, { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";
import ReportVolunteerButton from "./ReportVolunteerButton.jsx";
import { findBlacklistMatch, BlacklistBadge } from "./BlacklistWarning.jsx";
import { formatSmartTime } from "@/utils/formatSmartTime.js";
import TruncatedDescription from "@/components/shared/TruncatedDescription.jsx";
// jsPDF + jspdf-autotable déjà utilisés dans ce projet (voir
// VolunteersManager.jsx#exportPDF) — réutilisés ici pour l'export "Progression
// par volontaire" en A4 paysage (décision utilisateur, 2026-08-17, appliquée
// en parallèle sur les espaces SUPERVISEUR et PARTENAIRE).
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = import.meta.env.PUBLIC_API_BASE || "";

// Filtre de statut des soumissions (onglet Suivi) — même mécanisme que
// SupervisorDashboard.jsx.
const SUBMISSION_FILTERS = [
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvées" },
  { value: "REJECTED", label: "Rejetées" },
  { value: "", label: "Toutes" },
];
const SUBMISSION_STATUS_LABELS = { PENDING: "En attente", APPROVED: "Approuvée", REJECTED: "Rejetée" };
const SUBMISSION_STATUS_CLASSES = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const FIELD_TYPES = [
  { value: "TEXT", label: "Texte court" },
  { value: "TEXTAREA", label: "Texte long" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Téléphone" },
  { value: "NUMBER", label: "Nombre" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Choix (liste déroulante)" },
  { value: "CHECKBOX", label: "Case à cocher" },
];

// Types dédiés au formulaire de preuve d'une tâche — volontairement
// DISTINCT de FIELD_TYPES (formulaire de candidature) : URL/IMAGE
// n'apparaissent jamais comme option dans le constructeur de candidature,
// que l'assistant candidat (VolunteerApplicationForm.jsx) ne sait pas rendre.
const PROOF_FIELD_TYPES = [
  ...FIELD_TYPES,
  { value: "URL", label: "URL (avec aperçu du lien)" },
  { value: "IMAGE", label: "Image (upload)" },
];

const CONDITIONAL_TRIGGER_TYPES = ["SELECT", "CHECKBOX"];
const APPLICANT_FIELD_IDS = ["applicantFirstName", "applicantLastName", "applicantEmail", "applicantPhone"];
const APPLICATION_STATUS_LABELS = { PENDING: "En attente", ACCEPTED: "Acceptée", REJECTED: "Rejetée" };
const RECURRENCE_LABELS = { ONCE: "Une fois", DAILY: "Quotidienne", WEEKLY: "Hebdomadaire" };
const emptyTaskForm = { title: "", description: "", recurrence: "ONCE", status: "PUBLISHED", scheduledPublishAt: "", dueAt: "", proofFields: [] };
const TASK_STATUS_LABELS = { DRAFT: "Brouillon", SCHEDULED: "Programmée", PUBLISHED: "Publiée" };

// <input type="datetime-local"> attend "AAAA-MM-JJTHH:mm" en heure LOCALE
// (sans info de fuseau) — toISOString() renverrait l'heure UTC affichée à
// tort comme locale (décalage d'1h pour le Bénin/UTC+1). Getters locaux ici.
function toDatetimeLocalValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const emptyProofFieldForm = {
  label: "", type: "TEXTAREA", required: true, optionsText: "",
  minLength: "", maxLength: "", pattern: "", min: "", max: "", maxImages: "",
  conditionalFieldId: "", conditionalValues: [],
};

const canMoveFieldUp = (fields, index) =>
  index > 0 && fields[index].conditional?.fieldId !== fields[index - 1].id;
const canMoveFieldDown = (fields, index) =>
  index < fields.length - 1 && fields[index + 1].conditional?.fieldId !== fields[index].id;

const getFieldDepth = (field, fieldsById, guard = new Set()) => {
  const parentId = field.conditional?.fieldId;
  if (!parentId || guard.has(field.id)) return 0;
  const parent = fieldsById.get(parentId);
  if (!parent) return 0;
  guard.add(field.id);
  return 1 + getFieldDepth(parent, fieldsById, guard);
};

const formatResponseValue = (field, value) => {
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "CHECKBOX") return value ? "Oui" : "Non";
  return String(value);
};

const ACTIVITY_ACTION_LABELS = {
  LOGIN: "Connexion",
  OPEN_DASHBOARD: "Ouverture dashboard",
  VIEW_STATS: "Consultation stats",
  VIEW_APPLICATIONS: "Consultation candidatures",
  DOWNLOAD_REPORT: "Téléchargement PDF",
  UPLOAD_LOGO: "Changement logo",
  POST_COMMENT: "Commentaire envoyé",
};

function formatRelativeActivity(dateStr) {
  if (!dateStr) return "Jamais connecté";
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

const emptyFieldForm = {
  id: "", label: "", type: "TEXT", required: false, optionsText: "",
  minLength: "", maxLength: "", pattern: "", min: "", max: "",
  conditionalFieldId: "", conditionalValues: [],
};

const TABS = [
  { value: "info", label: "Informations", icon: "ℹ️" },
  { value: "form", label: "Formulaire de candidature", icon: "📝" },
  { value: "tasks", label: "Tâches", icon: "✅" },
  { value: "applications", label: "Candidatures", icon: "📥" },
  { value: "tracking", label: "Suivi des tâches", icon: "📊" },
  { value: "partners", label: "Partenaires", icon: "🤝" },
];

const SUBMISSIONS_PAGE_SIZE = 10;

// Carte d'une soumission — extraite pour être réutilisée telle quelle en
// affichage direct (volontaire avec 1 seule soumission sur le filtre actif)
// et à l'intérieur d'un groupe déplié (volontaire avec 2+ soumissions,
// décision utilisateur 2026-08-18 : "si au moins 2 tâches sont au nom d'un
// même volontaire, on affiche le nom du volontaire" plutôt que de tout
// mélanger). hideVolunteerName évite de répéter le nom déjà affiché comme
// en-tête du groupe.
function SubmissionCard({ s, onApprove, onReject, hideVolunteerName = false }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          {!hideVolunteerName && <strong>{s.volunteerName}</strong>}
          <span className="text-sm text-gray-600">{hideVolunteerName ? s.taskTitle : ` — ${s.taskTitle}`}</span>
          {s.occurrenceDate && (
            <span className="text-xs text-gray-500 ml-2">
              ({new Date(s.occurrenceDate).toLocaleDateString("fr-FR")})
            </span>
          )}
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${SUBMISSION_STATUS_CLASSES[s.status]}`}>
            {SUBMISSION_STATUS_LABELS[s.status]}
          </span>
          <div className="text-xs text-gray-500 mt-0.5">
            Groupe : {s.groupNames && s.groupNames.length > 0 ? s.groupNames.join(", ") : "—"}
            {" · "}
            Superviseur : {s.supervisorNames && s.supervisorNames.length > 0 ? s.supervisorNames.join(", ") : "—"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Publiée : {s.taskPublishedAt ? formatSmartTime(s.taskPublishedAt) : "—"}
            {" · "}
            Fermeture : {s.taskDueAt ? formatSmartTime(s.taskDueAt) : "Aucune"}
            {" · "}
            Soumise : {formatSmartTime(s.submittedAt)}
          </div>
          {s.status !== "PENDING" && s.reviewedAt && (
            <div className="text-xs text-gray-500 mt-1">
              {s.status === "APPROVED" ? "Approuvée" : "Rejetée"} {formatSmartTime(s.reviewedAt)}
              {s.reviewerName && <> par <strong>{s.reviewerName}</strong></>}
              {s.status === "REJECTED" && s.reviewNote && <> — Motif : {s.reviewNote}</>}
            </div>
          )}
          <dl className="text-sm mt-1 space-y-1">
            {(s.proofFields || []).map((f) => {
              const value = s.responses?.[f.id];
              if (value === undefined || value === null || value === "" ||
                (Array.isArray(value) && value.length === 0)) return null;
              return (
                <div key={f.id}>
                  <dt className="inline font-semibold text-gray-700">{f.label} : </dt>
                  <dd className="inline text-gray-700">
                    {f.type === "URL" ? (
                      <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{value}</a>
                    ) : f.type === "IMAGE" ? (
                      <span className="inline-flex gap-2 flex-wrap align-middle">
                        {value.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" className="h-14 w-14 object-cover rounded-lg border border-gray-200" />
                          </a>
                        ))}
                      </span>
                    ) : f.type === "CHECKBOX" ? (value ? "Oui" : "Non") : (
                      <span className="whitespace-pre-line">{String(value)}</span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
        {s.status === "PENDING" && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onApprove(s._id)}
              className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-green-700">
              Approuver
            </button>
            <button onClick={() => onReject(s._id)}
              className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-red-700">
              Rejeter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VolunteerProgramEditor({ programId, onBack }) {
  const [activeTab, setActiveTab] = useState("info");
  const [program, setProgram] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Onglet Candidatures : pagination serveur (10/page), recherche, filtres,
  // sélection multiple (scopée à la page affichée) — voir loadApplications().
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [applicationsTotalPages, setApplicationsTotalPages] = useState(1);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationFilters, setApplicationFilters] = useState({ status: "", dateFrom: "", dateTo: "" });
  const [applicationSearch, setApplicationSearch] = useState("");
  const [fieldFilterValues, setFieldFilterValues] = useState({});
  const [showApplicationFiltersMenu, setShowApplicationFiltersMenu] = useState(false);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);

  // Groupes de candidatures (organisation + raccourci d'affectation de
  // superviseur) — voir loadApplicationGroups().
  const [applicationGroups, setApplicationGroups] = useState([]);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedExistingGroupId, setSelectedExistingGroupId] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  // Liste noire des volontaires bannis — chargée une fois, croisée côté
  // client (voir BlacklistWarning.jsx) sur les candidatures affichées.
  const [blacklist, setBlacklist] = useState([]);

  const [meta, setMeta] = useState({
    title: "", description: "", coverImageUrl: "", location: "", startDate: "", endDate: "",
    capacity: "", accessMode: "APPLICATION", applicationDeadline: "",
    status: "DRAFT", brandColor: "", contactWhatsapp: "", contactEmail: "",
    admissionInstructions: "", missionValidationThreshold: 100,
  });
  const [copied, setCopied] = useState(false);

  const [formFields, setFormFields] = useState([]);
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [fieldForm, setFieldForm] = useState(emptyFieldForm);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [formTemplates, setFormTemplates] = useState([]);
  const [importTemplateId, setImportTemplateId] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [proofFieldForm, setProofFieldForm] = useState(emptyProofFieldForm);
  const [editingProofFieldIndex, setEditingProofFieldIndex] = useState(null);
  const [programProgress, setProgramProgress] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  // Filtre de statut des soumissions (onglet Suivi) — PENDING par défaut
  // (comportement historique), mais on peut aussi voir Approuvées/Rejetées/
  // Toutes : jusqu'ici une soumission traitée disparaissait purement et
  // simplement de la vue, aucun moyen de retrouver les preuves déjà
  // examinées. Même mécanisme que SupervisorDashboard.jsx#submissionFilter.
  const [submissionFilter, setSubmissionFilter] = useState("PENDING");
  // Regroupement par volontaire + pagination de la liste "Soumissions"
  // (décision utilisateur, 2026-08-18).
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [expandedVolunteerIds, setExpandedVolunteerIds] = useState(new Set());
  // Recherche/filtres/pagination de "Progression par volontaire" (onglet
  // Suivi des tâches) — tout calculé côté client, comme sur SupervisorDashboard.jsx.
  const [progressSearch, setProgressSearch] = useState("");
  const [progressGroupFilter, setProgressGroupFilter] = useState("");
  const [progressStatutFilter, setProgressStatutFilter] = useState("");
  const [progressPage, setProgressPage] = useState(1);

  const [staffUsers, setStaffUsers] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [selectedSupervisedVolunteerIds, setSelectedSupervisedVolunteerIds] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  // Affectation EDITOR — réservée ADMIN (voir toggleEditorAccess) : un
  // EDITOR affecté obtient exactement les mêmes pouvoirs qu'un ADMIN sur ce
  // programme (routes/volunteerProgramRoute.js#/:id/editors, ADMIN uniquement).
  const [selectedEditorId, setSelectedEditorId] = useState("");
  const currentRole = typeof window !== "undefined" ? localStorage.getItem("amp_role") : null;
  const [partnerComments, setPartnerComments] = useState([]);
  const [partnerActivity, setPartnerActivity] = useState([]);
  const [expandedActivityPartnerId, setExpandedActivityPartnerId] = useState(null);
  const [partnerActivityTimeline, setPartnerActivityTimeline] = useState([]);
  const [uploadingPartnersBar, setUploadingPartnersBar] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminFetch(`/api/volunteer-programs/${programId}`);
      setProgram(data);
      setMeta({
        title: data.title || "",
        description: data.description || "",
        coverImageUrl: data.coverImageUrl || "",
        location: data.location || "",
        startDate: data.startDate ? data.startDate.slice(0, 10) : "",
        endDate: data.endDate ? data.endDate.slice(0, 10) : "",
        capacity: data.capacity ?? "",
        accessMode: data.accessMode || "APPLICATION",
        applicationDeadline: data.applicationDeadline ? data.applicationDeadline.slice(0, 10) : "",
        status: data.status || "DRAFT",
        brandColor: data.brandColor || "",
        contactWhatsapp: data.contactWhatsapp || "",
        contactEmail: data.contactEmail || "",
        admissionInstructions: data.admissionInstructions || "",
        missionValidationThreshold: data.missionValidationThreshold ?? 100,
      });
      setFormFields(data.applicationForm?.fields || []);
      setEstimatedDuration(data.applicationForm?.estimatedDuration || "");
      setTasks(data.tasks || []);

      const templates = await adminFetch("/api/volunteer-form-templates");
      setFormTemplates(templates?.items || []);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  // Candidatures : paginées côté serveur, chargées séparément de load()
  // (déclenché à l'activation de l'onglet et à chaque changement de
  // page/filtre/recherche — voir le useEffect dédié plus bas).
  const loadApplications = async (page = 1) => {
    setApplicationsLoading(true);
    try {
      const params = new URLSearchParams({ programId, page: String(page), limit: "10" });
      if (applicationFilters.status) params.set("status", applicationFilters.status);
      if (applicationFilters.dateFrom) params.set("dateFrom", applicationFilters.dateFrom);
      if (applicationFilters.dateTo) params.set("dateTo", applicationFilters.dateTo);
      if (applicationSearch.trim()) params.set("search", applicationSearch.trim());

      // Les réponses CHECKBOX sont stockées en base comme de vrais booléens
      // (pas les chaînes "true"/"false" que renvoie le <select>) — conversion
      // nécessaire avant envoi, sinon la requête Mongo ne matche jamais.
      const customFieldsById = new Map(customFormFields.map((f) => [f.id, f]));
      const activeFieldFilters = Object.fromEntries(
        Object.entries(fieldFilterValues)
          .filter(([, v]) => v !== "" && v !== undefined && v !== null)
          .map(([fieldId, v]) => [fieldId, customFieldsById.get(fieldId)?.type === "CHECKBOX" ? v === "true" : v])
      );
      if (Object.keys(activeFieldFilters).length > 0) params.set("fieldFilters", JSON.stringify(activeFieldFilters));

      const res = await adminFetch(`/api/volunteer-applications?${params.toString()}`);
      setApplications(res?.items || []);
      setApplicationsTotal(res?.total || 0);
      setApplicationsTotalPages(res?.totalPages || 1);
      setApplicationsPage(page);
      setSelectedApplicationIds([]);
    } catch (err) {
      setError(err.message || "Erreur de chargement des candidatures");
    } finally {
      setApplicationsLoading(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const res = await adminFetch(`/api/volunteer-applications?programId=${programId}&status=PENDING&limit=1`);
      setPendingCount(res?.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  // Chargé à l'activation de l'onglet Candidatures (badges de groupe + panneau
  // de groupement) ET de l'onglet Suivi (sélecteur "depuis un groupe" pour
  // l'affectation de superviseur) — voir les deux useEffect concernés.
  const loadApplicationGroups = async () => {
    try {
      const res = await adminFetch(`/api/volunteer-applications/groups?programId=${programId}`);
      setApplicationGroups(res?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBlacklist = async () => {
    try {
      const res = await adminFetch("/api/volunteer-discipline/blacklist");
      setBlacklist(res?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const createApplicationGroup = async () => {
    if (!newGroupName.trim() || selectedApplicationIds.length < 2) return;
    try {
      await adminFetch("/api/volunteer-applications/groups", {
        method: "POST",
        body: JSON.stringify({ programId, name: newGroupName.trim(), applicationIds: selectedApplicationIds }),
      });
      setNewGroupName("");
      setShowGroupPanel(false);
      loadApplicationGroups();
    } catch (err) {
      alert(err.message || "Erreur lors de la création du groupe");
    }
  };

  const addSelectionToExistingGroup = async () => {
    if (!selectedExistingGroupId || selectedApplicationIds.length === 0) return;
    try {
      await adminFetch(`/api/volunteer-applications/groups/${selectedExistingGroupId}/members`, {
        method: "PATCH",
        body: JSON.stringify({ applicationIds: selectedApplicationIds, action: "add" }),
      });
      setSelectedExistingGroupId("");
      setShowGroupPanel(false);
      loadApplicationGroups();
    } catch (err) {
      alert(err.message || "Erreur lors de l'ajout au groupe");
    }
  };

  const removeFromGroup = async (groupId, applicationId) => {
    try {
      await adminFetch(`/api/volunteer-applications/groups/${groupId}/members`, {
        method: "PATCH",
        body: JSON.stringify({ applicationIds: [applicationId], action: "remove" }),
      });
      loadApplicationGroups();
    } catch (err) {
      alert(err.message || "Erreur lors du retrait du groupe");
    }
  };

  const renameApplicationGroup = async (groupId, currentName) => {
    const name = window.prompt("Nouveau nom du groupe :", currentName);
    if (name === null || !name.trim()) return;
    try {
      await adminFetch(`/api/volunteer-applications/groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      loadApplicationGroups();
    } catch (err) {
      alert(err.message || "Erreur lors du renommage du groupe");
    }
  };

  const deleteApplicationGroup = async (groupId) => {
    if (!confirm("Supprimer ce groupe ? Les candidatures elles-mêmes ne sont pas affectées.")) return;
    try {
      await adminFetch(`/api/volunteer-applications/groups/${groupId}`, { method: "DELETE" });
      loadApplicationGroups();
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression du groupe");
    }
  };

  // Rechargement débouncé (350 ms) à chaque changement de filtre/recherche —
  // évite un appel réseau par frappe dans la barre de recherche.
  useEffect(() => {
    if (activeTab !== "applications") return;
    const timeout = setTimeout(() => loadApplications(1), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, applicationFilters, fieldFilterValues, applicationSearch]);

  useEffect(() => {
    if (activeTab === "applications") {
      loadPendingCount();
      loadApplicationGroups();
      loadBlacklist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const toggleApplicationSelected = (id) => {
    setSelectedApplicationIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = applications.map((a) => a._id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedApplicationIds.includes(id));
    setSelectedApplicationIds(allSelected ? [] : pageIds);
  };

  const bulkAcceptApplications = async () => {
    if (selectedApplicationIds.length === 0) return;
    if (!confirm(`Valider ${selectedApplicationIds.length} candidature(s) sélectionnée(s) ?`)) return;
    try {
      const res = await adminFetch("/api/volunteer-applications/bulk/accept", {
        method: "PATCH",
        body: JSON.stringify({ ids: selectedApplicationIds }),
      });
      if (res?.failed?.length > 0) {
        alert(`${res.accepted} candidature(s) validée(s), ${res.failed.length} non traitée(s) (déjà traitées ou non autorisées).`);
      }
      loadApplications(applicationsPage);
      loadPendingCount();
    } catch (err) {
      alert(err.message || "Erreur lors de la validation en masse");
    }
  };

  const bulkRejectApplications = async () => {
    if (selectedApplicationIds.length === 0) return;
    if (!confirm(`Rejeter ${selectedApplicationIds.length} candidature(s) sélectionnée(s) ?`)) return;
    try {
      const res = await adminFetch("/api/volunteer-applications/bulk/reject", {
        method: "PATCH",
        body: JSON.stringify({ ids: selectedApplicationIds }),
      });
      if (res?.failed?.length > 0) {
        alert(`${res.rejected} candidature(s) rejetée(s), ${res.failed.length} non traitée(s) (déjà traitées ou non autorisées).`);
      }
      loadApplications(applicationsPage);
      loadPendingCount();
    } catch (err) {
      alert(err.message || "Erreur lors du rejet en masse");
    }
  };

  const wipeAllApplications = async () => {
    const typed = window.prompt(
      `Cette action supprime DÉFINITIVEMENT les ${applicationsTotal} candidature(s) de ce programme ` +
      `(en attente, acceptées ET rejetées). Les volontaires déjà admis ne sont pas affectés — seule la ` +
      `liste de candidatures est vidée pour repartir sur une base propre.\n\nTapez SUPPRIMER pour confirmer :`
    );
    if (typed === null) return;
    if (typed.trim() !== "SUPPRIMER") { alert("Confirmation incorrecte — rien n'a été supprimé."); return; }
    try {
      const res = await adminFetch(`/api/volunteer-applications/bulk?programId=${programId}`, { method: "DELETE" });
      alert(`${res?.deletedCount || 0} candidature(s) supprimée(s).`);
      loadApplications(1);
      loadPendingCount();
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const saveMeta = async (e) => {
    e.preventDefault();
    try {
      const updated = await adminFetch(`/api/volunteer-programs/${programId}`, {
        method: "PUT",
        body: JSON.stringify(meta),
      });
      setProgram(updated);
      alert("Informations enregistrées.");
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement");
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/volontaires/candidature/${programId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  };

  const deleteProgram = async () => {
    if (!confirm("Supprimer définitivement ce programme ?")) return;
    try {
      await adminFetch(`/api/volunteer-programs/${programId}`, { method: "DELETE" });
      onBack();
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression");
    }
  };

  const saveFormFields = async (fields) => {
    try {
      const updated = await adminFetch(`/api/volunteer-programs/${programId}`, {
        method: "PUT",
        body: JSON.stringify({ applicationFormFields: fields }),
      });
      setProgram(updated);
      setFormFields(updated.applicationForm?.fields || []);
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement du formulaire");
    }
  };

  const saveEstimatedDuration = async (e) => {
    e.preventDefault();
    try {
      await adminFetch(`/api/volunteer-programs/${programId}`, {
        method: "PUT",
        body: JSON.stringify({ estimatedDuration }),
      });
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement de la durée");
    }
  };

  const saveBrandColor = async (color) => {
    setMeta((m) => ({ ...m, brandColor: color }));
    try {
      await adminFetch(`/api/volunteer-programs/${programId}`, {
        method: "PUT",
        body: JSON.stringify({ brandColor: color }),
      });
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement de la couleur");
    }
  };

  const importTemplate = async () => {
    const template = formTemplates.find((t) => t._id === importTemplateId);
    if (!template) return;

    const idMap = new Map();
    const imported = template.fields.map((f, i) => {
      const newId = `f_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;
      idMap.set(f.id, newId);
      return { ...f, id: newId };
    });
    imported.forEach((f) => {
      if (f.conditional?.fieldId) {
        f.conditional = { ...f.conditional, fieldId: idMap.get(f.conditional.fieldId) || "" };
      }
    });

    await saveFormFields([...formFields, ...imported]);
    setImportTemplateId("");
  };

  const saveAsTemplate = async () => {
    const customFields = formFields.filter((f) => !f.locked);
    if (customFields.length === 0) {
      alert("Ajoutez au moins un champ personnalisé avant d'enregistrer ce formulaire comme modèle.");
      return;
    }
    const name = window.prompt("Nom du modèle :", meta.title ? `Formulaire — ${meta.title}` : "");
    if (!name) return;
    try {
      await adminFetch("/api/volunteer-form-templates", {
        method: "POST",
        body: JSON.stringify({ name, fields: customFields }),
      });
      const templates = await adminFetch("/api/volunteer-form-templates");
      setFormTemplates(templates?.items || []);
      alert("Modèle enregistré — disponible pour import dans tout autre programme.");
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement du modèle");
    }
  };

  const moveField = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= formFields.length) return;
    if (direction === -1 && !canMoveFieldUp(formFields, index)) return;
    if (direction === 1 && !canMoveFieldDown(formFields, index)) return;
    const reordered = [...formFields];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    await saveFormFields(reordered);
  };

  const submitField = async (e) => {
    e.preventDefault();
    if (!fieldForm.label.trim()) return;

    const originalField = editingFieldId ? formFields.find((f) => f.id === editingFieldId) : null;
    const isLocked = !!originalField?.locked;
    const type = isLocked ? originalField.type : fieldForm.type;

    const field = {
      id: editingFieldId || `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      label: fieldForm.label,
      type,
      required: isLocked ? true : fieldForm.required,
      locked: isLocked,
      options: type === "SELECT"
        ? fieldForm.optionsText.split(",").map((o) => o.trim()).filter(Boolean)
        : [],
      validation: {
        minLength: fieldForm.minLength ? Number(fieldForm.minLength) : null,
        maxLength: fieldForm.maxLength ? Number(fieldForm.maxLength) : null,
        pattern: fieldForm.pattern || "",
        min: fieldForm.min ? Number(fieldForm.min) : null,
        max: fieldForm.max ? Number(fieldForm.max) : null,
      },
      conditional: isLocked || !fieldForm.conditionalFieldId
        ? { fieldId: "", values: [] }
        : { fieldId: fieldForm.conditionalFieldId, values: fieldForm.conditionalValues },
    };

    const nextFields = editingFieldId
      ? formFields.map((f) => (f.id === editingFieldId ? field : f))
      : [...formFields, field];

    await saveFormFields(nextFields);
    setFieldForm(emptyFieldForm);
    setEditingFieldId(null);
  };

  const editField = (field) => {
    setEditingFieldId(field.id);
    setFieldForm({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      optionsText: (field.options || []).join(", "),
      minLength: field.validation?.minLength ?? "",
      maxLength: field.validation?.maxLength ?? "",
      pattern: field.validation?.pattern || "",
      min: field.validation?.min ?? "",
      max: field.validation?.max ?? "",
      conditionalFieldId: field.conditional?.fieldId || "",
      conditionalValues: field.conditional?.values || [],
    });
  };

  const deleteField = async (fieldId) => {
    const field = formFields.find((f) => f.id === fieldId);
    if (field?.locked) {
      alert("Ce champ est indispensable (utilisé pour créer le profil du candidat admis) et ne peut pas être supprimé.");
      return;
    }
    if (!confirm("Supprimer ce champ du formulaire ?")) return;
    const dependents = formFields.filter((f) => f.conditional?.fieldId === fieldId);
    const remaining = formFields
      .filter((f) => f.id !== fieldId)
      .map((f) => (f.conditional?.fieldId === fieldId ? { ...f, conditional: { fieldId: "", values: [] } } : f));

    await saveFormFields(remaining);
    if (dependents.length > 0) {
      alert(`${dependents.length} sous-champ(s) dépendaient de ce champ : ils redeviennent toujours affichés.`);
    }
  };

  const toggleConditionalValue = (value) => {
    setFieldForm((prev) => ({
      ...prev,
      conditionalValues: prev.conditionalValues.includes(value)
        ? prev.conditionalValues.filter((v) => v !== value)
        : [...prev.conditionalValues, value],
    }));
  };

  const toggleProofConditionalValue = (value) => {
    setProofFieldForm((prev) => ({
      ...prev,
      conditionalValues: prev.conditionalValues.includes(value)
        ? prev.conditionalValues.filter((v) => v !== value)
        : [...prev.conditionalValues, value],
    }));
  };

  const reviewApplication = async (applicationId, action) => {
    try {
      await adminFetch(`/api/volunteer-applications/${applicationId}/${action}`, { method: "PATCH" });
      setSelectedApplicationId(null);
      load();
    } catch (err) {
      alert(err.message || "Erreur lors du traitement de la candidature");
    }
  };

  const deleteApplication = async (applicationId) => {
    if (!confirm("Supprimer définitivement cette candidature ? (le profil volontaire, si déjà accepté, n'est pas affecté)")) return;
    try {
      await adminFetch(`/api/volunteer-applications/${applicationId}`, { method: "DELETE" });
      setSelectedApplicationId(null);
      load();
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression de la candidature");
    }
  };

  const saveTasks = async (nextTasks) => {
    try {
      const updated = await adminFetch(`/api/volunteer-programs/${programId}`, {
        method: "PUT",
        body: JSON.stringify({ programTasks: nextTasks }),
      });
      setProgram(updated);
      setTasks(updated.tasks || []);
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement des tâches");
    }
  };

  const submitTaskForm = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    if (taskForm.status === "SCHEDULED" && !taskForm.scheduledPublishAt) {
      alert("Choisissez une date et une heure de publication pour une tâche programmée.");
      return;
    }

    const task = {
      id: editingTaskId || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: taskForm.title,
      description: taskForm.description,
      recurrence: taskForm.recurrence,
      status: taskForm.status,
      scheduledPublishAt: taskForm.status === "SCHEDULED" ? new Date(taskForm.scheduledPublishAt).toISOString() : null,
      dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null,
      proofForm: { fields: taskForm.proofFields },
    };
    const nextTasks = editingTaskId
      ? tasks.map((t) => (t.id === editingTaskId ? task : t))
      : [...tasks, task];

    await saveTasks(nextTasks);
    setTaskForm(emptyTaskForm);
    setEditingTaskId(null);
    setProofFieldForm(emptyProofFieldForm);
    setEditingProofFieldIndex(null);
  };

  const editTask = (task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title, description: task.description || "", recurrence: task.recurrence,
      status: task.status || "PUBLISHED",
      scheduledPublishAt: task.scheduledPublishAt ? toDatetimeLocalValue(task.scheduledPublishAt) : "",
      dueAt: task.dueAt ? toDatetimeLocalValue(task.dueAt) : "",
      proofFields: task.proofForm?.fields || [],
    });
    setProofFieldForm(emptyProofFieldForm);
    setEditingProofFieldIndex(null);
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Supprimer cette tâche ? Les soumissions déjà faites par les volontaires restent enregistrées mais ne compteront plus dans la progression.")) return;
    await saveTasks(tasks.filter((t) => t.id !== taskId));
  };

  const submitProofField = (e) => {
    e.preventDefault();
    if (!proofFieldForm.label.trim()) return;

    const field = {
      id: editingProofFieldIndex !== null
        ? taskForm.proofFields[editingProofFieldIndex].id
        : `pf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      label: proofFieldForm.label,
      type: proofFieldForm.type,
      required: proofFieldForm.required,
      locked: false,
      options: proofFieldForm.type === "SELECT"
        ? proofFieldForm.optionsText.split(",").map((o) => o.trim()).filter(Boolean)
        : [],
      validation: {
        minLength: proofFieldForm.minLength ? Number(proofFieldForm.minLength) : null,
        maxLength: proofFieldForm.maxLength ? Number(proofFieldForm.maxLength) : null,
        pattern: proofFieldForm.pattern || "",
        min: proofFieldForm.min ? Number(proofFieldForm.min) : null,
        max: proofFieldForm.max ? Number(proofFieldForm.max) : null,
        maxImages: proofFieldForm.maxImages ? Number(proofFieldForm.maxImages) : null,
      },
      conditional: !proofFieldForm.conditionalFieldId
        ? { fieldId: "", values: [] }
        : { fieldId: proofFieldForm.conditionalFieldId, values: proofFieldForm.conditionalValues },
    };

    const nextProofFields = editingProofFieldIndex !== null
      ? taskForm.proofFields.map((f, i) => (i === editingProofFieldIndex ? field : f))
      : [...taskForm.proofFields, field];

    setTaskForm({ ...taskForm, proofFields: nextProofFields });
    setProofFieldForm(emptyProofFieldForm);
    setEditingProofFieldIndex(null);
  };

  const editProofFieldAt = (index) => {
    const f = taskForm.proofFields[index];
    setEditingProofFieldIndex(index);
    setProofFieldForm({
      label: f.label, type: f.type, required: f.required,
      optionsText: (f.options || []).join(", "),
      minLength: f.validation?.minLength ?? "", maxLength: f.validation?.maxLength ?? "",
      pattern: f.validation?.pattern || "", min: f.validation?.min ?? "", max: f.validation?.max ?? "",
      maxImages: f.validation?.maxImages ?? "",
      conditionalFieldId: f.conditional?.fieldId || "",
      conditionalValues: f.conditional?.values || [],
    });
  };

  const removeProofFieldAt = (index) => {
    const removedId = taskForm.proofFields[index].id;
    // Un sous-champ qui dépendait de ce champ redevient toujours visible
    // (pas de dépendance orpheline) — même principe que deleteField pour
    // le formulaire de candidature.
    const dependents = taskForm.proofFields.filter((f) => f.conditional?.fieldId === removedId);
    const remaining = taskForm.proofFields
      .filter((_, i) => i !== index)
      .map((f) => (f.conditional?.fieldId === removedId ? { ...f, conditional: { fieldId: "", values: [] } } : f));

    setTaskForm({ ...taskForm, proofFields: remaining });
    if (editingProofFieldIndex === index) {
      setEditingProofFieldIndex(null);
      setProofFieldForm(emptyProofFieldForm);
    }
    if (dependents.length > 0) {
      alert(`${dependents.length} sous-champ(s) dépendaient de ce champ : ils redeviennent toujours affichés.`);
    }
  };

  const loadTracking = async () => {
    try {
      // submissionFilter vide ("Toutes") => pas de &status du tout, comme
      // SupervisorDashboard.jsx#loadSubmissions — sinon une soumission déjà
      // traitée (Approuvée/Rejetée) restait invisible pour toujours, alors
      // qu'on a besoin d'y revenir pour retrouver les preuves fournies.
      const statusQs = submissionFilter ? `&status=${submissionFilter}` : "";
      const [progress, submissionsData, staff] = await Promise.all([
        adminFetch(`/api/volunteer-tasks/programs/${programId}/progress`),
        adminFetch(`/api/volunteer-tasks/submissions?programId=${programId}${statusQs}`),
        // Annuaire allégé (ADMIN+EDITOR) — pas /gestionamp/api/users, qui
        // est réservé ADMIN (gestion des comptes) et ferait échouer tout
        // ce Promise.all (donc toute la progression/les soumissions aussi)
        // pour un EDITOR pourtant correctement affecté à ce programme.
        adminFetch("/gestionamp/api/users/staff-directory"),
      ]);
      setProgramProgress(progress?.items || []);
      setSubmissions(submissionsData?.items || []);
      setStaffUsers(Array.isArray(staff) ? staff : []);
      loadApplicationGroups(); // pour le sélecteur "Affecter depuis un groupe"
    } catch (err) {
      console.error(err);
    }
  };

  const loadPartnerTab = async () => {
    try {
      const [staff, comments, activity] = await Promise.all([
        // Annuaire allégé (ADMIN+EDITOR) — pas /gestionamp/api/users, qui
        // est réservé ADMIN (gestion des comptes) et ferait échouer tout
        // ce Promise.all (donc toute la progression/les soumissions aussi)
        // pour un EDITOR pourtant correctement affecté à ce programme.
        adminFetch("/gestionamp/api/users/staff-directory"),
        adminFetch(`/api/volunteer-partner/programs/${programId}/comments`),
        adminFetch(`/api/volunteer-partner/admin/activity-summary?programId=${programId}`),
      ]);
      setStaffUsers(Array.isArray(staff) ? staff : []);
      setPartnerComments(comments?.items || []);
      setPartnerActivity(activity?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPartnerActivityTimeline = async (partnerId) => {
    try {
      const res = await adminFetch(`/api/volunteer-partner/admin/partners/${partnerId}/activity?programId=${programId}&limit=10`);
      setPartnerActivityTimeline(res?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActivityDetail = (partnerId) => {
    if (expandedActivityPartnerId === partnerId) {
      setExpandedActivityPartnerId(null);
      return;
    }
    setExpandedActivityPartnerId(partnerId);
    loadPartnerActivityTimeline(partnerId);
  };

  useEffect(() => {
    if (activeTab === "tracking") loadTracking();
    if (activeTab === "partners") loadPartnerTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Recharge les soumissions quand on change de filtre de statut (onglet
  // Suivi déjà actif — le useEffect ci-dessus ne se redéclenche pas juste
  // pour ça puisque activeTab ne change pas).
  useEffect(() => {
    if (activeTab === "tracking") loadTracking();
    setSubmissionsPage(1);
    setExpandedVolunteerIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionFilter]);

  // Revient à la page 1 dès qu'un filtre de "Progression par volontaire" change.
  useEffect(() => { setProgressPage(1); }, [progressSearch, progressGroupFilter, progressStatutFilter]);

  const assignSupervisor = async () => {
    if (!selectedSupervisorId) return;
    try {
      await adminFetch(`/api/volunteer-programs/${programId}/supervisors`, {
        method: "PATCH",
        body: JSON.stringify({ supervisorId: selectedSupervisorId, volunteerIds: selectedSupervisedVolunteerIds }),
      });
      setSelectedSupervisorId("");
      setSelectedSupervisedVolunteerIds([]);
      loadTracking();
    } catch (err) {
      alert(err.message || "Erreur lors de l'affectation du superviseur");
    }
  };

  // Raccourci "Affecter depuis un groupe" : copie figée — ajoute (sans
  // remplacer) les volunteerId des membres ACCEPTED du groupe choisi à la
  // sélection de cases à cocher déjà affichée. Les membres pas encore
  // acceptés (pas de volunteerId résolu) sont silencieusement ignorés.
  const applyGroupToSupervisorSelection = (groupId) => {
    const group = applicationGroups.find((g) => g._id === groupId);
    if (!group) return;
    const acceptedVolunteerIds = group.applicationIds
      .filter((m) => m.status === "ACCEPTED" && m.volunteerId)
      .map((m) => m.volunteerId);
    setSelectedSupervisedVolunteerIds((prev) => Array.from(new Set([...prev, ...acceptedVolunteerIds])));
  };

  const unassignSupervisor = async (supervisorId) => {
    if (!confirm("Retirer ce superviseur de ce programme ?")) return;
    try {
      await adminFetch(`/api/volunteer-programs/${programId}/supervisors`, {
        method: "PATCH",
        body: JSON.stringify({ supervisorId, volunteerIds: [] }),
      });
      loadTracking();
    } catch (err) {
      alert(err.message || "Erreur lors du retrait du superviseur");
    }
  };

  const togglePartnerAccess = async (partnerId, add) => {
    try {
      await adminFetch(`/api/volunteer-programs/${programId}/partners`, {
        method: "PATCH",
        body: JSON.stringify({ partnerId, action: add ? "add" : "remove" }),
      });
      setSelectedPartnerId("");
      loadPartnerTab();
    } catch (err) {
      alert(err.message || "Erreur lors de la mise à jour du partenaire");
    }
  };

  // Réservé ADMIN côté backend (routes/volunteerProgramRoute.js) — un EDITOR
  // affecté obtient les mêmes pouvoirs qu'un ADMIN sur CE programme, donc
  // seul un ADMIN peut accorder/retirer cette affectation.
  const toggleEditorAccess = async (editorId, add) => {
    try {
      await adminFetch(`/api/volunteer-programs/${programId}/editors`, {
        method: "PATCH",
        body: JSON.stringify({ editorId, action: add ? "add" : "remove" }),
      });
      setSelectedEditorId("");
      loadTracking();
    } catch (err) {
      alert(err.message || "Erreur lors de la mise à jour de l'éditeur");
    }
  };

  // Barre des partenaires — propre à CE programme (corrigé le 2026-08-07 :
  // d'abord un réglage global comme le logo AMP BENIN, l'utilisateur a
  // précisé "c'est une image propre à chaque programme, seuls les
  // partenaires où ce programme a été affecté verront ça"). adminFetch
  // force Content-Type: JSON, donc un fetch brut est nécessaire ici
  // (multipart), même pattern que uploadLogo côté PartnerDashboard.jsx.
  const uploadPartnersBar = async (file) => {
    if (!file) return;
    setUploadingPartnersBar(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("amp_token");
      const res = await fetch(`${API_BASE}/api/volunteer-programs/${programId}/partners-bar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Erreur lors de l'envoi de l'image");
      setProgram((prev) => ({ ...prev, partnersBarImageUrl: body.partnersBarImageUrl }));
    } catch (err) {
      alert(err.message || "Erreur lors de l'envoi de l'image");
    } finally {
      setUploadingPartnersBar(false);
    }
  };

  const replyToComment = async (commentId) => {
    const reply = window.prompt("Votre réponse à ce commentaire :");
    if (reply === null) return;
    if (!reply.trim()) { alert("La réponse ne peut pas être vide."); return; }
    try {
      await adminFetch(`/api/volunteer-partner/comments/${commentId}/reply`, {
        method: "PATCH",
        body: JSON.stringify({ reply: reply.trim() }),
      });
      loadPartnerTab();
    } catch (err) {
      alert(err.message || "Erreur lors de l'envoi de la réponse");
    }
  };

  const reviewSubmissionTask = async (submissionId, action) => {
    try {
      await adminFetch(`/api/volunteer-tasks/submissions/${submissionId}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      loadTracking();
    } catch (err) {
      alert(err.message || "Erreur lors du traitement de la soumission");
    }
  };

  const rejectSubmissionWithNote = async (submissionId) => {
    const reviewNote = window.prompt("Motif du rejet (obligatoire) :");
    if (reviewNote === null) return; // annulé
    if (!reviewNote.trim()) {
      alert("Un motif de rejet est requis.");
      return;
    }
    try {
      await adminFetch(`/api/volunteer-tasks/submissions/${submissionId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reviewNote: reviewNote.trim() }),
      });
      loadTracking();
    } catch (err) {
      alert(err.message || "Erreur lors du rejet");
    }
  };

  const finalizeMissions = async () => {
    const typed = window.prompt(
      "Cette action est IRRÉVERSIBLE : chaque volontaire encore \"Non disponible\" sur ce programme passera " +
      "définitivement à \"Mission validée\" (seuil atteint) ou \"Refusé\" (sinon), et plus aucune soumission de " +
      "tâche ne sera acceptée ensuite.\n\nTapez TERMINER pour confirmer :"
    );
    if (typed === null) return;
    if (typed.trim() !== "TERMINER") { alert("Confirmation incorrecte — rien n'a été fait."); return; }
    try {
      const res = await adminFetch(`/api/volunteer-tasks/programs/${programId}/finalize`, { method: "POST" });
      alert(`${res?.validated || 0} volontaire(s) validé(s), ${res?.refused || 0} refusé(s).`);
      load();
      loadTracking();
    } catch (err) {
      alert(err.message || "Erreur lors de la finalisation des missions");
    }
  };

  if (loading) return <p className="text-center text-gray-500 p-6">Chargement...</p>;
  if (error || !program) return <p className="text-center text-red-600 p-6">{error || "Programme introuvable"}</p>;

  const isTextType = ["TEXT", "TEXTAREA", "EMAIL", "PHONE"].includes(fieldForm.type);
  // Classement "Progression par volontaire" du meilleur au moins avancé, sur
  // la liste COMPLÈTE — le rang ne change jamais selon les filtres actifs.
  const rankedProgramProgress = [...programProgress]
    .sort((a, b) => b.progress.percent - a.progress.percent)
    .map((p, i) => ({ ...p, rank: i + 1 }));
  const availableProgressGroups = [...new Set(rankedProgramProgress.flatMap((p) => p.groupNames || []))].sort((a, b) => a.localeCompare(b));
  const filteredProgramProgress = rankedProgramProgress.filter((p) => {
    const q = progressSearch.trim().toLowerCase();
    const matchesSearch = !q || `${p.prenom} ${p.nom} ${p.email} ${p.telephone || ""}`.toLowerCase().includes(q);
    const matchesGroup = !progressGroupFilter || (p.groupNames || []).includes(progressGroupFilter);
    const matchesStatut = !progressStatutFilter || p.statut === progressStatutFilter;
    return matchesSearch && matchesGroup && matchesStatut;
  });
  const PROGRESS_PAGE_SIZE = 10;
  const progressTotalPages = Math.max(1, Math.ceil(filteredProgramProgress.length / PROGRESS_PAGE_SIZE));
  const pagedProgramProgress = filteredProgramProgress.slice((progressPage - 1) * PROGRESS_PAGE_SIZE, progressPage * PROGRESS_PAGE_SIZE);

  // Exporte ce qui correspond à la recherche/aux filtres actifs, pas
  // seulement la page affichée (même convention que VolunteersManager.jsx#exportPDF).
  const exportProgramProgressPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    doc.text(`Progression par volontaire — ${program?.title || "Programme"}`, 14, 14);
    autoTable(doc, {
      head: [["Rang", "Nom", "Email", "Groupe", "Superviseur", "Progression", "Statut mission"]],
      body: filteredProgramProgress.map((p) => [
        p.rank,
        `${p.prenom} ${p.nom}`,
        p.email,
        p.groupNames && p.groupNames.length > 0 ? p.groupNames.join(", ") : "-",
        p.supervisorNames && p.supervisorNames.length > 0 ? p.supervisorNames.join(", ") : "-",
        `${p.progress.approved}/${p.progress.totalDue} (${p.progress.percent}%)`,
        p.statut,
      ]),
      startY: 20,
    });
    const slug = (program?.title || "programme").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
    doc.save(`progression-${slug}.pdf`);
  };
  // Regroupe les soumissions (déjà filtrées par statut) par volontaire —
  // 2+ soumissions du même volontaire => repliées sous son nom ; 1 seule
  // => affichée directement, comme avant (décision utilisateur, 2026-08-18).
  const submissionsByVolunteer = new Map();
  submissions.forEach((s) => {
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

  const selectedApplication = applications.find((a) => a._id === selectedApplicationId) || null;
  const activeApplicationFilterCount =
    (applicationFilters.status ? 1 : 0) +
    (applicationFilters.dateFrom ? 1 : 0) +
    (applicationFilters.dateTo ? 1 : 0) +
    Object.values(fieldFilterValues).filter(Boolean).length;
  const editingField = editingFieldId ? formFields.find((f) => f.id === editingFieldId) : null;
  const isEditingLocked = !!editingField?.locked;
  const customFormFields = formFields.filter((f) => !APPLICANT_FIELD_IDS.includes(f.id));
  const fieldsById = new Map(formFields.map((f) => [f.id, f]));
  const editingFieldIndex = editingFieldId ? formFields.findIndex((f) => f.id === editingFieldId) : formFields.length;
  const eligibleTriggerFields = formFields.filter(
    (f, idx) => CONDITIONAL_TRIGGER_TYPES.includes(f.type) && idx < editingFieldIndex
  );
  const conditionalTriggerField = fieldsById.get(fieldForm.conditionalFieldId);

  // Même principe que pour le formulaire de candidature ci-dessus, appliqué
  // au formulaire de preuve d'une tâche (taskForm.proofFields) — un
  // sous-champ ne peut dépendre que d'un champ SELECT/CHECKBOX déjà présent
  // AVANT lui dans le tableau (les nouveaux champs sont toujours ajoutés en
  // fin de liste, donc l'ordre reste toujours cohérent sans réordonnancement manuel).
  const proofFieldsById = new Map(taskForm.proofFields.map((f) => [f.id, f]));
  const eligibleProofTriggerFields = taskForm.proofFields.filter(
    (f, idx) => CONDITIONAL_TRIGGER_TYPES.includes(f.type) && idx < (editingProofFieldIndex ?? taskForm.proofFields.length)
  );
  const conditionalProofTriggerField = proofFieldsById.get(proofFieldForm.conditionalFieldId);

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-violet-50 min-h-screen rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto flex-wrap gap-2">
        <button onClick={onBack} className="text-blue-600 hover:underline">← Retour aux programmes</button>
        <h2 className="text-xl font-extrabold text-yellow-700">{program.title}</h2>
        <button onClick={copyLink}
          className={`px-3 py-1 rounded-lg text-white text-sm ${copied ? "bg-green-600" : "bg-violet-600 hover:bg-violet-700"}`}>
          {copied ? "✓ Lien copié" : "🔗 Copier le lien de candidature"}
        </button>
      </div>

      <div className="flex gap-2 justify-center mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={`px-4 py-2 rounded-xl font-semibold ${
              activeTab === t.value ? "bg-yellow-600 text-white" : "bg-white text-gray-700 hover:bg-yellow-50"
            }`}
          >
            {t.icon} {t.label}
            {t.value === "applications" && pendingCount > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        {activeTab === "info" && (
          <form onSubmit={saveMeta} className="space-y-4">
            <input type="text" placeholder="Titre" value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })} required
              className="w-full border border-yellow-300 rounded-xl p-3" />
            <textarea placeholder="Description" rows={3} value={meta.description}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
              className="w-full border border-yellow-300 rounded-xl p-3" />
            <div>
              <input type="url" placeholder="URL de l'image de couverture (aperçu affiché sur le catalogue public)"
                value={meta.coverImageUrl} onChange={(e) => setMeta({ ...meta, coverImageUrl: e.target.value })}
                className="w-full border border-yellow-300 rounded-xl p-3" />
              {meta.coverImageUrl && (
                <img src={meta.coverImageUrl} alt="Aperçu" onError={(e) => (e.target.style.display = "none")}
                  onLoad={(e) => (e.target.style.display = "block")}
                  className="mt-2 h-28 w-full max-w-xs object-cover rounded-lg border border-gray-200" />
              )}
            </div>
            <input type="text" placeholder="Lieu" value={meta.location}
              onChange={(e) => setMeta({ ...meta, location: e.target.value })}
              className="w-full border border-yellow-300 rounded-xl p-3" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Date de début</label>
                <input type="date" value={meta.startDate} onChange={(e) => setMeta({ ...meta, startDate: e.target.value })}
                  className="w-full border border-yellow-300 rounded-xl p-3" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Date de fin</label>
                <input type="date" value={meta.endDate} onChange={(e) => setMeta({ ...meta, endDate: e.target.value })}
                  className="w-full border border-yellow-300 rounded-xl p-3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Nombre de places (optionnel)" value={meta.capacity} min="0"
                onChange={(e) => setMeta({ ...meta, capacity: e.target.value })}
                className="w-full border border-yellow-300 rounded-xl p-3" />
              <select value={meta.status} onChange={(e) => setMeta({ ...meta, status: e.target.value })}
                className="w-full border border-yellow-300 rounded-xl p-3">
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
                <option value="CLOSED">Fermé (candidatures closes)</option>
                <option value="ARCHIVED">Archivé</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Couleur du programme</label>
              <p className="text-xs text-gray-500 mb-1">Pilote le dégradé et les boutons du formulaire de candidature vu par le candidat.</p>
              <div className="flex items-center gap-3">
                <input type="color" value={meta.brandColor || "#1B4332"} onChange={(e) => saveBrandColor(e.target.value)}
                  className="w-11 h-11 rounded border border-gray-300 cursor-pointer" />
                {meta.brandColor && (
                  <button type="button" onClick={() => saveBrandColor("")} className="text-sm text-blue-600 hover:underline">
                    Réinitialiser (couleur par défaut)
                  </button>
                )}
              </div>
            </div>

            <select value={meta.accessMode} onChange={(e) => setMeta({ ...meta, accessMode: e.target.value })}
              className="w-full border border-yellow-300 rounded-xl p-3">
              <option value="APPLICATION">Sur candidature (examinée par le staff)</option>
              <option value="OPEN">Accès ouvert (admission immédiate)</option>
            </select>

            <div>
              <label className="text-sm font-semibold text-gray-700">Seuil de validation automatique de la mission (%)</label>
              <p className="text-xs text-gray-500 mb-1">
                Quand un volontaire atteint ce % de tâches dues et approuvées (voir l'onglet "Tâches"), son statut
                passe automatiquement à "Mission validée" — sans action manuelle supplémentaire.
              </p>
              <input type="number" min="0" max="100" value={meta.missionValidationThreshold}
                onChange={(e) => setMeta({ ...meta, missionValidationThreshold: e.target.value })}
                className="w-full border border-yellow-300 rounded-xl p-3" />
            </div>

            {meta.accessMode === "APPLICATION" && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Date limite pour postuler (optionnel)</label>
                  <input type="date" value={meta.applicationDeadline}
                    onChange={(e) => setMeta({ ...meta, applicationDeadline: e.target.value })}
                    className="w-full border border-yellow-300 rounded-xl p-3" />
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide pour des candidatures ouvertes en tout temps. Une fois la date dépassée, le
                    formulaire se ferme automatiquement et le statut passe à "Fermé".
                  </p>
                </div>
                <textarea placeholder="Informations d'admission (incluses dans l'email envoyé aux admis)" rows={3}
                  value={meta.admissionInstructions}
                  onChange={(e) => setMeta({ ...meta, admissionInstructions: e.target.value })}
                  className="w-full border border-yellow-300 rounded-xl p-3" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="tel" placeholder="Numéro WhatsApp" value={meta.contactWhatsapp}
                    onChange={(e) => setMeta({ ...meta, contactWhatsapp: e.target.value })}
                    className="w-full border border-yellow-300 rounded-xl p-3" />
                  <input type="email" placeholder="Email de contact" value={meta.contactEmail}
                    onChange={(e) => setMeta({ ...meta, contactEmail: e.target.value })}
                    className="w-full border border-yellow-300 rounded-xl p-3" />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700">
                Enregistrer
              </button>
              <button type="button" onClick={deleteProgram}
                className="bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </form>
        )}

        {activeTab === "form" && (
          meta.accessMode !== "APPLICATION" ? (
            <p className="text-gray-600">
              Ce programme est en accès ouvert — les volontaires s'inscrivent directement, sans candidature.
              Ce formulaire ne sera utilisé que si vous passez le mode d'accès sur "Sur candidature".
            </p>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Prénom, Nom et Email sont indispensables (verrouillés 🔒) — Téléphone est entièrement libre.
                Ajoutez ici les champs supplémentaires spécifiques à ce programme.
              </p>

              <form onSubmit={saveEstimatedDuration} className="flex gap-2 items-center">
                <input type="text" placeholder="Durée estimée affichée au candidat (ex : 5 minutes)"
                  value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-xl p-2" />
                <button type="submit" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl text-sm">
                  Enregistrer la durée
                </button>
              </form>

              <div className="flex gap-2 items-center flex-wrap">
                <select value={importTemplateId} onChange={(e) => setImportTemplateId(e.target.value)}
                  className="border border-gray-300 rounded-xl p-2 flex-1">
                  <option value="">-- Importer un modèle de formulaire --</option>
                  {formTemplates.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.fields.length} champ{t.fields.length > 1 ? "s" : ""})</option>
                  ))}
                </select>
                <button type="button" disabled={!importTemplateId} onClick={importTemplate}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl text-sm disabled:opacity-50">
                  Importer
                </button>
                <button type="button" onClick={saveAsTemplate}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl text-sm">
                  Enregistrer ce formulaire comme modèle
                </button>
              </div>

              <div className="space-y-2">
                {formFields.length === 0 && <p className="text-gray-500">Aucun champ pour l'instant.</p>}
                {formFields.map((field, index) => {
                  const depth = getFieldDepth(field, fieldsById);
                  const parentField = field.conditional?.fieldId ? fieldsById.get(field.conditional.fieldId) : null;
                  return (
                    <div key={field.id} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3"
                      style={{ marginLeft: depth * 24 }}>
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => moveField(index, -1)} disabled={!canMoveFieldUp(formFields, index)}
                          className="disabled:opacity-30">▲</button>
                        <button type="button" onClick={() => moveField(index, 1)} disabled={!canMoveFieldDown(formFields, index)}
                          className="disabled:opacity-30">▼</button>
                      </div>
                      <div className="flex-1">
                        <strong>{field.locked && "🔒 "}{field.label}</strong>
                        <span className="text-xs text-gray-500 ml-2">
                          {FIELD_TYPES.find((t) => t.value === field.type)?.label} {field.required && "· obligatoire"}
                        </span>
                        {parentField && (
                          <div className="text-xs text-blue-600">↳ Visible si « {parentField.label} » = {(field.conditional.values || []).join(", ")}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => editField(field)} className="text-blue-600 hover:underline text-sm">Éditer</button>
                        {!field.locked && (
                          <button type="button" onClick={() => deleteField(field.id)} className="text-red-600 hover:underline text-sm">Supprimer</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={submitField} className="border-t pt-4 space-y-3">
                <h3 className="font-semibold">{editingFieldId ? "Modifier le champ" : "Ajouter un champ"}</h3>
                {isEditingLocked && (
                  <p className="text-xs text-gray-500">
                    🔒 Champ indispensable : libellé, position et validation restent modifiables ; le type et le
                    caractère obligatoire sont fixes.
                  </p>
                )}
                <input type="text" placeholder="Libellé de la question" value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })} required
                  className="w-full border border-gray-300 rounded-xl p-2" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={fieldForm.type} disabled={isEditingLocked}
                    onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}
                    className="border border-gray-300 rounded-xl p-2 disabled:bg-gray-100">
                    {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={fieldForm.required} disabled={isEditingLocked}
                      onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })} />
                    Obligatoire
                  </label>
                </div>
                {fieldForm.type === "SELECT" && (
                  <input type="text" placeholder="Options séparées par des virgules" value={fieldForm.optionsText}
                    onChange={(e) => setFieldForm({ ...fieldForm, optionsText: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2" />
                )}
                {isTextType && (
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" placeholder="Longueur min" value={fieldForm.minLength}
                      onChange={(e) => setFieldForm({ ...fieldForm, minLength: e.target.value })}
                      className="border border-gray-300 rounded-xl p-2" />
                    <input type="number" placeholder="Longueur max" value={fieldForm.maxLength}
                      onChange={(e) => setFieldForm({ ...fieldForm, maxLength: e.target.value })}
                      className="border border-gray-300 rounded-xl p-2" />
                    <input type="text" placeholder="Motif regex (optionnel)" value={fieldForm.pattern}
                      onChange={(e) => setFieldForm({ ...fieldForm, pattern: e.target.value })}
                      className="border border-gray-300 rounded-xl p-2" />
                  </div>
                )}
                {fieldForm.type === "NUMBER" && (
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Min" value={fieldForm.min}
                      onChange={(e) => setFieldForm({ ...fieldForm, min: e.target.value })}
                      className="border border-gray-300 rounded-xl p-2" />
                    <input type="number" placeholder="Max" value={fieldForm.max}
                      onChange={(e) => setFieldForm({ ...fieldForm, max: e.target.value })}
                      className="border border-gray-300 rounded-xl p-2" />
                  </div>
                )}

                {!isEditingLocked && (
                  <div className="border border-gray-200 rounded-xl p-3">
                    <label className="text-sm font-semibold text-gray-700">Afficher ce champ seulement si...</label>
                    <select value={fieldForm.conditionalFieldId}
                      onChange={(e) => setFieldForm({ ...fieldForm, conditionalFieldId: e.target.value, conditionalValues: [] })}
                      className="w-full border border-gray-300 rounded-xl p-2 mt-1">
                      <option value="">-- Toujours visible --</option>
                      {eligibleTriggerFields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    {fieldForm.conditionalFieldId && conditionalTriggerField && (
                      <div className="mt-2 flex gap-3 flex-wrap">
                        {(conditionalTriggerField.type === "CHECKBOX" ? ["true", "false"] : conditionalTriggerField.options || []).map((opt) => (
                          <label key={opt} className="flex items-center gap-1 text-sm">
                            <input type="checkbox" checked={fieldForm.conditionalValues.includes(opt)}
                              onChange={() => toggleConditionalValue(opt)} />
                            {conditionalTriggerField.type === "CHECKBOX" ? (opt === "true" ? "si coché" : "si non coché") : opt}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-yellow-600 text-white font-bold py-2 rounded-xl hover:bg-yellow-700">
                    {editingFieldId ? "Enregistrer le champ" : "Ajouter le champ"}
                  </button>
                  {editingFieldId && (
                    <button type="button" onClick={() => { setEditingFieldId(null); setFieldForm(emptyFieldForm); }}
                      className="bg-gray-200 px-4 rounded-xl">
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
          )
        )}

        {activeTab === "tasks" && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Ces tâches s'appliquent à tout volontaire accepté sur ce programme. "Une fois" = à faire une seule
              fois ; "Quotidienne"/"Hebdomadaire" = une échéance chaque jour/semaine, de la date d'acceptation du
              volontaire jusqu'à la fin du programme (ou aujourd'hui si le programme est encore en cours).
            </p>

            <div className="space-y-2">
              {tasks.length === 0 && <p className="text-gray-500">Aucune tâche pour l'instant.</p>}
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3">
                  <div className="flex-1">
                    <strong>{task.title}</strong>
                    <span className={`text-xs font-bold ml-2 px-2 py-0.5 rounded-full ${
                      task.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                      task.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"
                    }`}>
                      {TASK_STATUS_LABELS[task.status || "PUBLISHED"]}
                      {task.status === "SCHEDULED" && task.scheduledPublishAt && ` — ${new Date(task.scheduledPublishAt).toLocaleString("fr-FR")}`}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">{RECURRENCE_LABELS[task.recurrence]}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {task.proofForm?.fields?.length > 0
                        ? `${task.proofForm.fields.length} champ(s) de preuve`
                        : "Formulaire de preuve par défaut (Description)"}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Publiée : {task.publishedAt ? formatSmartTime(task.publishedAt) : "—"}
                      {" · "}
                      Date limite : {task.dueAt ? formatSmartTime(task.dueAt) : "Aucune"}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        <TruncatedDescription
                          text={task.description}
                          title={task.title}
                          times={[
                            { label: "Publiée", value: task.publishedAt ? formatSmartTime(task.publishedAt) : "—" },
                            { label: "Date limite", value: task.dueAt ? formatSmartTime(task.dueAt) : "Aucune" },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editTask(task)} className="text-blue-600 hover:underline text-sm">Éditer</button>
                    <button type="button" onClick={() => deleteTask(task.id)} className="text-red-600 hover:underline text-sm">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={submitTaskForm} className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">{editingTaskId ? "Modifier la tâche" : "Ajouter une tâche"}</h3>
              <input type="text" placeholder="Titre de la tâche" value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required
                className="w-full border border-gray-300 rounded-xl p-2" />
              <textarea placeholder="Description (optionnel)" rows={2} value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded-xl p-2" />
              <div className="flex gap-3 items-end">
                <label className="flex-1 text-sm">
                  <span className="block text-gray-600 mb-1">Statut de publication</span>
                  <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2">
                    <option value="DRAFT">Brouillon (invisible des volontaires)</option>
                    <option value="SCHEDULED">Programmée</option>
                    <option value="PUBLISHED">Publiée (visible immédiatement)</option>
                  </select>
                </label>
                {taskForm.status === "SCHEDULED" && (
                  <label className="flex-1 text-sm">
                    <span className="block text-gray-600 mb-1">Date et heure de publication</span>
                    <input type="datetime-local" value={taskForm.scheduledPublishAt}
                      onChange={(e) => setTaskForm({ ...taskForm, scheduledPublishAt: e.target.value })}
                      required className="w-full border border-gray-300 rounded-xl p-2" />
                  </label>
                )}
              </div>
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Date limite de soumission (optionnel)</span>
                <input type="datetime-local" value={taskForm.dueAt}
                  onChange={(e) => setTaskForm({ ...taskForm, dueAt: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2" />
                <span className="block text-xs text-gray-500 mt-1">
                  Passé ce délai, plus aucun volontaire ne peut soumettre pour cette tâche. Laisser vide = pas de
                  limite propre à la tâche (seule la date de fin du programme compte).
                </span>
              </label>
              <select value={taskForm.recurrence} onChange={(e) => setTaskForm({ ...taskForm, recurrence: e.target.value })}
                className="w-full border border-gray-300 rounded-xl p-2">
                <option value="ONCE">Une fois</option>
                <option value="DAILY">Quotidienne</option>
                <option value="WEEKLY">Hebdomadaire</option>
              </select>

              <div className="border border-gray-200 rounded-xl p-3 space-y-3 bg-gray-50">
                <div>
                  <h4 className="font-semibold text-sm">Champs du formulaire de preuve</h4>
                  <p className="text-xs text-gray-500">
                    Ce que le volontaire doit remplir pour soumettre cette tâche à validation. Sans champ, un simple
                    champ "Description" obligatoire est utilisé par défaut.
                  </p>
                </div>

                {taskForm.proofFields.length > 0 && (
                  <div className="space-y-1">
                    {taskForm.proofFields.map((f, index) => {
                      const depth = getFieldDepth(f, proofFieldsById);
                      const parentField = f.conditional?.fieldId ? proofFieldsById.get(f.conditional.fieldId) : null;
                      return (
                        <div key={f.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2"
                          style={{ marginLeft: depth * 24 }}>
                          <div className="flex-1 text-sm">
                            <strong>{f.label}</strong>
                            <span className="text-xs text-gray-500 ml-2">
                              {PROOF_FIELD_TYPES.find((t) => t.value === f.type)?.label} {f.required && "· obligatoire"}
                              {f.type === "IMAGE" && f.validation?.maxImages ? ` · max ${f.validation.maxImages}` : ""}
                            </span>
                            {parentField && (
                              <div className="text-xs text-blue-600">↳ Visible si « {parentField.label} » = {(f.conditional.values || []).join(", ")}</div>
                            )}
                          </div>
                          <button type="button" onClick={() => editProofFieldAt(index)} className="text-blue-600 hover:underline text-xs">Éditer</button>
                          <button type="button" onClick={() => removeProofFieldAt(index)} className="text-red-600 hover:underline text-xs">Suppr.</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2 border-t border-gray-200 pt-3">
                  <input type="text" placeholder="Libellé du champ" value={proofFieldForm.label}
                    onChange={(e) => setProofFieldForm({ ...proofFieldForm, label: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={proofFieldForm.type} onChange={(e) => setProofFieldForm({ ...proofFieldForm, type: e.target.value })}
                      className="border border-gray-300 rounded-xl p-2 text-sm">
                      {PROOF_FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={proofFieldForm.required}
                        onChange={(e) => setProofFieldForm({ ...proofFieldForm, required: e.target.checked })} />
                      Obligatoire
                    </label>
                  </div>

                  {proofFieldForm.type === "SELECT" && (
                    <input type="text" placeholder="Options séparées par des virgules" value={proofFieldForm.optionsText}
                      onChange={(e) => setProofFieldForm({ ...proofFieldForm, optionsText: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2 text-sm" />
                  )}
                  {["TEXT", "TEXTAREA", "EMAIL", "PHONE", "URL"].includes(proofFieldForm.type) && (
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Longueur min" value={proofFieldForm.minLength}
                        onChange={(e) => setProofFieldForm({ ...proofFieldForm, minLength: e.target.value })}
                        className="border border-gray-300 rounded-xl p-2 text-sm" />
                      <input type="number" placeholder="Longueur max" value={proofFieldForm.maxLength}
                        onChange={(e) => setProofFieldForm({ ...proofFieldForm, maxLength: e.target.value })}
                        className="border border-gray-300 rounded-xl p-2 text-sm" />
                    </div>
                  )}
                  {proofFieldForm.type === "NUMBER" && (
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Min" value={proofFieldForm.min}
                        onChange={(e) => setProofFieldForm({ ...proofFieldForm, min: e.target.value })}
                        className="border border-gray-300 rounded-xl p-2 text-sm" />
                      <input type="number" placeholder="Max" value={proofFieldForm.max}
                        onChange={(e) => setProofFieldForm({ ...proofFieldForm, max: e.target.value })}
                        className="border border-gray-300 rounded-xl p-2 text-sm" />
                    </div>
                  )}
                  {proofFieldForm.type === "IMAGE" && (
                    <input type="number" min="1" placeholder="Nombre maximum de photos (optionnel)" value={proofFieldForm.maxImages}
                      onChange={(e) => setProofFieldForm({ ...proofFieldForm, maxImages: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl p-2 text-sm" />
                  )}

                  {/* Sous-champ conditionnel : n'apparaît côté volontaire que
                      si un champ SELECT/CHECKBOX déjà ajouté a une valeur
                      précise — même mécanisme que le formulaire de
                      candidature (ApplicationFieldSchema.conditional, déjà
                      géré par le backend pour proofForm.fields aussi). */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-white">
                    <label className="text-sm font-semibold text-gray-700">Afficher ce champ seulement si...</label>
                    <select value={proofFieldForm.conditionalFieldId}
                      onChange={(e) => setProofFieldForm({ ...proofFieldForm, conditionalFieldId: e.target.value, conditionalValues: [] })}
                      className="w-full border border-gray-300 rounded-xl p-2 mt-1 text-sm">
                      <option value="">-- Toujours visible --</option>
                      {eligibleProofTriggerFields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    {proofFieldForm.conditionalFieldId && conditionalProofTriggerField && (
                      <div className="mt-2 flex gap-3 flex-wrap">
                        {(conditionalProofTriggerField.type === "CHECKBOX" ? ["true", "false"] : conditionalProofTriggerField.options || []).map((opt) => (
                          <label key={opt} className="flex items-center gap-1 text-sm">
                            <input type="checkbox" checked={proofFieldForm.conditionalValues.includes(opt)}
                              onChange={() => toggleProofConditionalValue(opt)} />
                            {conditionalProofTriggerField.type === "CHECKBOX" ? (opt === "true" ? "si coché" : "si non coché") : opt}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={submitProofField}
                      className="flex-1 bg-gray-700 text-white text-sm font-semibold py-2 rounded-xl hover:bg-gray-800">
                      {editingProofFieldIndex !== null ? "Enregistrer le champ" : "Ajouter le champ"}
                    </button>
                    {editingProofFieldIndex !== null && (
                      <button type="button"
                        onClick={() => { setEditingProofFieldIndex(null); setProofFieldForm(emptyProofFieldForm); }}
                        className="bg-gray-200 px-3 rounded-xl text-sm">
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-yellow-600 text-white font-bold py-2 rounded-xl hover:bg-yellow-700">
                  {editingTaskId ? "Enregistrer la tâche" : "Ajouter la tâche"}
                </button>
                {editingTaskId && (
                  <button type="button" onClick={() => { setEditingTaskId(null); setTaskForm(emptyTaskForm); setProofFieldForm(emptyProofFieldForm); setEditingProofFieldIndex(null); }}
                    className="bg-gray-200 px-4 rounded-xl">
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === "applications" && (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="font-semibold">Candidatures ({applicationsTotal})</h3>
              <button onClick={wipeAllApplications} className="text-sm text-red-700 border border-red-300 rounded-lg px-3 py-1 hover:bg-red-50">
                🗑️ Vider tout
              </button>
            </div>

            {/* Recherche (toujours visible) + bouton menu Filtres */}
            <div className="flex flex-wrap gap-2 mb-3 items-end">
              <div className="flex flex-col flex-1 min-w-[200px]">
                <label className="text-xs text-gray-500 mb-1">Recherche</label>
                <input type="text" placeholder="Nom, email, téléphone..." value={applicationSearch}
                  onChange={(e) => setApplicationSearch(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 text-sm w-full" />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowApplicationFiltersMenu((v) => !v)}
                  className={`flex items-center gap-1 border rounded-lg px-3 py-2 text-sm font-semibold ${
                    activeApplicationFilterCount > 0 ? "border-yellow-500 bg-yellow-50 text-yellow-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  🎛️ Filtres
                  {activeApplicationFilterCount > 0 && (
                    <span className="bg-yellow-600 text-white text-xs rounded-full px-1.5">{activeApplicationFilterCount}</span>
                  )}
                  <span className="text-xs">{showApplicationFiltersMenu ? "▲" : "▼"}</span>
                </button>

                {showApplicationFiltersMenu && (
                  <div className="absolute right-0 z-10 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex flex-col gap-3">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 mb-1">Statut</label>
                      <select value={applicationFilters.status}
                        onChange={(e) => setApplicationFilters((prev) => ({ ...prev, status: e.target.value }))}
                        className="border border-gray-300 rounded-lg p-2 text-sm">
                        <option value="">Tous</option>
                        <option value="PENDING">En attente</option>
                        <option value="ACCEPTED">Acceptée</option>
                        <option value="REJECTED">Rejetée</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-500 mb-1">Reçue depuis</label>
                        <input type="date" value={applicationFilters.dateFrom}
                          onChange={(e) => setApplicationFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                          className="border border-gray-300 rounded-lg p-2 text-sm w-full" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-500 mb-1">Jusqu'au</label>
                        <input type="date" value={applicationFilters.dateTo}
                          onChange={(e) => setApplicationFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                          className="border border-gray-300 rounded-lg p-2 text-sm w-full" />
                      </div>
                    </div>
                    {customFormFields.filter((f) => f.type === "SELECT" || f.type === "CHECKBOX").map((f) => (
                      <div key={f.id} className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">{f.label}</label>
                        <select value={fieldFilterValues[f.id] || ""}
                          onChange={(e) => setFieldFilterValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          className="border border-gray-300 rounded-lg p-2 text-sm">
                          <option value="">Toutes</option>
                          {f.type === "CHECKBOX" ? (
                            <>
                              <option value="true">Oui</option>
                              <option value="false">Non</option>
                            </>
                          ) : (
                            f.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)
                          )}
                        </select>
                      </div>
                    ))}
                    {activeApplicationFilterCount > 0 && (
                      <button
                        onClick={() => { setApplicationFilters({ status: "", dateFrom: "", dateTo: "" }); setFieldFilterValues({}); }}
                        className="text-xs text-red-600 hover:underline self-start"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions en masse */}
            {selectedApplicationIds.length > 0 && (
              <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{selectedApplicationIds.length} sélectionnée(s)</span>
                  <button onClick={bulkAcceptApplications} className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-green-700">
                    Valider la sélection
                  </button>
                  <button onClick={bulkRejectApplications} className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-red-700">
                    Rejeter la sélection
                  </button>
                  {selectedApplicationIds.length >= 2 && (
                    <button onClick={() => setShowGroupPanel((v) => !v)} className="bg-violet-600 text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-violet-700">
                      👥 Grouper la sélection
                    </button>
                  )}
                </div>

                {showGroupPanel && selectedApplicationIds.length >= 2 && (
                  <div className="mt-2 pt-2 border-t border-yellow-200 flex flex-wrap gap-4">
                    <div className="flex items-end gap-2">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">Nouveau groupe</label>
                        <input type="text" placeholder="Nom du groupe" value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="border border-gray-300 rounded-lg p-2 text-sm" />
                      </div>
                      <button onClick={createApplicationGroup} disabled={!newGroupName.trim()}
                        className="bg-violet-600 text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50">
                        Créer le groupe
                      </button>
                    </div>

                    {applicationGroups.length > 0 && (
                      <div className="flex items-end gap-2">
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 mb-1">Groupe existant</label>
                          <select value={selectedExistingGroupId} onChange={(e) => setSelectedExistingGroupId(e.target.value)}
                            className="border border-gray-300 rounded-lg p-2 text-sm">
                            <option value="">-- Choisir --</option>
                            {applicationGroups.map((g) => (
                              <option key={g._id} value={g._id}>{g.name} ({g.applicationIds.length})</option>
                            ))}
                          </select>
                        </div>
                        <button onClick={addSelectionToExistingGroup} disabled={!selectedExistingGroupId}
                          className="bg-gray-700 text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                          Ajouter au groupe
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Groupes existants de ce programme — gestion minimale (renommer/supprimer) */}
            {applicationGroups.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {applicationGroups.map((g) => (
                  <div key={g._id} className="flex items-center gap-1 bg-violet-50 border border-violet-200 rounded-full pl-3 pr-1 py-1 text-xs">
                    <span className="font-semibold text-violet-800">{g.name}</span>
                    <span className="text-violet-500">({g.applicationIds.length})</span>
                    <button onClick={() => renameApplicationGroup(g._id, g.name)} title="Renommer" className="ml-1 text-violet-600 hover:text-violet-900 px-1">✎</button>
                    <button onClick={() => deleteApplicationGroup(g._id)} title="Supprimer" className="text-red-500 hover:text-red-700 px-1">✕</button>
                  </div>
                ))}
              </div>
            )}

            {applicationsLoading ? (
              <p className="text-gray-500">Chargement...</p>
            ) : applications.length === 0 ? (
              <p className="text-gray-500">Aucune candidature ne correspond à ces critères.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 border text-center">
                        <input type="checkbox"
                          checked={applications.length > 0 && applications.every((a) => selectedApplicationIds.includes(a._id))}
                          onChange={toggleSelectAllOnPage} />
                      </th>
                      <th className="px-3 py-2 border text-left">Candidat</th>
                      <th className="px-3 py-2 border text-left">Email</th>
                      <th className="px-3 py-2 border text-left">Téléphone</th>
                      {customFormFields.map((f) => <th key={f.id} className="px-3 py-2 border text-left">{f.label}</th>)}
                      <th className="px-3 py-2 border text-left">Statut</th>
                      <th className="px-3 py-2 border text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((a) => {
                      const blacklistEntry = findBlacklistMatch(blacklist, {
                        email: a.applicantEmail, phone: a.applicantPhone,
                        firstName: a.applicantFirstName, lastName: a.applicantLastName,
                      });
                      return (
                      <tr key={a._id} className={`cursor-pointer ${blacklistEntry ? "bg-red-50 hover:bg-red-100" : "hover:bg-yellow-50"}`}>
                        <td className="px-3 py-2 border text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedApplicationIds.includes(a._id)}
                            onChange={() => toggleApplicationSelected(a._id)} />
                        </td>
                        <td className="px-3 py-2 border" onClick={() => setSelectedApplicationId(a._id)}>
                          {a.applicantFirstName} {a.applicantLastName}
                          {blacklistEntry && <BlacklistBadge entry={blacklistEntry} />}
                          {(() => {
                            const memberGroups = applicationGroups.filter((g) => g.applicationIds.some((m) => String(m._id) === String(a._id)));
                            return memberGroups.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {memberGroups.map((g) => (
                                  <span key={g._id} className="bg-violet-100 text-violet-700 text-[10px] font-semibold rounded-full px-2 py-0.5">{g.name}</span>
                                ))}
                              </div>
                            ) : null;
                          })()}
                        </td>
                        <td className="px-3 py-2 border" onClick={() => setSelectedApplicationId(a._id)}>{a.applicantEmail}</td>
                        <td className="px-3 py-2 border" onClick={() => setSelectedApplicationId(a._id)}>{a.applicantPhone || "—"}</td>
                        {customFormFields.map((f) => (
                          <td key={f.id} className="px-3 py-2 border" onClick={() => setSelectedApplicationId(a._id)}>{formatResponseValue(f, a.responses?.[f.id])}</td>
                        ))}
                        <td className="px-3 py-2 border" onClick={() => setSelectedApplicationId(a._id)}>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            a.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                            a.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                          }`}>
                            {APPLICATION_STATUS_LABELS[a.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 border">
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteApplication(a._id); }}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Supprimer
                            </button>
                            <ReportVolunteerButton programId={programId} applicationId={a._id} />
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex items-center justify-between mt-3 text-sm">
                  <button onClick={() => loadApplications(applicationsPage - 1)} disabled={applicationsPage <= 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
                    ← Précédent
                  </button>
                  <span className="text-gray-600">
                    Page {applicationsPage} / {applicationsTotalPages} — {applicationsTotal} candidature(s)
                  </span>
                  <button onClick={() => loadApplications(applicationsPage + 1)} disabled={applicationsPage >= applicationsTotalPages}
                    className="px-3 py-1 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "tracking" && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h3 className="font-semibold">Soumissions ({submissions.length})</h3>
                <div className="flex gap-2 flex-wrap">
                  {SUBMISSION_FILTERS.map((f) => (
                    <button key={f.value || "ALL"} onClick={() => setSubmissionFilter(f.value)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                        submissionFilter === f.value
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {submissions.length === 0 ? (
                <p className="text-gray-500">Aucune soumission pour ce filtre.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {pagedSubmissionEntries.map((entry) =>
                      entry.type === "single" ? (
                        <SubmissionCard key={entry.submission._id} s={entry.submission}
                          onApprove={(id) => reviewSubmissionTask(id, "accept")} onReject={rejectSubmissionWithNote} />
                      ) : (
                        <div key={entry.volunteerId} className="border border-gray-200 rounded-xl">
                          <button onClick={() => toggleVolunteerExpanded(entry.volunteerId)}
                            className="w-full text-left bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                            <span><strong>{entry.volunteerName}</strong> <span className="text-sm text-gray-600">— {entry.subs.length} soumissions</span></span>
                            <span className="text-gray-500">{expandedVolunteerIds.has(entry.volunteerId) ? "▲" : "▼"}</span>
                          </button>
                          {expandedVolunteerIds.has(entry.volunteerId) && (
                            <div className="space-y-2 p-3 border-t border-gray-200">
                              {entry.subs.map((s) => (
                                <SubmissionCard key={s._id} s={s}
                                  onApprove={(id) => reviewSubmissionTask(id, "accept")} onReject={rejectSubmissionWithNote} hideVolunteerName />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {submissionEntries.length > SUBMISSIONS_PAGE_SIZE && (
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => setSubmissionsPage((p) => Math.max(1, p - 1))} disabled={submissionsPage <= 1}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm disabled:opacity-40">
                        ← Précédent
                      </button>
                      <span className="text-sm text-gray-500">Page {submissionsPage} / {submissionsTotalPages} — {submissionEntries.length} entrée(s)</span>
                      <button onClick={() => setSubmissionsPage((p) => Math.min(submissionsTotalPages, p + 1))} disabled={submissionsPage >= submissionsTotalPages}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm disabled:opacity-40">
                        Suivant →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 border-t pt-4">
              <div>
                <h3 className="font-semibold">Fin de mission</h3>
                {program.missionsFinalizedAt ? (
                  <p className="text-sm text-gray-500">
                    Missions terminées le {new Date(program.missionsFinalizedAt).toLocaleString("fr-FR")} — plus aucune soumission n'est acceptée.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Tant que ce n'est pas fait, aucun volontaire ne passe automatiquement à "Mission validée" ou "Refusé".
                  </p>
                )}
              </div>
              {!program.missionsFinalizedAt && (
                <button onClick={finalizeMissions} className="bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-orange-700">
                  🏁 Terminer les missions
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <h3 className="font-semibold">Progression par volontaire</h3>
                {programProgress.length > 0 && (
                  <button onClick={exportProgramProgressPdf}
                    className="bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-900">
                    📄 Télécharger en PDF (A4 paysage)
                  </button>
                )}
              </div>
              {programProgress.length === 0 ? (
                <p className="text-gray-500">Aucun volontaire accepté sur ce programme pour l'instant.</p>
              ) : (
                <>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <input type="text" placeholder="🔍 Rechercher (nom, email, téléphone)..." value={progressSearch}
                      onChange={(e) => setProgressSearch(e.target.value)}
                      className="flex-1 min-w-[220px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                    <select value={progressGroupFilter} onChange={(e) => setProgressGroupFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                      <option value="">Tous les groupes</option>
                      {availableProgressGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select value={progressStatutFilter} onChange={(e) => setProgressStatutFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                      <option value="">Tous les statuts</option>
                      <option value="Non disponible">Non disponible</option>
                      <option value="Mission validée">Mission validée</option>
                      <option value="Refusé">Refusé</option>
                    </select>
                  </div>

                  {filteredProgramProgress.length === 0 ? (
                    <p className="text-gray-500">Aucun volontaire ne correspond à ces critères.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 border text-left">Rang</th>
                            <th className="px-3 py-2 border text-left">Volontaire</th>
                            <th className="px-3 py-2 border text-left">Groupe</th>
                            <th className="px-3 py-2 border text-left">Superviseur</th>
                            <th className="px-3 py-2 border text-left">Progression</th>
                            <th className="px-3 py-2 border text-left">Statut mission</th>
                            <th className="px-3 py-2 border text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedProgramProgress.map((p) => (
                            <tr key={p.volunteerId}>
                              <td className="px-3 py-2 border font-bold text-gray-500">{p.rank}</td>
                              <td className="px-3 py-2 border">
                                {p.prenom} {p.nom}
                                <div className="text-xs text-gray-500">{p.email}</div>
                              </td>
                              <td className="px-3 py-2 border">{p.groupNames && p.groupNames.length > 0 ? p.groupNames.join(", ") : "—"}</td>
                              <td className="px-3 py-2 border">{p.supervisorNames && p.supervisorNames.length > 0 ? p.supervisorNames.join(", ") : "—"}</td>
                              <td className="px-3 py-2 border">{p.progress.approved}/{p.progress.totalDue} ({p.progress.percent}%)</td>
                              <td className="px-3 py-2 border">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  p.statut === "Mission validée" ? "bg-green-100 text-green-700" :
                                  p.statut === "Refusé" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                                }`}>
                                  {p.statut}
                                </span>
                              </td>
                              <td className="px-3 py-2 border">
                                <ReportVolunteerButton programId={programId} volunteerId={p.volunteerId} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {filteredProgramProgress.length > PROGRESS_PAGE_SIZE && (
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => setProgressPage((p) => Math.max(1, p - 1))} disabled={progressPage <= 1}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm disabled:opacity-40">
                        ← Précédent
                      </button>
                      <span className="text-sm text-gray-500">Page {progressPage} / {progressTotalPages} — {filteredProgramProgress.length} volontaire(s)</span>
                      <button onClick={() => setProgressPage((p) => Math.min(progressTotalPages, p + 1))} disabled={progressPage >= progressTotalPages}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm disabled:opacity-40">
                        Suivant →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Superviseurs de ce programme</h3>
              {(() => {
                const currentSupervisors = staffUsers.filter((u) =>
                  u.role === "SUPERVISEUR" && (u.supervisedAssignments || []).some((a) => String(a.programId) === String(programId))
                );
                return currentSupervisors.length === 0 ? (
                  <p className="text-gray-500 mb-3">Aucun superviseur affecté à ce programme.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {currentSupervisors.map((u) => {
                      const assignment = (u.supervisedAssignments || []).find((a) => String(a.programId) === String(programId));
                      const names = (assignment?.volunteerIds || []).map((vid) => {
                        const p = programProgress.find((pp) => String(pp.volunteerId) === String(vid));
                        return p ? `${p.prenom} ${p.nom}` : vid;
                      });
                      return (
                        <div key={u._id} className="flex items-center justify-between border border-gray-200 rounded-lg p-2 text-sm">
                          <div><strong>{u.name}</strong> <span className="text-gray-500">({u.email})</span> — supervise : {names.join(", ") || "aucun"}</div>
                          <button onClick={() => unassignSupervisor(u._id)} className="text-red-600 hover:underline text-xs">Retirer</button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <select value={selectedSupervisorId} onChange={(e) => setSelectedSupervisorId(e.target.value)}
                className="border border-gray-300 rounded-xl p-2 text-sm w-full mb-2">
                <option value="">-- Affecter un superviseur --</option>
                {staffUsers.filter((u) => u.role === "SUPERVISEUR").map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>

              {selectedSupervisorId && (
                <div className="border border-gray-200 rounded-xl p-3">
                  {applicationGroups.length > 0 && (
                    <div className="flex items-end gap-2 mb-3">
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-500 mb-1">Affecter depuis un groupe</label>
                        <select onChange={(e) => { if (e.target.value) applyGroupToSupervisorSelection(e.target.value); e.target.value = ""; }}
                          defaultValue="" className="border border-gray-300 rounded-lg p-2 text-sm">
                          <option value="">-- Choisir un groupe --</option>
                          {applicationGroups.map((g) => {
                            const acceptedCount = g.applicationIds.filter((m) => m.status === "ACCEPTED" && m.volunteerId).length;
                            return (
                              <option key={g._id} value={g._id}>
                                {g.name} ({acceptedCount}/{g.applicationIds.length} membres acceptés)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  )}
                  <p className="text-sm font-semibold mb-2">Volontaires à superviser :</p>
                  {programProgress.length === 0 ? (
                    <p className="text-gray-500 text-sm mb-3">Aucun volontaire accepté sur ce programme pour l'instant.</p>
                  ) : (
                    <div className="space-y-1 mb-3">
                      {programProgress.map((p) => (
                        <label key={p.volunteerId} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={selectedSupervisedVolunteerIds.includes(p.volunteerId)}
                            onChange={(e) => setSelectedSupervisedVolunteerIds((prev) =>
                              e.target.checked ? [...prev, p.volunteerId] : prev.filter((id) => id !== p.volunteerId)
                            )} />
                          {p.prenom} {p.nom}
                        </label>
                      ))}
                    </div>
                  )}
                  <button onClick={assignSupervisor}
                    className="bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-800">
                    Affecter
                  </button>
                </div>
              )}
            </div>

            {/* Réservé ADMIN — un EDITOR affecté obtient exactement les
                mêmes pouvoirs qu'un ADMIN sur ce programme (voir
                canReviewProgram côté backend), donc seul un ADMIN peut
                décider de cette affectation. */}
            {currentRole === "ADMIN" && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Éditeurs affectés à ce programme</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Un compte EDITOR ne gère plus tous les programmes par défaut : il ne peut
                  gérer que ceux affectés ici, mais y a alors exactement les mêmes pouvoirs
                  qu'un ADMIN (réglages, tâches, candidatures, groupes, suivi, finaliser les
                  missions...).
                </p>
                {(() => {
                  const currentEditors = staffUsers.filter((u) =>
                    u.role === "EDITOR" && (program?.editorIds || []).some((id) => String(id) === String(u._id))
                  );
                  return currentEditors.length === 0 ? (
                    <p className="text-gray-500 mb-3">Aucun éditeur affecté à ce programme.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {currentEditors.map((u) => (
                        <div key={u._id} className="flex items-center justify-between border border-gray-200 rounded-lg p-2 text-sm">
                          <div><strong>{u.name}</strong> <span className="text-gray-500">({u.email})</span></div>
                          <button onClick={() => toggleEditorAccess(u._id, false)} className="text-red-600 hover:underline text-xs">Retirer</button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="flex gap-2">
                  <select value={selectedEditorId} onChange={(e) => setSelectedEditorId(e.target.value)}
                    className="border border-gray-300 rounded-xl p-2 text-sm flex-1">
                    <option value="">-- Choisir un éditeur --</option>
                    {staffUsers.filter((u) => u.role === "EDITOR").map((u) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  <button onClick={() => toggleEditorAccess(selectedEditorId, true)} disabled={!selectedEditorId}
                    className="bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50">
                    Affecter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "partners" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Barre des partenaires de ce programme</h3>
              <p className="text-xs text-gray-500 mb-3">
                Une seule image (bannière/collage déjà composé), affichée tout en bas du tableau de bord
                des partenaires suivant CE programme — et en pied de page de chaque page de leur rapport
                PDF. Propre à ce programme : les partenaires d'un autre programme ne la verront pas.
              </p>
              <div className="flex items-center gap-4">
                <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center" style={{ minHeight: 90, minWidth: 160, padding: 10 }}>
                  {program?.partnersBarImageUrl ? (
                    <img src={program.partnersBarImageUrl} alt="Barre des partenaires" style={{ maxHeight: 100, maxWidth: 260, objectFit: "contain" }} />
                  ) : (
                    <span className="text-xs text-gray-400">Aucune image définie</span>
                  )}
                </div>
                <label className="bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-800 cursor-pointer">
                  {uploadingPartnersBar ? "Envoi..." : program?.partnersBarImageUrl ? "Remplacer l'image" : "Envoyer une image"}
                  <input type="file" accept="image/*" onChange={(e) => uploadPartnersBar(e.target.files?.[0])} disabled={uploadingPartnersBar} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Partenaires de ce programme</h3>
              {(() => {
                const currentPartners = staffUsers.filter((u) =>
                  u.role === "PARTENAIRE" && (u.partnerProgramIds || []).some((id) => String(id) === String(programId))
                );
                return currentPartners.length === 0 ? (
                  <p className="text-gray-500 mb-3">Aucun partenaire affecté à ce programme.</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {currentPartners.map((u) => {
                      const activity = partnerActivity.find((a) => String(a.partnerId) === String(u._id));
                      return (
                        <div key={u._id} className="border border-gray-200 rounded-lg p-2 text-sm">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              {u.partnerLogoUrl && (
                                <img src={u.partnerLogoUrl} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" />
                              )}
                              <div>
                                <strong>{u.name}</strong> <span className="text-gray-500">({u.email})</span>
                                {activity && (
                                  activity.isOnline ? (
                                    <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">● En ligne</span>
                                  ) : (
                                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Vu {formatRelativeActivity(activity.lastActiveAt)}</span>
                                  )
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {activity && (
                                <button onClick={() => toggleActivityDetail(u._id)} className="text-xs text-blue-600 hover:underline">
                                  {activity.totalActions} action(s) — {expandedActivityPartnerId === u._id ? "masquer" : "détail"}
                                </button>
                              )}
                              <button onClick={() => togglePartnerAccess(u._id, false)} className="text-red-600 hover:underline text-xs">Retirer</button>
                            </div>
                          </div>
                          {expandedActivityPartnerId === u._id && (
                            <div className="mt-2 bg-gray-50 rounded-lg p-2">
                              {partnerActivityTimeline.length === 0 ? (
                                <p className="text-xs text-gray-500">Aucune activité sur ce programme.</p>
                              ) : (
                                <ul className="space-y-1 text-xs">
                                  {partnerActivityTimeline.map((it) => (
                                    <li key={it._id} className="flex justify-between border-b border-gray-200 pb-1">
                                      <span>
                                        <strong>{ACTIVITY_ACTION_LABELS[it.action] || it.action}</strong>
                                        {it.metadata?.search && <span className="text-gray-400"> (recherche : "{it.metadata.search}")</span>}
                                      </span>
                                      <span className="text-gray-400 whitespace-nowrap ml-2">{new Date(it.createdAt).toLocaleString("fr-FR")}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <div className="flex gap-2">
                <select value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="border border-gray-300 rounded-xl p-2 text-sm flex-1">
                  <option value="">-- Choisir un partenaire --</option>
                  {staffUsers.filter((u) => u.role === "PARTENAIRE").map((u) => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <button onClick={() => togglePartnerAccess(selectedPartnerId, true)} disabled={!selectedPartnerId}
                  className="bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50">
                  Ajouter
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Commentaires des partenaires ({partnerComments.length})</h3>
              {partnerComments.length === 0 ? (
                <p className="text-gray-500">Aucun commentaire pour l'instant.</p>
              ) : (
                <div className="space-y-2">
                  {partnerComments.map((c) => (
                    <div key={c._id} className="border border-gray-200 rounded-lg p-3 text-sm">
                      <div className="text-gray-500 text-xs mb-1">
                        {c.partnerName} ({c.partnerEmail}) — {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                      <p className="whitespace-pre-line mb-2">{c.text}</p>
                      {c.reply ? (
                        <div className="bg-gray-50 rounded-lg p-2 text-xs">
                          <strong>Réponse envoyée</strong>
                          {c.repliedAt && <span className="text-gray-400 ml-1">({new Date(c.repliedAt).toLocaleDateString("fr-FR")})</span>}
                          <p className="whitespace-pre-line mt-1">{c.reply}</p>
                        </div>
                      ) : (
                        <button onClick={() => replyToComment(c._id)} className="text-xs text-gray-700 font-semibold hover:underline">
                          Répondre
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedApplicationId(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3">
              {selectedApplication.applicantFirstName} {selectedApplication.applicantLastName}
            </h3>
            <dl className="text-sm space-y-1 mb-4">
              <div><dt className="inline font-semibold">Email : </dt><dd className="inline">{selectedApplication.applicantEmail}</dd></div>
              <div><dt className="inline font-semibold">Téléphone : </dt><dd className="inline">{selectedApplication.applicantPhone || "—"}</dd></div>
              {customFormFields.map((f) => (
                <div key={f.id}>
                  <dt className="font-semibold">{f.label}</dt>
                  <dd>{formatResponseValue(f, selectedApplication.responses?.[f.id])}</dd>
                </div>
              ))}
            </dl>
            {selectedApplication.status === "PENDING" ? (
              <div className="flex gap-3">
                <button onClick={() => reviewApplication(selectedApplication._id, "accept")}
                  className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl hover:bg-green-700">
                  Accepter
                </button>
                <button onClick={() => reviewApplication(selectedApplication._id, "reject")}
                  className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl hover:bg-red-700">
                  Rejeter
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Statut : {APPLICATION_STATUS_LABELS[selectedApplication.status]}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <button onClick={() => setSelectedApplicationId(null)} className="text-sm text-gray-500 hover:underline">
                Fermer
              </button>
              <button onClick={() => deleteApplication(selectedApplication._id)} className="text-sm text-red-600 hover:underline">
                🗑 Supprimer cette candidature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
