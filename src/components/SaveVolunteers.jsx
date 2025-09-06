import React, { useState } from "react";

export default function SaveVolunteers({ initialMissionId = "" }) {
  const [form, setForm] = useState({
    titre: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    statut: "Non disponible",
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

    try {
      console.log("📩 Vérification mission:", form.titre);

      const missionRes = await fetch(
        "https://outdoor-arlene-ampbenin-4ca9a164.koyeb.app/api/missions/find-by-title",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titre: form.titre }),
        }
      );

      const missionData = await missionRes.json();

      if (!missionRes.ok) throw new Error(missionData.message || "Mission introuvable");

      const missionId = missionData._id?.toString();
      if (!missionId) throw new Error("Impossible de récupérer l'ID de la mission");

      console.log("✅ Mission trouvée, ObjectId:", missionId);

      const res = await fetch(
        "https://outdoor-arlene-ampbenin-4ca9a164.koyeb.app/api/volunteers",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titre: form.titre,
            nom: form.nom,
            prenom: form.prenom,
            email: form.email,
            telephone: form.telephone,
            statut: form.statut,
          }),
        }
      );

      const data = await res.json();
      console.log("📬 Réponse backend:", data);

      if (!res.ok) throw new Error(data.message || "Erreur lors de l'enregistrement");

      setMessage({ type: "success", text: data.message });
      setForm({
        titre: "",
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        statut: "Non disponible",
      });
    } catch (err) {
      console.error("❌ Erreur fetch:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-yellow-50 via-white to-yellow-50 border border-yellow-200">
      <h2 className="text-2xl font-extrabold text-yellow-700 mb-4 text-center">
        🌿 Ajouter un volontaire
      </h2>

      <p className="text-center text-gray-600 mb-6">
        Remplissez le formulaire pour inscrire un nouveau volontaire pour une mission. CET ESPACE EST RESERVE UNIQUEMENT AUX ADMINISTRATEURS TECHNIQUE ET DAF DE AMP BENIN
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="titre"
          placeholder="Titre de la MISSION"
          value={form.titre}
          onChange={handleChange}
          required
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <input
          type="text"
          name="nom"
          placeholder="Nom"
          value={form.nom}
          onChange={handleChange}
          required
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <input
          type="text"
          name="prenom"
          placeholder="Prénom"
          value={form.prenom}
          onChange={handleChange}
          required
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <input
          type="tel"
          name="telephone"
          placeholder="Téléphone"
          value={form.telephone}
          onChange={handleChange}
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        />
        <select
          name="statut"
          value={form.statut}
          onChange={handleChange}
          required
          className="w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        >
          <option value="Non disponible">Non disponible</option>
          <option value="Refusé">Refusé</option>
          <option value="Mission validée">Mission validée</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700 transition-all shadow-lg disabled:opacity-50"
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 text-center font-semibold ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
