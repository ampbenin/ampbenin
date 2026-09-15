// Gestion du recrutement pour UNE offre (JobPosting) : construction du
// formulaire de candidature interne + suivi du pipeline de candidatures en
// 3 étapes (Reçues → En étude → Retenues/Refusées, décision utilisateur
// 2026-09-15). Vraie page dédiée (pas une modale, retour utilisateur
// 2026-09-15 : "une vraie page de dashboard qui s'ouvre comme le cas avec
// les programmes") — même principe que VolunteerProgramEditor.jsx, rendue
// à la place de la liste par JobPostingsManager.jsx quand une offre est
// sélectionnée.
//
// Le formulaire n'édite QUE les champs personnalisés (job.applicationForm.fields) —
// les 4 champs verrouillés (prénom/nom/email/téléphone) sont injectés
// automatiquement côté serveur (voir jobApplicationController.js#ensureBuiltinFields),
// jamais stockés ici, même convention que VolunteerProgramEditor.jsx.
//
// Import/enregistrement de modèles de formulaire : réutilise la même
// bibliothèque que les programmes de volontariat (/api/volunteer-form-templates,
// décision utilisateur 2026-09-15 — bibliothèque partagée plutôt que
// dupliquée par domaine).
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texte court' },
  { value: 'TEXTAREA', label: 'Texte long' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Téléphone' },
  { value: 'NUMBER', label: 'Nombre' },
  { value: 'DATE', label: 'Date' },
  { value: 'SELECT', label: 'Choix (liste déroulante)' },
  { value: 'CHECKBOX', label: 'Case à cocher' },
];

const STATUS_LABELS = {
  RECEIVED: 'Reçue', UNDER_REVIEW: 'En étude', RETAINED: 'Retenue', REJECTED: 'Refusée',
};
const STATUS_COLORS = {
  RECEIVED: 'bg-gray-200 text-gray-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  RETAINED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const TABS = [
  { value: 'formulaire', label: 'Formulaire', icon: '📝' },
  { value: 'candidatures', label: 'Candidatures', icon: '📋' },
];

// Sous-champs conditionnels ("Afficher ce champ seulement si...") — même
// logique que VolunteerProgramEditor.jsx (un champ ne peut dépendre que
// d'un champ SELECT/CHECKBOX déjà présent AVANT lui dans la liste ; un
// champ avec des dépendants ne peut pas être déplacé après eux). Absente de
// la première version de ce constructeur (retour utilisateur 2026-09-16 :
// "les sous champs qui s'affichent en fonction d'une réponse... n'est pas
// appliqué au niveau de recrutement") — le rendu candidat
// (JobApplicationForm.jsx) gérait déjà `conditional`, seule l'UI admin pour
// le configurer manquait ici.
const CONDITIONAL_TRIGGER_TYPES = ['SELECT', 'CHECKBOX'];

const emptyFieldForm = {
  label: '', type: 'TEXT', required: false, optionsText: '',
  minLength: '', maxLength: '', pattern: '', min: '', max: '',
  conditionalFieldId: '', conditionalValues: [],
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

export default function JobRecruitmentManager({ jobId, onBack }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subTab, setSubTab] = useState('formulaire');
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    adminFetch(`/api/cms/jobs/admin/${jobId}`)
      .then(setJob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [jobId]);

  const applyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/recrutement/postuler/${jobId}`;
  const copyLink = () => {
    navigator.clipboard?.writeText(applyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-violet-50 min-h-screen rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto flex-wrap gap-2">
        <button onClick={onBack} className="text-blue-600 hover:underline">← Retour aux offres</button>
        <h2 className="text-xl font-extrabold text-yellow-700">{job?.title || '...'}</h2>
        <button onClick={copyLink}
          className={`px-3 py-1 rounded-lg text-white text-sm ${copied ? 'bg-green-600' : 'bg-violet-600 hover:bg-violet-700'}`}>
          {copied ? '✓ Lien copié' : '🔗 Copier le lien de candidature'}
        </button>
      </div>

      <div className="flex gap-2 justify-center mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setSubTab(t.value)}
            className={`px-4 py-2 rounded-xl font-semibold ${
              subTab === t.value ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 hover:bg-yellow-50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        {loading && <p className="text-gray-500">Chargement...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {job && subTab === 'formulaire' && <FormBuilderTab job={job} applyUrl={applyUrl} onSaved={load} />}
        {job && subTab === 'candidatures' && <ApplicationsTab job={job} />}
      </div>
    </div>
  );
}

/* -------------------- Onglet Formulaire -------------------- */
function FormBuilderTab({ job, applyUrl, onSaved }) {
  const [fields, setFields] = useState(job.applicationForm?.fields || []);
  const [estimatedDuration, setEstimatedDuration] = useState(job.applicationForm?.estimatedDuration || '');
  const [backgroundColor, setBackgroundColor] = useState(job.applicationForm?.backgroundColor || '');
  const [textColor, setTextColor] = useState(job.applicationForm?.textColor || '');
  const [templates, setTemplates] = useState([]);
  const [importTemplateId, setImportTemplateId] = useState('');
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [fieldForm, setFieldForm] = useState(emptyFieldForm);

  useEffect(() => {
    setFields(job.applicationForm?.fields || []);
    setEstimatedDuration(job.applicationForm?.estimatedDuration || '');
    setBackgroundColor(job.applicationForm?.backgroundColor || '');
    setTextColor(job.applicationForm?.textColor || '');
  }, [job]);

  useEffect(() => {
    adminFetch('/api/volunteer-form-templates').then((data) => setTemplates(data?.items || [])).catch(console.error);
  }, []);

  // Point d'enregistrement UNIQUE pour tout applicationForm : le backend
  // remplace le sous-document entier à chaque PUT (Mongoose $set sur la clé
  // top-level "applicationForm"), donc omettre un champ ici l'effacerait —
  // chaque appel repart toujours de l'état local complet, en écrasant
  // seulement ce que `patch` fournit explicitement. Chaque ajout/édition/
  // réordonnancement/suppression de champ ou changement de couleur
  // enregistre immédiatement (pas de bouton "Enregistrer" séparé), même
  // comportement que VolunteerProgramEditor.jsx#saveFormFields/saveBrandColor.
  const persist = async (patch) => {
    const next = {
      fields: patch.fields ?? fields,
      estimatedDuration: patch.estimatedDuration ?? estimatedDuration,
      backgroundColor: patch.backgroundColor ?? backgroundColor,
      textColor: patch.textColor ?? textColor,
    };
    try {
      const updated = await adminFetch(`/api/cms/jobs/admin/${job._id}`, {
        method: 'PUT',
        body: JSON.stringify({ applicationForm: next }),
      });
      setFields(updated.applicationForm?.fields ?? next.fields);
      setEstimatedDuration(updated.applicationForm?.estimatedDuration ?? next.estimatedDuration);
      setBackgroundColor(updated.applicationForm?.backgroundColor ?? next.backgroundColor);
      setTextColor(updated.applicationForm?.textColor ?? next.textColor);
      onSaved?.();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'enregistrement du formulaire');
    }
  };
  const saveFields = (nextFields) => persist({ fields: nextFields });

  const saveEstimatedDuration = async (e) => {
    e.preventDefault();
    await persist({ estimatedDuration });
  };

  const saveAppearance = (patch) => persist(patch);

  const isTextType = ['TEXT', 'TEXTAREA', 'EMAIL', 'PHONE'].includes(fieldForm.type);
  const fieldsById = new Map(fields.map((f) => [f.id, f]));
  const editingFieldIndex = editingFieldId ? fields.findIndex((f) => f.id === editingFieldId) : fields.length;
  const eligibleTriggerFields = fields.filter(
    (f, idx) => CONDITIONAL_TRIGGER_TYPES.includes(f.type) && idx < editingFieldIndex
  );
  const conditionalTriggerField = fieldsById.get(fieldForm.conditionalFieldId);

  const submitField = async (e) => {
    e.preventDefault();
    if (!fieldForm.label.trim()) return;

    const field = {
      id: editingFieldId || `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      label: fieldForm.label,
      type: fieldForm.type,
      required: fieldForm.required,
      locked: false,
      options: fieldForm.type === 'SELECT'
        ? fieldForm.optionsText.split(',').map((o) => o.trim()).filter(Boolean)
        : [],
      validation: {
        minLength: fieldForm.minLength ? Number(fieldForm.minLength) : null,
        maxLength: fieldForm.maxLength ? Number(fieldForm.maxLength) : null,
        pattern: fieldForm.pattern || '',
        min: fieldForm.min ? Number(fieldForm.min) : null,
        max: fieldForm.max ? Number(fieldForm.max) : null,
      },
      conditional: !fieldForm.conditionalFieldId
        ? { fieldId: '', values: [] }
        : { fieldId: fieldForm.conditionalFieldId, values: fieldForm.conditionalValues },
    };

    const nextFields = editingFieldId
      ? fields.map((f) => (f.id === editingFieldId ? field : f))
      : [...fields, field];

    await saveFields(nextFields);
    setFieldForm(emptyFieldForm);
    setEditingFieldId(null);
  };

  const editField = (field) => {
    setEditingFieldId(field.id);
    setFieldForm({
      label: field.label,
      type: field.type,
      required: field.required,
      optionsText: (field.options || []).join(', '),
      minLength: field.validation?.minLength ?? '',
      maxLength: field.validation?.maxLength ?? '',
      pattern: field.validation?.pattern || '',
      min: field.validation?.min ?? '',
      max: field.validation?.max ?? '',
      conditionalFieldId: field.conditional?.fieldId || '',
      conditionalValues: field.conditional?.values || [],
    });
  };

  const deleteField = async (fieldId) => {
    if (!confirm('Supprimer ce champ du formulaire ?')) return;
    const dependents = fields.filter((f) => f.conditional?.fieldId === fieldId);
    const remaining = fields
      .filter((f) => f.id !== fieldId)
      .map((f) => (f.conditional?.fieldId === fieldId ? { ...f, conditional: { fieldId: '', values: [] } } : f));

    await saveFields(remaining);
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

  const moveField = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    if (direction === -1 && !canMoveFieldUp(fields, index)) return;
    if (direction === 1 && !canMoveFieldDown(fields, index)) return;
    const reordered = [...fields];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    await saveFields(reordered);
  };

  const importTemplate = async () => {
    const template = templates.find((t) => t._id === importTemplateId);
    if (!template) return;

    const idMap = new Map();
    const imported = template.fields.map((f, i) => {
      const newId = `f_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;
      idMap.set(f.id, newId);
      return { ...f, id: newId };
    });
    imported.forEach((f) => {
      if (f.conditional?.fieldId) {
        f.conditional = { ...f.conditional, fieldId: idMap.get(f.conditional.fieldId) || '' };
      }
    });

    setImportTemplateId('');
    await saveFields([...fields, ...imported]);
  };

  const saveAsTemplate = async () => {
    const customFields = fields.filter((f) => !f.locked);
    if (customFields.length === 0) {
      alert('Ajoutez au moins un champ avant d\'enregistrer ce formulaire comme modèle.');
      return;
    }
    const name = window.prompt('Nom du modèle :', job.title ? `Formulaire — ${job.title}` : '');
    if (!name) return;
    try {
      await adminFetch('/api/volunteer-form-templates', {
        method: 'POST',
        body: JSON.stringify({ name, fields: customFields }),
      });
      const data = await adminFetch('/api/volunteer-form-templates');
      setTemplates(data?.items || []);
      alert('Modèle enregistré — disponible pour import dans tout autre programme ou offre.');
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'enregistrement du modèle');
    }
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-gray-50 rounded flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">Lien du formulaire :</span>
        <code className="text-sm bg-white border px-2 py-1 rounded flex-1 min-w-0 overflow-x-auto whitespace-nowrap">{applyUrl}</code>
        <button onClick={() => navigator.clipboard?.writeText(applyUrl)} className="px-3 py-1 border rounded text-sm">Copier</button>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        Prénom, nom, email et téléphone sont toujours demandés automatiquement — ajoutez ici uniquement les questions spécifiques à cette offre.
      </p>

      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-700">Couleur du formulaire</label>
        <p className="text-xs text-gray-500 mb-1">Fond et texte du formulaire de candidature plein écran vu par le candidat — propres à cette offre.</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="text-xs text-gray-500 block">Fond</label>
            <input type="color" value={backgroundColor || '#1B4332'}
              onChange={(e) => saveAppearance({ backgroundColor: e.target.value })}
              className="w-11 h-11 rounded border border-gray-300 cursor-pointer" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">Texte</label>
            <input type="color" value={textColor || '#FFFFFF'}
              onChange={(e) => saveAppearance({ textColor: e.target.value })}
              className="w-11 h-11 rounded border border-gray-300 cursor-pointer" />
          </div>
          {(backgroundColor || textColor) && (
            <button type="button" onClick={() => saveAppearance({ backgroundColor: '', textColor: '' })}
              className="text-sm text-blue-600 hover:underline">
              Réinitialiser (couleurs par défaut)
            </button>
          )}
        </div>
      </div>

      <form onSubmit={saveEstimatedDuration} className="flex gap-2 items-center mb-4">
        <input type="text" placeholder="Durée estimée affichée au candidat (ex : 5 minutes)"
          value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)}
          className="flex-1 border border-gray-300 rounded-xl p-2" />
        <button type="submit" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl text-sm">
          Enregistrer la durée
        </button>
      </form>

      <div className="flex gap-2 items-center flex-wrap mb-4">
        <select value={importTemplateId} onChange={(e) => setImportTemplateId(e.target.value)}
          className="border border-gray-300 rounded-xl p-2 flex-1">
          <option value="">-- Importer un modèle de formulaire --</option>
          {templates.map((t) => (
            <option key={t._id} value={t._id}>{t.name} ({t.fields.length} champ{t.fields.length > 1 ? 's' : ''})</option>
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
        {fields.length === 0 && <p className="text-gray-500">Aucun champ personnalisé pour l'instant.</p>}
        {fields.map((field, index) => {
          const depth = getFieldDepth(field, fieldsById);
          const parentField = field.conditional?.fieldId ? fieldsById.get(field.conditional.fieldId) : null;
          return (
            <div key={field.id} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3"
              style={{ marginLeft: depth * 24 }}>
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveField(index, -1)} disabled={!canMoveFieldUp(fields, index)}
                  className="disabled:opacity-30">▲</button>
                <button type="button" onClick={() => moveField(index, 1)} disabled={!canMoveFieldDown(fields, index)}
                  className="disabled:opacity-30">▼</button>
              </div>
              <div className="flex-1">
                <strong>{field.label}</strong>
                <span className="text-xs text-gray-500 ml-2">
                  {FIELD_TYPES.find((t) => t.value === field.type)?.label} {field.required && '· obligatoire'}
                </span>
                {parentField && (
                  <div className="text-xs text-blue-600">↳ Visible si « {parentField.label} » = {(field.conditional.values || []).join(', ')}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => editField(field)} className="text-blue-600 hover:underline text-sm">Éditer</button>
                <button type="button" onClick={() => deleteField(field.id)} className="text-red-600 hover:underline text-sm">Supprimer</button>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submitField} className="border-t pt-4 mt-4 space-y-3">
        <h3 className="font-semibold">{editingFieldId ? 'Modifier le champ' : 'Ajouter un champ'}</h3>
        <input type="text" placeholder="Libellé de la question" value={fieldForm.label}
          onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })} required
          className="w-full border border-gray-300 rounded-xl p-2" />
        <div className="grid grid-cols-2 gap-3">
          <select value={fieldForm.type}
            onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}
            className="border border-gray-300 rounded-xl p-2">
            {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={fieldForm.required}
              onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })} />
            Obligatoire
          </label>
        </div>
        {fieldForm.type === 'SELECT' && (
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
        {fieldForm.type === 'NUMBER' && (
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Min" value={fieldForm.min}
              onChange={(e) => setFieldForm({ ...fieldForm, min: e.target.value })}
              className="border border-gray-300 rounded-xl p-2" />
            <input type="number" placeholder="Max" value={fieldForm.max}
              onChange={(e) => setFieldForm({ ...fieldForm, max: e.target.value })}
              className="border border-gray-300 rounded-xl p-2" />
          </div>
        )}

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
              {(conditionalTriggerField.type === 'CHECKBOX' ? ['true', 'false'] : conditionalTriggerField.options || []).map((opt) => (
                <label key={opt} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={fieldForm.conditionalValues.includes(opt)}
                    onChange={() => toggleConditionalValue(opt)} />
                  {conditionalTriggerField.type === 'CHECKBOX' ? (opt === 'true' ? 'si coché' : 'si non coché') : opt}
                </label>
              ))}
            </div>
          )}
          {eligibleTriggerFields.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Ajoutez d'abord un champ "Choix" ou "Case à cocher" avant celui-ci pour pouvoir le conditionner.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700">
            {editingFieldId ? 'Enregistrer le champ' : 'Ajouter le champ'}
          </button>
          {editingFieldId && (
            <button type="button" onClick={() => { setEditingFieldId(null); setFieldForm(emptyFieldForm); }}
              className="px-4 py-2 border rounded-xl">
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* -------------------- Onglet Candidatures -------------------- */
function ApplicationsTab({ job }) {
  const [statusFilter, setStatusFilter] = useState('RECEIVED');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [categories, setCategories] = useState([]);
  const [retainForm, setRetainForm] = useState({ category: '', notes: '' });
  const [notesDraft, setNotesDraft] = useState('');

  const load = () => {
    const params = new URLSearchParams({ jobPostingId: job._id });
    if (statusFilter) params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());
    adminFetch(`/api/job-applications?${params.toString()}`).then((data) => setItems(data?.items || [])).catch(console.error);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter, search, job._id]);
  useEffect(() => {
    adminFetch('/api/personnel/categories').then((data) => setCategories(data?.categories || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setNotesDraft(selected?.staffNotes || '');
    setRetainForm({ category: '', notes: '' });
  }, [selected?._id]);

  const act = async (id, action, body) => {
    try {
      await adminFetch(`/api/job-applications/${id}/${action}`, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
      setSelected(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const saveNotes = async () => {
    try {
      await adminFetch(`/api/job-applications/${selected._id}/notes`, { method: 'PATCH', body: JSON.stringify({ staffNotes: notesDraft }) });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const retain = async (e) => {
    e.preventDefault();
    if (!retainForm.category.trim()) return alert('Catégorie d\'agent requise');
    await act(selected._id, 'retain', retainForm);
  };

  const del = async (id) => {
    if (!confirm('Supprimer définitivement cette candidature ?')) return;
    await adminFetch(`/api/job-applications/${id}`, { method: 'DELETE' });
    setSelected(null);
    load();
  };

  const fieldLabelById = new Map((job.applicationForm?.fields || []).map((f) => [f.id, f.label]));

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          ['RECEIVED', 'Reçues'],
          ['UNDER_REVIEW', 'En étude'],
          ['', 'Retenues & refusées'],
        ].map(([value, label]) => (
          <button
            key={value || 'all-decided'}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1 rounded-full text-sm border ${statusFilter === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}
          >
            {label}
          </button>
        ))}
        <input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="border px-2 py-1 rounded flex-1 min-w-[160px]" />
      </div>

      {statusFilter === '' && (
        <p className="text-xs text-gray-500 mb-2">Affiche les candidatures retenues et refusées.</p>
      )}

      {items.length === 0 && <p className="text-gray-500 text-sm">Aucune candidature ici.</p>}

      {items
        .filter((a) => statusFilter !== '' || a.status === 'RETAINED' || a.status === 'REJECTED')
        .map((a) => (
        <div key={a._id} onClick={() => setSelected(a)}
          className="border-b py-2 flex justify-between items-center cursor-pointer hover:bg-gray-50">
          <div>
            <strong>{a.applicantFirstName} {a.applicantLastName}</strong> — {a.applicantEmail}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[a.status]}`}>{STATUS_LABELS[a.status]}</span>
        </div>
      ))}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">{selected.applicantFirstName} {selected.applicantLastName}</h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold mb-3 ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
            <dl className="text-sm space-y-1 mb-4">
              <div><dt className="inline font-semibold">Email : </dt><dd className="inline">{selected.applicantEmail}</dd></div>
              <div><dt className="inline font-semibold">Téléphone : </dt><dd className="inline">{selected.applicantPhone || '—'}</dd></div>
              {Object.entries(selected.responses || {}).map(([key, value]) => (
                <div key={key}>
                  <dt className="inline font-semibold">{fieldLabelById.get(key) || key} : </dt>
                  <dd className="inline">{value === true ? 'Oui' : value === false ? 'Non' : String(value ?? '—')}</dd>
                </div>
              ))}
            </dl>

            <label className="text-sm font-semibold block mb-1">Note interne (jamais visible du candidat)</label>
            <textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={3} className="border px-2 py-1 rounded w-full mb-2" />
            <button onClick={saveNotes} className="text-sm text-blue-600 underline mb-4">Enregistrer la note</button>

            {selected.status === 'RECEIVED' && (
              <div className="flex gap-3">
                <button onClick={() => act(selected._id, 'review')} className="flex-1 bg-yellow-500 text-white font-bold py-2 rounded-xl hover:bg-yellow-600">
                  Passer en étude
                </button>
                <button onClick={() => act(selected._id, 'reject')} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl hover:bg-red-700">
                  Refuser
                </button>
              </div>
            )}

            {selected.status === 'UNDER_REVIEW' && (
              <form onSubmit={retain} className="border-t pt-3 mt-2">
                <label className="text-sm font-semibold block mb-1">Retenir — catégorie d'agent</label>
                <input placeholder="ex: Salarié, Consultant, Stagiaire..." list="recruitment-categories"
                  value={retainForm.category} onChange={(e) => setRetainForm({ ...retainForm, category: e.target.value })}
                  className="border px-2 py-1 rounded w-full mb-2" required />
                <datalist id="recruitment-categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
                <textarea placeholder="Notes (optionnel)" value={retainForm.notes}
                  onChange={(e) => setRetainForm({ ...retainForm, notes: e.target.value })}
                  className="border px-2 py-1 rounded w-full mb-2" rows={2} />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl hover:bg-green-700">
                    ✓ Retenir → Ajouter au personnel
                  </button>
                  <button type="button" onClick={() => act(selected._id, 'reject')} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl hover:bg-red-700">
                    Refuser
                  </button>
                </div>
              </form>
            )}

            {selected.status === 'RETAINED' && (
              <p className="text-sm text-green-700">✓ Candidature retenue — profil ajouté à la base du personnel (onglet "Personnel").</p>
            )}
            {selected.status === 'REJECTED' && (
              <p className="text-sm text-gray-500">Candidature refusée.</p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:underline">Fermer</button>
              <button onClick={() => del(selected._id)} className="text-sm text-red-600 hover:underline">🗑 Supprimer cette candidature</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
