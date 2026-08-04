import React, { useState, useEffect } from "react";
import { adminFetch } from "@/services/admin/api";

export default function GenerateCertificate() {
  const [titreMission, setTitreMission] = useState("");
  const [mode, setMode] = useState("Tous les volontaires"); // "Tous les volontaires" ou "Un volontaire"
  const [email, setEmail] = useState("");
  const [volunteers, setVolunteers] = useState([]);
  const [programs, setPrograms] = useState([]); // 🔹 Programmes de volontariat (remplace missions)
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Récupérer les programmes au chargement
  // (l'endpoint /api/certificates/* conserve la clé de requête "titre" côté
  // serveur — voir controllers/certificateController.js — seule la source
  // de la liste change ici, missions → programmes de volontariat)
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const data = await adminFetch("/api/volunteer-programs/all");
        setPrograms(data?.items || []);
      } catch (err) {
        console.error("Erreur chargement programmes :", err);
      }
    };
    fetchPrograms();
  }, []);

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

      const data = await adminFetch("/api/certificates/fetch-volunteers", {
        method: "POST",
        body: JSON.stringify(body),
      });

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
      console.error(err);
      setNotification(err.message || "Erreur lors de la récupération des volontaires.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificates = async () => {
    if (volunteers.length === 0) {
      setNotification("Aucun volontaire à traiter.");
      return;
    }

    setLoading(true);
    setNotification("");

    try {
      const payload = {
        titre: titreMission,
        mode: mode,
        email: mode === "Un volontaire" ? email : undefined,
        volunteers,
      };

      const data = await adminFetch("/api/certificates/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setNotification(`Attestations générées avec succès pour ${data.generated} volontaire(s).`);
      setVolunteers([]);
      setEmail("");
      setTitreMission("");
    } catch (err) {
      console.error(err);
      setNotification(err.message || "Erreur lors de la génération des attestations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl p-4 rounded-xl shadow-md bg-white">
      <h2 className="text-lg font-bold mb-4">Générer les attestations</h2>

      <div className="space-y-3">
        {/* Liste déroulante missions */}
        <select
          className="w-full p-2 border rounded-lg"
          value={titreMission}
          onChange={(e) => setTitreMission(e.target.value)}
          required
        >
          <option value="">-- Sélectionner une mission --</option>
          {missions.map((mission) => (
            <option key={mission._id} value={mission.titre}>
              {mission.titre}
            </option>
          ))}
        </select>

        {/* Mode */}
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
          disabled={loading || !titreMission}
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
          <div
            className={`mt-3 text-sm font-medium ${
              volunteers.length > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {notification}
          </div>
        )}
      </div>
    </div>
  );
}
