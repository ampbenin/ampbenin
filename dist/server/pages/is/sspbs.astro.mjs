/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../../renderers.mjs';

const $$Sspbs = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {}, { "default": ($$result2) => renderTemplate` <title>SSPBS-AMP | Santé Publique & Bien-être Social</title> <meta name="description" content="Découvrez la SSPBS-AMP d’AMP BENIN : une institution dédiée à la promotion de la santé publique, au bien-être social et à la prévention pour tous au Bénin."> ${maybeRenderHead()}<section class="bg-white text-gray-900 py-12 px-4 md:px-12"> <div class="max-w-5xl mx-auto text-center mb-10"> <h1 class="text-4xl font-bold mb-4 text-emerald-700">SSPBS-AMP</h1> <p class="text-lg text-gray-700">
La <strong>Section de Santé Publique et de Bien-être Social</strong> (SSPBS-AMP) se consacre à la promotion de la santé pour tous et à l'amélioration du bien-être des communautés.
</p> </div> <div class="grid gap-8 md:grid-cols-2 mb-16"> <div> <h2 class="text-2xl font-semibold mb-3 text-emerald-700">Nos missions</h2> <ul class="list-disc list-inside text-gray-800 space-y-2"> <li>Promouvoir l’accès aux soins de santé de qualité.</li> <li>Contribuer à la prévention des maladies et à l’éducation sanitaire.</li> <li>Renforcer la santé mentale, émotionnelle et physique des populations.</li> <li>Appuyer les initiatives communautaires de bien-être social.</li> </ul> </div> <div> <h2 class="text-2xl font-semibold mb-3 text-emerald-700">Actions principales</h2> <ul class="list-disc list-inside text-gray-800 space-y-2"> <li>Campagnes de dépistage, vaccination et hygiène communautaire.</li> <li>Ateliers de sensibilisation sur la santé mentale et reproductive.</li> <li>Soutien aux personnes vulnérables (femmes, enfants, personnes âgées).</li> <li>Initiatives d’accès à l’eau potable et à l’assainissement.</li> </ul> </div> </div> <div class="text-center mb-16"> <h2 class="text-2xl font-semibold mb-4 text-emerald-700">Notre vision</h2> <p class="max-w-3xl mx-auto text-gray-800">
Garantir un environnement sain et un accès équitable aux soins, pour un développement humain durable et harmonieux.
</p> </div> <div class="text-center"> <h2 class="text-2xl font-semibold mb-4 text-emerald-700">Participez à la transformation sanitaire !</h2> <p class="max-w-2xl mx-auto text-gray-700 mb-4">
Rejoignez la SSPBS-AMP pour bâtir ensemble une société en meilleure santé et plus solidaire.
</p> <a href="/contact" class="inline-block bg-emerald-600 text-white px-6 py-3 rounded-full shadow hover:bg-emerald-700 transition">
Intégrer la SSPBS-AMP
</a> </div> </section> ` })}`;
}, "C:/amp-benin-site/src/pages/is/sspbs.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/is/sspbs.astro";
const $$url = "/is/sspbs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Sspbs,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
