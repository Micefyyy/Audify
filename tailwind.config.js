/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          overlay: 'var(--bg-overlay)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
        },
        error: 'var(--error)',
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
