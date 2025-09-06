/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../../renderers.mjs';

const $$Mycountry2292025 = createComponent(($$result, $$props, $$slots) => {
  const title = "R\xE9sum\xE9 d\u2019ex\xE9cution du projet MyCountry229 \u2013 2025";
  const description = "Synth\xE8se de la campagne MyCountry229 (11\u201324 ao\xFBt 2025) avec volontaires, statistiques et actions cl\xE9s.";
  const pubDate = "2025-08-25";
  const author = "AMP BENIN";
  const volontaires = [
    { nom: "Alice HOUNTONDJI", message: "Heureuse d\u2019avoir contribu\xE9 \xE0 la paix num\xE9rique.", photo: "/images/vol1.png" },
    { nom: "Jean KOUASSI", message: "Une belle exp\xE9rience de coh\xE9sion et d\u2019apprentissage.", photo: "/images/vol2.png" },
    { nom: "Mariam ISSA", message: "J\u2019ai appris \xE0 mieux lutter contre la d\xE9sinformation.", photo: "/images/vol3.png" },
    { nom: "Dieudonn\xE9 AHOUANSOU", message: "La jeunesse b\xE9ninoise peut \xEAtre moteur de changement positif.", photo: "/images/vol4.png" },
    { nom: "Cl\xE9mentine ADJOVI", message: "Cette mission a renforc\xE9 ma confiance en moi et mes comp\xE9tences.", photo: "/images/vol5.png" }
  ];
  const stats = [
    { chiffre: "226", label: "Volontaires mobilis\xE9s" },
    { chiffre: "2", label: "\xC9quipes constitu\xE9es" },
    { chiffre: "14", label: "Jours de mobilisation digitale" },
    { chiffre: "500K+", label: "Personnes touch\xE9es en ligne" }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="prose lg:prose-xl max-w-6xl mx-auto px-4 md:px-0 py-12"> <!-- Titre --> <header class="mb-8 text-center"> <h1 class="text-3xl md:text-4xl font-bold text-green-800">${title}</h1> <p class="text-gray-600 mt-2">${description}</p> </header> <!-- Statistiques --> <section class="grid grid-cols-2 md:grid-cols-4 gap-6 my-8"> ${stats.map((s) => renderTemplate`<div class="bg-white shadow-md rounded-lg p-6 text-center"> <div class="text-3xl font-bold text-green-700">${s.chiffre}</div> <div class="text-gray-600 mt-2">${s.label}</div> </div>`)} </section> <!-- Volontaires --> <section class="mt-12"> <h2 class="text-2xl font-bold text-green-800 mb-6">Nos volontaires</h2> <div class="grid gap-6 md:grid-cols-3"> ${volontaires.map((v) => renderTemplate`<div class="bg-white shadow rounded-lg p-4 text-center"> <img${addAttribute(v.photo, "src")}${addAttribute(v.nom, "alt")} class="w-32 h-32 mx-auto rounded-lg object-cover"> <h3 class="mt-4 font-semibold text-lg">${v.nom}</h3> <p class="text-gray-600 mt-2">${v.message}</p> </div>`)} </div> </section> <!-- CTA --> <section class="mt-12 grid gap-6 md:grid-cols-3"> <a href="/attestations" class="bg-green-700 text-white text-center px-6 py-4 rounded-xl shadow hover:bg-green-800 font-semibold">
📜 Télécharger mon attestation
</a> <a href="/contact" class="bg-yellow-500 text-white text-center px-6 py-4 rounded-xl shadow hover:bg-yellow-600 font-semibold">
📩 Nous contacter pour une campagne
</a> <a href="/soutenir" class="bg-blue-600 text-white text-center px-6 py-4 rounded-xl shadow hover:bg-blue-700 font-semibold">
🤝 Soutenir les campagnes
</a> </section> <!-- Footer méta --> <footer class="mt-12 text-sm text-gray-500 text-center"> <div>Publié le : <time${addAttribute(pubDate, "datetime")}>${pubDate}</time></div> <div>Auteur : ${author}</div> </footer> </article> ` })}`;
}, "C:/amp-benin-site/src/pages/actualites/mycountry229-2025.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/actualites/mycountry229-2025.astro";
const $$url = "/actualites/mycountry229-2025";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Mycountry2292025,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
