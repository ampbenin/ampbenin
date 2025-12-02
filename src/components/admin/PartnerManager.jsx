// src/components/admin/PartnerManager.jsx
import React, { useEffect, useState } from 'react';

export default function PartnerManager({ serverUrl = '' }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    fetch(`${serverUrl}/admin/partners`).then(r => r.json()).then(setList).catch(console.error);
  }, []);

  const approve = async (id) => {
    await fetch(`${serverUrl}/admin/partners/${id}/approve`, { method: 'PATCH' });
    setList(list.map(i => i._id === id ? { ...i, status: 'approved' } : i));
  };

  const del = async (id) => {
    if (!confirm('Supprimer ?')) return;
    await fetch(`${serverUrl}/admin/partners/${id}`, { method: 'DELETE' });
    setList(list.filter(i => i._id !== id));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-3">Propositions de partenariat</h2>
      <div style={{maxHeight:400, overflow:'auto'}}>
        {list.map(p => (
          <div key={p._id} className="border-b py-2 flex justify-between">
            <div>
              <div><strong>{p.organization}</strong> — {p.contactEmail}</div>
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
    </div>
  );
}
