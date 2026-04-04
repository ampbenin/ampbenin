/**
 * Dashboard EC — Tableau des activités
 * AMP BENIN
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function ActivitiesTable() {
  const { user, loading: authLoading } = useAuthAMP(["EC"]);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchActivities = async () => {
      try {
        const data = await apiFetch("/api/activities");
        setActivities(data);
      } catch (err) {
        console.error("Erreur chargement activités :", err);
        setError("Impossible de charger les activités");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [authLoading]);

  if (loading || authLoading) {
    return <p>Chargement des activités...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <section className="activities-table">
      <h3>Activités de la Coordination</h3>

      <table>
        <thead>
          <tr>
            <th>Titre</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Budget (FCFA)</th>
            <th>Validation</th>
          </tr>
        </thead>

        <tbody>
          {activities.length === 0 && (
            <tr>
              <td colSpan="5">Aucune activité enregistrée</td>
            </tr>
          )}

          {activities.map((activity) => (
            <tr key={activity._id}>
              <td>{activity.title}</td>
              <td>{new Date(activity.date).toLocaleDateString()}</td>
              <td>
                {activity.status === "PLANNED" && "Prévue"}
                {activity.status === "COMPLETED" && "Réalisée"}
              </td>
              <td>{activity.budget.toLocaleString()}</td>
              <td>
                {activity.validated ? (
                  <span className="badge success">Validée</span>
                ) : (
                  <span className="badge warning">En attente</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
