// Base du personnel AMP BÉNIN — alimentée automatiquement quand une
// candidature de recrutement est retenue (voir JobRecruitmentManager.jsx),
// et par ajout manuel ici (personnel déjà en poste, non issu d'un
// recrutement).
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', category: '', status: 'ACTIF', notes: '',
};

export default function PersonnelManager() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (categoryFilter) params.set('category', categoryFilter);
    adminFetch(`/api/personnel?${params.toString()}`).then((data) => setItems(data?.items || [])).catch(console.error);
  };

  const loadCategories = () => {
    adminFetch('/api/personnel/categories').then((data) => setCategories(data?.categories || [])).catch(console.error);
  };

  useEffect(() => { load(); loadCategories(); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [search, categoryFilter]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      firstName: item.firstName || '', lastName: item.lastName || '', email: item.email || '',
      phone: item.phone || '', category: item.category || '', status: item.status || 'ACTIF',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await adminFetch(`/api/personnel/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await adminFetch('/api/personnel', { method: 'POST', body: JSON.stringify(form) });
      }
      resetForm();
      load();
      loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async (id) => {
    if (!confirm('Supprimer ce membre du personnel ?')) return;
    await adminFetch(`/api/personnel/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Personnel AMP BÉNIN</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="px-3 py-1 bg-blue-600 text-white rounded">
            + Ajouter manuellement
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-6 grid gap-2 max-w-xl border rounded p-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <input placeholder="Prénom" value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="border px-2 py-1 rounded flex-1" />
            <input placeholder="Nom" value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="border px-2 py-1 rounded flex-1" />
          </div>
          <input placeholder="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required className="border px-2 py-1 rounded" />
          <input placeholder="Téléphone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border px-2 py-1 rounded" />
          <input placeholder="Catégorie d'agent (ex: Salarié, Consultant, Stagiaire...)" list="personnel-categories"
            value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="border px-2 py-1 rounded" />
          <datalist id="personnel-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
          <div className="flex gap-2 items-center">
            <label>Statut</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border px-2 py-1 rounded">
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
          </div>
          <textarea placeholder="Notes (optionnel)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} className="border px-2 py-1 rounded" rows={2} />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
            <button type="button" onClick={resetForm} className="px-3 py-1 border rounded">Annuler</button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-3">
        <input placeholder="Rechercher (nom, email, téléphone)..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="border px-2 py-1 rounded flex-1" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">Toutes catégories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        {items.length === 0 && <p className="text-gray-500 text-sm">Aucun membre du personnel pour l'instant.</p>}
        {items.map((item) => (
          <div key={item._id} className="border-b py-2 flex justify-between items-center">
            <div>
              <strong>{item.firstName} {item.lastName}</strong>{' '}
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                {item.status === 'ACTIF' ? 'Actif' : 'Inactif'}
              </span>
              <div className="text-sm text-gray-600">{item.category} — {item.email}{item.phone ? ` — ${item.phone}` : ''}</div>
              <div className="text-xs text-gray-400">
                {item.sourceJobPostingId ? 'Issu d\'un recrutement' : 'Ajout manuel'} · depuis le {new Date(item.hiredAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => edit(item)} className="underline">Éditer</button>
              <button onClick={() => del(item._id)} className="text-red-600">Suppr</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
