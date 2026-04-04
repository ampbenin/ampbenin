/**
 * Dashboard IS — Résumé financier institutionnel
 * AMP BENIN
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function InstitutionFinanceSummary() {
  const { user, loading: authLoading } = useAuthAMP(["IS"]);

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    const fetchFinanceSummary = async () => {
      try {
        const data = await apiFetch("/api/finances/summary");
        setSummary(data);
      } catch (err) {
        console.error("Erreur finances IS :", err);
        setError("Impossible de charger le résumé financier");
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceSummary();
  }, [authLoading]);

  if (loading || authLoading) {
    return <p>Chargement du résumé financier...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!summary) {
    return null;
  }

  return (
    <section className="institution-finance-summary">
      <h3>Résumé financier</h3>

      <div className="finance-grid">
        <div className="finance-card income">
          <h4>Entrées</h4>
          <p>{summary.totalIncomes.toLocaleString()} FCFA</p>
        </div>

        <div className="finance-card expense">
          <h4>Sorties</h4>
          <p>{summary.totalExpenses.toLocaleString()} FCFA</p>
        </div>

        <div className="finance-card balance">
          <h4>Solde</h4>
          <p>{summary.balance.toLocaleString()} FCFA</p>
        </div>
      </div>
    </section>
  );
}
