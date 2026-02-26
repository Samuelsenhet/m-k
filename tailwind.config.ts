import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        /* FAS 1 – semantic typography tokens (for later phases) */
        body: 'var(--font-body)',
        heading: 'var(--font-heading)',
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '1.2' }],
        headline: ['1.875rem', { lineHeight: '1.25' }],
        title: ['1.5rem', { lineHeight: '1.3' }],
        body: ['1rem', { lineHeight: '1.5' }],
        label: ['0.875rem', { lineHeight: '1.4' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
          /* MÄÄK design system scale */
          50: "#F0F7F4",
          100: "#D9EDE4",
          200: "#B5DBC9",
          300: "#8AC4A9",
          400: "#5FA886",
          500: "#4B6E48",
          600: "#3D5A3B",
          700: "#2F472E",
          800: "#253D2C",
          900: "#1A2D1E",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--surface-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        personality: {
          diplomat: "hsl(var(--diplomat))",
          strateger: "hsl(var(--strateger))",
          byggare: "hsl(var(--byggare))",
          upptackare: "hsl(var(--upptackare))",
          debattoren: "hsl(var(--debattoren))",
          vardaren: "hsl(var(--vardaren))",
        },
        dimension: {
          ei: "hsl(var(--dimension-ei))",
          sn: "hsl(var(--dimension-sn))",
          tf: "hsl(var(--dimension-tf))",
          jp: "hsl(var(--dimension-jp))",
          at: "hsl(var(--dimension-at))",
        },
        /* FAS 1 – design palette + MÄÄK full scales */
        coral: {
          DEFAULT: "#F97068",
          50: "#FFF5F3",
          100: "#FFE8E4",
          200: "#FFD4CC",
          300: "#FFB5A8",
          400: "#FF9080",
          500: "#F97068",
          600: "#E85550",
          700: "#C9403B",
          800: "#A63330",
          900: "#872928",
        },
        sage: {
          DEFAULT: "#B2AC88",
          50: "#FDFCFA",
          100: "#F8F6F1",
          200: "#F0EDE4",
          300: "#E4DED0",
          400: "#D1C8B5",
          500: "#B2AC88",
          600: "#968F6B",
          700: "#787254",
          800: "#5A5640",
          900: "#3D3B2C",
        },
        cream: "hsl(var(--color-cream))",
        "warm-dark": "hsl(var(--color-dark))",
        /* MÄÄK neutral scale (for text/surfaces) */
        maak: {
          white: "#FFFFFF",
          offWhite: "#FAFAF8",
          cream: "#F5F4F1",
          sand: "#ECEAE5",
          stone: "#D4D1CA",
          gray: "#9A9790",
          slate: "#6B6860",
          charcoal: "#3D3B36",
          dark: "#1F1E1B",
        },
      },
      /* FAS 1: radius scale in CSS (--radius-sm … --radius-full); Tailwind keeps current mapping for no regression */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        "elevation-1": "var(--elevation-1)",
        "elevation-2": "var(--elevation-2)",
        "elevation-3": "var(--elevation-3)",
        "elevation-glow-primary": "var(--elevation-glow-primary)",
        "elevation-glow-accent": "var(--elevation-glow-accent)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        emphasized: "var(--ease-emphasized)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "progress-fill": {
          from: { width: "0%" },
          to: { width: "var(--progress-width)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "progress-fill": "progress-fill 1s ease-out forwards",
      },
    },
  },
  plugins: [animatePlugin],
} satisfies Config;
