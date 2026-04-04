import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/gestionamp/api";

export default function ActivitiesTable() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    apiFetch("/api/activities")
      .then(setActivities)
      .catch(() => {});
  }, []);

  return (
    <div>
      <h2>Activités</h2>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Statut</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {activities.map((a) => (
            <tr key={a._id}>
              <td>{a.title}</td>
              <td>{a.status}</td>
              <td>{new Date(a.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
