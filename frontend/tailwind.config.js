/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f4f6ee',
          100: '#e5eadb',
          200: '#c9d3b3',
          300: '#a6b586',
          400: '#849a5f',
          500: '#647a44',
          600: '#4c5f34',
          700: '#3a4a29',
          800: '#2f3e2e',
          900: '#232e21',
        },
        paprika: {
          50: '#fdf3ee',
          100: '#fbe1d3',
          200: '#f5bd9d',
          300: '#ec9464',
          400: '#dc6636',
          500: '#c1440e',
          600: '#a3390c',
          700: '#7f2c0a',
          800: '#5e2108',
          900: '#3f1606',
        },
        mustard: {
          400: '#e8bb3f',
          500: '#d4a017',
          600: '#b28513',
        },
        ivory: '#f8f5ee',
        ink: '#211c16',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
