/* empty css                                       */
import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate } from '../../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_DXKGEhHV.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
export { renderers } from '../../renderers.mjs';

function VerifyAttestation({ id }) {
  const [data, setData] = useState(null);
  const [step, setStep] = useState("loading");
  const [report, setReport] = useState({ anonymous: true, name: "", message: "" });
  useEffect(() => {
    if (!id) {
      console.warn("⚠️ Aucun ID fourni au composant VerifyAttestation");
      return;
    }
    console.log("📡 Vérification en cours pour l'ID :", id);
    fetch(`https://outdoor-arlene-ampbenin-4ca9a164.koyeb.app/api/certificates/verify/${id}`).then((res) => {
      console.log("📥 Réponse brute du serveur :", res);
      return res.json();
    }).then((res) => {
      console.log("📥 Réponse JSON décodée :", res);
      if (res.error) {
        console.error("❌ Erreur renvoyée par le backend :", res.error);
        setStep("error");
      } else {
        console.log("✅ Données de l’attestation :", res);
        setData(res);
        setStep("showData");
      }
    }).catch((err) => {
      console.error("🚨 Erreur lors du fetch :", err);
      setStep("error");
    });
  }, [id]);
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    console.log("📤 Envoi du rapport :", { attestationId: id, ...report });
    try {
      const response = await fetch("/.netlify/functions/reportAttestation", {
        method: "POST",
        body: JSON.stringify({ attestationId: id, ...report }),
        headers: { "Content-Type": "application/json" }
      });
      console.log("📥 Réponse à la dénonciation :", response);
      if (!response.ok) throw new Error("Erreur côté serveur");
      setStep("thanks");
    } catch (err) {
      console.error("🚨 Erreur lors de l'envoi de la dénonciation :", err);
      alert("Erreur lors de l'envoi, veuillez réessayer.");
    }
  };
  if (step === "loading") {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center h-screen", children: /* @__PURE__ */ jsx("p", { className: "text-gray-600 animate-pulse", children: "⏳ Vérification en cours..." }) });
  }
  if (step === "error") {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center items-center h-screen text-center p-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-red-600 mb-4", children: "❌ Attestation introuvable" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-700", children: "Veuillez vérifier le lien ou contacter AMP BENIN." })
    ] });
  }
  if (step === "thanks") {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center items-center h-screen text-center p-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-green-700 mb-4", children: "🙏 Merci pour votre contribution" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-700", children: "Votre retour a été enregistré. AMP BENIN vous remercie." })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex flex-col justify-center items-center p-6 bg-gradient-to-b from-green-50 to-green-100", children: /* @__PURE__ */ jsxs("div", { className: "bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg text-center", children: [
    step === "showData" && data && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold text-green-700 mb-6", children: "✅ Attestation authentique" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-lg text-gray-800 text-left", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Nom :" }),
          " ",
          data.nom
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Prénom :" }),
          " ",
          data.prenom
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Mission :" }),
          " ",
          data.mission
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Email :" }),
          " ",
          data.email
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Date :" }),
          " ",
          new Date(data.date).toLocaleDateString()
        ] }),
        data.fileUrl && /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "PDF :" }),
          " ",
          /* @__PURE__ */ jsx("a", { href: data.fileUrl, target: "_blank", className: "text-blue-600 underline", children: "Télécharger" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-gray-700 font-medium mb-4", children: "ℹ️ Les informations affichées correspondent-elles à celles inscrites sur l’attestation papier ?" }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                console.log("✅ Confirmation reçue, passage à 'thanks'");
                setStep("thanks");
              },
              className: "px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition",
              children: "✅ Oui"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                console.log("🚨 Signalement demandé, passage à 'report'");
                setStep("report");
              },
              className: "px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition",
              children: "❌ Non"
            }
          )
        ] })
      ] })
    ] }),
    step === "report" && /* @__PURE__ */ jsxs("form", { onSubmit: handleReportSubmit, className: "text-left space-y-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-red-600 mb-2", children: "🚨 Dénonciation" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm mb-4", children: "Merci de nous signaler si vous constatez une fraude. Vous pouvez rester anonyme." }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            id: "anonymous",
            checked: report.anonymous,
            onChange: (e) => {
              console.log("🔄 Toggle anonymat :", e.target.checked);
              setReport({ ...report, anonymous: e.target.checked });
            }
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "anonymous", className: "text-sm text-gray-700", children: "Dénonciation anonyme" })
      ] }),
      !report.anonymous && /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Votre nom complet",
          className: "w-full border rounded-lg p-2",
          value: report.name,
          onChange: (e) => {
            console.log("✍️ Nom du rapporteur :", e.target.value);
            setReport({ ...report, name: e.target.value });
          },
          required: true
        }
      ),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          placeholder: "Expliquez votre constat...",
          className: "w-full border rounded-lg p-2",
          rows: 4,
          value: report.message,
          onChange: (e) => {
            console.log("✍️ Message du rapport :", e.target.value);
            setReport({ ...report, message: e.target.value });
          },
          required: true
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "w-full py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition",
          children: "🚀 Envoyer la dénonciation"
        }
      )
    ] })
  ] }) });
}

const $$Astro = createAstro("https://ampbenin.netlify.app");
const prerender = false;
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "V\xE9rification Attestation" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "VerifyAttestation", VerifyAttestation, { "id": id, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/amp-benin-site/src/components/VerifyAttestation.jsx", "client:component-export": "default" })} ` })}`;
}, "C:/amp-benin-site/src/pages/verify/[id].astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/verify/[id].astro";
const $$url = "/verify/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
