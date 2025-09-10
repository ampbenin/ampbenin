// src/components/GenerateCertificate.jsx
import React, { useState } from "react";

export default function GenerateCertificate() {
  const [titreMission, setTitreMission] = useState("");
  const [mode, setMode] = useState("Tous les volontaires"); // "Tous les volontaires" ou "Un volontaire"
  const [email, setEmail] = useState("");
  const [volunteers, setVolunteers] = useState([]);
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);

  // Étape 1 : récupérer les volontaires selon la sélection
  const handleFetchVolunteers = async () => {
    if (!titreMission) {
      setNotification("Veuillez renseigner le titre de la mission.");
      return;
    }

    setLoading(true);
    setNotification("");

    try {
      const body = { titre: titreMission };
      if (mode === "Un volontaire" && email) body.email = email;

      console.log("👉 [FRONT] Payload envoyé fetchVolunteers:", body);

      //const res = await fetch("https://outdoor-arlene-ampbenin-4ca9a164.koyeb.app/api/certificates/fetch-volunteers", {
      const res = await fetch(" http://localhost:5000/api/certificates/fetch-volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("👉 [FRONT] Status réponse fetchVolunteers:", res.status);

      const data = await res.json();
      console.log("👉 [FRONT] Réponse backend fetchVolunteers:", data);

      if (!res.ok) throw new Error(data.message || "Erreur serveur");

      if (data.volunteers && data.volunteers.length > 0) {
        setVolunteers(data.volunteers);
        setNotification(
          `Volontaires prêts à générer attestation : ${data.volunteers.length}. Mission: ${titreMission}`
        );
      } else {
        setVolunteers([]);
        setNotification("Aucun volontaire trouvé avec le statut 'Mission validée' et sans attestation.");
      }
    } catch (err) {
      console.error("❌ [FRONT] Erreur handleFetchVolunteers:", err);
      setNotification(err.message || "Erreur lors de la récupération des volontaires.");
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : générer les attestations pour les volontaires récupérés
  const handleGenerateCertificates = async () => {
    if (volunteers.length === 0) {
      setNotification("Aucun volontaire à traiter.");
      return;
    }

    setLoading(true);
    setNotification("");

    try {
      const payload = {
        titre: titreMission,               // 🔹 Titre obligatoire pour le backend
        mode: mode,                        // 🔹 Mode: "Tous les volontaires" ou "Un volontaire"
        email: mode === "Un volontaire" ? email : undefined,
        volunteers,                        // 🔹 Liste des volontaires récupérés
      };

      console.log("👉 [FRONT] Payload envoyé generateCertificate:", payload);

      //const res = await fetch("https://outdoor-arlene-ampbenin-4ca9a164.koyeb.app/api/certificates/generate", {
      const res = await fetch("http://localhost:5000/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("👉 [FRONT] Status réponse generateCertificate:", res.status);

      const data = await res.json();
      console.log("👉 [FRONT] Réponse backend generateCertificate:", data);

      if (!res.ok) throw new Error(data.message || "Erreur serveur");

      setNotification(`Attestations générées avec succès pour ${data.generated} volontaire(s).`);
      setVolunteers([]);
      setEmail("");
      setTitreMission("");
    } catch (err) {
      console.error("❌ [FRONT] Erreur handleGenerateCertificates:", err);
      setNotification(err.message || "Erreur lors de la génération des attestations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl p-4 rounded-xl shadow-md bg-white">
      <h2 className="text-lg font-bold mb-4">Générer les attestations</h2>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Titre de la mission"
          className="w-full p-2 border rounded-lg"
          value={titreMission}
          onChange={(e) => setTitreMission(e.target.value)}
          required
        />

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="Tous les volontaires">Tous les volontaires (Mission validée)</option>
          <option value="Un volontaire">Un volontaire</option>
        </select>

        {mode === "Un volontaire" && (
          <input
            type="email"
            placeholder="Email du volontaire"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        )}

        <button
          onClick={handleFetchVolunteers}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Chargement..." : "Suivant"}
        </button>

        {volunteers.length > 0 && (
          <button
            onClick={handleGenerateCertificates}
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 mt-2"
          >
            {loading ? "Génération..." : "Générer les attestations"}
          </button>
        )}

        {notification && (
          <div className={`mt-3 text-sm font-medium ${volunteers.length > 0 ? "text-green-600" : "text-red-600"}`}>
            {notification}
          </div>
        )}
      </div>
    </div>
  );
}
