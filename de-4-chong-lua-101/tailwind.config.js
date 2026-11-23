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
        brand: '#DC2626',
        'brand-hover': '#B91C1C',
        accent: '#059669',
      },
    },
  },
  plugins: [],
};
