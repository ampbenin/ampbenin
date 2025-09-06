import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import node from "@astrojs/node"; // ← ajouter

export default defineConfig({
  site: "https://ampbenin.netlify.app", // pour le sitemap

  integrations: [tailwind(), sitemap(), react()],

  // 🔹 Passer de "static" à "server" pour le SSR
  output: "server",

  // 🔹 Ajouter l'adapter Node
  adapter: node({
    mode: "standalone"
  }),

  

  defaultLocale: "fr",
  locales: ["fr", "en"],
  i18nextOptions: {
    interpolation: {
      escapeValue: false,
    },
    fallbackLng: "fr",
  },
});
