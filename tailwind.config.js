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
