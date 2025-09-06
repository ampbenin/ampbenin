/* empty css                                       */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as renderScript } from '../../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../../renderers.mjs';

const $$Admimission = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Administration Missions & Volontaires" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="container mx-auto px-4 py-10 space-y-10"> <h1 class="text-3xl font-bold mb-6 text-blue-700">
🔑 Administration Missions & Volontaires
</h1> <!-- -------------------- LOGIN -------------------- --> <div id="loginDiv" class="bg-white p-6 rounded-lg shadow-md"> <p class="mb-2">Veuillez entrer le mot de passe admin :</p> <input type="password" id="adminPass" placeholder="Mot de passe" class="border p-2 rounded w-full mb-3"> <button onclick="login()" class="bg-blue-600 text-white px-4 py-2 rounded">
Se connecter
</button> <div id="loginMessage" class="mt-2"></div> </div> <!-- -------------------- ADMIN PANEL -------------------- --> <div id="adminPanel" class="hidden space-y-8"> <!-- FORMULAIRE : Création de mission --> <div class="bg-white p-6 rounded-lg shadow-md"> <h2 class="text-xl font-semibold mb-4">📌 Créer une mission</h2> <form id="missionForm" class="space-y-3"> <input type="text" id="missionCode" placeholder="Code (ex: MYCOUNTRY229_2025)" required class="border p-2 rounded w-full"> <input type="text" id="missionTitre" placeholder="Titre" required class="border p-2 rounded w-full"> <textarea id="missionDesc" placeholder="Description" class="border p-2 rounded w-full"></textarea> <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">
Ajouter Mission
</button> </form> <div id="missionMessage" class="mt-2"></div> </div> <!-- FORMULAIRE : Ajout volontaire --> <div class="bg-white p-6 rounded-lg shadow-md"> <h2 class="text-xl font-semibold mb-4">👥 Ajouter un volontaire</h2> <form id="volontaireForm" class="space-y-3"> <input type="text" id="nom" placeholder="Nom" required class="border p-2 rounded w-full"> <input type="email" id="email" placeholder="Email" required class="border p-2 rounded w-full"> <input type="text" id="identifiant" placeholder="Identifiant (Nom@DA)" required class="border p-2 rounded w-full"> <!-- ⚠️ remplacé par un select alimenté dynamiquement --> <select id="missionCodeVol" required class="border p-2 rounded w-full"> <option value="">-- Sélectionner une mission --</option> </select> <select id="statut" class="border p-2 rounded w-full"> <option value="Non disponible">Non disponible</option> <option value="Refusé">Refusé</option> <option value="Disponible">Disponible</option> </select> <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">
Ajouter Volontaire
</button> </form> <div id="volontaireMessage" class="mt-2"></div> </div> <!-- FORMULAIRE : Admission membre actif --> <div class="bg-white p-6 rounded-lg shadow-md"> <h2 class="text-xl font-semibold mb-4">📝 Nouvelle admission de membre actif</h2> <form id="memberForm" class="grid grid-cols-2 gap-4"> <input type="text" id="name" placeholder="Nom complet" class="border p-2 rounded" required> <input type="email" id="memberEmail" placeholder="Email" class="border p-2 rounded" required> <input type="text" id="phone" placeholder="Téléphone" class="border p-2 rounded"> <!-- ⚠️ remplacé aussi par un select dynamique --> <select id="missionMember" required class="border p-2 rounded col-span-2"> <option value="">-- Sélectionner une mission --</option> </select> <button type="submit" class="col-span-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
Enregistrer
</button> </form> </div> <!-- TABLEAU VOLONTAIRES --> <div class="bg-white p-6 rounded-lg shadow-md"> <h2 class="text-xl font-semibold mb-4">📊 Gestion des Volontaires par Mission</h2> <!-- Filtre Mission --> <div class="mb-4 flex items-center space-x-2"> <label for="missionFilter" class="font-medium">Mission :</label> <select id="missionFilter" class="border p-2 rounded"> <option value="">-- Toutes les missions --</option> </select> </div> <!-- Tableau --> <table class="w-full border border-gray-300"> <thead> <tr class="bg-gray-100"> <th class="border p-2">Nom</th> <th class="border p-2">Email</th> <th class="border p-2">Mission</th> <th class="border p-2">Statut</th> <th class="border p-2">Actions</th> </tr> </thead> <tbody id="volunteerTable"></tbody> </table> </div> </div> </section>  ${renderScript($$result2, "C:/amp-benin-site/src/pages/actualites/admimission.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "C:/amp-benin-site/src/pages/actualites/admimission.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/actualites/admimission.astro";
const $$url = "/actualites/admimission";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Admimission,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
