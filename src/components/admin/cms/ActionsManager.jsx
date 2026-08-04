// Gestion des actions/projets (page Nos Actions).
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';

const emptyForm = {
  title: '', description: '', media: '', type: 'image', theme: '', year: '', reportUrl: '', order: 0, status: 'DRAFT',
};

export default function ActionsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    adminFetch('/api/cms/actions/admin').then((data) => setItems(data?.items || [])).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      media: item.media || '',
      type: item.type || 'image',
      theme: item.theme || '',
      year: item.year ?? '',
      reportUrl: item.reportUrl || '',
      order: item.order ?? 0,
      status: item.status || 'DRAFT',
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      ...form,
      year: form.year === '' ? null : Number(form.year),
      order: Number(form.order) || 0,
    };

    try {
      if (editingId) {
        await adminFetch(`/api/cms/actions/admin/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/api/cms/actions/admin', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async (id) => {
    if (!confirm('Supprimer cette action ?')) return;
    await adminFetch(`/api/cms/actions/admin/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Actions / Projets</h2>

      <form onSubmit={submit} className="mb-6 grid gap-2 max-w-xl">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input placeholder="Titre" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} required className="border px-2 py-1 rounded" />
        <textarea placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="border px-2 py-1 rounded" />
        <input placeholder="URL média (image ou vidéo)" value={form.media}
          onChange={(e) => setForm({ ...form, media: e.target.value })} className="border px-2 py-1 rounded" />
        <div className="flex gap-2 items-center">
          <label>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border px-2 py-1 rounded">
            <option value="image">Image</option>
            <option value="video">Vidéo</option>
          </select>
          <label>Année</label>
          <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="border px-2 py-1 rounded w-24" />
        </div>
        <input placeholder="Thématique (ex: SSR, VBG, Citoyenneté...)" value={form.theme}
          onChange={(e) => setForm({ ...form, theme: e.target.value })} className="border px-2 py-1 rounded" />
        <input placeholder="URL du rapport (optionnel)" value={form.reportUrl}
          onChange={(e) => setForm({ ...form, reportUrl: e.target.value })} className="border px-2 py-1 rounded" />
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

      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {items.map((item) => (
          <div key={item._id} className="border-b py-2 flex justify-between items-center">
            <div>
              <strong>{item.title}</strong> <span className="text-xs text-gray-500">({item.status})</span>
              {item.theme && <div className="text-sm text-gray-600">{item.theme} {item.year ? `— ${item.year}` : ''}</div>}
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
