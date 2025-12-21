/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aponta onde estarão nossos arquivos com classes do tailwind
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#000000", // Ajuste conforme a marca Readeek
        secondary: "#333333",
      }
    },
  },
  plugins: [],
}