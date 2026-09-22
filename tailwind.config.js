/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['"Space Grotesk"', 'sans-serif'], sans: ['"DM Sans"', 'sans-serif'] },
      colors: { ocean: { 950: '#11100f', 900: '#1b1917', 800: '#292521', 700: '#4a3b2d', 500: '#a87945', 300: '#d7b98a' } },
      boxShadow: { glow: '0 0 50px rgba(168, 121, 69, 0.24)' },
    },
  },
  plugins: [],
}
