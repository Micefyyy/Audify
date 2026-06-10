/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Audify palette — deep black base, electric accent
        bg: {
          base:    '#0A0A0A',
          surface: '#141414',
          elevated:'#1E1E1E',
          overlay: '#282828',
        },
        accent: {
          DEFAULT: '#6C63FF', // electric violet — not Spotify green
          hover:   '#7D75FF',
          muted:   '#6C63FF33',
        },
        text: {
          primary:   '#F2F2F2',
          secondary: '#8A8A8A',
          muted:     '#4A4A4A',
        },
        success: '#1DB954',
        error:   '#FF453A',
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Inter var', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glow': '0 0 24px rgba(108, 99, 255, 0.35)',
        'card': '0 4px 24px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
