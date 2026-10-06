/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,js}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        'primary-dark': '#E85555',
        secondary: '#4ECDC4',
        'secondary-dark': '#3DBDB4',
        // Text-safe variants (WCAG AA with white) — see --primary-strong in styles.css
        'primary-strong': '#D93A3A',
        'secondary-strong': '#247F79',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'default': '12px',
      },
    },
  },
  plugins: [],
}
