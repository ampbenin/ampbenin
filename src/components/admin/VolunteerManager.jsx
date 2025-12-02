// src/components/admin/VolunteerManager.jsx
import React, { useEffect, useState } from 'react';

export default function VolunteerManager({ serverUrl = '' }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    fetch(`${serverUrl}/admin/volunteers`).then(r => r.json()).then(setList).catch(console.error);
  }, []);

  const approve = async (id) => {
    await fetch(`${serverUrl}/admin/volunteers/${id}/approve`, { method: 'PATCH' });
    setList(list.map(i => i._id === id ? { ...i, status: 'approved' } : i));
  };

  const del = async (id) => {
    if (!confirm('Supprimer ?')) return;
    await fetch(`${serverUrl}/admin/volunteers/${id}`, { method: 'DELETE' });
    setList(list.filter(i => i._id !== id));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-3">Demandes de volontariat</h2>
      <div style={{maxHeight:400, overflow:'auto'}}>
        {list.map(v => (
          <div key={v._id} className="border-b py-2 flex justify-between">
            <div>
              <div><strong>{v.name}</strong> — {v.email}</div>
              <div className="text-sm">{v.motivation?.slice(0,200)}</div>
            </div>
            <div>
              <div>{v.status}</div>
              {v.status !== 'approved' && <button onClick={() => approve(v._id)}>Approuver</button>}
              <button onClick={() => del(v._id)} className="text-red-600">Suppr</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
