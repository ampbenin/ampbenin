// src/components/admin/MemberManager.jsx
import React, { useEffect, useState } from 'react';

export default function MemberManager({ serverUrl = '' }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    fetch(`${serverUrl}/admin/members`).then(r=>r.json()).then(setList).catch(console.error);
  }, []);

  const approve = async (id) => {
    await fetch(`${serverUrl}/admin/members/${id}/approve`, { method: 'PATCH' });
    setList(list.map(i => i._id === id ? { ...i, status: 'approved' } : i));
  };

  const del = async (id) => {
    if (!confirm('Supprimer ?')) return;
    await fetch(`${serverUrl}/admin/members/${id}`, { method: 'DELETE' });
    setList(list.filter(i => i._id !== id));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-3">Demandes d'adhésion</h2>
      <div style={{maxHeight:400, overflow:'auto'}}>
        {list.map(m => (
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
    </div>
  );
}
