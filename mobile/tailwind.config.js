/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#16A34A",
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
        },
        surface: "#FFFFFF",
        "surface-muted": "#F9FAFB",
        "surface-card": "#FFFFFF",
        border: "#E5E7EB",
        "text-primary": "#111827",
        "text-secondary": "#374151",
        "text-muted": "#6B7280",
        "text-faint": "#9CA3AF",
        accent: "#DCFCE7",
        warning: "#F59E0B",
        "warning-bg": "#FFFBEB",
        error: "#EF4444",
        overlay: "rgba(0,0,0,0.5)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        display: ["Inter", "system-ui"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      spacing: {
        "safe-bottom": "34px",
      },
    },
  },
  plugins: [],
};
