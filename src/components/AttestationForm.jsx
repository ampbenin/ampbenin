// src/components/AttestationForm.jsx
import { useState } from "react";
import { motion } from "framer-motion";

export default function AttestationForm() {
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [step, setStep] = useState(1); // 1 = vérification, 2 = mission, 3 = téléchargement, 4 = attestation téléchargée

  const API_BASE =
    import.meta.env.MODE === "development"
      ? "https://outdoor-arlene-ampbenin-4ca9a164.koyeb.app/api/certificates"
      : "https://outdoor-arlene-ampbenin-4ca9a164.koyeb.app/api/certificates";

  /**
   * Étape 1 : Vérifier volontaire
   */
  const checkVolontaire = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMissions([]);
    setDownloadUrl("");

    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nom }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur serveur");
        return;
      }

      if (data.missions) {
        setMissions(data.missions);
        setMessage("🎯 Sélectionnez votre mission pour continuer.");
        setStep(2);
      } else {
        setMessage(data.message || "Aucune mission assignée.");
      }
    } catch (err) {
      setMessage("❌ Erreur lors de la communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Étape 2 : Récupérer attestation
   */
  const fetchCertificate = async () => {
    if (!selectedMission) return;
    setLoading(true);
    setMessage("");
    setDownloadUrl("");

    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nom, titre: selectedMission }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur serveur");
        return;
      }

      if (data.url) {
        setDownloadUrl(data.url);
        setMessage("✅ Attestation prête au téléchargement !");
        setStep(3);
      } else {
        setMessage(data.message || "Aucune attestation disponible.");
      }
    } catch (err) {
      setMessage("❌ Erreur lors de la récupération de l'attestation.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Étape 3 : Télécharger PDF et passer à l'étape 4
   */
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const response = await fetch(`${downloadUrl}?t=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Erreur téléchargement");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `attestation_${selectedMission}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage("");
      setStep(4);
    } catch (err) {
      console.error("❌ Erreur téléchargement :", err);
      alert("Impossible de télécharger le fichier");
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  return (
    <motion.div
      className="max-w-lg mx-auto mt-12 bg-white shadow-2xl rounded-2xl p-8 border border-yellow-600"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Titres uniquement si ce n'est pas l'étape 4 */}
      {step !== 4 && (
        <>
          <h3 className="text-1xl font-bold text-blue-600 mb-4 text-center">
            Bienvenue sur l'espace des Volontaires AMP BENIN. Veuillez renseigner vos informations
          </h3>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🔎 Vérification d’attestation
          </h2>
        </>
      )}

      {/* Étape 1 : Formulaire vérification */}
      {step === 1 && (
        <form className="space-y-4" onSubmit={checkVolontaire}>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            value={email}
            maxLength={40}
            onChange={(e) => setEmail(e.target.value.slice(0, 40))}
            required
          />

<input
  type="text"
  placeholder="Nom (nom de famille)"
  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none uppercase"
  value={nom}
  maxLength={30}
  onChange={(e) => {
    const formatted = e.target.value
      .toUpperCase()
      .replace(/[^A-Z ]/g, "") // autorise aussi les espaces
      .slice(0, 30);
    setNom(formatted);
  }}
  required
/>

          <button
            type="submit"
            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              "Vérifier"
            )}
          </button>
        </form>
      )}

      {/* Étape 2 : Sélection mission */}
      {step === 2 && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <select
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
            value={selectedMission}
            onChange={(e) => setSelectedMission(e.target.value)}
          >
            <option value="">-- Sélectionner votre mission --</option>
            {missions.map((m, idx) => (
              <option key={idx} value={m.titre}>
                {m.titre}
              </option>
            ))}
          </select>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg transition-all"
            >
              ⬅️ Précédent
            </button>

            <button
              className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all"
              onClick={fetchCertificate}
              disabled={loading || !selectedMission}
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                "Télécharger l’attestation"
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Étape 3 : Téléchargement PDF */}
      {step === 3 && (
        <motion.div
          className="space-y-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-green-600 font-medium">
            ✅ Félicitation ! Vous avez terminé avec succès cette mission. AMP BENIN vous remercie !
          </p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg shadow-lg transition-all text-white ${
              downloading
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {downloading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              "📄 Télécharger le PDF"
            )}
          </button>
        </motion.div>
      )}

      {/* Étape 4 : Attestation téléchargée */}
      {step === 4 && (
        <motion.div
          className="space-y-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-blue-600 font-semibold text-lg">
            🎉 Vous avez téléchargé votre Attestation. Merci pour votre engagement continu.
          </p>
        </motion.div>
      )}

      {/* Message info uniquement si ce n'est pas l'étape 4 */}
      {message && step !== 4 && (
        <p
          className={`mt-6 text-base font-medium text-center ${
            downloadUrl ? "text-green-600" : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}
    </motion.div>
  );
}
