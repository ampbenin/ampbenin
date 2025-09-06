/* empty css                                    */
import { f as createComponent, r as renderTemplate, h as addAttribute, m as maybeRenderHead, k as renderComponent } from '../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DXKGEhHV.mjs';
import 'clsx';
/* empty css                                 */
import { I as IS_LIST } from '../chunks/is_Du_oeUYf.mjs';
export { renderers } from '../renderers.mjs';

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) }));
var _a$1;
const $$HeroSlider = createComponent(($$result, $$props, $$slots) => {
  const slides = [
    {
      image: "/images/impact-positif-ODD.jpg",
      title: "Environnement, Climat et Promotion des ODD",
      subtitle: "Ensemble, promouvons les Objectifs de D\xE9veloppement Durable."
    },
    {
      image: "/images/droits-hummains.jpg",
      title: "Engagement, Coh\xE9sion Siciale et Droits Hummainns",
      subtitle: "Accompagnons les jeunes et communaut\xE9s vers un avenir meilleur sans les in\xE9galit\xE9s sociales et les violences."
    },
    {
      image: "/images/forum-jeunesse.jpg",
      title: "Innovation, Entrepreneuriat Social et Num\xE9rique",
      subtitle: "Soutenons les projets transformateurs dans nos communaut\xE9s."
    },
    {
      image: "/images/sante-bienetre-social.jpg",
      title: "\xC9ducation, Sant\xE9 et Promotion de l'Enfance",
      subtitle: "Nous intervenons dans les domaine de l'Education, Sant\xE9 communautaire et la Promotion de l'Enfance."
    }
  ];
  return renderTemplate(_a$1 || (_a$1 = __template$1(["", '<section class="relative w-full overflow-hidden" data-astro-cid-r6qggs4k> <div id="hero-slider" class="relative h-screen" data-astro-cid-r6qggs4k> ', ' </div> <script>\n    document.addEventListener("DOMContentLoaded", () => {\n      const slides = document.querySelectorAll("#hero-slider > div");\n      let index = 0;\n\n      setInterval(() => {\n        slides[index].classList.remove("opacity-100", "z-10");\n        slides[index].classList.add("opacity-0");\n\n        index = (index + 1) % slides.length;\n\n        slides[index].classList.remove("opacity-0");\n        slides[index].classList.add("opacity-100", "z-10");\n      }, 5000);\n    });\n  <\/script>  </section>'])), maybeRenderHead(), slides.map((slide, i) => renderTemplate`<div${addAttribute(`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === 0 ? "opacity-100 z-10" : "opacity-0"}`, "class")}${addAttribute(i, "data-slide-index")} data-astro-cid-r6qggs4k> <img${addAttribute(slide.image, "src")}${addAttribute(slide.title, "alt")} class="w-full h-full object-cover" loading="lazy" data-astro-cid-r6qggs4k> <div class="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10 flex flex-col justify-center items-center text-center px-4 pt-24" data-astro-cid-r6qggs4k> <div class="bg-black/50 px-6 py-4 rounded-lg backdrop-blur-sm" data-astro-cid-r6qggs4k> <h1 class="text-3xl md:text-5xl font-extrabold mb-3 text-white drop-shadow-lg animate-fade-in-up" data-astro-cid-r6qggs4k> ${slide.title} </h1> <p class="text-base md:text-xl text-gray-200 animate-fade-in-up delay-200" data-astro-cid-r6qggs4k> ${slide.subtitle} </p> </div> </div> </div>`));
}, "C:/amp-benin-site/src/components/HeroSlider.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$NewsSlider = createComponent(($$result, $$props, $$slots) => {
  const newsItems = [
    {
      image: "/images/campagne-mycountry229-paix-benin.png",
      title: "Lancement de la Campagne Nationale Digitale #MyCountry229",
      date: "11 - 24 Ao\xFBt 2025",
      link: "/actualites/campagne-mycountry229-paix-benin"
    },
    {
      image: "/images/news2.jpg",
      title: "Atelier sur l\u2019innovation sociale \xE0 Cotonou",
      date: "5 juillet 2025",
      link: "/actualites/atelier-innovation"
    },
    {
      image: "/images/news3.jpg",
      title: "Forum AMP BENIN pour un B\xE9nin durable",
      date: "28 juin 2025",
      link: "/actualites/forum-benin-durable"
    }
  ];
  return renderTemplate(_a || (_a = __template(["", '<section class="relative w-full overflow-hidden"> <div id="news-slider" class="flex transition-transform duration-700 ease-in-out"', "> ", ' </div> <script is:script>\n    const slider = document.getElementById("news-slider");\n    const totalItems = newsItems.length; // <-- correction ici\n    let index = 0;\n\n    setInterval(() => {\n      index = (index + 1) % totalItems;\n      slider.style.transform = `translateX(-${index * 100}%)`;\n    }, 5000);\n  <\/script> </section>'], ["", '<section class="relative w-full overflow-hidden"> <div id="news-slider" class="flex transition-transform duration-700 ease-in-out"', "> ", ' </div> <script is:script>\n    const slider = document.getElementById("news-slider");\n    const totalItems = newsItems.length; // <-- correction ici\n    let index = 0;\n\n    setInterval(() => {\n      index = (index + 1) % totalItems;\n      slider.style.transform = \\`translateX(-\\${index * 100}%)\\`;\n    }, 5000);\n  <\/script> </section>'])), maybeRenderHead(), addAttribute(`width: calc(100% * ${newsItems.length});`, "style"), newsItems.map((item) => renderTemplate`<a${addAttribute(item.link, "href")} class="min-w-full md:min-w-1/2 lg:min-w-1/3 flex-shrink-0 block"> <div class="relative h-64 md:h-72 lg:h-80"> <img${addAttribute(item.image, "src")}${addAttribute(item.title, "alt")} class="w-full h-full object-cover rounded-lg" loading="lazy"> <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4 rounded-b-lg"> <h3 class="text-md font-semibold">${item.title}</h3> <p class="text-xs">${item.date}</p> </div> </div> </a>`));
}, "C:/amp-benin-site/src/components/NewsSlider.astro", void 0);

const $$ISCarousel = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section class="py-12 bg-gray-100"> <div class="container mx-auto px-4"> <h2 class="text-2xl md:text-3xl font-bold text-center mb-8 text-green-800">
Nos Institutions Spécialisées
</h2> <div class="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory"> ${IS_LIST.map((is) => renderTemplate`<a${addAttribute(`/is/${is.slug}`, "href")}${addAttribute(`Voir la page de ${is.name}`, "aria-label")} class="inline-block snap-start w-72 flex-shrink-0 bg-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300"> <img${addAttribute(is.image, "src")}${addAttribute(`Illustration de ${is.name}`, "alt")} loading="lazy" class="w-full h-40 object-cover rounded-t-xl"> <div class="p-4"> <h3 class="text-lg font-semibold mb-2 text-green-700"> ${is.name} </h3> <p class="text-sm text-gray-600">${is.description}</p> </div> </a>`)} </div> </div> </section>`;
}, "C:/amp-benin-site/src/components/ISCarousel.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const title = "AMP BENIN";
  const description = "D\xE9couvrez les actions de AMP BENIN pour un B\xE9nin plus durable \xE0 travers des programmes communautaires et la mobilisation des jeunes.";
  const url = "https://ampbenin.netlify.app";
  const image = "/og-image.png";
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "url": url, "image": image }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main> <section class="mb-8"> ${renderComponent($$result2, "HeroSlider", $$HeroSlider, {})} </section> <section class="px-4 md:px-12 lg:px-24 py-8 text-center"> <h2 class="text-3xl font-bold mb-4">Bienvenue sur AMP BENIN</h2> <p class="max-w-3xl mx-auto text-gray-600">
L'Action Monde Productif est une organisation sociale dédiée à la promotion des Objectifs de Développement Durable (ODD) au Bénin à travers des initiatives citoyennes, des programmes d'engagement communautaire et la mobilisation des jeunes.
</p> </section> <section class="py-12 bg-gray-100 px-4 md:px-12 lg:px-24"> <h2 class="text-2xl font-semibold mb-4">Dernières actualités</h2> ${renderComponent($$result2, "NewsSlider", $$NewsSlider, {})} </section> <section class="py-12 px-4 md:px-12 lg:px-24"> ${renderComponent($$result2, "ISCarousel", $$ISCarousel, {})} </section> </main> ` })}`;
}, "C:/amp-benin-site/src/pages/index.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
