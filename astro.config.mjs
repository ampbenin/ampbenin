import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap"; // 👉 Import du sitemap

import react from "@astrojs/react";

export default defineConfig({
  site: "https://ampbenin.netlify.app", // ⚠️ Obligatoire pour le sitemap

  integrations: [tailwind(), // 👉 Ajout ici
  sitemap(), react()],

  output: "static",

  defaultLocale: "fr",
  locales: ["fr", "en"],
  i18nextOptions: {
    interpolation: {
      escapeValue: false,
    },
    fallbackLng: "fr",
  }
});