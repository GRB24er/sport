/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#E31725",
          crimson: "#AE0C0E",
          green: "#0B9635",
          gold: "#D4AF37",
          platinum: "#A0B2C6",
          diamond: "#B9F2FF",
        },
        dark: {
          bg: "#1A1D22",
          card: "#22262D",
          input: "#2A2E36",
          slate: "#343944",
        },
        steel: "#5B5C5F",
        smoke: "#EEEFF1",
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        body: ["'Barlow'", "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "slide-up": "slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.4s ease-out",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
        "slide-up": {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
