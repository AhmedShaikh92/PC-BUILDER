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
      neutral: {
          50:  "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
          950: "var(--color-neutral-950)",
        },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
      },
    },
  },
  plugins: [],
}
