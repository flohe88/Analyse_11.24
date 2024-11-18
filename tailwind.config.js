/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#3b82f6',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      keyframes: {
        'bounce-x': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' }
        }
      },
      animation: {
        'bounce-x': 'bounce-x 1s infinite'
      }
    },
  },
  plugins: [],
}
