// src/components/AttestationForm.jsx
import { useState } from "react";

export default function AttestationForm() {
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const checkVolontaire = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMissions([]);
    setDownloadUrl("");

    try {
      const res = await fetch("/.netlify/functions/downloadCertificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nom }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur serveur");
        setLoading(false);
        return;
      }

      if (data.missions && data.missions.length > 0) {
        setMissions(data.missions);
        setMessage("Sélectionnez une mission pour télécharger votre attestation.");
      } else {
        setMessage("Aucune mission assignée à ce volontaire.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de la communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificate = async () => {
    if (!selectedMission) return;
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/.netlify/functions/downloadCertificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nom, missionId: selectedMission }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur serveur");
        setDownloadUrl("");
        setLoading(false);
        return;
      }

      if (data.url) {
        setDownloadUrl(data.url);
        setMessage("Attestation prête au téléchargement !");
      } else {
        setMessage("Aucune attestation disponible pour cette mission.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de la récupération de l'attestation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-center">
      <form className="space-y-4" onSubmit={checkVolontaire}>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Nom"
          className="w-full p-3 border rounded-lg"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-primary text-white px-6 py-3 rounded-lg"
          disabled={loading}
        >
          {loading ? "Chargement..." : "Vérifier"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-6 text-lg ${
            downloadUrl ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      {missions.length > 0 && (
        <div className="mt-6 space-y-4">
          <select
            className="w-full p-3 border rounded-lg"
            value={selectedMission}
            onChange={(e) => setSelectedMission(e.target.value)}
          >
            <option value="">-- Sélectionner votre mission --</option>
            {missions.map((m) => (
              <option key={m.missionId} value={m.missionId}>
                {m.missionName}
              </option>
            ))}
          </select>
          <button
            className="bg-primary text-white px-6 py-3 rounded-lg"
            onClick={fetchCertificate}
            disabled={loading || !selectedMission}
          >
            {loading ? "Chargement..." : "Télécharger l'attestation"}
          </button>
        </div>
      )}

      {downloadUrl && (
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <button className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg">
            Télécharger le PDF
          </button>
        </a>
      )}
    </div>
  );
}
