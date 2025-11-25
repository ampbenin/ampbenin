import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify"; // adapter SSR officiel

export default defineConfig({
  site: "https://ampbenin.netlify.app",

  integrations: [
    tailwind(),
    sitemap(),
    react(),
  ],

  output: "server",      // ← OBLIGATOIRE pour SSR
  adapter: netlify(),    // ← OBLIGATOIRE pour SSR + Netlify

  defaultLocale: "fr",
  locales: ["fr", "en"],
  i18nextOptions: {
    interpolation: {
      escapeValue: false,
    },
    fallbackLng: "fr",
  },
});
