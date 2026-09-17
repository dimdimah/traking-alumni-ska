import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        /* ─── shadcn/ui system ─── */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        /* ─── Amikom Apple Design System ─── */
        amikom: {
          /* Primary — Satu aksen interaktif */
          'purple': '#700070',
          'purple-hover': '#580058',
          'purple-focus': '#4A1B9D',    /* Amikom Tekhelet — focus ring */
          'purple-bright': '#9B30FF',   /* Amikom Purple Bright — link on dark */
          'purple-light': '#f0d4f0',    /* Subtle purple bg */
          'purple-dim': 'rgba(112, 0, 112, 0.06)',
          'purple-glow': 'rgba(112, 0, 112, 0.12)',

          /* Secondary — Dekoratif saja */
          'jonquil': '#FFCC00',
          'jonquil-warm': '#FFAC00',
          'jonquil-vivid': '#FF7900',

          /* Surface */
          'canvas': '#ffffff',
          'parchment': '#f5f5f7',
          'pearl': '#fafafc',
          'tile-1': '#272729',
          'tile-2': '#2a2a2c',
          'tile-3': '#252527',
          'black': '#000000',
          'chip': 'rgba(210, 210, 215, 0.64)',

          /* Text */
          'ink': '#1d1d1f',
          'on-dark': '#ffffff',
          'muted': '#cccccc',
          'ink-muted-80': '#333333',
          'ink-muted-48': '#7a7a7a',

          /* Borders */
          'divider-soft': '#f0f0f0',
          'hairline': '#e0e0e0',

          /* Semantic (dashboard) */
          'danger': '#ef4444',
          'danger-bg': '#fef2f2',
          'warning': '#f59e0b',
          'warning-bg': '#fffbeb',
          'success': '#22c55e',
          'success-bg': '#f0fdf4',
        },
      },
      borderRadius: {
        'xs': '5px',
        'sm': '8px',
        'md': '11px',
        'lg': '18px',
        'pill': '9999px',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'press': 'press 0.1s ease-out both',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'press': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.95)' },
        },
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'product': '0 3px 5px 30px rgba(0, 0, 0, 0.22)',  /* Satu-satunya shadow pada product render */
      },
      spacing: {
        'section': '80px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
