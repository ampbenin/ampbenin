/* empty css                                    */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { I as IS_LIST } from '../chunks/is_Du_oeUYf.mjs';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Nos Institutions Sp\xE9cialis\xE9es | AMP BENIN" }, { "default": ($$result2) => renderTemplate` <title>Institutions Spécialisées | AMP BENIN</title> <meta name="description" content="Découvrez nos différentes institutions spécialisées AMP BENIN, leurs missions et actions."> ${maybeRenderHead()}<section class="bg-white py-16 px-4"> <div class="max-w-6xl mx-auto text-center mb-12"> <h1 class="text-4xl font-bold text-green-800 mb-4">Nos Institutions Spécialisées</h1> <p class="text-lg text-gray-700 max-w-3xl mx-auto">
Découvrez les différentes sections spécialisées de AMP BENIN, chacune œuvrant pour un domaine clé du développement durable.
</p> </div> <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"> ${IS_LIST.map((institution) => renderTemplate`<a${addAttribute(`/is/${institution.slug}`, "href")} class="block bg-gray-100 rounded-xl shadow hover:shadow-lg transition overflow-hidden"> <img${addAttribute(institution.image, "src")}${addAttribute(institution.name, "alt")} class="w-full h-48 object-cover rounded-t-xl"> <div class="p-6"> <h2 class="text-2xl font-semibold text-green-700 mb-2">${institution.name}</h2> <p class="text-gray-700 mb-4">${institution.description}</p> <span class="inline-block bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
Voir les détails
</span> </div> </a>`)} </div> </section> ` })}`;
}, "C:/amp-benin-site/src/pages/is/index.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/is/index.astro";
const $$url = "/is";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
