/* empty css                                    */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as renderScript } from '../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../renderers.mjs';

const $$Volontaires = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$BaseLayout, { "title": "Devenir Volontaire - AMP BENIN" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-6"> <div class="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 animate-fade-in"> <h1 class="text-3xl font-bold text-green-700 mb-6 text-center">
Formulaire de Volontariat
</h1> <form id="volunteerForm" class="space-y-4"> <div> <label class="block text-sm font-medium text-gray-700">Nom complet</label> <input type="text" name="name" required class="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"> </div> <div> <label class="block text-sm font-medium text-gray-700">Email</label> <input type="email" name="email" required class="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"> </div> <div> <label class="block text-sm font-medium text-gray-700">Téléphone</label> <input type="text" name="phone" class="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"> </div> <div> <label class="block text-sm font-medium text-gray-700">Domaine de volontariat</label> <select name="domain" class="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"> <option value="">Choisissez...</option> <option value="Éducation">Éducation</option> <option value="Santé">Santé</option> <option value="Environnement">Environnement</option> <option value="Autre">Autre</option> </select> </div> <div> <label class="block text-sm font-medium text-gray-700">Motivation</label> <textarea name="motivation" rows="4" required class="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"></textarea> </div> <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all">
Envoyer ma candidature
</button> <p id="formMessage" class="text-center mt-4 text-sm"></p> </form> </div> </section> ${renderScript($$result2, "C:/amp-benin-site/src/pages/volontaires.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "C:/amp-benin-site/src/pages/volontaires.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/volontaires.astro";
const $$url = "/volontaires";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Volontaires,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
