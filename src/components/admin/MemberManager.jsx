// src/components/admin/MemberManager.jsx
import React from 'react';
import { adminFetch } from '@/services/admin/api';
import { usePaginatedAdminList } from './usePaginatedAdminList';
import Pagination from './Pagination';

export default function MemberManager() {
  const { items, setItems, page, setPage, totalPages } = usePaginatedAdminList('/admin/members');

  const approve = async (id) => {
    await adminFetch(`/admin/members/${id}/approve`, { method: 'PATCH' });
    setItems(items.map(i => i._id === id ? { ...i, status: 'approved' } : i));
  };

  const del = async (id) => {
    if (!confirm('Supprimer ?')) return;
    await adminFetch(`/admin/members/${id}`, { method: 'DELETE' });
    setItems(items.filter(i => i._id !== id));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-3">Demandes d'adhésion</h2>
      <div style={{maxHeight:400, overflow:'auto'}}>
        {items.map(m => (
          <div key={m._id} className="border-b py-2 flex justify-between">
            <div>
              <div><strong>{m.fullName || m.name}</strong> — {m.email}</div>
              <div className="text-sm">{m.note}</div>
            </div>
            <div>
              <div>{m.status}</div>
              {m.status !== 'approved' && <button onClick={() => approve(m._id)}>Approuver</button>}
              <button onClick={() => del(m._id)} className="text-red-600">Suppr</button>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
