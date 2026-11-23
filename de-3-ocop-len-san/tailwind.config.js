/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: '#FAF8F5',
        surface: '#FFFFFF',
        ink: '#1C1917',
        muted: '#57534E',
        line: '#E7E5E4',
        brand: '#15803D',
        'brand-hover': '#166534',
        accent: '#B45309',
      },
    },
  },
  plugins: [],
};
