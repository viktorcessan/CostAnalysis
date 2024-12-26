/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        secondary: '#e66900',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
} 