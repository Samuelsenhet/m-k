import type { Config } from "tailwindcss";

/** Hex aligned with packages/core/src/tokens.ts (maakTokens) */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        maak: {
          bg: "#F2F0EF",
          foreground: "#253D2C",
          card: "#FAF9F8",
          muted: "#EBEAE8",
          "muted-fg": "#6B6B6B",
          primary: "#4B6E48",
          "primary-mid": "#5FA886",
          coral: "#F97068",
          sage: "#B2AC88",
          cream: "#F5F4F1",
          border: "#E8E4E0",
        },
      },
      fontFamily: {
        // System font stack — noll nätverks-lastning, noll FOUT/FOIT,
        // noll main-thread parse. Macos → SF Pro, iOS → SF, Win → Segoe UI,
        // Android → Roboto. Alla är redan renderade vid page load.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          '"Open Sans"',
          '"Helvetica Neue"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
