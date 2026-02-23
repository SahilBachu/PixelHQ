/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0d59f2',
        'bg-dark': '#101622',
        'bg-panel': '#161b2e',
      },
    },
  },
  plugins: [],
}
