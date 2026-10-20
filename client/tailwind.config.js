/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F9F4F1',
        warm: '#F0DFD1',
        paper: '#FCFAF8',
        ink: {
          DEFAULT: '#28030F',
          soft: '#4A2B35',
          muted: '#755760',
        },
        tc: '#28030F',
        sage: '#588F60',
        gold: '#755760',
        purple: '#33557F',
        brown: '#755760',
        anger: '#B85450',
        lemon: '#FBF582',
        slate: '#33557F',
        fern: '#194B22',
        sand: '#F0DFD1',
        rose: '#D4C4C9',
      },
      fontFamily: {
        playfair: ['Gambetta', 'Georgia', 'serif'],
        lora: ['Gambetta', 'Georgia', 'serif'],
        serif: ['Gambetta', 'Georgia', 'serif'],
        sans: ['"General Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '8px',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        floatUp: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        blink: 'blink 2s ease-in-out infinite',
        blinkFast: 'blink 1.5s ease-in-out infinite',
        fadeUp: 'fadeUp 0.4s ease',
        floatUp: 'floatUp 3s ease-in-out infinite',
      },
      backdropBlur: {
        nav: '12px',
      },
    },
  },
  plugins: [],
}
