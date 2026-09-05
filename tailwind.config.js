/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nursery: {
          dark: '#07080b',
          card: '#11131a',
          cardHover: '#181b24',
          border: '#232733',
        },
        mom: {
          50: '#fdf4f5',
          100: '#fbe8eb',
          500: '#e11d48',
          600: '#be123c',
          700: '#9f1239',
        },
        baby: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
    },
  },
  plugins: [],
}
