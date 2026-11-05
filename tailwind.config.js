/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', ' Cambria', 'serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        sci: {
          bg: '#F8FAFC',
          paper: '#FFFFFF',
          panel: '#F1F5F9',
          border: '#E2E8F0',
          borderStrong: '#CBD5E1',
          ink: '#0F172A',
          slate: '#334155',
          muted: '#64748B',
          blue: '#1E40AF',
          blueLight: '#DBEAFE',
          blueAccent: '#2563EB',
          teal: '#0F766E',
          tealLight: '#CCFBF1',
          tealAccent: '#0D9488',
          amber: '#B45309',
          amberLight: '#FEF3C7',
          crimson: '#9F1239',
          crimsonLight: '#FFE4E6',
          indigo: '#4338CA',
          indigoLight: '#E0E7FF',
        }
      }
    },
  },
  plugins: [],
}
