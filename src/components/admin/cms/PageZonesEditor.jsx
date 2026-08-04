// Éditeur d'une page "singleton" (accueil, à-propos, programmes).
// `zones` est édité en JSON brut : sa forme diffère selon la page
// (heroSlides/heroStats/... pour l'accueil, un simple `body` pour à-propos),
// donc un éditeur générique par champ serait sur-mesure pour chaque page —
// non justifié tant qu'il n'y a que 3 pages singleton (voir plan de refonte).
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';

const PAGES = [
  { key: 'home', label: 'Accueil' },
  { key: 'a-propos', label: 'À propos' },
  { key: 'programmes', label: 'Programmes (intro)' },
];

export default function PageZonesEditor() {
  const [pageKey, setPageKey] = useState('home');
  const [zonesJson, setZonesJson] = useState('{}');
  const [status, setStatus] = useState('DRAFT');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setError('');
    setSaved(false);
    adminFetch(`/api/cms/pages/${pageKey}`)
      .then((data) => {
        setZonesJson(JSON.stringify(data?.zones || {}, null, 2));
        setStatus(data?.status || 'DRAFT');
      })
      .catch(() => {
        setZonesJson('{}');
        setStatus('DRAFT');
      });
  }, [pageKey]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    let zones;
    try {
      zones = JSON.parse(zonesJson);
    } catch {
      setError('JSON invalide');
      return;
    }

    try {
      await adminFetch(`/api/cms/pages/${pageKey}`, {
        method: 'PUT',
        body: JSON.stringify({ zones, status }),
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Pages du site</h2>

      <div className="flex gap-2 mb-4">
        {PAGES.map((p) => (
          <button key={p.key} onClick={() => setPageKey(p.key)}
            className={`px-3 py-1 rounded border ${pageKey === p.key ? 'bg-blue-600 text-white' : ''}`}>
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="grid gap-2 max-w-3xl">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm">Enregistré</p>}
        <label className="text-sm text-gray-600">Contenu (JSON)</label>
        <textarea value={zonesJson} onChange={(e) => setZonesJson(e.target.value)}
          rows={20} className="border px-2 py-1 rounded font-mono text-sm" />
        <div className="flex gap-2 items-center">
          <label>Statut</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border px-2 py-1 rounded">
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
          </select>
        </div>
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded w-fit">Enregistrer</button>
      </form>
    </div>
  );
}
