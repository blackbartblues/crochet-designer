/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        paper: 'var(--bg-paper)',
        elevated: 'var(--bg-elevated)',
        ink: {
          deep: 'var(--ink-deep)',
          DEFAULT: 'var(--ink-body)',
          muted: 'var(--ink-muted)',
          subtle: 'var(--ink-subtle)',
          inverse: 'var(--ink-inverse)',
        },
        terracotta: {
          DEFAULT: 'var(--accent-terracotta)',
          hover: 'var(--accent-terracotta-hover)',
          soft: 'var(--accent-terracotta-soft)',
        },
        sage: 'var(--accent-sage)',
        gold: 'var(--accent-gold)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
}

