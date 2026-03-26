/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#080d22",
          800: "#111b45",
          700: "#202d67",
          600: "#2b3d85",
        },
        emeraldRate: {
          500: "#3454d1",
          600: "#2b46b3",
          700: "#223793",
        },
        emerald: {
          50: "#edf6ff",
          100: "#d9ecff",
          200: "#b9dcff",
          300: "#8cc4ff",
          400: "#61a8f6",
          500: "#3f86df",
          600: "#326fc4",
          700: "#295aa5",
          800: "#234c88",
          900: "#1f3f70",
        },
        slateGlass: {
          800: "#1d3d5d",
          700: "#4a9bb8",
          600: "#7ec4d8",
          500: "#a8deeb",
        },
      },
      boxShadow: {
        glow: "0 10px 30px rgba(61, 134, 223, 0.35)",
        panel: "0 16px 40px rgba(3,7,18,0.45)",
      },
      animation: {
        "pulse-soft": "pulseSoft 2.2s ease-in-out infinite",
        "fade-up": "fadeUp .5s ease-out forwards",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: 0.45 },
          "50%": { opacity: 0.9 },
        },
        fadeUp: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
