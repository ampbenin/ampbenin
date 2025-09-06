/* empty css                                    */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../renderers.mjs';

const $$Actualites = createComponent(($$result, $$props, $$slots) => {
  const articles = [
    {
      title: "Lancement de la campagne nationale pour la paix",
      date: "Du 11 au 24 Ao\xFBt 2025",
      excerpt: "AMP BENIN mobilise les jeunes \xE0 travers tout le pays pour promouvoir la paix et la coh\xE9sion sociale.",
      image: "/images/campagne-mycountry229-paix-benin.png",
      link: "/actualites/campagne-mycountry229-paix-benin"
    },
    {
      title: "Forum des jeunes pour le d\xE9veloppement durable",
      date: "15 Juin 2025",
      excerpt: "Une centaine de jeunes se sont r\xE9unis \xE0 Cotonou pour \xE9changer sur les enjeux des ODD au B\xE9nin.",
      image: "/images/forum-jeunesse.jpg",
      link: "/actualites/forum-jeunesse-odd"
    }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Actualit\xE9s AMP BENIN" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="bg-white py-16 px-4"> <div class="max-w-6xl mx-auto text-center mb-10"> <h1 class="text-4xl font-bold text-primary mb-4">Nos Actualités</h1> <p class="text-lg text-gray-600 max-w-3xl mx-auto">
Suivez toutes les actions, projets et temps forts de AMP BENIN à travers le pays et à l’international.
</p> </div> </section> <section class="bg-gray-100 py-16 px-4"> <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-8"> ${articles.map((article) => renderTemplate`<a${addAttribute(article.link, "href")} class="block bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden"> <img${addAttribute(article.image, "src")}${addAttribute(article.title, "alt")} class="w-full h-56 object-cover" loading="lazy"> <div class="p-6"> <h2 class="text-2xl font-semibold text-primary mb-2">${article.title}</h2> <p class="text-sm text-gray-500 mb-2">${article.date}</p> <p class="text-gray-600">${article.excerpt}</p> </div> </a>`)} </div> </section> ` })}`;
}, "C:/amp-benin-site/src/pages/actualites.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/actualites.astro";
const $$url = "/actualites";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Actualites,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
