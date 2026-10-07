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
        // Deeper brand variants for text/fills — keep in sync with --primary-strong in styles.css
        'primary-strong': '#DE6458',
        'secondary-strong': '#2E9A92',
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
