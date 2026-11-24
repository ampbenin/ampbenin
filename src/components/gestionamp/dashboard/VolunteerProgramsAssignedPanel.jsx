// Programmes de volontariat pour les rôles EC/IS/SUPERVISEUR/PARTENAIRE —
// même principe que RecruitmentAssignedPanel.jsx : ces rôles n'ont jamais
// accès à /admin/dashboard (réservé ADMIN/EDITOR), donc ce panneau est le
// seul chemin pour eux vers un programme où ils ont été affectés comme
// réviseur (VolunteerProgram.reviewerIds, voir canReviewProgram) — retour
// utilisateur, 2026-11-24 : "donner accès à un superviseur pour intervenir
// sur l'étude" des candidatures d'un programme.
//
// GET /api/volunteer-programs/all est déjà filtré côté serveur aux
// programmes où l'utilisateur connecté figure dans reviewerIds (voir
// volunteerProgramController.js#listAllPrograms) — ce panneau n'a donc qu'à
// afficher la liste telle quelle. VolunteerProgramEditor.jsx restreint de
// son côté l'affichage à l'onglet Candidatures pour ce rôle (isReviewerOnly).
import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin/api';
import VolunteerProgramEditor from '@/components/admin/VolunteerProgramEditor.jsx';

const STATUS_LABELS = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', ARCHIVED: 'Archivé', CLOSED: 'Fermé' };

export default function VolunteerProgramsAssignedPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState(null);

  const load = () => {
    setLoading(true);
    adminFetch('/api/volunteer-programs/all')
      .then((data) => setItems(data?.items || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (selectedProgramId) {
    return (
      <VolunteerProgramEditor
        programId={selectedProgramId}
        onBack={() => { setSelectedProgramId(null); load(); }}
      />
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Volontariat — programmes qui vous sont affectés</h2>

      {loading && <p className="text-gray-500">Chargement...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-500">Aucun programme ne vous est affecté pour l'instant.</p>
      )}

      <div>
        {items.map((item) => (
          <div key={item._id} className="border-b py-2 flex justify-between items-center">
            <div>
              <strong>{item.title}</strong> <span className="text-xs text-gray-500">({STATUS_LABELS[item.status] || item.status})</span>
              <div className="text-sm text-gray-600">{item.location}</div>
            </div>
            <button onClick={() => setSelectedProgramId(item._id)} className="underline text-blue-700 text-sm">
              Gérer les candidatures
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
