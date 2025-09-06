/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../../renderers.mjs';

const $$Sfpf = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {}, { "default": ($$result2) => renderTemplate` <title>SFPF-AMP | Féminisme & Promotion de la Femme</title> <meta name="description" content="Découvrez la Section du Féminisme et de la Promotion de la Femme (SFPF-AMP) d’AMP BENIN, engagée pour l’égalité de genre, l’autonomisation des femmes et la lutte contre les violences basées sur le genre."> ${maybeRenderHead()}<section class="bg-white text-gray-800 py-12 px-4 md:px-12"> <div class="max-w-5xl mx-auto text-center mb-10"> <h1 class="text-4xl font-bold mb-4 text-pink-700">SFPF-AMP</h1> <p class="text-lg text-gray-700">
La <strong>Section du Féminisme et de la Promotion de la Femme</strong> (SFPF-AMP) est une institution spécialisée de AMP BENIN dédiée à l'autonomisation des femmes, à la lutte pour l’égalité de genre, et à la valorisation du leadership féminin.
</p> </div> <div class="grid gap-8 md:grid-cols-2 mb-16"> <div> <h2 class="text-2xl font-semibold mb-3 text-pink-700">Nos missions</h2> <ul class="list-disc list-inside text-gray-700 space-y-2"> <li>Promouvoir les droits des femmes et des filles dans toutes les sphères de la société.</li> <li>Encourager l'entrepreneuriat féminin et l'accès aux ressources économiques.</li> <li>Former et accompagner les femmes leaders dans les communautés locales.</li> <li>Sensibiliser contre les violences basées sur le genre (VBG).</li> </ul> </div> <div> <h2 class="text-2xl font-semibold mb-3 text-pink-700">Nos actions phares</h2> <ul class="list-disc list-inside text-gray-700 space-y-2"> <li>Ateliers de leadership et mentorat pour jeunes filles.</li> <li>Campagnes communautaires contre les VBG.</li> <li>Projets d'appui aux femmes rurales et commerçantes.</li> <li>Journées de plaidoyer pour l’égalité de genre.</li> </ul> </div> </div> <div class="text-center mb-16"> <h2 class="text-2xl font-semibold mb-4 text-pink-700">Notre vision</h2> <p class="max-w-3xl mx-auto text-gray-700">
Un Bénin où chaque femme et fille a les mêmes opportunités que les hommes pour réaliser son potentiel, contribuer à la société, et être libre de toute discrimination ou violence.
</p> </div> <div class="text-center"> <h2 class="text-2xl font-semibold mb-4 text-pink-700">Rejoignez le mouvement !</h2> <p class="max-w-2xl mx-auto text-gray-700 mb-4">
La SFPF-AMP mobilise les femmes, les hommes alliés et les institutions pour construire une société égalitaire. Engagez-vous dès aujourd’hui !
</p> <a href="/contact" class="inline-block bg-pink-600 text-white px-6 py-3 rounded-full shadow hover:bg-pink-700 transition">
Devenir membre ou partenaire
</a> </div> </section> ` })}`;
}, "C:/amp-benin-site/src/pages/is/sfpf.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/is/sfpf.astro";
const $$url = "/is/sfpf";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Sfpf,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
