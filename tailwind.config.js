/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{astro,html,js,jsx,ts,tsx}",
      "./components/**/*.{astro,html,js,jsx,ts,tsx}",
      "./layouts/**/*.{astro,html,js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#1E3A8A", // Bleu foncé AMP
          secondary: "#FBBF24", // Jaune AMP
          dark: "#111827",
        },
        fontFamily: {
          sans: ["Inter", "sans-serif"],
          heading: ["Poppins", "sans-serif"],
        },
      },
    },
    plugins: [],
  }
  