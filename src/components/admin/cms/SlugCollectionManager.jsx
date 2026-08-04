// Gestionnaire générique pour les collections CMS "à slug" qui partagent
// la même forme (Programme, Institution) : slug/titre/description/image/ordre/statut.
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';

const emptyForm = {
  slug: '',
  title: '',
  description: '',
  image: '',
  order: 0,
  status: 'DRAFT',
  missions: '',
};

export default function SlugCollectionManager({ endpoint, label, nameField = 'title', hasMissions = false }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    adminFetch(`${endpoint}/admin`).then((data) => setItems(data?.items || [])).catch(console.error);
  };

  useEffect(() => { load(); }, [endpoint]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      slug: item.slug || '',
      title: item[nameField] || '',
      description: item.description || '',
      image: item.image || '',
      order: item.order ?? 0,
      status: item.status || 'DRAFT',
      missions: (item.missions || []).join('\n'),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      slug: form.slug,
      [nameField]: form.title,
      description: form.description,
      image: form.image,
      order: Number(form.order) || 0,
      status: form.status,
      ...(hasMissions && {
        missions: form.missions.split('\n').map((s) => s.trim()).filter(Boolean),
      }),
    };

    try {
      if (editingId) {
        await adminFetch(`${endpoint}/admin/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminFetch(`${endpoint}/admin`, { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async (id) => {
    if (!confirm('Supprimer cet élément ?')) return;
    await adminFetch(`${endpoint}/admin/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">{label}</h2>

      <form onSubmit={submit} className="mb-6 grid gap-2 max-w-xl">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input placeholder="slug (ex: education)" value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="border px-2 py-1 rounded" />
        <input placeholder="Titre" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} required className="border px-2 py-1 rounded" />
        <textarea placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="border px-2 py-1 rounded" />
        <input placeholder="URL image" value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })} className="border px-2 py-1 rounded" />
        {hasMissions && (
          <textarea placeholder="Missions (une par ligne)" value={form.missions}
            onChange={(e) => setForm({ ...form, missions: e.target.value })} rows={3} className="border px-2 py-1 rounded" />
        )}
        <div className="flex gap-2 items-center">
          <label>Ordre</label>
          <input type="number" value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })} className="border px-2 py-1 rounded w-24" />
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
          {editingId && (
            <button type="button" onClick={resetForm} className="px-3 py-1 border rounded">Annuler</button>
          )}
        </div>
      </form>

      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {items.map((item) => (
          <div key={item._id} className="border-b py-2 flex justify-between items-center">
            <div>
              <strong>{item[nameField]}</strong> <span className="text-xs text-gray-500">({item.status})</span>
              <div className="text-sm text-gray-600">/{item.slug}</div>
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
