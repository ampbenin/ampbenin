/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../../renderers.mjs';

const $$Snie = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, {}, { "default": ($$result2) => renderTemplate` <title>SNIE-AMP | Numérique, Innovation & Entrepreneuriat</title> <meta name="description" content="Découvrez la SNIE-AMP d’AMP BENIN : une institution dédiée à l’inclusion numérique, à l’innovation technologique et à l’accompagnement des jeunes entrepreneurs au Bénin."> ${maybeRenderHead()}<section class="bg-white text-gray-900 py-12 px-4 md:px-12"> <div class="max-w-5xl mx-auto text-center mb-10"> <h1 class="text-4xl font-bold mb-4 text-purple-700">SNIE-AMP</h1> <p class="text-lg text-gray-700">
La <strong>Section du Numérique, de l’Innovation et de l’Entrepreneuriat</strong> (SNIE-AMP) stimule l’esprit d’innovation et développe l’économie numérique et entrepreneuriale, en particulier chez les jeunes.
</p> </div> <div class="grid gap-8 md:grid-cols-2 mb-16"> <div> <h2 class="text-2xl font-semibold mb-3 text-purple-700">Nos missions</h2> <ul class="list-disc list-inside text-gray-800 space-y-2"> <li>Favoriser l’inclusion numérique des jeunes et des communautés.</li> <li>Encourager l’innovation technologique locale et durable.</li> <li>Former et accompagner les jeunes porteurs de projets entrepreneuriaux.</li> <li>Créer des espaces de coworking et d’incubation à travers le Bénin.</li> </ul> </div> <div> <h2 class="text-2xl font-semibold mb-3 text-purple-700">Actions principales</h2> <ul class="list-disc list-inside text-gray-800 space-y-2"> <li>Organisation de hackathons, concours et ateliers d’innovation.</li> <li>Formations en développement web, IA, cybersécurité, etc.</li> <li>Accompagnement des startups sociales et solidaires.</li> <li>Création de programmes d’incubation et d’accélération AMP.</li> </ul> </div> </div> <div class="text-center mb-16"> <h2 class="text-2xl font-semibold mb-4 text-purple-700">Notre vision</h2> <p class="max-w-3xl mx-auto text-gray-800">
Un écosystème où les idées, la technologie et l’entrepreneuriat transforment durablement nos communautés.
</p> </div> <div class="text-center"> <h2 class="text-2xl font-semibold mb-4 text-purple-700">Rejoignez la dynamique innovante !</h2> <p class="max-w-2xl mx-auto text-gray-700 mb-4">
La SNIE-AMP vous offre des opportunités uniques pour apprendre, créer et entreprendre autrement.
</p> <a href="/contact" class="inline-block bg-purple-600 text-white px-6 py-3 rounded-full shadow hover:bg-purple-700 transition">
Intégrer la SNIE-AMP
</a> </div> </section> ` })}`;
}, "C:/amp-benin-site/src/pages/is/snie.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/is/snie.astro";
const $$url = "/is/snie";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Snie,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
