/**
 * Dashboard ADMIN — Statistiques nationales (avec filtres)
 * AMP BENIN
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function AdminStats() {
  // Sécurité : ADMIN uniquement
  const { loading: authLoading } = useAuthAMP(["ADMIN"]);

  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ year: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Écoute des filtres globaux
  useEffect(() => {
    const handleFiltersChange = (event) => {
      setFilters(event.detail);
    };

    window.addEventListener("amp:filtersChanged", handleFiltersChange);

    return () => {
      window.removeEventListener(
        "amp:filtersChanged",
        handleFiltersChange
      );
    };
  }, []);

  // Chargement des stats selon filtres
  useEffect(() => {
    if (authLoading) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/dashboard/stats", {
          params: filters,
        });
        setStats(data);
      } catch (err) {
        console.error("Erreur stats ADMIN :", err);
        setError("Impossible de charger les statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [authLoading, filters]);

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
    <section className="admin-stats">
      <h2>Indicateurs nationaux</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Coordinations Communales</h3>
          <p>{stats.coordinations}</p>
        </div>

        <div className="stat-card">
          <h3>Institutions Spécialisées</h3>
          <p>{stats.institutions}</p>
        </div>

        <div className="stat-card">
          <h3>Émissaires Communautaires (EC)</h3>
          <p>{stats.ec}</p>
        </div>

        <div className="stat-card">
          <h3>Institutions (IS)</h3>
          <p>{stats.is}</p>
        </div>

        <div className="stat-card">
          <h3>Activités prévues</h3>
          <p>{stats.activities.planned}</p>
        </div>

        <div className="stat-card">
          <h3>Activités réalisées</h3>
          <p>{stats.activities.completed}</p>
        </div>

        <div className="stat-card">
          <h3>En attente de validation</h3>
          <p>{stats.activities.pending}</p>
        </div>
      </div>
    </section>
  );
}
