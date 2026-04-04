/**
 * Dashboard ADMIN — Tableau national des activités (avec filtres)
 * AMP BENIN
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function GlobalActivitiesTable() {
  // Sécurité : ADMIN uniquement
  const { loading: authLoading } = useAuthAMP(["ADMIN"]);

  const [activities, setActivities] = useState([]);
  const [filters, setFilters] = useState({});
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

  // Chargement des activités selon filtres
  useEffect(() => {
    if (authLoading) return;

    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/activities", {
          params: filters,
        });
        setActivities(data);
      } catch (err) {
        console.error("Erreur activités ADMIN :", err);
        setError("Impossible de charger les activités");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [authLoading, filters]);

  if (loading || authLoading) {
    return <p>Chargement des activités...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <section className="global-activities">
      <h2>Activités nationales</h2>

      <table className="activities-table">
        <thead>
          <tr>
            <th>Intitulé</th>
            <th>Espace</th>
            <th>Type</th>
            <th>Date</th>
            <th>Statut</th>
          </tr>
        </thead>

        <tbody>
          {activities.length === 0 && (
            <tr>
              <td colSpan="5">Aucune activité trouvée</td>
            </tr>
          )}

          {activities.map((activity) => (
            <tr key={activity._id}>
              <td>{activity.title}</td>
              <td>{activity.spaceName}</td>
              <td>{activity.spaceType}</td>
              <td>
                {new Date(activity.date).toLocaleDateString()}
              </td>
              <td>
                <span
                  className={`status ${activity.status.toLowerCase()}`}
                >
                  {activity.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
