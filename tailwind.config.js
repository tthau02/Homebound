/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        short: { raw: '(max-height: 600px)' },
        touch: { raw: '(pointer: coarse)' },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        // HUD design tokens (Phase 9): calm neutral surfaces + one warm accent
        ink: {
          950: '#0b0f16',
          900: '#11161f',
          800: '#1a212c',
          700: '#273041',
          600: '#3a4556',
          400: '#8d99aa',
          300: '#b6c0cc',
          200: '#d5dce5',
          100: '#eef2f6',
        },
        accent: {
          DEFAULT: '#f5a524',
          soft: '#fcd27d',
          strong: '#d98a06',
        },
        ok: '#34d399',
        info: '#60b4f0',
        danger: '#f87171',
      },
      borderRadius: {
        hud: '14px',
      },
      boxShadow: {
        hud: '0 10px 30px -12px rgba(0, 0, 0, 0.55)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-up': 'slide-up 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
