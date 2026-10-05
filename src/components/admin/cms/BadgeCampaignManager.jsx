import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE || '';

const EMPTY_ZONE = { x: 10, y: 10, w: 30, h: 30 };

const EMPTY_FORM = {
  id: null,
  slug: '',
  title: '',
  description: '',
  templateUrl: '',
  templatePublicId: null,
  photoZone: { ...EMPTY_ZONE },
  nameZone: { x: 10, y: 75, w: 80, h: 10 },
  colors: { accent: '#1B4332', nameText: '#FFFFFF' },
  status: 'DRAFT',
};

const ZONE_FIELDS = [
  { key: 'x', label: 'X (%)' },
  { key: 'y', label: 'Y (%)' },
  { key: 'w', label: 'Largeur (%)' },
  { key: 'h', label: 'Hauteur (%)' },
];

function ZoneEditor({ label, zone, onChange, color }) {
  return (
    <fieldset className="border rounded p-3">
      <legend className="px-1 font-semibold" style={{ color }}>{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {ZONE_FIELDS.map((f) => (
          <label key={f.key} className="text-sm">
            {f.label}
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={zone[f.key]}
              onChange={(e) => onChange({ ...zone, [f.key]: Number(e.target.value) })}
              className="border px-2 py-1 rounded w-full"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TemplatePreview({ templateUrl, photoZone, nameZone }) {
  if (!templateUrl) {
    return <p className="text-sm text-gray-500">Uploadez un gabarit pour voir l'aperçu des zones.</p>;
  }
  const overlay = (zone, color, text) => (
    <div
      style={{
        position: 'absolute',
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.w}%`,
        height: `${zone.h}%`,
        border: `2px dashed ${color}`,
        background: `${color}33`,
        color,
        fontSize: 12,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {text}
    </div>
  );
  return (
    <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
      <img src={templateUrl} alt="Gabarit" style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      {overlay(photoZone, '#2563eb', 'PHOTO')}
      {overlay(nameZone, '#16a34a', 'NOM')}
    </div>
  );
}

export default function BadgeCampaignManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await adminFetch('/api/cms/badge-campaigns');
      setItems(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const token = localStorage.getItem('amp_token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/cms/badge-campaigns/upload-template`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Échec de l\'upload');
      setForm((f) => ({ ...f, templateUrl: data.url, templatePublicId: data.publicId }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const startEdit = (item) => {
    setForm({
      id: item._id,
      slug: item.slug,
      title: item.title,
      description: item.description || '',
      templateUrl: item.templateUrl,
      templatePublicId: item.templatePublicId || null,
      photoZone: item.photoZone,
      nameZone: item.nameZone,
      colors: { ...EMPTY_FORM.colors, ...(item.colors || {}) },
      status: item.status,
    });
    setError('');
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.templateUrl) {
      setError('Veuillez uploader le gabarit du badge.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description,
      templateUrl: form.templateUrl,
      templatePublicId: form.templatePublicId,
      photoZone: form.photoZone,
      nameZone: form.nameZone,
      colors: form.colors,
      status: form.status,
    };
    try {
      await adminFetch(
        form.id ? `/api/cms/badge-campaigns/${form.id}` : '/api/cms/badge-campaigns',
        { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Supprimer la campagne "${item.title}" ?`)) return;
    try {
      await adminFetch(`/api/cms/badge-campaigns/${item._id}`, { method: 'DELETE' });
      if (form.id === item._id) resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const publicUrl = form.slug ? `/badge/${form.slug}` : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Badges de campagne</h2>

      {error && <p className="text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

      <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-6 border rounded-xl p-6 bg-white">
        <div className="space-y-3">
          <label className="block text-sm font-semibold">
            Titre de la campagne
            <input value={form.title} onChange={(e) => set('title')(e.target.value)} required className="border px-3 py-2 rounded w-full" />
          </label>

          <label className="block text-sm font-semibold">
            Description
            <textarea value={form.description} onChange={(e) => set('description')(e.target.value)} rows={3} className="border px-3 py-2 rounded w-full" />
          </label>

          <label className="block text-sm font-semibold">
            Identifiant d'URL (ex : 16-jours-2026)
            <input
              value={form.slug}
              onChange={(e) => set('slug')(e.target.value.toLowerCase())}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              className="border px-3 py-2 rounded w-full font-mono"
            />
            {publicUrl && <span className="text-xs text-gray-500">Page publique : {publicUrl}</span>}
          </label>

          <label className="block text-sm font-semibold">
            Gabarit du badge (image)
            <input type="file" accept="image/*" onChange={handleTemplateUpload} disabled={uploading} className="block mt-1" />
            {uploading && <span className="text-xs text-gray-500">Envoi en cours…</span>}
          </label>

          <ZoneEditor label="Zone photo" zone={form.photoZone} onChange={set('photoZone')} color="#2563eb" />
          <ZoneEditor label="Zone nom" zone={form.nameZone} onChange={set('nameZone')} color="#16a34a" />

          <fieldset className="border rounded p-3 space-y-2">
            <legend className="px-1 font-semibold">Couleurs de la campagne</legend>
            <label className="flex items-center justify-between text-sm">
              Couleur d'accent (titres, bouton)
              <input
                type="color"
                value={form.colors.accent}
                onChange={(e) => set('colors')({ ...form.colors, accent: e.target.value })}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              Couleur du nom sur le badge
              <input
                type="color"
                value={form.colors.nameText}
                onChange={(e) => set('colors')({ ...form.colors, nameText: e.target.value })}
              />
            </label>
          </fieldset>

          <label className="block text-sm font-semibold">
            Statut
            <select value={form.status} onChange={(e) => set('status')(e.target.value)} className="border px-3 py-2 rounded w-full">
              <option value="DRAFT">Brouillon (non visible du public)</option>
              <option value="PUBLISHED">Publiée</option>
            </select>
          </label>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-violet-700 text-white px-4 py-2 rounded disabled:opacity-50">
              {saving ? 'Enregistrement…' : form.id ? 'Mettre à jour' : 'Créer la campagne'}
            </button>
            {form.id && (
              <button type="button" onClick={resetForm} className="border px-4 py-2 rounded">Annuler</button>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Aperçu des zones</p>
          <TemplatePreview templateUrl={form.templateUrl} photoZone={form.photoZone} nameZone={form.nameZone} />
        </div>
      </form>

      <div className="border rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Titre</th>
              <th className="p-3">URL</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan="4" className="p-3 text-gray-500">Aucune campagne pour l'instant.</td></tr>
            )}
            {items.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="p-3">{item.title}</td>
                <td className="p-3 font-mono">/badge/{item.slug}</td>
                <td className="p-3">{item.status === 'PUBLISHED' ? 'Publiée' : 'Brouillon'}</td>
                <td className="p-3 space-x-3">
                  <button onClick={() => startEdit(item)} className="text-blue-600 underline">Modifier</button>
                  <button onClick={() => handleDelete(item)} className="text-red-600 underline">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
