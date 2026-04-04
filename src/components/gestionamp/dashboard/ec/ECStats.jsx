/**
 * Dashboard EC — Statistiques de la Coordination Communale
 * AMP BENIN
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function ECStats() {
  // Sécurité : EC uniquement
  const { user, loading: authLoading } = useAuthAMP(["EC"]);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchECStats = async () => {
      try {
        const data = await apiFetch("/api/dashboard/ec/stats");
        setStats(data);
      } catch (err) {
        console.error("Erreur stats EC :", err);
        setError("Impossible de charger les statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchECStats();
  }, [authLoading]);

  if (loading || authLoading) {
    return <p>Chargement des statistiques...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!stats) {
    return null;
  }

  return (
    <section className="ec-stats">
      <h2>{stats.coordinationName}</h2>

      <div className="stats-grid">
        {/* Activités */}
        <div className="stat-card">
          <h3>Activités prévues</h3>
          <p>{stats.activities.planned}</p>
        </div>

        <div className="stat-card">
          <h3>Activités réalisées</h3>
          <p>{stats.activities.completed}</p>
        </div>

        {/* Finances */}
        <div className="stat-card">
          <h3>Entrées</h3>
          <p>{stats.finance.totalIncomes.toLocaleString()} FCFA</p>
        </div>

        <div className="stat-card">
          <h3>Sorties</h3>
          <p>{stats.finance.totalExpenses.toLocaleString()} FCFA</p>
        </div>

        <div className="stat-card">
          <h3>Solde</h3>
          <p>{stats.finance.balance.toLocaleString()} FCFA</p>
        </div>
      </div>
    </section>
  );
}
