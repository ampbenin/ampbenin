import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify";
import path from "path";

export default defineConfig({
  site: "https://ampbenin.netlify.app",

  integrations: [
    tailwind(),
    sitemap(),
    react(),
  ],

  output: "server",
  adapter: netlify(),

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
