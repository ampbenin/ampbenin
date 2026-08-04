import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE || '';

export default function MediaLibrary() {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const token = localStorage.getItem('amp_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/cms/media`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, []);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    const token = localStorage.getItem('amp_token');
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/cms/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Échec de l\'envoi');
      setItems([data, ...items]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const copy = (url) => {
    navigator.clipboard.writeText(url);
    alert('URL copiée');
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Médiathèque</h2>

      <div className="mb-4">
        <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} />
        {uploading && <span className="ml-2 text-sm text-gray-500">Envoi en cours...</span>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((m) => (
          <div key={m._id} className="border rounded p-2">
            <img src={m.url} alt={m.alt} className="w-full h-24 object-cover rounded mb-1" />
            <button onClick={() => copy(m.url)} className="text-xs underline w-full text-left">Copier l'URL</button>
          </div>
        ))}
      </div>
    </div>
  );
}
