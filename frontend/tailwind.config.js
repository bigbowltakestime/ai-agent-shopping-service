/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'sm': '480px',
      },
      colors: {
        primary: {
          DEFAULT: '#646cff',
          hover: '#535bf2',
        },
        background: {
          light: '#ffffff',
          dark: '#242424',
        },
        text: {
          light: '#213547',
          dark: 'rgba(255, 255, 255, 0.87)',
        },
        button: {
          DEFAULT: '#1a1a1a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      lineHeight: {
        'heading': '1.1',
      },
    },
  },
  darkMode: 'class', // or 'media' if you want to use OS preference
  plugins: [],
}
