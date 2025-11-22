import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Void Theme
        "deep-void": "#05050A",
        "void-grid": "#1A1A2E",
        "glass-panel": "#11111F",
        // Signals
        "holo-cyan": "#00F0FF",
        "simp-red": "#FF2A2A",
        "lust-pink": "#FF007F",
        "toxic-green": "#39FF14",
        "decay-rust": "#C27842",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
        display: ["var(--font-orbitron)", "sans-serif"],
      },
      backgroundImage: {
        "void-gradient": "radial-gradient(circle at center, #1A1A2E 0%, #05050A 100%)",
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};
export default config;
