import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';

// Liste admin paginée et filtrable (recherche, campagne, statut facultatif),
// avec suppression par ligne et envoi groupé en copie cachée (CCI) à toutes
// les personnes correspondant au filtre — pas seulement à la page affichée.
export default function BadgeListPanel({
  title,
  endpoint,
  columns,
  campaigns,
  statusOptions,
  renderRowActions,
  reloadKey,
}) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [error, setError] = useState('');
  const [showMail, setShowMail] = useState(false);
  const [mailSubject, setMailSubject] = useState('');
  const [mailMessage, setMailMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const filterParams = () => {
    const params = new URLSearchParams();
    if (debouncedQ.trim()) params.set('q', debouncedQ.trim());
    if (campaignId) params.set('campaignId', campaignId);
    if (status) params.set('status', status);
    return params;
  };

  const load = async () => {
    try {
      const params = filterParams();
      params.set('page', String(page));
      params.set('limit', '20');
      const res = await adminFetch(`/api/cms/badge-campaigns/${endpoint}?${params.toString()}`);
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, campaignId, status, page, reloadKey]);

  const remove = async (item) => {
    if (!confirm('Supprimer cette entrée ?')) return;
    try {
      await adminFetch(`/api/cms/badge-campaigns/${endpoint}/${item._id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const sendMail = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setNotice('');
    try {
      const body = { subject: mailSubject, message: mailMessage, q: debouncedQ, campaignId, status };
      const res = await adminFetch(`/api/cms/badge-campaigns/${endpoint}/send-email`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setNotice(res.message);
      setMailSubject('');
      setMailMessage('');
      setShowMail(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const selectClass = 'border px-2 py-1 rounded text-sm';

  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-100">
        <h3 className="font-semibold">{title} ({data.total})</h3>
        <button
          type="button"
          onClick={() => setShowMail((v) => !v)}
          disabled={data.total === 0}
          className="bg-violet-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          ✉️ Envoyer un email groupé
        </button>
      </div>

      <div className="flex flex-wrap gap-2 p-3 border-b">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher…"
          className="border px-2 py-1 rounded text-sm flex-1 min-w-[160px]"
        />
        <select value={campaignId} onChange={(e) => { setCampaignId(e.target.value); setPage(1); }} className={selectClass}>
          <option value="">Toutes les campagnes</option>
          {campaigns.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
        {statusOptions && (
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">Tous les statuts</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}
      </div>

      {showMail && (
        <form onSubmit={sendMail} className="p-3 border-b space-y-2 bg-violet-50">
          <p className="text-xs text-gray-600">
            Le message part à {data.total} personne(s) selon les filtres actuels, en copie cachée (CCI) : chacune ne voit pas les autres.
          </p>
          <input
            value={mailSubject}
            onChange={(e) => setMailSubject(e.target.value)}
            placeholder="Objet"
            required
            className="border px-2 py-1 rounded w-full text-sm"
          />
          <textarea
            value={mailMessage}
            onChange={(e) => setMailMessage(e.target.value)}
            placeholder="Votre message"
            required
            rows={5}
            className="border px-2 py-1 rounded w-full text-sm"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="bg-violet-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
            <button type="button" onClick={() => setShowMail(false)} className="border px-3 py-1 rounded text-sm">Annuler</button>
          </div>
        </form>
      )}

      {error && <p className="text-red-600 bg-red-50 px-3 py-2 text-sm">{error}</p>}
      {notice && <p className="text-green-800 bg-green-50 px-3 py-2 text-sm">{notice}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="p-3">{c.label}</th>
              ))}
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="p-3 text-gray-500">Aucun résultat.</td></tr>
            )}
            {data.items.map((item) => (
              <tr key={item._id} className="border-t align-top">
                {columns.map((c) => (
                  <td key={c.key} className="p-3 break-words">{c.render ? c.render(item) : item[c.key]}</td>
                ))}
                <td className="p-3 space-y-1">
                  {renderRowActions && renderRowActions(item, load)}
                  <button type="button" onClick={() => remove(item)} className="block text-red-600 underline">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 text-sm">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border px-3 py-1 rounded disabled:opacity-40">← Précédent</button>
        <span>Page {page} / {data.pages}</span>
        <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="border px-3 py-1 rounded disabled:opacity-40">Suivant →</button>
      </div>
    </div>
  );
}
