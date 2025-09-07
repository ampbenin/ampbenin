import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify/functions"; // ← Adapter Netlify

export default defineConfig({
  site: "https://ampbenin.netlify.app",

  integrations: [
    tailwind(),
    sitemap(),
    react()
  ],

  output: "server",       // ← Nécessaire pour SSR
  adapter: netlify(),     // ← L’adapter Netlify

  defaultLocale: "fr",
  locales: ["fr", "en"],
  i18nextOptions: {
    interpolation: {
      escapeValue: false,
    },
    fallbackLng: "fr",
  }
});
