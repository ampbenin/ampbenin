import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/gestionamp/api";

export default function FinanceSummary() {
  const [finances, setFinances] = useState([]);

  useEffect(() => {
    apiFetch("/api/finances")
      .then(setFinances)
      .catch(() => {});
  }, []);

  return (
    <div>
      <h2>Détails financiers</h2>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Type</th>
            <th>Montant</th>
            <th>Activité</th>
          </tr>
        </thead>

        <tbody>
          {finances.map((f) => (
            <tr key={f._id}>
              <td>{f.type}</td>
              <td>{f.amount}</td>
              <td>{f.activityId?.title || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
