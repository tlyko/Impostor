/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        discord: {
          bg: '#36393f',
          sidebar: '#2f3136',
          element: '#202225',
          accent: '#7289da',
          green: '#43b581',
          red: '#f04747',
          gray: '#b9bbbe'
        }
      }
    },
  },
  plugins: [],
};
