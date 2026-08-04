// src/components/admin/NewsletterManager.jsx
import React, { useState } from 'react';
import { adminFetch } from '@/services/admin/api';
import { usePaginatedAdminList } from './usePaginatedAdminList';
import Pagination from './Pagination';

export default function NewsletterManager() {
  const { items, setItems, page, setPage, total, totalPages } = usePaginatedAdminList('/admin/newsletters');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');
  const [selection, setSelection] = useState('all'); // all, single, range, list
  const [singleEmail, setSingleEmail] = useState('');
  const [rangeFrom, setRangeFrom] = useState(0);
  const [rangeTo, setRangeTo] = useState(9);
  const [listEmails, setListEmails] = useState('');

  const send = async () => {
    setLoading(true);
    const body = { type: selection, subject, text, html };
    if (selection === 'single') body.email = singleEmail;
    if (selection === 'range') { body.from = parseInt(rangeFrom || 0); body.to = parseInt(rangeTo || 0); }
    if (selection === 'list') body.emails = listEmails.split(',').map(s => s.trim()).filter(Boolean);
    try {
      const data = await adminFetch('/admin/newsletters/send', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      alert(`Envoi lancé — destinataires: ${data?.sentTo || 'inconnu'}`);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erreur en envoyant');
    } finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!confirm('Supprimer cet abonné ?')) return;
    await adminFetch(`/admin/newsletters/${id}`, { method: 'DELETE' });
    setItems(items.filter(l => l._id !== id));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Newsletter</h2>

      <div className="mb-4">
        <h3 className="font-medium">Envoyer un email</h3>
        <div className="flex gap-2 items-center my-2">
          <label>Destinataires:</label>
          <select value={selection} onChange={e => setSelection(e.target.value)}>
            <option value="all">Tous</option>
            <option value="single">Une personne</option>
            <option value="range">Plage d'indices</option>
            <option value="list">Liste (virgule)</option>
          </select>
        </div>

        {selection === 'single' && (
          <input placeholder="email@example.com" value={singleEmail} onChange={e=>setSingleEmail(e.target.value)} />
        )}
        {selection === 'range' && (
          <div>
            <input type="number" value={rangeFrom} onChange={e=>setRangeFrom(e.target.value)} style={{width:80}} /> à
            <input type="number" value={rangeTo} onChange={e=>setRangeTo(e.target.value)} style={{width:80, marginLeft:6}} />
            <small> (indices 0..N, triés par date décroissante)</small>
          </div>
        )}
        {selection === 'list' && (
          <input placeholder="a@b.com, c@d.com" value={listEmails} onChange={e=>setListEmails(e.target.value)} />
        )}

        <div className="mt-2">
          <input placeholder="Sujet" value={subject} onChange={e=>setSubject(e.target.value)} className="w-full mb-2" />
          <textarea placeholder="Texte" value={text} onChange={e=>setText(e.target.value)} className="w-full mb-2" rows="3" />
          <textarea placeholder="HTML (optionnel)" value={html} onChange={e=>setHtml(e.target.value)} className="w-full mb-2" rows="4" />
          <button onClick={send} disabled={loading} className="px-3 py-1 border rounded">
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>

      <hr />

      <div className="mt-4">
        <h3 className="font-medium mb-2">Abonnés ({total})</h3>
        <div style={{maxHeight:300, overflow:'auto'}}>
          <table className="w-full">
            <thead><tr><th>Email</th><th>Nom</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  <td>{item.email}</td>
                  <td>{item.fullname || '-'}</td>
                  <td>
                    <button onClick={() => { navigator.clipboard.writeText(item.email); alert('Copié'); }} className="mr-2">Copier</button>
                    <button onClick={() => del(item._id)} className="text-red-600">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
