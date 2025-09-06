/* empty css                                    */
import { f as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DXKGEhHV.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
export { renderers } from '../renderers.mjs';

function SaveVolunteers({ initialMissionId = "" }) {
  const [form, setForm] = useState({
    titre: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    statut: "Non disponible"
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
          body: JSON.stringify({ titre: form.titre })
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
            statut: form.statut
          })
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
        statut: "Non disponible"
      });
    } catch (err) {
      console.error("❌ Erreur fetch:", err);
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-yellow-50 via-white to-yellow-50 border border-yellow-200", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-extrabold text-yellow-700 mb-4 text-center", children: "🌿 Ajouter un volontaire" }),
    /* @__PURE__ */ jsx("p", { className: "text-center text-gray-600 mb-6", children: "Remplissez le formulaire pour inscrire un nouveau volontaire pour une mission. CET ESPACE EST RESERVE UNIQUEMENT AUX ADMINISTRATEURS TECHNIQUE ET DAF DE AMP BENIN" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          name: "titre",
          placeholder: "Titre de la MISSION",
          value: form.titre,
          onChange: handleChange,
          required: true,
          className: "w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          name: "nom",
          placeholder: "Nom",
          value: form.nom,
          onChange: handleChange,
          required: true,
          className: "w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          name: "prenom",
          placeholder: "Prénom",
          value: form.prenom,
          onChange: handleChange,
          required: true,
          className: "w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "email",
          name: "email",
          placeholder: "Email",
          value: form.email,
          onChange: handleChange,
          required: true,
          className: "w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "tel",
          name: "telephone",
          placeholder: "Téléphone",
          value: form.telephone,
          onChange: handleChange,
          className: "w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm"
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          name: "statut",
          value: form.statut,
          onChange: handleChange,
          required: true,
          className: "w-full border border-yellow-300 rounded-xl p-3 focus:ring-2 focus:ring-yellow-400 outline-none shadow-sm",
          children: [
            /* @__PURE__ */ jsx("option", { value: "Non disponible", children: "Non disponible" }),
            /* @__PURE__ */ jsx("option", { value: "Refusé", children: "Refusé" }),
            /* @__PURE__ */ jsx("option", { value: "Mission validée", children: "Mission validée" })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "w-full bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700 transition-all shadow-lg disabled:opacity-50",
          children: loading ? "Enregistrement..." : "Enregistrer"
        }
      )
    ] }),
    message && /* @__PURE__ */ jsx(
      "div",
      {
        className: `mt-4 text-center font-semibold ${message.type === "success" ? "text-green-600" : "text-red-600"}`,
        children: message.text
      }
    )
  ] });
}

const $$Admimission = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Admin Missions | AMP BENIN" }, { "default": ($$result2) => renderTemplate`   ${renderComponent($$result2, "SaveVolunteers", SaveVolunteers, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/amp-benin-site/src/components/SaveVolunteers.jsx", "client:component-export": "default" })}  ` })}`;
}, "C:/amp-benin-site/src/pages/admimission.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/admimission.astro";
const $$url = "/admimission";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Admimission,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
