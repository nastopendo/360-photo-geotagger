import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#080D14',
        surface: '#0D1523',
        panel: '#132030',
        hover: '#192B3E',
        sky: {
          DEFAULT: '#4490F5',
          light: '#5BA3FF',
        },
        match: '#1ECC9D',
        caution: '#E8971F',
        cut: '#E84464',
        ink: {
          DEFAULT: '#C5DAF0',
          soft: '#7A9EC0',
          mute: '#3B5370',
        },
        line: {
          DEFAULT: '#1C2B3E',
          soft: '#243C58',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
