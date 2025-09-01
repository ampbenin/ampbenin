import React, { useState } from "react";

export default function SaveVolunteers({ initialMissionId = "" }) {
  const [form, setForm] = useState({
    titre: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    statut: "", // valeur par défaut
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    console.log("📩 Envoi au backend:", form);

    try {
      const res = await fetch("/.netlify/functions/saveVolunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("📬 Réponse backend:", data);

      if (!res.ok) throw new Error(data.message || "Erreur inconnue");

      setMessage({ type: "success", text: data.message });
      setForm({ ...form, nom: "", prenom: "", email: "", telephone: "", statut: "Non disponible" });
    } catch (err) {
      console.error("❌ Erreur fetch:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md p-4 rounded-xl shadow-md bg-white">
      <h2 className="text-lg font-bold mb-4">Ajouter un volontaire</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="titre"
          placeholder="Titre de la MISSION"
          value={form.titre}
          onChange={handleChange}
          required
          className="w-full border rounded-lg p-2"
        />
        <input
          type="text"
          name="nom"
          placeholder="Nom"
          value={form.nom}
          onChange={handleChange}
          required
          className="w-full border rounded-lg p-2"
        />
        <input
          type="text"
          name="prenom"
          placeholder="Prénom"
          value={form.prenom}
          onChange={handleChange}
          required
          className="w-full border rounded-lg p-2"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border rounded-lg p-2"
        />
        <input
          type="tel"
          name="telephone"
          placeholder="Téléphone"
          value={form.telephone}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
        <select
          name="statut"
          value={form.statut}
          onChange={handleChange}
          required
          className="w-full border rounded-lg p-2"
        >
          <option value="">Sélectionner le statut</option>
          <option value="Non disponible">Non disponible</option>
          <option value="Refusé">Refusé</option>
          <option value="Mission validée">Mission validée</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-3 text-sm font-medium ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
