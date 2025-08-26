/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Waymo-inspired color palette
        waymo: {
          // Primary blues
          primary: "#1a1a2e",
          "primary-light": "#16213e",
          "primary-dark": "#0f0f23",

          // Secondary orange/amber
          secondary: "#ff6b35",
          "secondary-light": "#ff8c42",
          "secondary-dark": "#e55a2b",

          // Accent teal/cyan
          accent: "#0ea5e9",
          "accent-light": "#06b6d4",
          "accent-dark": "#0284a8",

          // Success green
          success: "#10b981",
          "success-light": "#34d399",
          "success-dark": "#059669",

          // Warning amber
          warning: "#f59e0b",
          "warning-light": "#fbbf24",
          "warning-dark": "#d97706",

          // Danger red
          danger: "#ef4444",
          "danger-light": "#f87171",
          "danger-dark": "#dc2626",

          // Neutral grays
          neutral: {
            50: "#f8fafc",
            100: "#f1f5f9",
            200: "#e2e8f0",
            300: "#cbd5e1",
            400: "#94a3b8",
            500: "#64748b",
            600: "#475569",
            700: "#334155",
            800: "#1e293b",
            900: "#0f172a",
          },
        },
      },
    },
  },
  plugins: [],
}
