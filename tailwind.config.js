/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--primary)',
        'primary-40': 'var(--primary-40)',
        'secondary': 'var(--secondary)',
        'secondary-40': 'var(--secondary-40)',
        'tertiary': 'var(--tertiary)',
        'tertiary-40': 'var(--tertiary-40)',
        'background-dark': 'var(--background-dark)',
        'surface-dark': 'var(--surface-dark)',
        'on-surface': 'var(--on-surface)',
        'on-primary': 'var(--on-primary)',
        'green-win': 'var(--green-win)',
        'accent': 'var(--yellow-accent)',
      }
    },
  },
  plugins: [],
}