/**
 * Dashboard ADMIN — Résumé financier national (avec filtres)
 * AMP BENIN
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function FinanceGlobalSummary() {
  // Sécurité : ADMIN uniquement
  const { loading: authLoading } = useAuthAMP(["ADMIN"]);

  const [finance, setFinance] = useState(null);
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

  // Chargement du résumé financier selon filtres
  useEffect(() => {
    if (authLoading) return;

    const fetchFinanceSummary = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/api/finances/summary", {
          params: filters,
        });
        setFinance(data);
      } catch (err) {
        console.error("Erreur finances ADMIN :", err);
        setError("Impossible de charger le résumé financier");
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceSummary();
  }, [authLoading, filters]);

  if (loading || authLoading) {
    return <p>Chargement du résumé financier...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!finance) {
    return null;
  }

  return (
    <section className="finance-summary">
      <h2>Résumé financier national</h2>

      <div className="finance-cards">
        <div className="finance-card income">
          <h3>Entrées totales</h3>
          <p>{finance.totalIncomes.toLocaleString()} FCFA</p>
        </div>

        <div className="finance-card expense">
          <h3>Sorties totales</h3>
          <p>{finance.totalExpenses.toLocaleString()} FCFA</p>
        </div>

        <div className="finance-card balance">
          <h3>Solde global</h3>
          <p>{finance.balance.toLocaleString()} FCFA</p>
        </div>
      </div>
    </section>
  );
}
