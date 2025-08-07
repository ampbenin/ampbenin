import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(), 
  ],
  site: "https://ampbenin.org", // ou "http://localhost:4321" en local
  output: "static",

  // Options globales (hors intégrations)
  defaultLocale: "fr",
  locales: ["fr", "en"],
  i18nextOptions: {
    interpolation: {
      escapeValue: false,
    },
    fallbackLng: "fr"
  }
});
