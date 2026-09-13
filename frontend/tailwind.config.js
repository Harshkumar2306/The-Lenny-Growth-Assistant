/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lenny: {
          50: '#fbf7ee',
          100: '#f5edd8',
          200: '#ebd7af',
          300: '#dfbc80',
          400: '#d5a156',
          500: '#cb8637',
          600: '#bd6e2d',
          700: '#9d5427',
          800: '#7f4426',
          900: '#673922',
        },
        // Intermediate stone steps referenced across the UI but not in
        // Tailwind's default palette.
        stone: {
          750: '#242120',
          850: '#1c1917',
        },
      },
      spacing: {
        '13': '3.25rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.4)',
      },
    },
  },
  plugins: [],
};
