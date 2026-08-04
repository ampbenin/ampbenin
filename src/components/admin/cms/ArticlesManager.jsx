// Gestion des articles/actualités.
// Les blocs optionnels (stats/gallery/testimonials/faq) sont édités en JSON brut :
// leur forme varie d'un article à l'autre et ne justifie pas un formulaire dédié
// par champ pour ce volume de contenu (voir plan de refonte, phase 1).
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';

const emptyForm = {
  slug: '', title: '', excerpt: '', coverImage: '', body: '', tags: '', status: 'DRAFT',
  date: '', externalLink: '',
  extrasJson: '{\n  "stats": [],\n  "pillars": [],\n  "gallery": [],\n  "testimonials": [],\n  "faq": []\n}',
};

export default function ArticlesManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    adminFetch('/api/cms/articles/admin').then((data) => setItems(data?.items || [])).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      slug: item.slug || '',
      title: item.title || '',
      excerpt: item.excerpt || '',
      coverImage: item.coverImage || '',
      body: item.body || '',
      tags: (item.tags || []).join(', '),
      status: item.status || 'DRAFT',
      date: item.date || '',
      externalLink: item.externalLink || '',
      extrasJson: JSON.stringify({
        stats: item.stats || [],
        pillars: item.pillars || [],
        gallery: item.gallery || [],
        testimonials: item.testimonials || [],
        faq: item.faq || [],
      }, null, 2),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    let extras;
    try {
      extras = JSON.parse(form.extrasJson);
    } catch {
      setError('Le JSON des blocs additionnels (stats/gallery/testimonials/faq) est invalide');
      return;
    }

    const payload = {
      slug: form.slug,
      title: form.title,
      excerpt: form.excerpt,
      coverImage: form.coverImage,
      body: form.body,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      status: form.status,
      date: form.date,
      externalLink: form.externalLink,
      ...extras,
    };

    try {
      if (editingId) {
        await adminFetch(`/api/cms/articles/admin/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/api/cms/articles/admin', { method: 'POST', body: JSON.stringify(payload) });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const del = async (id) => {
    if (!confirm('Supprimer cet article ?')) return;
    await adminFetch(`/api/cms/articles/admin/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Articles / Actualités</h2>

      <form onSubmit={submit} className="mb-6 grid gap-2 max-w-2xl">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input placeholder="slug (ex: forum-jeunesse-2026)" value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="border px-2 py-1 rounded" />
        <input placeholder="Titre" value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} required className="border px-2 py-1 rounded" />
        <textarea placeholder="Extrait (résumé court)" value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="border px-2 py-1 rounded" />
        <input placeholder="URL image de couverture" value={form.coverImage}
          onChange={(e) => setForm({ ...form, coverImage: e.target.value })} className="border px-2 py-1 rounded" />
        <input placeholder="Date affichée (ex: Du 25 novembre au 10 décembre 2025)" value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })} className="border px-2 py-1 rounded" />
        <input placeholder="Lien externe (page historique déjà codée en dur, optionnel)" value={form.externalLink}
          onChange={(e) => setForm({ ...form, externalLink: e.target.value })} className="border px-2 py-1 rounded" />
        <textarea placeholder="Contenu (HTML autorisé)" value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8} className="border px-2 py-1 rounded font-mono text-sm" />
        <input placeholder="Tags (séparés par des virgules)" value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })} className="border px-2 py-1 rounded" />
        <label className="text-sm text-gray-600">Blocs additionnels (JSON) — stats, gallery, testimonials, faq</label>
        <textarea value={form.extrasJson}
          onChange={(e) => setForm({ ...form, extrasJson: e.target.value })} rows={8} className="border px-2 py-1 rounded font-mono text-sm" />
        <div className="flex gap-2 items-center">
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
