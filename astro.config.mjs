import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    image(),
  ],
  site: "https://ampbenin.org", // tu peux mettre localhost si besoin
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
