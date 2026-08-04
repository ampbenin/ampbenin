// Éditeur de la campagne "16 jours d'activisme" (et futures campagnes
// similaires). Édition en JSON brut par pragmatisme : `sections` +
// `dailyArticles` couvrent des formes hétérogènes (tableaux d'images,
// stats, chronologie, articles longs) pour lesquelles un formulaire par
// champ serait disproportionné vu le nombre de campagnes gérées (une seule
// aujourd'hui). Voir plan de refonte, phase 3.
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';

const DEFAULT_SLUG = '16jours-2025';

export default function CampaignEditor() {
  const [slug, setSlug] = useState(DEFAULT_SLUG);
  const [sectionsJson, setSectionsJson] = useState('{}');
  const [dailyArticlesJson, setDailyArticlesJson] = useState('[]');
  const [status, setStatus] = useState('DRAFT');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setError('');
    setSaved(false);
    adminFetch(`/api/cms/campaigns/${slug}`)
      .then((data) => {
        setSectionsJson(JSON.stringify(data?.sections || {}, null, 2));
        setDailyArticlesJson(JSON.stringify(data?.dailyArticles || [], null, 2));
        setStatus(data?.status || 'DRAFT');
      })
      .catch(() => {
        setSectionsJson('{}');
        setDailyArticlesJson('[]');
        setStatus('DRAFT');
      });
  }, [slug]);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    let sections, dailyArticles;
    try {
      sections = JSON.parse(sectionsJson);
      dailyArticles = JSON.parse(dailyArticlesJson);
    } catch {
      setError('JSON invalide (sections ou articles journaliers)');
      return;
    }

    try {
      await adminFetch(`/api/cms/campaigns/${slug}`, {
        method: 'PUT',
        body: JSON.stringify({ sections, dailyArticles, status }),
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Campagne — {slug}</h2>

      <form onSubmit={save} className="grid gap-2 max-w-3xl">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm">Enregistré</p>}

        <label className="text-sm text-gray-600">
          Blocs à données (JSON) — actuImages[], stats[], timeline[], gallery[]
        </label>
        <textarea value={sectionsJson} onChange={(e) => setSectionsJson(e.target.value)}
          rows={10} className="border px-2 py-1 rounded font-mono text-sm" />

        <label className="text-sm text-gray-600 mt-2">
          Articles journaliers (JSON) — [{'{'}day, title, date, body, gallery{'}'}]
        </label>
        <textarea value={dailyArticlesJson} onChange={(e) => setDailyArticlesJson(e.target.value)}
          rows={14} className="border px-2 py-1 rounded font-mono text-sm" />

        <div className="flex gap-2 items-center mt-2">
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
