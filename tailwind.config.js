/** @type {import('tailwindcss').Config} */
// Brand values mirror the tokens in src/styles.css :root — keep them in sync.
const warmGray = {
  50: '#FBF7F0',
  100: '#F4EEE4',
  200: '#E9E1D4',
  300: '#DAD0C1',
  400: '#A8A195',
  500: '#5F655C',
  600: '#4A5048',
  700: '#343B35',
  800: '#252D27',
  900: '#1E2620',
  950: '#141A16',
};


// Tailwind's stock hues are remapped onto the warm palette so existing
// utility classes (text-blue-500, bg-red-100 …) follow the new look.
const clayScale = { 50: '#FBF0E9', 100: '#F6E0D3', 200: '#EEC3AC', 300: '#E19C7B', 400: '#CF6D45', 500: '#B4461E', 600: '#A23E1A', 700: '#963817', 800: '#7A2D12', 900: '#5E230E', 950: '#3B1609' };
const pineScale = { 50: '#EEF4F0', 100: '#DCE8E0', 200: '#B9D1C2', 300: '#8FB49E', 400: '#5E8C73', 500: '#2F6450', 600: '#1F4A3A', 700: '#163829', 800: '#102A1F', 900: '#0B1D15', 950: '#06110C' };
const successScale = { 50: '#EEF5EF', 100: '#DCEBDF', 200: '#BCD9C3', 300: '#A9CDB3', 400: '#5E9C72', 500: '#2F7A4B', 600: '#2A6D43', 700: '#1F5A36', 800: '#18472B', 900: '#113520', 950: '#0A2014' };
const errorScale = { 50: '#FBEDEA', 100: '#F4DAD6', 200: '#EDC3BC', 300: '#E9B4AC', 400: '#D0645A', 500: '#B8433A', 600: '#A1322B', 700: '#7E2620', 800: '#651E1A', 900: '#4C1713', 950: '#300E0C' };
const harborScale = { 50: '#EEF3F8', 100: '#DCE7F0', 200: '#BCD0E2', 300: '#9AB7D1', 400: '#5B86AB', 500: '#2C5F8A', 600: '#28567D', 700: '#224B6E', 800: '#1B3C58', 900: '#142D42', 950: '#0D1D2B' };
const wheatScale = { 50: '#FBF4E2', 100: '#F4E6C6', 200: '#EBD49A', 300: '#E3C06E', 400: '#DDA846', 500: '#C98F2A', 600: '#9A6C14', 700: '#7E5810', 800: '#6E4C0E', 900: '#4F370A', 950: '#2F2106' };
const apricotScale = { 50: '#FEF4EC', 100: '#FCE7D8', 200: '#F9D0B4', 300: '#F6B48A', 400: '#F2955B', 500: '#E67A3C', 600: '#C9622A', 700: '#A14C1F', 800: '#7A3412', 900: '#5A260D', 950: '#381707' };

module.exports = {
  content: [
    "./src/**/*.{html,ts,js}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#FFFCF6',
        gray: warmGray,
        slate: warmGray,
        zinc: warmGray,
        neutral: warmGray,
        stone: warmGray,
        blue: harborScale,
        sky: harborScale,
        green: successScale,
        emerald: successScale,
        red: errorScale,
        rose: errorScale,
        teal: pineScale,
        cyan: pineScale,
        indigo: clayScale,
        purple: clayScale,
        violet: clayScale,
        yellow: wheatScale,
        amber: wheatScale,
        orange: apricotScale,
        pink: { 50: '#FBEFF4', 100: '#F6DDE8', 200: '#EDBBD1', 300: '#DE8FB1', 400: '#CB6693', 500: '#B8467A', 600: '#9E3865', 700: '#822D52', 800: '#652340', 900: '#4A1A2F', 950: '#2E101D' },
        oat: '#F7F2EA',
        cream: '#FFFCF6',
        linen: '#EFE7DA',
        ink: '#1E2620',
        clay: { DEFAULT: '#B4461E', hover: '#963817', soft: '#F6E0D3' },
        apricot: { DEFAULT: '#F2955B', soft: '#FCE7D8' },
        pine: { DEFAULT: '#1F4A3A', hover: '#163829', soft: '#DCE8E0' },
        primary: '#B4461E',
        'primary-dark': '#963817',
        secondary: '#1F4A3A',
        'secondary-dark': '#163829',
        'primary-strong': '#B4461E',
        'secondary-strong': '#1F4A3A',
      },
      fontFamily: {
        display: ['Literata', 'Georgia', 'serif'],
        heading: ['Onest', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['Onest', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'default': '14px',
      },
    },
  },
  plugins: [],
}
