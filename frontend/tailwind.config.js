/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "nu-blue": "#3D398C",
        "nu-gold": "#F5DA3E",
        "nu-bg": "#f9f9f9",
        "nu-card": "#faf8fd",
        "nu-muted": "#6b6b6b",
      },
    },
  },
  plugins: [],
};
