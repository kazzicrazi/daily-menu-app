/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cpp: {
          dark: '#004482',
          brand: '#00599C',
          light: '#659AD2',
          bg: '#F0F5FA',
        },
        accent: {
          green: '#059669',
          greenHover: '#047857',
          red: '#DC2626',
          redHover: '#B91C1C',
        },
      },
    },
  },
  plugins: [],
}