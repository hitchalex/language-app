/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'duo-blue': '#1CB0F6',
        'duo-blue-dark': '#1899D6',
        'duo-bg': '#F7F9FC',
        'duo-card': '#FFFFFF',
        'duo-text': '#3C3C3C',
        'duo-gray': '#AFAFAF',
        'accent-purple': '#A855F7',
        'accent-pink': '#EC4899',
        'accent-orange': '#FF8C42',
        'accent-green': '#22C55E',
        'accent-teal': '#14B8A6',
        'accent-yellow': '#FBBF24',
        'accent-indigo': '#6366F1',
      },
      borderRadius: {
        'duo': '16px',
        'duo-lg': '24px',
      },
    },
  },
  plugins: [],
}