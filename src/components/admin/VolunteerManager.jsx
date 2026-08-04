// src/components/admin/VolunteerManager.jsx
import React from 'react';
import { adminFetch } from '@/services/admin/api';
import { usePaginatedAdminList } from './usePaginatedAdminList';
import Pagination from './Pagination';

export default function VolunteerManager() {
  const { items, setItems, page, setPage, totalPages } = usePaginatedAdminList('/admin/volunteers');

  const approve = async (id) => {
    await adminFetch(`/admin/volunteers/${id}/approve`, { method: 'PATCH' });
    setItems(items.map(i => i._id === id ? { ...i, status: 'approved' } : i));
  };

  const promote = async (id) => {
    if (!confirm("Promouvoir ce candidat vers le fichier des volontaires éligibles aux missions ?")) return;
    try {
      await adminFetch(`/admin/volunteers/${id}/promote`, { method: 'POST' });
      setItems(items.map(i => i._id === id ? { ...i, status: 'approved', promotedTo: true } : i));
      alert('Volontaire promu avec succès.');
    } catch (err) {
      alert(err.message);
    }
  };

  const del = async (id) => {
    if (!confirm('Supprimer ?')) return;
    await adminFetch(`/admin/volunteers/${id}`, { method: 'DELETE' });
    setItems(items.filter(i => i._id !== id));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-3">Demandes de volontariat</h2>
      <div style={{maxHeight:400, overflow:'auto'}}>
        {items.map(v => (
          <div key={v._id} className="border-b py-2 flex justify-between">
            <div>
              <div><strong>{v.fullName}</strong> — {v.email}</div>
              <div className="text-sm">{v.motivation?.slice(0,200)}</div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <div>{v.status}</div>
              {v.status !== 'approved' && <button onClick={() => approve(v._id)}>Approuver</button>}
              {!v.promotedTo && (
                <button onClick={() => promote(v._id)} className="text-blue-600">
                  Promouvoir vers volontaires missions
                </button>
              )}
              <button onClick={() => del(v._id)} className="text-red-600">Suppr</button>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
