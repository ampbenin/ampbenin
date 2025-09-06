/* empty css                                    */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../renderers.mjs';

const $$APropos = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "\xC0 propos de AMP BENIN" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="bg-white text-gray-800 py-12 px-4 md:px-12"> <div class="max-w-5xl mx-auto text-center"> <h1 class="text-4xl font-bold mb-4 text-primary">À propos de AMP BENIN</h1> <p class="text-lg mb-6 text-gray-700">
AMP BENIN (Action Monde Productif) est une organisation sociale béninoise engagée dans la mobilisation citoyenne pour un développement durable, inclusif et équitable.
</p> </div> <div class="mt-10 grid gap-8 md:grid-cols-2"> <div> <h2 class="text-2xl font-semibold mb-2 text-primary">Notre vision</h2> <p class="text-gray-700">
Construire un Bénin solidaire et prospère, où chaque citoyen, en particulier les jeunes, participe activement à la construction d’une société inclusive, pacifique, durable et résiliente.
</p> </div> <div> <h2 class="text-2xl font-semibold mb-2 text-primary">Notre mission</h2> <p class="text-gray-700">
Mobiliser, former et outiller les jeunes, les femmes et les communautés pour leur permettre de contribuer efficacement à la réalisation des Objectifs de Développement Durable (ODD).
</p> </div> </div> <div class="mt-12"> <h2 class="text-2xl font-semibold mb-4 text-center text-primary">Nos valeurs fondamentales</h2> <ul class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center"> <li class="bg-gray-100 p-6 rounded-xl shadow-sm hover:shadow-md transition"> <strong class="text-primary">Engagement citoyen</strong><br> <span class="text-gray-700">Une jeunesse au service du bien commun.</span> </li> <li class="bg-gray-100 p-6 rounded-xl shadow-sm hover:shadow-md transition"> <strong class="text-primary">Solidarité</strong><br> <span class="text-gray-700">Ensemble pour ne laisser personne de côté.</span> </li> <li class="bg-gray-100 p-6 rounded-xl shadow-sm hover:shadow-md transition"> <strong class="text-primary">Responsabilité</strong><br> <span class="text-gray-700">Chaque acte compte pour un monde meilleur.</span> </li> </ul> </div> <div class="mt-16 text-center"> <h2 class="text-2xl font-semibold mb-4 text-primary">Notre histoire</h2> <p class="max-w-3xl mx-auto text-gray-700">
Née d’une volonté de jeunes leaders béninois, AMP BENIN s’est structurée autour d’une vision claire : favoriser la participation active de toutes les couches sociales à la mise en œuvre des ODD. Depuis sa création, elle mène des campagnes, formations, sensibilisations et projets communautaires sur tout le territoire national.
</p> </div> <div class="mt-16 text-center"> <h2 class="text-2xl font-semibold mb-4 text-primary">Nos engagements</h2> <p class="max-w-3xl mx-auto text-gray-700">
Nous agissons pour la paix, la cohésion sociale, l’égalité des genres, la santé publique, le numérique, l’éducation des enfants, et le leadership féminin à travers nos Institutions Spécialisées (IS) et coordinations locales.
</p> </div> </section> ` })}`;
}, "C:/amp-benin-site/src/pages/a-propos.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/a-propos.astro";
const $$url = "/a-propos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$APropos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
