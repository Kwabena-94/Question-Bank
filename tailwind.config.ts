import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand primaries
        primary: {
          DEFAULT: "#9E0E27",
          hover: "#7D0B1F",
          light: "#FDF2F4",
        },
        accent: {
          DEFAULT: "#FE7406",
          hover: "#E56805",
          light: "#FFF4EB",
        },
        // Sub-brand (label/badge use only — not UI surfaces)
        nursing: { DEFAULT: "#2E7D32", light: "rgba(46,125,50,0.1)" },
        pharmacy: { DEFAULT: "#145A79", light: "#F9B4C7" },
        // Neutrals
        neutral: {
          900: "#1A1A1A",
          700: "#4A4A4A",
          500: "#8A8A8A",
          300: "#D4D4D4",
          100: "#F4F2EF", // page background
          0: "#FFFFFF",
        },
        // Semantic
        success: "#2E7D32",
        warning: "#F9A825",
        error: "#C62828",
        info: "#145A79",
        // shadcn/ui token aliases
        background: "#F4F2EF",
        foreground: "#1A1A1A",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
        },
        border: "#D4D4D4",
        input: "#D4D4D4",
        ring: "#9E0E27",
        muted: {
          DEFAULT: "#F4F2EF",
          foreground: "#4A4A4A",
        },
        secondary: {
          DEFAULT: "#F4F2EF",
          foreground: "#1A1A1A",
        },
        destructive: {
          DEFAULT: "#C62828",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "system-ui", "sans-serif"],
        manrope: ["Manrope", "system-ui", "sans-serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.4" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.6" }],
        lg: ["20px", { lineHeight: "1.4" }],
        xl: ["22px", { lineHeight: "1.4" }],
        "2xl": ["28px", { lineHeight: "1.3" }],
        "3xl": ["36px", { lineHeight: "1.2" }],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        xl: "12px",
        "2xl": "16px",
        full: "9999px",
        lg: "12px", // shadcn alias
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "24px",
        6: "32px",
        8: "48px",
        10: "64px",
        12: "80px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.10)",
        modal: "0 8px 32px rgba(0,0,0,0.12)",
      },
      letterSpacing: {
        tight: "-0.03em",
        snug: "-0.01em",
        wide: "0.02em",
        wider: "0.05em",
      },
    },
  },
  plugins: [],
};

export default config;
