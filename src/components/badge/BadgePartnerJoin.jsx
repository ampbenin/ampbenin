import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE || '';

const EMPTY = { structureName: '', email: '', phone: '', actionDescription: '', contribution: '' };

export default function BadgePartnerJoin({ slug }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [logo, setLogo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));
      if (logo) fd.append('logo', logo);

      const res = await fetch(`${API_BASE_URL}/api/cms/badge-campaigns/public/${slug}/partner-requests`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Envoi impossible, réessayez.');

      setDone(data.message);
      setForm(EMPTY);
      setLogo(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return <p className="bg-green-50 text-green-800 rounded-xl px-4 py-3 text-center">{done}</p>;
  }

  if (!open) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ backgroundColor: 'var(--badge-accent)' }}
          className="text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90"
        >
          Rejoindre la campagne
        </button>
      </div>
    );
  }

  const field = (label, key, type = 'text', required = true) => (
    <label className="block text-sm font-semibold text-gray-800">
      {label}
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        required={required}
        className="border px-3 py-2 rounded w-full mt-1 font-normal"
      />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-4 sm:p-6 space-y-4 w-full box-border overflow-hidden">
      {error && <p className="text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

      {field('Nom de la structure ou nom individuel', 'structureName')}
      {field('Adresse email', 'email', 'email')}
      {field('Numéro de téléphone', 'phone', 'tel')}

      <label className="block text-sm font-semibold text-gray-800">
        Expliquez votre action
        <textarea
          value={form.actionDescription}
          onChange={set('actionDescription')}
          required
          rows={4}
          maxLength={2000}
          className="border px-3 py-2 rounded w-full mt-1 font-normal"
        />
      </label>

      <label className="block text-sm font-semibold text-gray-800">
        Ce que vous pensez apporter à la campagne
        <textarea
          value={form.contribution}
          onChange={set('contribution')}
          required
          rows={3}
          maxLength={2000}
          className="border px-3 py-2 rounded w-full mt-1 font-normal"
        />
      </label>

      <label className="block text-sm font-semibold text-gray-800">
        Votre logo (facultatif)
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => setLogo(e.target.files?.[0] || null)}
          className="block w-full max-w-full min-w-0 mt-1 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          style={{ backgroundColor: 'var(--badge-accent)' }}
          className="flex-1 text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="border px-4 py-3 rounded-xl text-gray-700">
          Annuler
        </button>
      </div>
    </form>
  );
}
