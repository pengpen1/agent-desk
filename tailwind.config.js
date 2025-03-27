/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  safelist: [
    'bg-red-500',
    'bg-yellow-500',
    'bg-green-500',
    'dark:bg-gray-700',
    'dark:bg-gray-800',
    'dark:bg-gray-900',
  ],
  plugins: [],
}
