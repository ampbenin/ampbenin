/**
 * Dashboard EC — Formulaire de saisie financière
 * AMP BENIN
 */

import { useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";
import { useAuthAMP } from "@/services/gestionamp/useAuthAMP";

export default function AddFinanceForm({ onFinanceAdded }) {
  const { user } = useAuthAMP(["EC"]);

  const [formData, setFormData] = useState({
    type: "INCOME",
    amount: "",
    label: "",
    date: "",
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
      await apiFetch("/api/finances", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
        }),
      });

      setSuccess("Opération financière enregistrée");
      setFormData({
        type: "INCOME",
        amount: "",
        label: "",
        date: "",
      });

      if (onFinanceAdded) {
        onFinanceAdded();
      }
    } catch (err) {
      console.error("Erreur finance EC :", err);
      setError("Erreur lors de l’enregistrement financier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="add-finance-form">
      <h3>Nouvelle opération financière</h3>

      <form onSubmit={handleSubmit}>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
        >
          <option value="INCOME">Entrée</option>
          <option value="EXPENSE">Sortie</option>
        </select>

        <input
          type="number"
          name="amount"
          placeholder="Montant (FCFA)"
          value={formData.amount}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="label"
          placeholder="Libellé"
          value={formData.label}
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

        <button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </section>
  );
}
