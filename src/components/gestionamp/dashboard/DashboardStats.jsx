import { useEffect, useState } from "react";
import { apiFetch } from "../../../services/gestionamp/api";

export default function DashboardStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch("/api/finances/summary")
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return <p>Chargement des statistiques...</p>;

  return (
    <div>
      <h2>Résumé financier</h2>
      <ul>
        <li>Total entrées : {stats.totalIncome}</li>
        <li>Total sorties : {stats.totalExpense}</li>
        <li>Solde : {stats.balance}</li>
      </ul>
    </div>
  );
}
