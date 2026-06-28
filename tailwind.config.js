/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#07111f',
        panel: '#0b1628',
        cyanx: '#22d3ee',
        vio: '#8b5cf6',
        good: '#34d399',
        warn: '#fbbf24',
        bad: '#fb7185'
      },
      boxShadow: { glow: '0 0 40px rgba(34,211,238,.18)' }
    },
  },
  plugins: [],
};
