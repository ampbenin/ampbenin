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
const emptyTaskForm = { title: "", description: "", recurrence: "ONCE", proofFields: [] };
const emptyProofFieldForm = {
  label: "", type: "TEXTAREA", required: true, optionsText: "",
  minLength: "", maxLength: "", pattern: "", min: "", max: "", maxImages: "",
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
];

export default function VolunteerProgramEditor({ programId, onBack }) {
  const [activeTab, setActiveTab] = useState("info");
  const [program, setProgram] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  const [pendingSubmissions, setPendingSubmissions] = useState([]);

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

      const apps = await adminFetch(`/api/volunteer-applications?programId=${programId}`);
      setApplications(apps?.items || []);

      const templates = await adminFetch("/api/volunteer-form-templates");
      setFormTemplates(templates?.items || []);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
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

    const task = {
      id: editingTaskId || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: taskForm.title,
      description: taskForm.description,
      recurrence: taskForm.recurrence,
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
      conditional: { fieldId: "", values: [] },
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
    });
  };

  const removeProofFieldAt = (index) => {
    setTaskForm({ ...taskForm, proofFields: taskForm.proofFields.filter((_, i) => i !== index) });
    if (editingProofFieldIndex === index) {
      setEditingProofFieldIndex(null);
      setProofFieldForm(emptyProofFieldForm);
    }
  };

  const loadTracking = async () => {
    try {
      const [progress, submissions] = await Promise.all([
        adminFetch(`/api/volunteer-tasks/programs/${programId}/progress`),
        adminFetch(`/api/volunteer-tasks/submissions?programId=${programId}&status=PENDING`),
      ]);
      setProgramProgress(progress?.items || []);
      setPendingSubmissions(submissions?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "tracking") loadTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  if (loading) return <p className="text-center text-gray-500 p-6">Chargement...</p>;
  if (error || !program) return <p className="text-center text-red-600 p-6">{error || "Programme introuvable"}</p>;

  const isTextType = ["TEXT", "TEXTAREA", "EMAIL", "PHONE"].includes(fieldForm.type);
  const pendingApplications = applications.filter((a) => a.status === "PENDING");
  const selectedApplication = applications.find((a) => a._id === selectedApplicationId) || null;
  const editingField = editingFieldId ? formFields.find((f) => f.id === editingFieldId) : null;
  const isEditingLocked = !!editingField?.locked;
  const customFormFields = formFields.filter((f) => !APPLICANT_FIELD_IDS.includes(f.id));
  const fieldsById = new Map(formFields.map((f) => [f.id, f]));
  const editingFieldIndex = editingFieldId ? formFields.findIndex((f) => f.id === editingFieldId) : formFields.length;
  const eligibleTriggerFields = formFields.filter(
    (f, idx) => CONDITIONAL_TRIGGER_TYPES.includes(f.type) && idx < editingFieldIndex
  );
  const conditionalTriggerField = fieldsById.get(fieldForm.conditionalFieldId);

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
            {t.value === "applications" && pendingApplications.length > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">{pendingApplications.length}</span>
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
                    <span className="text-xs text-gray-500 ml-2">{RECURRENCE_LABELS[task.recurrence]}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {task.proofForm?.fields?.length > 0
                        ? `${task.proofForm.fields.length} champ(s) de preuve`
                        : "Formulaire de preuve par défaut (Description)"}
                    </span>
                    {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
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
                    {taskForm.proofFields.map((f, index) => (
                      <div key={f.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
                        <div className="flex-1 text-sm">
                          <strong>{f.label}</strong>
                          <span className="text-xs text-gray-500 ml-2">
                            {PROOF_FIELD_TYPES.find((t) => t.value === f.type)?.label} {f.required && "· obligatoire"}
                            {f.type === "IMAGE" && f.validation?.maxImages ? ` · max ${f.validation.maxImages}` : ""}
                          </span>
                        </div>
                        <button type="button" onClick={() => editProofFieldAt(index)} className="text-blue-600 hover:underline text-xs">Éditer</button>
                        <button type="button" onClick={() => removeProofFieldAt(index)} className="text-red-600 hover:underline text-xs">Suppr.</button>
                      </div>
                    ))}
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
            <h3 className="font-semibold mb-3">Candidatures ({applications.length})</h3>
            {applications.length === 0 ? (
              <p className="text-gray-500">Aucune candidature pour l'instant.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 border text-left">Candidat</th>
                      <th className="px-3 py-2 border text-left">Email</th>
                      <th className="px-3 py-2 border text-left">Téléphone</th>
                      {customFormFields.map((f) => <th key={f.id} className="px-3 py-2 border text-left">{f.label}</th>)}
                      <th className="px-3 py-2 border text-left">Statut</th>
                      <th className="px-3 py-2 border text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((a) => (
                      <tr key={a._id} onClick={() => setSelectedApplicationId(a._id)}
                        className="cursor-pointer hover:bg-yellow-50">
                        <td className="px-3 py-2 border">{a.applicantFirstName} {a.applicantLastName}</td>
                        <td className="px-3 py-2 border">{a.applicantEmail}</td>
                        <td className="px-3 py-2 border">{a.applicantPhone || "—"}</td>
                        {customFormFields.map((f) => (
                          <td key={f.id} className="px-3 py-2 border">{formatResponseValue(f, a.responses?.[f.id])}</td>
                        ))}
                        <td className="px-3 py-2 border">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            a.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                            a.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                          }`}>
                            {APPLICATION_STATUS_LABELS[a.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 border">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteApplication(a._id); }}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "tracking" && (
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold mb-3">Soumissions en attente ({pendingSubmissions.length})</h3>
              {pendingSubmissions.length === 0 ? (
                <p className="text-gray-500">Aucune soumission en attente.</p>
              ) : (
                <div className="space-y-2">
                  {pendingSubmissions.map((s) => (
                    <div key={s._id} className="border border-gray-200 rounded-xl p-3">
                      <div className="flex justify-between items-start gap-3 flex-wrap">
                        <div>
                          <strong>{s.volunteerName}</strong> <span className="text-sm text-gray-600">— {s.taskTitle}</span>
                          {s.occurrenceDate && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({new Date(s.occurrenceDate).toLocaleDateString("fr-FR")})
                            </span>
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
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => reviewSubmissionTask(s._id, "accept")}
                            className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-green-700">
                            Approuver
                          </button>
                          <button onClick={() => reviewSubmissionTask(s._id, "reject")}
                            className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-lg hover:bg-red-700">
                            Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3">Progression par volontaire</h3>
              {programProgress.length === 0 ? (
                <p className="text-gray-500">Aucun volontaire accepté sur ce programme pour l'instant.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 border text-left">Volontaire</th>
                        <th className="px-3 py-2 border text-left">Progression</th>
                        <th className="px-3 py-2 border text-left">Statut mission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programProgress.map((p) => (
                        <tr key={p.volunteerId}>
                          <td className="px-3 py-2 border">
                            {p.prenom} {p.nom}
                            <div className="text-xs text-gray-500">{p.email}</div>
                          </td>
                          <td className="px-3 py-2 border">{p.progress.approved}/{p.progress.totalDue} ({p.progress.percent}%)</td>
                          <td className="px-3 py-2 border">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              p.statut === "Mission validée" ? "bg-green-100 text-green-700" :
                              p.statut === "Refusé" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                            }`}>
                              {p.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
