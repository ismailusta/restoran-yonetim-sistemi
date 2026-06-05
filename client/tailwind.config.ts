import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-dm-serif)', 'Georgia', 'serif'],
      },
      colors: {
        ink: '#0a0a0a',
        stone: '#f5f5f4',
        accent: '#16a34a',
      },
    },
  },
  plugins: [],
};

export default config;
