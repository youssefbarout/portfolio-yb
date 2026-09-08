/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['"Space Grotesk"', 'sans-serif'], sans: ['"DM Sans"', 'sans-serif'] },
      colors: { ocean: { 950: '#061521', 900: '#0a2231', 800: '#103447', 700: '#15516b', 500: '#2b9bc1', 300: '#83d8ed' } },
      boxShadow: { glow: '0 0 50px rgba(43, 155, 193, 0.2)' },
    },
  },
  plugins: [],
}

