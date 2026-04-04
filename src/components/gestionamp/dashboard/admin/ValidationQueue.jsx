/**
 * Dashboard ADMIN — File de validation des activités
 * AMP BENIN
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function ValidationQueue() {
  // Sécurité : ADMIN uniquement
  const { loading: authLoading } = useAuthAMP(["ADMIN"]);

  const [pendingActivities, setPendingActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchPendingActivities = async () => {
    try {
      const data = await apiFetch("/api/activities?status=PENDING");
      setPendingActivities(data);
    } catch (err) {
      console.error("Erreur file validation :", err);
      setError("Impossible de charger les validations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchPendingActivities();
    }
  }, [authLoading]);

  const handleValidate = async (id) => {
    setProcessingId(id);

    try {
      await apiFetch(`/api/activities/${id}/validate`, {
        method: "PUT",
      });

      // Mise à jour locale après validation
      setPendingActivities((prev) =>
        prev.filter((activity) => activity._id !== id)
      );
    } catch (err) {
      console.error("Erreur validation activité :", err);
      alert("Erreur lors de la validation");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || authLoading) {
    return <p>Chargement de la file de validation...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <section className="validation-queue">
      <h2>Activités en attente de validation</h2>

      {pendingActivities.length === 0 ? (
        <p>Aucune activité en attente</p>
      ) : (
        <table className="validation-table">
          <thead>
            <tr>
              <th>Intitulé</th>
              <th>Espace</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {pendingActivities.map((activity) => (
              <tr key={activity._id}>
                <td>{activity.title}</td>
                <td>{activity.spaceName}</td>
                <td>
                  {new Date(activity.date).toLocaleDateString()}
                </td>
                <td>
                  <button
                    onClick={() => handleValidate(activity._id)}
                    disabled={processingId === activity._id}
                  >
                    {processingId === activity._id
                      ? "Validation..."
                      : "Valider"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
