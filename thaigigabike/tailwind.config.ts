import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        green: { DEFAULT: '#22c55e', bright: '#4ade80', dark: '#15803d', dim: '#052e16' },
        orange: { DEFAULT: '#f97316', dim: '#431407' },
        red: { DEFAULT: '#ef4444', dim: '#450a0a' },
        surface: { DEFAULT: '#0f0f0f', 2: '#161616', 3: '#1c1c1c', 4: '#242424' },
        border: { DEFAULT: '#2a2a2a', 2: '#333' },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
}
export default config
