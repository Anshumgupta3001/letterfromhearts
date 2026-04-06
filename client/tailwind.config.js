/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F2EA',
        warm: '#F2EBE0',
        paper: '#FDF9F3',
        ink: {
          DEFAULT: '#1C1A17',
          soft: '#4A4640',
          muted: '#8C8478',
        },
        tc: '#C4633A',
        sage: '#7A9E8E',
        gold: '#C9A84C',
        purple: '#8B7EC8',
        brown: '#7A6E5C',
        anger: '#B85450',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        lora: ['Lora', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        pill: '100px',
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
