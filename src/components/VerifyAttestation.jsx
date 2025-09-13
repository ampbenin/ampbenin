import { useState, useEffect } from "react";

export default function VerifyAttestation({ id }) {
  const [data, setData] = useState(null);
  const [step, setStep] = useState("loading"); // Étapes possibles : loading | showData | error | thanks | report
  const [report, setReport] = useState({ anonymous: true, name: "", message: "" });

  useEffect(() => {
    if (!id) {
      console.warn("⚠️ Aucun ID fourni au composant VerifyAttestation");
      return;
    }

    console.log("📡 Vérification en cours pour l'ID :", id);

    // Appel de l'API backend
    fetch(`https://potential-rafa-amp1-00541efa.koyeb.app/api/certificates/verify/${id}`)
      .then((res) => {
        console.log("📥 Réponse brute du serveur :", res);
        return res.json();
      })
      .then((res) => {
        console.log("📥 Réponse JSON décodée :", res);

        if (res.error) {
          console.error("❌ Erreur renvoyée par le backend :", res.error);
          setStep("error");
        } else {
          console.log("✅ Données de l’attestation :", res);
          setData(res);
          setStep("showData");
        }
      })
      .catch((err) => {
        console.error("🚨 Erreur lors du fetch :", err);
        setStep("error");
      });
  }, [id]);

  // Soumission de la dénonciation  FONCTION NETLIFY
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    console.log("📤 Envoi du rapport :", { attestationId: id, ...report });

    try {
      const response = await fetch("/.netlify/functions/reportAttestation", {
        method: "POST",
        body: JSON.stringify({ attestationId: id, ...report }),
        headers: { "Content-Type": "application/json" },
      });

      console.log("📥 Réponse à la dénonciation :", response);

      if (!response.ok) throw new Error("Erreur côté serveur");
      setStep("thanks");
    } catch (err) {
      console.error("🚨 Erreur lors de l'envoi de la dénonciation :", err);
      alert("Erreur lors de l'envoi, veuillez réessayer.");
    }
  };

  // === RENDU SELON L'ÉTAT ===

  if (step === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600 animate-pulse">⏳ Vérification en cours...</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-6">
        <h1 className="text-3xl font-bold text-red-600 mb-4">❌ Attestation introuvable</h1>
        <p className="text-gray-700">Veuillez vérifier le lien ou contacter AMP BENIN.</p>
      </div>
    );
  }

  if (step === "thanks") {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-6">
        <h1 className="text-3xl font-bold text-green-700 mb-4">🙏 Merci pour votre contribution</h1>
        <p className="text-gray-700">Votre retour a été enregistré. AMP BENIN vous remercie.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-gradient-to-b from-green-50 to-green-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg text-center">
        {step === "showData" && data && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-6">
              ✅ Attestation authentique
            </h1>
            <div className="space-y-3 text-lg text-gray-800 text-left">
              <p><span className="font-semibold">Nom :</span> {data.nom}</p>
              <p><span className="font-semibold">Prénom :</span> {data.prenom}</p>
              <p><span className="font-semibold">Mission :</span> {data.mission}</p>
              <p><span className="font-semibold">Email :</span> {data.email}</p>
              <p><span className="font-semibold">Date :</span> {new Date(data.date).toLocaleDateString()}</p>
              {data.fileUrl && (
                <p>
                  <span className="font-semibold">PDF :</span>{" "}
                  <a href={data.fileUrl} target="_blank" className="text-blue-600 underline">
                    Télécharger
                  </a>
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="text-gray-700 font-medium mb-4">
                ℹ️ Les informations affichées correspondent-elles à celles inscrites sur l’attestation papier ?
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => {
                    console.log("✅ Confirmation reçue, passage à 'thanks'");
                    setStep("thanks");
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                >
                  ✅ Oui
                </button>
                <button
                  onClick={() => {
                    console.log("🚨 Signalement demandé, passage à 'report'");
                    setStep("report");
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                >
                  ❌ Non
                </button>
              </div>
            </div>
          </>
        )}

        {step === "report" && (
          <form onSubmit={handleReportSubmit} className="text-left space-y-4">
            <h2 className="text-xl font-bold text-red-600 mb-2">🚨 Dénonciation</h2>
            <p className="text-gray-600 text-sm mb-4">
              Merci de nous signaler si vous constatez une fraude. Vous pouvez rester anonyme.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={report.anonymous}
                onChange={(e) => {
                  console.log("🔄 Toggle anonymat :", e.target.checked);
                  setReport({ ...report, anonymous: e.target.checked });
                }}
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700">
                Dénonciation anonyme
              </label>
            </div>

            {!report.anonymous && (
              <input
                type="text"
                placeholder="Votre nom complet"
                className="w-full border rounded-lg p-2"
                value={report.name}
                onChange={(e) => {
                  console.log("✍️ Nom du rapporteur :", e.target.value);
                  setReport({ ...report, name: e.target.value });
                }}
                required
              />
            )}

            <textarea
              placeholder="Expliquez votre constat..."
              className="w-full border rounded-lg p-2"
              rows={4}
              value={report.message}
              onChange={(e) => {
                console.log("✍️ Message du rapport :", e.target.value);
                setReport({ ...report, message: e.target.value });
              }}
              required
            />

            <button
              type="submit"
              className="w-full py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
            >
              🚀 Envoyer la dénonciation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
