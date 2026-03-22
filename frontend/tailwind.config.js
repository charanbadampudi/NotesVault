/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          bg:      '#0a0b0f',
          surface: '#12141a',
          card:    '#1a1d26',
          border:  '#252836',
          accent:  '#4f8aff',
          accent2: '#7c4dff',
          green:   '#00d68f',
          red:     '#ff4d6d',
          amber:   '#ffb300',
          text:    '#e8eaf0',
          muted:   '#6b7280',
          dimmed:  '#3a3f52',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      },
      keyframes: {
        slideUp: { from:{ transform:'translateY(8px)', opacity:'0' }, to:{ transform:'translateY(0)', opacity:'1' } },
        fadeIn:  { from:{ opacity:'0' }, to:{ opacity:'1' } },
      },
      animation: {
        slideUp: 'slideUp 0.25s ease',
        fadeIn:  'fadeIn 0.2s ease',
      },
    },
  },
  plugins: [],
};
