/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        'primary': '#1e1e2e',
        'secondary': '#2d2d44',
        'accent': '#a8e6cf',
        'accent-alt': '#7c3aed',
        'text': '#e0e0e0',
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
      },
    },
  },
  plugins: [],
}
