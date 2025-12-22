// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Adicione todas as pastas onde você usa classes do Tailwind
  content: [
    "./app/**/*.{ts,tsx}", 
    "./components/**/*.{ts,tsx}",
    "./_components/**/*.{ts,tsx}", // Caso use pastas com underline
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}