// Gestion des offres d'emploi/consultance (page Recrutement).
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';
import JobRecruitmentManager from './JobRecruitmentManager.jsx';

const emptyForm = {
  title: '', category: 'Consultance', location: '', applyUrl: '', applicationLink: '', deadline: '', order: 0, status: 'DRAFT',
};

export default function JobPostingsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [recruitingJob, setRecruitingJob] = useState(null);

  const load = () => {
    adminFetch('/api/cms/jobs/admin').then((data) => setItems(data?.items || [])).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      category: item.category || 'Consultance',
      location: item.location || '',
      applyUrl: item.applyUrl || '',
      applicationLink: item.applicationLink || '',
      deadline: item.deadline ? item.deadline.slice(0, 10) : '',
      order: item.order ?? 0,
      status: item.status || 'DRAFT',
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      ...form,
      deadline: form.deadline || null,
      order: Number(form.order) || 0,
    };

    try {
      if (editingId) {
        await adminFetch(`/api/cms/jobs/admin/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/api/cms/jobs/admin', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async (id) => {
    if (!confirm('Supprimer cette offre ?')) return;
    await adminFetch(`/api/cms/jobs/admin/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Offres (recrutement)</h2>

      <form onSubmit={submit} className="mb-6 grid gap-2 max-w-xl">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input placeholder="Titre de l'offre" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} required className="border px-2 py-1 rounded" />
        <div className="flex gap-2 items-center">
          <label>Catégorie</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border px-2 py-1 rounded">
            <option value="Consultance">Consultance</option>
            <option value="Emploi">Emploi</option>
            <option value="Formation">Formation</option>
          </select>
        </div>
        <input placeholder="Lieu" value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })} className="border px-2 py-1 rounded" />
        <input placeholder="Lien du document / TDR (Google Drive...)" value={form.applyUrl}
          onChange={(e) => setForm({ ...form, applyUrl: e.target.value })} required className="border px-2 py-1 rounded" />
        <input placeholder="Lien de candidature (formulaire, email mailto:...) — optionnel" value={form.applicationLink}
          onChange={(e) => setForm({ ...form, applicationLink: e.target.value })} className="border px-2 py-1 rounded" />
        <p className="text-xs text-gray-500 -mt-1">
          Si renseigné, un bouton "Postuler ici" apparaît sur la carte de l'offre en plus de l'aperçu/téléchargement du document.
        </p>
        <div className="flex gap-2 items-center">
          <label>Date limite (optionnel)</label>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="border px-2 py-1 rounded" />
        </div>
        <div className="flex gap-2 items-center">
          <label>Ordre</label>
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="border px-2 py-1 rounded w-24" />
          <label>Statut</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border px-2 py-1 rounded">
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
            {editingId ? 'Mettre à jour' : 'Créer'}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="px-3 py-1 border rounded">Annuler</button>}
        </div>
      </form>

      {/* Pas de hauteur limitée avec scroll interne ici : une liste
          courte dans une boîte à défilement donne l'impression que les
          anciennes offres "disparaissent" dès qu'on en crée une nouvelle
          qui pousse les autres hors du cadre visible (retour utilisateur,
          2026-09-15). La liste s'étend simplement avec la page. */}
      <div>
        {items.map((item) => {
          const isExpired = item.deadline && new Date(item.deadline) < new Date(new Date().setHours(0, 0, 0, 0));
          return (
            <div key={item._id} className="border-b py-2 flex justify-between items-center">
              <div>
                <strong>{item.title}</strong> <span className="text-xs text-gray-500">({item.status})</span>
                <div className="text-sm text-gray-600">{item.category} — {item.location}</div>
                {!item.applicationLink && !(item.applicationForm?.fields?.length) && (
                  <div className="text-xs text-orange-600 mt-0.5">⚠️ Pas de lien de candidature — bouton "Postuler ici" masqué</div>
                )}
                {isExpired && (
                  <div className="text-xs text-red-600 mt-0.5">⏳ Date limite dépassée — masquée de la page publique</div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setRecruitingJob(item)} className="underline text-blue-700">Gérer le recrutement</button>
                <button onClick={() => edit(item)} className="underline">Éditer</button>
                <button onClick={() => del(item._id)} className="text-red-600">Suppr</button>
              </div>
            </div>
          );
        })}
      </div>

      {recruitingJob && (
        <JobRecruitmentManager job={recruitingJob} onClose={() => { setRecruitingJob(null); load(); }} />
      )}
    </div>
  );
}
