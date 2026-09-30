/**
 * Dashboard IS — Statistiques Institution Spécialisée
 * AMP BENIN
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function ISStats() {
  const { user, loading: authLoading } = useAuthAMP(["IS"]);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchISStats = async () => {
      try {
        const data = await apiFetch("/dashboard/is/stats");
        setStats(data);
      } catch (err) {
        console.error("Erreur stats IS :", err);
        setError("Impossible de charger les statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchISStats();
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
    <section className="is-stats">
      <h2>{stats.institutionName}</h2>

      {/* Activités */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Activités prévues</h3>
          <p>{stats.activities.planned}</p>
        </div>
        <div className="stat-card">
          <h3>Activités réalisées</h3>
          <p>{stats.activities.completed}</p>
        </div>
      </div>

      {/* Finances */}
      <div className="finance-grid">
        <div className="finance-card income">
          <h4>Entrées</h4>
          <p>{stats.finance.totalIncomes.toLocaleString()} FCFA</p>
        </div>

        <div className="finance-card expense">
          <h4>Sorties</h4>
          <p>{stats.finance.totalExpenses.toLocaleString()} FCFA</p>
        </div>

        <div className="finance-card balance">
          <h4>Solde</h4>
          <p>{stats.finance.balance.toLocaleString()} FCFA</p>
        </div>
      </div>
    </section>
  );
}
