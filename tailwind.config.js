/** @type {import('tailwindcss').Config} */
module.exports = {
  // Mode sombre par attribut plutôt que par classe .dark (décision
  // utilisateur, 2026-08-19 : icône dans l'en-tête, s'applique à tout
  // l'espace Admin/Gestion) — même sélecteur que celui déjà posé sur
  // <body> par le mode sombre des pages Volontaire/Superviseur
  // (src/hooks/useTheme.js, GestionAMPLayout.astro) : un seul mécanisme
  // partagé, "dark:bg-gray-900" etc. s'activent dès que body[data-theme="dark"].
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx}",
    "./components/**/*.{astro,html,js,jsx,ts,tsx}",
    "./layouts/**/*.{astro,html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:  "#1B4332",
        "primary-light": "#2D6A4F",
        "primary-dark":  "#0F2A1E",
        secondary: "#C9903A",
        accent:    "#C9903A",
        dark:      "#131F17",
      },
      fontFamily: {
        sans:    ["DM Sans", "system-ui", "sans-serif"],
        heading: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
