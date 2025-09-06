/* empty css                                    */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DXKGEhHV.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState } from 'react';
import { motion } from 'framer-motion';
export { renderers } from '../renderers.mjs';

function AttestationForm() {
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [step, setStep] = useState(1);
  const API_BASE = "https://outdoor-arlene-ampbenin-4ca9a164.koyeb.app/api/certificates";
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
        body: JSON.stringify({ email, nom })
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
  const fetchCertificate = async () => {
    if (!selectedMission) return;
    setLoading(true);
    setMessage("");
    setDownloadUrl("");
    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nom, titre: selectedMission })
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
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(`${downloadUrl}?t=${Date.now()}`, {
        cache: "no-store"
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
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      className: "max-w-lg mx-auto mt-12 bg-white shadow-2xl rounded-2xl p-8 border border-yellow-600",
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      children: [
        step !== 4 && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-1xl font-bold text-blue-600 mb-4 text-center", children: "Bienvenue sur l'espace des Volontaires AMP BENIN. Veuillez renseigner vos informations" }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-6 text-center", children: "🔎 Vérification d’attestation" })
        ] }),
        step === 1 && /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: checkVolontaire, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              placeholder: "Email",
              className: "w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none",
              value: email,
              maxLength: 30,
              onChange: (e) => setEmail(e.target.value.slice(0, 30)),
              required: true
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Nom (nom de famille)",
              className: "w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none uppercase",
              value: nom,
              maxLength: 15,
              onChange: (e) => {
                const formatted = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 15);
                setNom(formatted);
              },
              required: true
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300",
              disabled: loading,
              children: loading ? /* @__PURE__ */ jsx("span", { className: "animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" }) : "Vérifier"
            }
          )
        ] }),
        step === 2 && /* @__PURE__ */ jsxs(
          motion.div,
          {
            className: "space-y-4",
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            children: [
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none",
                  value: selectedMission,
                  onChange: (e) => setSelectedMission(e.target.value),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Sélectionner votre mission --" }),
                    missions.map((m, idx) => /* @__PURE__ */ jsx("option", { value: m.titre, children: m.titre }, idx))
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setStep(1),
                    className: "w-1/3 bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg transition-all",
                    children: "⬅️ Précédent"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    className: "flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all",
                    onClick: fetchCertificate,
                    disabled: loading || !selectedMission,
                    children: loading ? /* @__PURE__ */ jsx("span", { className: "animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" }) : "Télécharger l’attestation"
                  }
                )
              ] })
            ]
          }
        ),
        step === 3 && /* @__PURE__ */ jsxs(
          motion.div,
          {
            className: "space-y-4 text-center",
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            children: [
              /* @__PURE__ */ jsx("p", { className: "text-green-600 font-medium", children: "✅ Félicitation ! Vous avez terminé avec succès cette mission. AMP BENIN vous remercie !" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleDownload,
                  disabled: downloading,
                  className: `w-full flex items-center justify-center px-6 py-3 rounded-lg shadow-lg transition-all text-white ${downloading ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`,
                  children: downloading ? /* @__PURE__ */ jsx("span", { className: "animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" }) : "📄 Télécharger le PDF"
                }
              )
            ]
          }
        ),
        step === 4 && /* @__PURE__ */ jsx(
          motion.div,
          {
            className: "space-y-4 text-center",
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            children: /* @__PURE__ */ jsx("p", { className: "text-blue-600 font-semibold text-lg", children: "🎉 Vous avez téléchargé votre Attestation. Merci pour votre engagement continu." })
          }
        ),
        message && step !== 4 && /* @__PURE__ */ jsx(
          "p",
          {
            className: `mt-6 text-base font-medium text-center ${downloadUrl ? "text-green-600" : "text-red-500"}`,
            children: message
          }
        )
      ]
    }
  );
}

const $$Monattestation = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Mon Attestation" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="bg-white text-gray-800 py-12 px-4 md:px-12"> ${renderComponent($$result2, "AttestationForm", AttestationForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/amp-benin-site/src/components/AttestationForm.jsx", "client:component-export": "default" })} </section> ` })}`;
}, "C:/amp-benin-site/src/pages/monattestation.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/monattestation.astro";
const $$url = "/monattestation";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Monattestation,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
