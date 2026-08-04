// src/components/admin/ContactManager.jsx
import React from 'react';
import { adminFetch } from '@/services/admin/api';
import { usePaginatedAdminList } from './usePaginatedAdminList';
import Pagination from './Pagination';

export default function ContactManager() {
  const { items, setItems, page, setPage, totalPages } = usePaginatedAdminList('/admin/contacts');

  const del = async (id) => {
    if (!confirm('Supprimer ce contact ?')) return;
    await adminFetch(`/admin/contacts/${id}`, { method: 'DELETE' });
    setItems(items.filter(l => l._id !== id));
  };

  const mark = async (id) => {
    await adminFetch(`/admin/contacts/${id}/handled`, { method: 'PATCH' });
    setItems(items.map(i => i._id === id ? { ...i, handled: true } : i));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-3">Contacts</h2>
      <div style={{maxHeight:400, overflow:'auto'}}>
        {items.map(c => (
          <div key={c._id} className="border-b py-2">
            <div className="flex justify-between items-center">
              <div>
                <div><strong>{c.name || '-'}</strong> — {c.email}</div>
                <div className="text-sm">{c.message?.slice(0,200)}</div>
                <div className="text-xs text-gray-500">Le {new Date(c.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <a href={`mailto:${c.email}`} className="underline">Gmail</a>
                {/* WhatsApp link (international format) */}
                <a href={`https://wa.me/${c.phone?.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" className="underline">WhatsApp</a>
                <a href={`tel:${c.phone}`} className="underline">Appel</a>

                <button onClick={() => mark(c._id)} disabled={c.handled}>Marquer traité</button>
                <button onClick={() => del(c._id)} className="text-red-600">Suppr</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
