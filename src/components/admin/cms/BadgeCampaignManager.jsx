import React, { useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/services/admin/api';
import BadgeListPanel from './BadgeListPanel.jsx';

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
  nameAlign: 'center',
  colors: { accent: '#1B4332', nameText: '#FFFFFF' },
  bannerUrl: null,
  bannerPublicId: null,
  partners: [],
  status: 'DRAFT',
};

const EMPTY_PARTNER = { name: '', logoUrl: null, websiteUrl: '' };

const ZONE_FIELDS = [
  { key: 'x', label: 'X (%)' },
  { key: 'y', label: 'Y (%)' },
  { key: 'w', label: 'Largeur (%)' },
  { key: 'h', label: 'Hauteur (%)' },
];

// Met la zone à l'échelle `factor` autour de son centre, bornée au gabarit.
function scaleZone(zone, factor) {
  const cx = zone.x + zone.w / 2;
  const cy = zone.y + zone.h / 2;
  const w = clamp(zone.w * factor, 1, 100);
  const h = clamp(zone.h * factor, 1, 100);
  return {
    x: round1(clamp(cx - w / 2, 0, 100 - w)),
    y: round1(clamp(cy - h / 2, 0, 100 - h)),
    w: round1(w),
    h: round1(h),
  };
}

function ZoneEditor({ label, zone, onChange, color }) {
  return (
    <fieldset className="border rounded p-3">
      <legend className="px-1 font-semibold" style={{ color }}>{label}</legend>
      <div className="flex gap-2 mb-3">
        <button type="button" onClick={() => onChange(scaleZone(zone, 1.1))} className="border px-3 py-1 rounded text-sm">+ Agrandir</button>
        <button type="button" onClick={() => onChange(scaleZone(zone, 0.9))} className="border px-3 py-1 rounded text-sm">− Réduire</button>
      </div>
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

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const round1 = (v) => Math.round(v * 10) / 10;

// Aperçu interactif : glisser une zone pour la déplacer, poignée en bas à
// droite pour la redimensionner. Les valeurs saisies sont en % du gabarit,
// donc le déplacement à la souris se traduit directement en coordonnées réelles.
function TemplatePreview({ templateUrl, photoZone, nameZone, onZoneChange }) {
  const containerRef = useRef(null);
  const dragRef = useRef(null);

  if (!templateUrl) {
    return <p className="text-sm text-gray-500">Uploadez un gabarit pour voir l'aperçu des zones.</p>;
  }

  const zones = [
    { key: 'photoZone', zone: photoZone, color: '#2563eb', text: 'PHOTO' },
    { key: 'nameZone', zone: nameZone, color: '#16a34a', text: 'NOM' },
  ];

  const startDrag = (key, zone, mode) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = { key, zone, mode, startX: e.clientX, startY: e.clientY, rect };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
    const z = { ...d.zone };
    if (d.mode === 'move') {
      z.x = round1(clamp(d.zone.x + dx, 0, 100 - d.zone.w));
      z.y = round1(clamp(d.zone.y + dy, 0, 100 - d.zone.h));
    } else {
      z.w = round1(clamp(d.zone.w + dx, 1, 100 - d.zone.x));
      z.h = round1(clamp(d.zone.h + dy, 1, 100 - d.zone.y));
    }
    onZoneChange(d.key, z);
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="select-none"
      style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}
    >
      <img src={templateUrl} alt="Gabarit" draggable={false} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      {zones.map(({ key, zone, color, text }) => (
        <div
          key={key}
          onPointerDown={startDrag(key, zone, 'move')}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="touch-none cursor-move"
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
          <div
            onPointerDown={startDrag(key, zone, 'resize')}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="touch-none cursor-nwse-resize"
            style={{
              position: 'absolute',
              right: -8,
              bottom: -8,
              width: 20,
              height: 20,
              background: color,
              borderRadius: 3,
            }}
          />
        </div>
      ))}
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

  // Upload générique d'une image (gabarit, bannière, logo partenaire) ;
  // `onDone` reçoit { url, publicId } et range le résultat au bon endroit.
  const uploadImage = async (e, onDone) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const token = localStorage.getItem('amp_token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/cms/badge-campaigns/upload-image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Échec de l\'upload');
      onDone(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleTemplateUpload = (e) =>
    uploadImage(e, (d) => setForm((f) => ({ ...f, templateUrl: d.url, templatePublicId: d.publicId })));

  const handleBannerUpload = (e) =>
    uploadImage(e, (d) => setForm((f) => ({ ...f, bannerUrl: d.url, bannerPublicId: d.publicId })));

  const updatePartner = (index, patch) =>
    setForm((f) => ({
      ...f,
      partners: f.partners.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));

  const addPartner = () => setForm((f) => ({ ...f, partners: [...f.partners, { ...EMPTY_PARTNER }] }));

  const removePartner = (index) =>
    setForm((f) => ({ ...f, partners: f.partners.filter((_, i) => i !== index) }));

  const handlePartnerLogoUpload = (index) => (e) =>
    uploadImage(e, (d) => updatePartner(index, { logoUrl: d.url }));

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
      nameAlign: item.nameAlign || 'center',
      colors: { ...EMPTY_FORM.colors, ...(item.colors || {}) },
      bannerUrl: item.bannerUrl || null,
      bannerPublicId: item.bannerPublicId || null,
      partners: (item.partners || []).map((p) => ({ name: p.name, logoUrl: p.logoUrl || null, websiteUrl: p.websiteUrl || '' })),
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
      nameAlign: form.nameAlign,
      colors: form.colors,
      bannerUrl: form.bannerUrl,
      bannerPublicId: form.bannerPublicId,
      partners: form.partners.filter((p) => p.name.trim()),
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

  const reviewRequest = async (req, status, reload) => {
    try {
      await adminFetch(`/api/cms/badge-campaigns/partner-requests/${req._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      reload();
      if (status === 'ACCEPTED') load();
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

          <label className="block text-sm font-semibold">
            Bannière en haut de page (image, facultative)
            <input type="file" accept="image/*" onChange={handleBannerUpload} disabled={uploading} className="block mt-1" />
            {form.bannerUrl && <img src={form.bannerUrl} alt="Bannière" className="mt-2 max-h-24 rounded" />}
          </label>

          <fieldset className="border rounded p-3 space-y-3">
            <legend className="px-1 font-semibold">Partenaires engagés (affichés en bas de page)</legend>
            {form.partners.map((p, i) => (
              <div key={i} className="border rounded p-2 space-y-2">
                <input
                  placeholder="Nom du partenaire"
                  value={p.name}
                  onChange={(e) => updatePartner(i, { name: e.target.value })}
                  className="border px-2 py-1 rounded w-full"
                />
                <input
                  placeholder="Site web (https://…), facultatif"
                  value={p.websiteUrl}
                  onChange={(e) => updatePartner(i, { websiteUrl: e.target.value })}
                  className="border px-2 py-1 rounded w-full"
                />
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={handlePartnerLogoUpload(i)} disabled={uploading} className="text-sm" />
                  {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="h-8 object-contain" />}
                  <button type="button" onClick={() => removePartner(i)} className="text-red-600 underline text-sm ml-auto">Retirer</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addPartner} className="text-blue-600 underline text-sm">+ Ajouter un partenaire</button>
          </fieldset>

          <ZoneEditor label="Zone photo" zone={form.photoZone} onChange={set('photoZone')} color="#2563eb" />
          <ZoneEditor label="Zone nom" zone={form.nameZone} onChange={set('nameZone')} color="#16a34a" />

          <label className="block text-sm font-semibold">
            Alignement du nom sur le badge
            <select value={form.nameAlign} onChange={(e) => set('nameAlign')(e.target.value)} className="border px-3 py-2 rounded w-full">
              <option value="left">Gauche</option>
              <option value="center">Centre</option>
              <option value="right">Droite</option>
            </select>
          </label>

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
          <TemplatePreview
            templateUrl={form.templateUrl}
            photoZone={form.photoZone}
            nameZone={form.nameZone}
            onZoneChange={(key, zone) => set(key)(zone)}
          />
        </div>
      </form>

      <BadgeListPanel
        title="Personnes inscrites"
        endpoint="participants"
        campaigns={items}
        columns={[
          { key: 'name', label: 'Nom' },
          { key: 'email', label: 'Email' },
          { key: 'whatsapp', label: 'WhatsApp' },
          { key: 'countryCity', label: 'Pays / Ville' },
          { key: 'campaignTitle', label: 'Campagne' },
        ]}
      />

      <BadgeListPanel
        title="Demandes de partenariat"
        endpoint="partner-requests"
        campaigns={items}
        statusOptions={[
          { value: 'PENDING', label: 'En attente' },
          { value: 'ACCEPTED', label: 'Acceptées' },
          { value: 'REJECTED', label: 'Refusées' },
        ]}
        columns={[
          { key: 'structureName', label: 'Structure' },
          { key: 'email', label: 'Contact', render: (r) => <>{r.email}<br />{r.phone}</> },
          { key: 'action', label: 'Action / apport', render: (r) => <><strong>Action :</strong> {r.actionDescription}<br /><strong>Apport :</strong> {r.contribution}</> },
          { key: 'campaignTitle', label: 'Campagne' },
          { key: 'status', label: 'Statut', render: (r) => ({ PENDING: 'En attente', ACCEPTED: 'Acceptée', REJECTED: 'Refusée' }[r.status]) },
        ]}
        renderRowActions={(r, reload) => (
          <>
            {r.status !== 'ACCEPTED' && (
              <button type="button" onClick={() => reviewRequest(r, 'ACCEPTED', reload)} className="block text-green-700 underline">Accepter (ajoute aux partenaires)</button>
            )}
            {r.status !== 'REJECTED' && (
              <button type="button" onClick={() => reviewRequest(r, 'REJECTED', reload)} className="block text-red-600 underline">Refuser</button>
            )}
          </>
        )}
      />

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
