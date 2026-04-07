/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde7ff',
          200: '#c3d2fe',
          300: '#9eb4fd',
          400: '#748bf9',
          500: '#5265f5',
          600: '#3d45ea',
          700: '#3234d0',
          800: '#2b2ca9',
          900: '#292c85',
          950: '#1a1a52',
        },
        surface: {
          DEFAULT: '#0f0f1a',
          card: '#16162a',
          border: '#2a2a45',
          hover: '#1e1e35',
        }
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        }
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        hrdark: {
          "primary": "#5265f5",
          "primary-content": "#ffffff",
          "secondary": "#7c3aed",
          "accent": "#06d6a0",
          "neutral": "#16162a",
          "base-100": "#0f0f1a",
          "base-200": "#16162a",
          "base-300": "#1e1e35",
          "base-content": "#e2e8f0",
          "info": "#38bdf8",
          "success": "#06d6a0",
          "warning": "#fbbf24",
          "error": "#f87171",
        },
      },
    ],
    darkTheme: "hrdark",
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
}
