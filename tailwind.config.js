/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255, 255, 255, 0.03)",
        "glass-border": "rgba(255, 255, 255, 0.08)",
      },
      backgroundImage: {
        "gradient-sky": "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
        "gradient-violet": "linear-gradient(135deg, #8b5cf6 0%, #fb7185 100%)",
      }
    },
  },
  plugins: [],
}
