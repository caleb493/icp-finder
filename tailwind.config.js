/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        yellow: '#DCE11F',
        offwhite: '#F5F5F0',
        teal: '#00A78B',
        midgrey: '#555555',
        bubble: '#141414'
      },
      fontFamily: {
        heading: ['"Inter"', '"Arial Black"', 'sans-serif'],
        body: ['"Inter"', '"Arial"', 'sans-serif']
      }
    }
  },
  plugins: []
}
