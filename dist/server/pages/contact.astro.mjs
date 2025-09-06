/* empty css                                    */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Contact = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$BaseLayout, { "title": "Contact | AMP BENIN" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template(["  ", `<section class="py-12 px-6 md:px-20 bg-gray-50 text-gray-800"> <div class="max-w-4xl mx-auto text-center mb-12"> <h1 class="text-4xl font-bold text-primary mb-4">Contactez-nous</h1> <p class="text-lg text-gray-600">
Une question ? Une proposition de partenariat ? \xC9crivez-nous et nous vous r\xE9pondrons rapidement.
</p> </div> <div class="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center"> <!-- Partenariat --> <div class="p-6 bg-white rounded-2xl shadow hover:shadow-md transition"> <div class="flex justify-center mb-4 text-primary"> <!-- Ic\xF4ne Handshake --> <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 12l2 2m0 0l4-4m-4 4l-4 4m4-4l-4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> </div> <h3 class="text-lg font-semibold mb-2">Partenaires</h3> <p class="text-sm text-gray-600 mb-4">
AMP BENIN est fi\xE8re de collaborer avec toute structure ou personne pour un impact positif.
</p> <a href="/partenaire" class="inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition">
Devenir partenaire
</a> </div> <!-- Membres actifs --> <div class="p-6 bg-white rounded-2xl shadow hover:shadow-md transition"> <div class="flex justify-center mb-4 text-primary"> <!-- Ic\xF4ne Utilisateurs --> <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M15 11a4 4 0 11-8 0 4 4 0 018 0z"></path> </svg> </div> <h3 class="text-lg font-semibold mb-2">Membres actifs</h3> <p class="text-sm text-gray-600 mb-4">
AMP BENIN accueille avec joie tout membre pr\xEAt \xE0 cr\xE9er un impact positif, peu importe son pays, sa religion ou sa classe sociale.
</p> <a href="/adhesion" class="inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition">
Devenir membre actif
</a> </div> <!-- Volontaires / Sympathisants --> <div class="p-6 bg-white rounded-2xl shadow hover:shadow-md transition"> <div class="flex justify-center mb-4 text-primary"> <!-- Ic\xF4ne Main + C\u0153ur --> <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21l-1-1c-4.5-4.5-6-6-6-9a5 5 0 0110 0c0 3-1.5 4.5-6 9l-1 1z"></path> </svg> </div> <h3 class="text-lg font-semibold mb-2">Volontaires & Sympathisants</h3> <p class="text-sm text-gray-600 mb-4">
AMP BENIN dispose d'une base de donn\xE9es pour ses sympathisants et volontaires afin de participer \xE0 ses actions.
</p> <a href="/volontaires" class="inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition">
Devenir sympathisant / volontaire
</a> </div> </div> </section>  <section class="py-16 px-6 md:px-20 bg-white text-gray-800"> <div class="max-w-4xl mx-auto text-center mb-12"> <h1 class="text-4xl font-bold text-primary mb-4">Contactez-nous</h1> <p class="text-lg text-gray-600">
Une question ? Une proposition de partenariat ? \xC9crivez-nous et nous vous r\xE9pondrons rapidement.
</p> </div> <div class="max-w-4xl mx-auto grid md:grid-cols-2 gap-10"> <form id="contactForm" class="space-y-6 bg-gray-50 p-6 rounded-2xl shadow hover:shadow-md transition"> <!-- Nom complet --> <div> <label for="name" class="block text-sm font-medium text-gray-700">Nom complet *</label> <input type="text" name="name" id="name" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> </div> <!-- Email --> <div> <label for="email" class="block text-sm font-medium text-gray-700">Adresse email *</label> <input type="email" name="email" id="email" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> </div> <!-- Pays / Ville --> <div> <label for="location" class="block text-sm font-medium text-gray-700">Pays / Ville *</label> <input type="text" name="location" id="location" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> </div> <!-- Num\xE9ro WhatsApp --> <div> <label for="whatsapp" class="block text-sm font-medium text-gray-700">Num\xE9ro WhatsApp</label> <input type="tel" name="whatsapp" id="whatsapp" placeholder="+229XXXXXXXX" class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> </div> <!-- Destination principale --> <div> <label for="destination" class="block text-sm font-medium text-gray-700">Destination de votre message *</label> <select name="destination" id="destination" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> <option value="">-- S\xE9lectionnez --</option> <option value="Direction G\xE9n\xE9rale (Conseil d'Administration)">1 - Direction G\xE9n\xE9rale (Conseil d'Administration)</option> <option value="Direction Administrative et Financi\xE8re">2 - Direction Administrative et Financi\xE8re</option> <option value="Direction Ex\xE9cutive et Technique">3 - Direction Ex\xE9cutive et Technique</option> <option value="Direction des Plaintes et de R\xE9gulation (Conseil de Supervision)">4 - Direction des Plaintes et de R\xE9gulation (Conseil de Supervision)</option> <option value="Institution Sp\xE9cialis\xE9e">5 - Institution Sp\xE9cialis\xE9e</option> </select> </div> <!-- Sous-menu Institution Sp\xE9cialis\xE9e --> <div id="institutionField" class="hidden"> <label for="institution" class="block text-sm font-medium text-gray-700">Choisissez l'institution sp\xE9cialis\xE9e</label> <select name="institution" id="institution" class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> <option value="">-- S\xE9lectionnez --</option> <option value="Coordination Internationale de D\xE9centralisation et AMP zones">1 - Coordination Internationale de D\xE9centralisation et AMP zones</option> <option value="SFPF-AMP">2 - SFPF-AMP - Section du F\xE9minisme et de Promotion de la Femme</option> <option value="SEPE-AMP">3 - SEPE-AMP - Section de l'\xC9ducation et de Promotion de l'Enfance</option> <option value="SECV AMP">4 - SECV AMP - Section de l'environnement et du climat</option> <option value="SCCS-AMP">5 - SCCS-AMP - Section du Citoyennet\xE9 et de Coh\xE9sion Sociale</option> <option value="SNIE-AMP">6 - SNIE-AMP - Section du Num\xE9rique, d'Innovation et de l'Entrepreneuriat</option> <option value="SBSC-AMP">7 - SBSC-AMP - Section du Bien-\xEAtre et de Sant\xE9 Communautaire</option> </select> </div> <!-- Message --> <div> <label for="message" class="block text-sm font-medium text-gray-700">Message *</label> <textarea name="message" id="message" rows="5" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"></textarea> </div> <!-- Texte de confidentialit\xE9 --> <p class="text-xs text-gray-500">
Vos informations seront trait\xE9es en toute confidentialit\xE9 et utilis\xE9es uniquement pour r\xE9pondre \xE0 votre demande.
</p> <!-- Bouton --> <button type="submit" class="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition">
Envoyer le message
</button> </form> <!-- Coordonn\xE9es --> <div class="space-y-6 text-gray-700"> <div> <h2 class="text-lg font-semibold text-primary mb-1">Nos contacts</h2> <p>Email : <a href="mailto:ampbenin.contact@gmail.com" class="text-blue-600">ampbenin.contact@gmail.com</a></p> <p>T\xE9l\xE9phone : <span class="text-gray-800 font-medium">+229 01 47 47 14 65</span></p> </div> <div> <h2 class="text-lg font-semibold text-primary mb-1">Adresse</h2> <p>TORI-BOSSITO, B\xE9nin</p> <p>Si\xE8ge AMP BENIN</p> </div> <div> <h2 class="text-lg font-semibold text-primary mb-1">R\xE9seaux sociaux</h2> <ul class="space-y-1"> <li><a href="https://facebook.com/ampbenin.org" class="text-blue-600">Facebook</a></li> <li><a href="#" class="text-blue-500">Twitter</a></li> <li><a href="#" class="text-purple-600">Instagram</a></li> <li><a href="https://wa.me/22947471465" class="text-green-600">WhatsApp</a></li> </ul> </div> </div> </div> </section> <script>
    document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById('contactForm');
      const statusMessage = document.createElement('p');
      statusMessage.className = "mt-4 text-center text-sm text-green-600";
      form.appendChild(statusMessage);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          location: form.location.value.trim(),
          whatsapp: form.whatsapp.value.trim(),
          destination: form.destination.value,
          institution: form.institution ? form.institution.value : '',
          message: form.message.value.trim(),
        };

        statusMessage.style.color = "green";
        statusMessage.textContent = "Envoi en cours...";

        try {
          const response = await fetch('/.netlify/functions/saveMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (result.result === 'success') {
            statusMessage.textContent = "Message envoy\xE9 avec succ\xE8s, merci !";
            form.reset();
          } else {
            statusMessage.style.color = "red";
            statusMessage.textContent = "Erreur lors de l'envoi du message : " + (result.error || "erreur inconnue");
          }
        } catch (err) {
          statusMessage.style.color = "red";
          statusMessage.textContent = "Erreur r\xE9seau ou serveur : " + err.message;
        }
      });

      // Gestion affichage champ institution selon destination
      const destinationSelect = form.destination;
      const institutionField = document.getElementById("institutionField");
      destinationSelect.addEventListener("change", () => {
        if (destinationSelect.value === "Institution Sp\xE9cialis\xE9e") {
          institutionField.classList.remove("hidden");
        } else {
          institutionField.classList.add("hidden");
        }
      });
    });
  <\/script> `])), maybeRenderHead()) })}`;
}, "C:/amp-benin-site/src/pages/contact.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/contact.astro";
const $$url = "/contact";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Contact,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
