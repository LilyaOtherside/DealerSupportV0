/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'tg-theme-bg': '#0F0F0F',
        'tg-theme-section': '#1C1C1C',
        'tg-theme-button': '#2C2C2C',
        'tg-theme-hint': '#6B7280',
      },
    },
  },
  plugins: [],
} 