/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#bae6fd',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#0f172a',
        },
        odoo: {
          purple: '#714B67',
          teal: '#00A09D',
          dark: '#212529',
          light: '#F8F9FA',
          accent: '#E06D53',
        }
      },
    },
  },
  plugins: [],
}
