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
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36a8f7',
          500: '#0c8ce9',
          600: '#026ec7',
          700: '#0358a1',
          800: '#074b85',
          900: '#0c3f6e',
          950: '#082849',
        },
        stitch: {
          dark: '#0f172a',
          sidebar: '#111827',
          card: '#1e293b',
          border: '#334155',
          accent: '#3b82f6',
          gold: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(59, 130, 246, 0.4)',
        'glow-danger': '0 0 20px -5px rgba(244, 63, 94, 0.4)',
        'glow-success': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [],
}
