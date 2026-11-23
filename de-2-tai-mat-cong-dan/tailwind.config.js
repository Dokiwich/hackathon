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
        brand: '#0284C7',
        'brand-hover': '#0369A1',
        accent: '#0F172A',
      },
    },
  },
  plugins: [],
};
