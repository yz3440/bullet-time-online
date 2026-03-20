import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
      },
      fontFamily: {
        led: ['var(--font-led)'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      dropShadow: {
        glow: [
          '0 0px 20px rgba(255,255, 255, 0.35)',
          '0 0px 65px rgba(255, 255,255, 0.2)',
        ],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        marquee2: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'led-text-glow-green': {
          '0%': {
            textShadow:
              '0 0 10px #444, 0 0 20px #444, 0 0 30px #00FF41, 0 0 40px #00FF41, 0 0 50px #00FF41, 0 0 60px #00FF41, 0 0 70px #00FF41',
          },
          '50%': {
            textShadow:
              '0 0 20px #444, 0 0 30px #003900, 0 0 40px #003900, 0 0 50px #003900, 0 0 60px #003900, 0 0 70px #003900, 0 0 80px #003900',
          },
          '100%': {
            textShadow:
              '0 0 10px #444, 0 0 20px #444, 0 0 30px #00FF41, 0 0 40px #00FF41, 0 0 50px #00FF41, 0 0 60px #00FF41, 0 0 70px #00FF41',
          },
        },
      },
      animation: {
        'led-text-glow-green': 'led-text-glow-green 2s linear infinite',
        marquee: 'marquee 20s linear infinite',
        marquee2: 'marquee2 20s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
