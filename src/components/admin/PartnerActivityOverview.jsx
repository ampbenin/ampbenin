// src/components/admin/PartnerActivityOverview.jsx
// Vue d'ensemble ADMIN/EDITOR : qui parmi les comptes PARTENAIRE est actif,
// depuis quand, et ce qu'il consulte le plus (voir
// controllers/volunteerProgramPartnerController.js#getPartnerActivitySummary
// / getPartnerActivityTimeline, utils/partnerActivityLogger.js pour les
// points de collecte). "En ligne" est dérivé du dernier événement enregistré
// (actif il y a moins de 5 min) — pas de statut temps réel/WebSocket.
import { useEffect, useState } from "react";
import { adminFetch } from "@/services/admin/api";

const ACTION_LABELS = {
  LOGIN: "Connexion",
  OPEN_DASHBOARD: "Ouverture dashboard",
  VIEW_STATS: "Consultation stats",
  VIEW_APPLICATIONS: "Consultation candidatures",
  DOWNLOAD_REPORT: "Téléchargement PDF",
  UPLOAD_LOGO: "Changement logo",
  POST_COMMENT: "Commentaire envoyé",
};

function formatRelative(dateStr) {
  if (!dateStr) return "Jamais connecté";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function Timeline({ partnerId }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/volunteer-partner/admin/partners/${partnerId}/activity?page=${p}&limit=10`);
      setItems(res?.items || []);
      setTotalPages(res?.totalPages || 1);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [partnerId]);

  if (loading) return <p className="text-sm text-gray-500 mt-2">Chargement...</p>;
  if (items.length === 0) return <p className="text-sm text-gray-500 mt-2">Aucune activité enregistrée.</p>;

  return (
    <div className="mt-2 bg-gray-50 rounded-lg p-3">
      <ul className="space-y-1 text-sm">
        {items.map((it) => (
          <li key={it._id} className="flex justify-between border-b border-gray-200 pb-1">
            <span>
              <strong>{ACTION_LABELS[it.action] || it.action}</strong>
              {it.programTitle && <span className="text-gray-500"> — {it.programTitle}</span>}
              {it.metadata?.search && <span className="text-gray-400 text-xs"> (recherche : "{it.metadata.search}")</span>}
            </span>
            <span className="text-gray-400 text-xs whitespace-nowrap ml-2">
              {new Date(it.createdAt).toLocaleString("fr-FR")}
            </span>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-2 text-xs">
          <button onClick={() => load(page - 1)} disabled={page <= 1} className="text-blue-600 disabled:text-gray-300">← Précédent</button>
          <span className="text-gray-500">Page {page} / {totalPages}</span>
          <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="text-blue-600 disabled:text-gray-300">Suivant →</button>
        </div>
      )}
    </div>
  );
}

export default function PartnerActivityOverview() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/volunteer-partner/admin/activity-summary");
      setItems(res?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Activité des partenaires</h2>
      <p className="text-sm text-gray-500 mb-4">
        Qui s'intéresse aux programmes et ce qu'il aime vérifier — "En ligne" = actif il y a moins de 5 minutes.
      </p>

      {items.length === 0 ? (
        <p className="text-gray-500">Aucun compte partenaire pour l'instant.</p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.partnerId} className="border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <strong>{p.name}</strong>
                    <span className="text-gray-500 text-sm">({p.email})</span>
                    {p.isOnline ? (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">● En ligne</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Vu {formatRelative(p.lastActiveAt)}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Programmes suivis : {p.programs.length > 0 ? p.programs.join(", ") : "aucun"}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(p.actionCounts).length === 0 ? (
                      <span className="text-xs text-gray-400">Aucune action enregistrée</span>
                    ) : (
                      Object.entries(p.actionCounts).map(([action, count]) => (
                        <span key={action} className="bg-violet-50 text-violet-700 text-xs px-2 py-0.5 rounded-full">
                          {ACTION_LABELS[action] || action} × {count}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{p.totalActions}</div>
                  <div className="text-xs text-gray-500">action(s)</div>
                  <button
                    onClick={() => setExpandedId(expandedId === p.partnerId ? null : p.partnerId)}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    {expandedId === p.partnerId ? "Masquer le détail" : "Voir le détail"}
                  </button>
                </div>
              </div>
              {expandedId === p.partnerId && <Timeline partnerId={p.partnerId} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
