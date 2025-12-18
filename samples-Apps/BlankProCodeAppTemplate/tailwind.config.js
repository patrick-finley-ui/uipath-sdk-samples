/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'uipath': {
          orange: '#FA4616',
          'orange-light': '#FF6B3D',
          'orange-dark': '#E03D0F',
          'orange-subtle': '#FFF4F1',
        },
      },
    },
  },
  plugins: [],
}

