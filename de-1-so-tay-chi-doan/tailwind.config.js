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
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        ink: '#0F172A',
        muted: '#475569',
        line: '#CBD5E1',
        brand: '#0066B3',
        'brand-hover': '#005291',
        accent: '#0F766E',
        'navy-950': '#071324',
        'navy-900': '#0C1D36',
        'navy-800': '#142B4D',
        'navy-700': '#22416E',
      },
    },
  },
  plugins: [],
};
