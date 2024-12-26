/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        secondary: '#E38E49',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
} 