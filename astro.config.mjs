import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify";
import path from "path";

export default defineConfig({
  site: "https://ampbenin.org",

  integrations: [
    tailwind(),
    sitemap(),
    react(),
  ],

  output: "server",
  adapter: netlify(),

  // Redirection fixe vers l'espace admin (suivi des dons/retraits, voir
  // frontend-vote-admin) — géré nativement par l'adaptateur Netlify (302 à
  // la volée, aucune page intermédiaire). Ajouter d'autres redirections ici
  // si besoin, jamais dans public/_redirects (les deux mécanismes se
  // marcheraient dessus).
  redirects: {
    "/don/suivi": "https://cflworld.netlify.app/admin",
  },

  // Pas de routage i18n par URL : une seule adresse par page, la langue
  // est choisie via un cookie (voir src/i18n/utils.ts `resolveLang`).

  vite: {
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
  },
});
