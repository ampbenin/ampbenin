// src/components/admin/PartnerManager.jsx
import React from 'react';
import { adminFetch } from '@/services/admin/api';
import { usePaginatedAdminList } from './usePaginatedAdminList';
import Pagination from './Pagination';

export default function PartnerManager() {
  const { items, setItems, page, setPage, totalPages } = usePaginatedAdminList('/admin/partners');

  const approve = async (id) => {
    await adminFetch(`/admin/partners/${id}/approve`, { method: 'PATCH' });
    setItems(items.map(i => i._id === id ? { ...i, status: 'approved' } : i));
  };

  const del = async (id) => {
    if (!confirm('Supprimer ?')) return;
    await adminFetch(`/admin/partners/${id}`, { method: 'DELETE' });
    setItems(items.filter(i => i._id !== id));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-3">Propositions de partenariat</h2>
      <div style={{maxHeight:400, overflow:'auto'}}>
        {items.map(p => (
          <div key={p._id} className="border-b py-2 flex justify-between">
            <div>
              <div><strong>{p.name}</strong> — {p.email}</div>
              <div className="text-sm">{p.message?.slice(0,200)}</div>
            </div>
            <div>
              <div>{p.status}</div>
              {p.status !== 'approved' && <button onClick={() => approve(p._id)}>Approuver</button>}
              <button onClick={() => del(p._id)} className="text-red-600">Suppr</button>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
