/* empty css                                    */
import { f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_C4XkxFqA.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DXKGEhHV.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Partenaire = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$BaseLayout, { "title": "Partenaires & Donateurs | AMP BENIN" }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template(["  ", `<section class="py-12 px-6 md:px-20 bg-gray-50 text-gray-800 text-center"> <div class="max-w-4xl mx-auto"> <div class="flex justify-center mb-4 text-primary"> <!-- Ic\xF4ne partenariat --> <svg xmlns="http://www.w3.org/2000/svg" class="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 1.343-3 3v6a3 3 0 006 0v-6c0-1.657-1.343-3-3-3z"></path> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8V6a5 5 0 00-10 0v2M7 16v5m10-5v5"></path> </svg> </div> <h1 class="text-4xl font-bold mb-4">Ensemble, construisons un avenir meilleur</h1> <p class="text-lg text-gray-600">
AMP BENIN est honor\xE9e de collaborer avec des <strong>partenaires</strong> et <strong>donateurs</strong> du monde entier.
        Votre engagement et votre g\xE9n\xE9rosit\xE9 contribuent directement \xE0 nos actions pour un impact durable et positif.
        Nous croyons en la <span class="text-primary font-semibold">s\xE9r\xE9nit\xE9</span> et la <span class="text-primary font-semibold">confiance</span> comme fondements d'une coop\xE9ration fructueuse.
</p> </div> </section>  <section class="py-16 px-6 md:px-20 bg-white text-gray-800"> <div class="max-w-4xl mx-auto mb-12 text-center"> <h2 class="text-3xl font-bold text-primary">Proposez votre partenariat ou votre soutien</h2> <p class="text-gray-600 mt-2">
Remplissez ce formulaire pour nous faire part de votre volont\xE9 de collaborer ou de soutenir nos initiatives.
</p> </div> <form id="partnerForm" class="space-y-6 bg-gray-50 p-6 rounded-2xl shadow hover:shadow-md transition max-w-3xl mx-auto"> <!-- Nom / Organisation --> <div> <label for="name" class="block text-sm font-medium text-gray-700">Nom complet ou organisation *</label> <input type="text" name="name" id="name" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> </div> <!-- Email --> <div> <label for="email" class="block text-sm font-medium text-gray-700">Adresse email *</label> <input type="email" name="email" id="email" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> </div> <!-- Pays / Ville --> <div> <label for="location" class="block text-sm font-medium text-gray-700">Pays / Ville *</label> <input type="text" name="location" id="location" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> </div> <!-- Type de collaboration --> <div> <label for="type" class="block text-sm font-medium text-gray-700">Type de collaboration *</label> <select name="type" id="type" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> <option value="">-- S\xE9lectionnez --</option> <option value="Partenariat institutionnel">Partenariat institutionnel</option> <option value="Soutien financier">Soutien financier / Don</option> <option value="Appui mat\xE9riel ou technique">Appui mat\xE9riel ou technique</option> <option value="Autre">Autre</option> </select> </div> <!-- Montant du don (optionnel) --> <div id="donAmountField" class="hidden"> <label for="amount" class="block text-sm font-medium text-gray-700">Montant du don (\u20AC ou FCFA)</label> <input type="number" name="amount" id="amount" min="0" step="0.01" class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"> </div> <!-- Message --> <div> <label for="message" class="block text-sm font-medium text-gray-700">Message *</label> <textarea name="message" id="message" rows="5" required class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary focus:border-primary"></textarea> </div> <!-- Bouton --> <button type="submit" class="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition">
Envoyer ma proposition
</button> <!-- Status --> <p id="partnerStatus" class="mt-4 text-center text-sm"></p> </form> </section> <script>
    document.addEventListener("DOMContentLoaded", () => {
      const form = document.getElementById('partnerForm');
      const statusMessage = document.getElementById('partnerStatus');
      const typeSelect = form.type;
      const donAmountField = document.getElementById('donAmountField');

      // Afficher le champ montant si soutien financier
      typeSelect.addEventListener("change", () => {
        if (typeSelect.value === "Soutien financier") {
          donAmountField.classList.remove("hidden");
        } else {
          donAmountField.classList.add("hidden");
        }
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
          name: form.name.value.trim(),
          email: form.email.value.trim(),
          location: form.location.value.trim(),
          type: form.type.value,
          amount: form.amount ? form.amount.value : '',
          message: form.message.value.trim(),
        };

        statusMessage.style.color = "green";
        statusMessage.textContent = "Envoi en cours...";

        try {
          const response = await fetch('/.netlify/functions/savePartner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (result.result === 'success') {
            statusMessage.style.color = "green";
            statusMessage.textContent = "Proposition envoy\xE9e avec succ\xE8s, merci pour votre engagement !";
            form.reset();
            donAmountField.classList.add("hidden");
          } else {
            statusMessage.style.color = "red";
            statusMessage.textContent = "Erreur : " + (result.error || "erreur inconnue");
          }
        } catch (err) {
          statusMessage.style.color = "red";
          statusMessage.textContent = "Erreur r\xE9seau ou serveur : " + err.message;
        }
      });
    });
  <\/script> `])), maybeRenderHead()) })}`;
}, "C:/amp-benin-site/src/pages/partenaire.astro", void 0);

const $$file = "C:/amp-benin-site/src/pages/partenaire.astro";
const $$url = "/partenaire";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Partenaire,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
