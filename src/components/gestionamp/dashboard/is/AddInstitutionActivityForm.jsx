/**
 * Dashboard IS — Formulaire de création d’activité institutionnelle
 * AMP BENIN
 */

import { useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function AddInstitutionActivityForm({ onActivityCreated }) {
  const { user } = useAuthAMP(["IS"]);

  const [formData, setFormData] = useState({
    title: "",
    domain: "",
    date: "",
    budget: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch("/api/activities", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget),
        }),
      });

      setSuccess("Activité institutionnelle créée");
      setFormData({
        title: "",
        domain: "",
        date: "",
        budget: "",
        description: "",
      });

      if (onActivityCreated) {
        onActivityCreated();
      }
    } catch (err) {
      console.error("Erreur création activité IS :", err);
      setError("Erreur lors de la création de l’activité");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="add-institution-activity-form">
      <h3>Nouvelle activité institutionnelle</h3>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Titre de l’activité"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="domain"
          placeholder="Domaine d’intervention"
          value={formData.domain}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="budget"
          placeholder="Budget (FCFA)"
          value={formData.budget}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer l’activité"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </section>
  );
}
