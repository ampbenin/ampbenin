/**
 * Dashboard ADMIN — Filtres globaux
 * AMP BENIN
 */

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function FilterByYearAndSpace() {
  // Sécurité : ADMIN uniquement
  const { loading: authLoading } = useAuthAMP(["ADMIN"]);

  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [coordinations, setCoordinations] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [coordinationId, setCoordinationId] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  useEffect(() => {
    if (authLoading) return;

    const fetchSpaces = async () => {
      try {
        const cc = await apiFetch("/api/coordinations");
        const is = await apiFetch("/api/institutions");

        setCoordinations(cc);
        setInstitutions(is);
      } catch (err) {
        console.error("Erreur chargement espaces :", err);
      }
    };

    fetchSpaces();
  }, [authLoading]);

  // Diffusion globale des filtres
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("amp:filtersChanged", {
        detail: {
          year,
          coordinationId,
          institutionId,
        },
      })
    );
  }, [year, coordinationId, institutionId]);

  if (authLoading) return null;

  return (
    <section className="filter-bar">
      <h2>Filtres</h2>

      <div className="filters">
        {/* Année */}
        <div className="filter">
          <label>Année</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Coordination Communale */}
        <div className="filter">
          <label>Coordination Communale</label>
          <select
            value={coordinationId}
            onChange={(e) => setCoordinationId(e.target.value)}
          >
            <option value="">Toutes</option>
            {coordinations.map((cc) => (
              <option key={cc._id} value={cc._id}>
                {cc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Institution Spécialisée */}
        <div className="filter">
          <label>Institution Spécialisée</label>
          <select
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
          >
            <option value="">Toutes</option>
            {institutions.map((inst) => (
              <option key={inst._id} value={inst._id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
