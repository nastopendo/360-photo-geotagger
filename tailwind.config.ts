import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        confidence: {
          high: '#16a34a',
          medium: '#d97706',
          low: '#dc2626',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
