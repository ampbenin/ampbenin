import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE || '';

const EMPTY = { name: '', email: '', whatsapp: '', countryCity: '' };

export default function BadgeParticipantForm({ slug, onSuccess, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/cms/badge-campaigns/public/${slug}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Envoi impossible, réessayez.');
      onSuccess(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <label className="block text-sm font-semibold text-gray-800">
      {label}
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        required
        placeholder={placeholder}
        className="border px-3 py-2 rounded w-full mt-1 font-normal"
      />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white border-2 rounded-xl p-4 sm:p-5 space-y-4 w-full box-border overflow-hidden" style={{ borderColor: 'var(--badge-accent)' }}>
      <div>
        <p className="font-bold text-gray-900">Rejoignez la campagne</p>
        <p className="text-sm text-gray-600">Renseignez vos coordonnées pour recevoir les rappels de la campagne et obtenir votre badge.</p>
      </div>

      {error && <p className="text-red-600 bg-red-50 rounded px-3 py-2 text-sm">{error}</p>}

      {field('Nom complet', 'name', 'text', 'Prénom Nom')}
      {field('Email (pour recevoir les rappels)', 'email', 'email')}
      {field('Numéro WhatsApp', 'whatsapp', 'tel', '+229 …')}
      {field('Pays / Ville de résidence', 'countryCity', 'text', 'Ex : Bénin / Cotonou')}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          style={{ backgroundColor: 'var(--badge-accent)' }}
          className="flex-1 text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Envoi…' : 'Valider et voir mon badge'}
        </button>
        <button type="button" onClick={onCancel} className="border px-4 py-3 rounded-xl text-gray-700">
          Annuler
        </button>
      </div>
    </form>
  );
}
