/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#e63946",
          dark: "#a12633",
          gold: "#f5d042",
          midnight: "#080b16",
          indigo: "#11192f",
        },
      },
      backgroundImage: {
        "lux-gradient": "radial-gradient(circle at top right, rgba(229,57,70,0.35), transparent 55%), radial-gradient(circle at bottom left, rgba(245,208,66,0.2), transparent 50%)",
      },
      boxShadow: {
        glow: "0 20px 45px -15px rgba(229,57,70,0.45)",
        "glow-soft": "0 25px 60px -20px rgba(15,23,42,0.65)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s ease-out forwards",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};
