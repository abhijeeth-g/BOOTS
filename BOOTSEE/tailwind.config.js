/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000", // Black
        secondary: "#FF1493", // Dark Pink
        accent: "#FFFFFF", // White
        dark: {
          primary: "#121212",
          secondary: "#D81B60",
        },
        light: {
          primary: "#F5F5F5",
          secondary: "#FFCCE5",
        }
      },
    },
  },
  plugins: [],
}
