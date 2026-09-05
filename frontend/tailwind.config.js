/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f0f4',
          100: '#e8dce6',
          200: '#d1bacd',
          300: '#b998b4',
          400: '#9e729a',
          500: '#714B67',
          600: '#5e3f57',
          700: '#4c3347',
          800: '#3a2736',
          900: '#261a24',
        },
        secondary: {
          50:  '#e6f6f7',
          100: '#ccedee',
          200: '#99dbdd',
          300: '#66c9cc',
          400: '#33b7bb',
          500: '#017E84',
          600: '#016870',
          700: '#01525b',
          800: '#013c45',
          900: '#00262e',
        },
        brand: {
          purple: '#714B67',
          teal:   '#017E84',
          dark:   '#212121',
          light:  '#F8F8F8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass:    '0 8px 32px 0 rgba(113,75,103,0.10)',
        'glass-lg': '0 16px 48px 0 rgba(113,75,103,0.15)',
        'card':   '0 2px 12px 0 rgba(33,33,33,0.07)',
        'card-hover': '0 8px 24px 0 rgba(113,75,103,0.14)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #714B67 0%, #017E84 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(113,75,103,0.08) 0%, rgba(1,126,132,0.08) 100%)',
      },
    },
  },
  plugins: [],
}
