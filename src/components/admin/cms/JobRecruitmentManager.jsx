// Gestion du recrutement pour UNE offre (JobPosting) : construction du
// formulaire de candidature interne + suivi du pipeline de candidatures en
// 3 étapes (Reçues → En étude → Retenues/Refusées, décision utilisateur
// 2026-09-15). Ouvert depuis JobPostingsManager.jsx ("Gérer le recrutement").
//
// Le formulaire n'édite QUE les champs personnalisés (job.applicationForm.fields) —
// les 4 champs verrouillés (prénom/nom/email/téléphone) sont injectés
// automatiquement côté serveur (voir jobApplicationController.js#ensureBuiltinFields),
// jamais stockés ici, même convention que VolunteerProgramEditor.jsx.
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

const newField = () => ({
  id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  label: '', type: 'TEXT', required: false, options: [],
});

export default function JobRecruitmentManager({ job, onClose }) {
  const [subTab, setSubTab] = useState('formulaire');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Recrutement — {job.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        <div className="flex gap-2 mb-4 border-b">
          {[['formulaire', 'Formulaire'], ['candidatures', 'Candidatures']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`px-3 py-2 -mb-px border-b-2 ${subTab === id ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {subTab === 'formulaire' && <FormBuilderTab job={job} />}
        {subTab === 'candidatures' && <ApplicationsTab job={job} />}
      </div>
    </div>
  );
}

/* -------------------- Onglet Formulaire -------------------- */
function FormBuilderTab({ job }) {
  const [fields, setFields] = useState(job.applicationForm?.fields || []);
  const [estimatedDuration, setEstimatedDuration] = useState(job.applicationForm?.estimatedDuration || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const applyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/recrutement/postuler/${job._id}`;

  const updateField = (index, patch) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    setSaved(false);
  };
  const removeField = (index) => { setFields((prev) => prev.filter((_, i) => i !== index)); setSaved(false); };
  const moveField = (index, dir) => {
    setFields((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  };
  const addField = () => { setFields((prev) => [...prev, newField()]); setSaved(false); };

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch(`/api/cms/jobs/admin/${job._id}`, {
        method: 'PUT',
        body: JSON.stringify({ applicationForm: { fields, estimatedDuration } }),
      });
      job.applicationForm = { fields, estimatedDuration }; // reflète localement sans recharger la liste parente
      setSaved(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(applyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-gray-50 rounded flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">Lien du formulaire :</span>
        <code className="text-sm bg-white border px-2 py-1 rounded flex-1 min-w-0 overflow-x-auto whitespace-nowrap">{applyUrl}</code>
        <button onClick={copyLink} className="px-3 py-1 border rounded text-sm">{copied ? '✓ Copié' : 'Copier'}</button>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Prénom, nom, email et téléphone sont toujours demandés automatiquement — ajoutez ici uniquement les questions spécifiques à cette offre.
      </p>

      <div className="mb-3">
        <label className="text-sm text-gray-600">Durée estimée du formulaire (optionnel, ex: "5 minutes")</label>
        <input value={estimatedDuration} onChange={(e) => { setEstimatedDuration(e.target.value); setSaved(false); }}
          className="border px-2 py-1 rounded w-full mt-1" />
      </div>

      <div className="space-y-3">
        {fields.map((field, i) => (
          <div key={field.id} className="border rounded p-3">
            <div className="flex gap-2 mb-2">
              <input placeholder="Intitulé de la question" value={field.label}
                onChange={(e) => updateField(i, { label: e.target.value })} className="border px-2 py-1 rounded flex-1" />
              <select value={field.type} onChange={(e) => updateField(i, { type: e.target.value })} className="border px-2 py-1 rounded">
                {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {field.type === 'SELECT' && (
              <input placeholder="Options séparées par des virgules" value={(field.options || []).join(', ')}
                onChange={(e) => updateField(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="border px-2 py-1 rounded w-full mb-2" />
            )}
            <div className="flex justify-between items-center">
              <label className="text-sm flex items-center gap-1">
                <input type="checkbox" checked={!!field.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                Obligatoire
              </label>
              <div className="flex gap-1">
                <button type="button" onClick={() => moveField(i, -1)} disabled={i === 0} className="px-2 border rounded disabled:opacity-30">↑</button>
                <button type="button" onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} className="px-2 border rounded disabled:opacity-30">↓</button>
                <button type="button" onClick={() => removeField(i)} className="px-2 border rounded text-red-600">Suppr</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button type="button" onClick={addField} className="px-3 py-1 border rounded">+ Ajouter un champ</button>
        <button type="button" onClick={save} disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">
          {saving ? 'Enregistrement...' : 'Enregistrer le formulaire'}
        </button>
        {saved && <span className="text-green-600 text-sm">✓ Enregistré</span>}
      </div>
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

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter, search]);
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
        <p className="text-xs text-gray-500 mb-2">Affiche les candidatures retenues et refusées (toutes, non filtrées par statut individuellement).</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]" onClick={() => setSelected(null)}>
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
              <>
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
              </>
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
