/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base:    '#08090E',
        surface: '#0F1119',
        card:    '#161A26',
        rowh:    '#1C2033',
        wire:    '#20253A',
        wire2:   '#2A3050',
        gold:    '#D4A843',
        'gold-dk': '#8A6E2A',
        'gold-lt': '#F0CC80',
        up:      '#3ECC91',
        dn:      '#E05555',
        caution: '#F5C055',
        ink:     '#EDE8DC',
        ink2:    '#7E8499',
        ink3:    '#3E4358',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
        body:    ['"Karla"', 'sans-serif'],
      },
      keyframes: {
        'bar-fill': {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--fill-w)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'bar-fill': 'bar-fill 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-up':  'fade-up 0.4s ease forwards',
        'fade-in':  'fade-in 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}
