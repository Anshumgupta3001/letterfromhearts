/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── "Sunrise" palette (legacy names kept stable for compat) ──
        cream: '#FFFFFF',   // base canvas
        warm: '#FBFAF8',    // soft off-white / card
        paper: '#FFFFFF',
        card: '#FBFAF8',
        ink: {
          DEFAULT: '#3B3663',
          soft: '#5A5580',
          muted: '#8B87A6',
        },
        tc: '#F4813F',       // primary accent — sunrise orange
        'tc-2': '#E06B28',
        sage: '#2E7D5B',     // mint green
        gold: '#FFD166',     // sunny yellow
        purple: '#5C4FA8',   // lavender
        brown: '#5A5580',
        anger: '#E06B28',
        clay: '#E06B28',
        // Pastel family
        yellow: '#FFD166',
        sky: '#AFD5F2',
        mint: '#BFE5D2',
        blush: '#FBD9C6',
        lav: '#DCD6F5',
        line: '#F1EFEA',
      },
      fontFamily: {
        // All legacy families remap to Inter
        playfair: ['Inter', 'system-ui', 'sans-serif'],
        lora: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '100px',
        '3xl': '26px',
        '4xl': '32px',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.6' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
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
        pulseDot: 'pulseDot 2.4s ease-in-out infinite',
        fadeUp: 'fadeUp 0.6s cubic-bezier(.2,.7,.2,1) both',
        floatUp: 'floatUp 3s ease-in-out infinite',
      },
      backdropBlur: {
        nav: '12px',
      },
    },
  },
  plugins: [],
}
