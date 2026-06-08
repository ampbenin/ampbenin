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

  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en", "es", "ar"],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
  },
});
