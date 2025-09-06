/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../../renderers.mjs';

const $$Sccs = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "SCCS - Citoyennet\xE9 & Coh\xE9sion Sociale" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="bg-white text-gray-900 py-12 px-4 md:px-12"> <div class="max-w-5xl mx-auto text-center"> <h1 class="text-4xl font-bold mb-4 text-yellow-700">SCCS-AMP</h1> <p class="text-lg mb-6 text-gray-700">
La <strong>Section de la Citoyenneté et de la Cohésion Sociale</strong> (SCCS-AMP) œuvre pour promouvoir la citoyenneté active, le vivre-ensemble et une paix durable au Bénin.
</p> </div> <div class="mt-10 grid gap-10 md:grid-cols-2"> <div> <h2 class="text-2xl font-semibold mb-3 text-yellow-700">Nos missions</h2> <ul class="list-disc list-inside text-gray-800 space-y-1"> <li>Sensibiliser à la citoyenneté responsable et engagée.</li> <li>Renforcer la cohésion sociale et prévenir les conflits.</li> <li>Promouvoir la paix, la tolérance et le dialogue intergénérationnel.</li> <li>Former des ambassadeurs communautaires pour la paix et la citoyenneté.</li> </ul> </div> <div> <h2 class="text-2xl font-semibold mb-3 text-yellow-700">Actions principales</h2> <ul class="list-disc list-inside text-gray-800 space-y-1"> <li>Campagnes de sensibilisation contre l’extrémisme violent.</li> <li>Journées citoyennes, forums et débats communautaires.</li> <li>Partenariats avec structures publiques et société civile pour la paix.</li> <li>Formations en leadership civique et prévention des conflits.</li> </ul> </div> </div> <div class="mt-16 text-center"> <h2 class="text-2xl font-semibold mb-4 text-yellow-700">Notre vision</h2> <p class="max-w-3xl mx-auto text-gray-800">
Bâtir une société inclusive, juste et résiliente, où chaque citoyen devient acteur et artisan de la paix et de la solidarité.
</p> </div> <div class="mt-16 text-center"> <h2 class="text-2xl font-semibold mb-4 text-yellow-700">Rejoignez le mouvement citoyen !</h2> <p class="max-w-2xl mx-auto text-gray-700 mb-4">
Participez avec la SCCS-AMP pour construire ensemble un avenir fondé sur la cohésion, la responsabilité et le dialogue.
</p> <a href="/contact" class="inline-block bg-yellow-600 text-white px-6 py-3 rounded-full shadow hover:bg-yellow-700 transition">
Intégrer la SCCS-AMP
</a> </div> </section> ` })}`;
}, "C:/amp-benin-site/src/pages/is/sccs.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/is/sccs.astro";
const $$url = "/is/sccs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Sccs,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
