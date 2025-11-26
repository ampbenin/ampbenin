import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify"; 

export default defineConfig({
  site: "https://ampbenin.netlify.app",

  integrations: [
    tailwind(),
    sitemap(),
    react(),
  ],

  output: "server",     
  adapter: netlify(),  

  defaultLocale: "fr",
  locales: ["fr", "en"],
  i18nextOptions: {
    interpolation: {
      escapeValue: false,
    },
    fallbackLng: "fr",
  },
});
