/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        film: {
          bg: '#0a0a0a',
          surface: '#1a1a1a',
          cream: '#f5e6d0',
          gold: '#e8c97a',
          border: '#333333',
          muted: '#888888',
        },
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}
