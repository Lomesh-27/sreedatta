/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aqua: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        brand: {
          orange: '#ff6600',
          'orange-hover': '#e65c00',
          'orange-light': '#fff3e0',
          blue: '#0284c7',
          'blue-dark': '#0369a1',
          'blue-light': '#e0f2fe',
          navy: '#0f172a',
          dark: '#0b1120',
          card: '#1e293b',
          surface: '#f8fafc',
          border: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}
