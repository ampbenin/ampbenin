// Recrutement pour les rôles EC/IS/SUPERVISEUR/PARTENAIRE — décision
// utilisateur 2026-09-30 : "les accès s'appliquent... à tous les comptes
// sauf les admins". Ces rôles n'ont jamais accès à /admin/dashboard
// (AdminShell, réservé ADMIN/EDITOR), donc ce panneau est le seul chemin
// pour eux vers une offre qui leur est affectée — monté depuis
// src/pages/gestionamp/dashboard/recrutement.astro, lié dans l'en-tête de
// chacun de leurs tableaux de bord existants (ec/is/superviseur/partenaire.astro).
//
// GET /api/cms/jobs/admin est déjà filtré côté serveur aux offres où
// l'utilisateur connecté a au moins un droit dans staffAccess (voir
// controllers/cms/jobPostingsController.js#adminList) — ce panneau n'a
// donc qu'à afficher la liste telle quelle, pas de filtrage supplémentaire.
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';
import JobRecruitmentManager from '@/components/admin/cms/JobRecruitmentManager.jsx';

const STATUS_LABELS = { DRAFT: 'Brouillon', PUBLISHED: 'Publiée' };

export default function RecruitmentAssignedPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(null);

  const load = () => {
    setLoading(true);
    adminFetch('/api/cms/jobs/admin')
      .then((data) => setItems(data?.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (selectedJobId) {
    return (
      <JobRecruitmentManager
        jobId={selectedJobId}
        onBack={() => { setSelectedJobId(null); load(); }}
      />
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Recrutement — offres qui vous sont affectées</h2>

      {loading && <p className="text-gray-500">Chargement...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-500">Aucune offre ne vous est affectée pour l'instant.</p>
      )}

      <div>
        {items.map((item) => (
          <div key={item._id} className="border-b py-2 flex justify-between items-center">
            <div>
              <strong>{item.title}</strong> <span className="text-xs text-gray-500">({STATUS_LABELS[item.status] || item.status})</span>
              <div className="text-sm text-gray-600">{item.category} — {item.location}</div>
            </div>
            <button onClick={() => setSelectedJobId(item._id)} className="underline text-blue-700 text-sm">
              Gérer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
