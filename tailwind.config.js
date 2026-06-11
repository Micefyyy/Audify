/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0C0C0C',
          surface: '#161616',
          elevated: '#1E1E1E',
          overlay: '#262626',
        },
        accent: {
          DEFAULT: '#6C63FF',
          hover:   '#7D75FF',
          muted:   '#6C63FF33',
        },
        text: {
          primary:   '#F5F5F5',
          secondary: '#9E9E9E',
          muted:     '#555555',
        },
        error: '#FF453A',
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 0 0 rgba(255,255,255,0.04)',
        'bar': '0 -1px 0 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
};
