import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        /* Eucalyptus & Oat design system — bg-ds-page, text-ds-base, etc. Overridable per-tenant via CSS vars. */
        ds: {
          page: "var(--ds-page)",
          tint: "var(--ds-tint)",
          soft: "var(--ds-soft)",
          mid: "var(--ds-mid)",
          deep: "var(--ds-deep)",
          "deep-hover": "var(--ds-deep-hover)",
          base: "var(--ds-base)",
          dark: "var(--ds-dark)",
          mint: "var(--ds-mint)",
          danger: "var(--ds-danger)",
          online: "var(--ds-online)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
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
        /* Data-viz palette — categorical bands, sequential severity (clay), diverging delta */
        viz: {
          low: "var(--viz-low)",
          moderate: "var(--viz-moderate)",
          high: "var(--viz-high)",
          sev1: "var(--viz-sev-1)",
          sev2: "var(--viz-sev-2)",
          sev3: "var(--viz-sev-3)",
          sev4: "var(--viz-sev-4)",
          sev5: "var(--viz-sev-5)",
          up: "var(--viz-up)",
          down: "var(--viz-down)",
          flat: "var(--viz-flat)",
        },
        /* Mood tiers — ordered diverging ramp, always shipped with a text label */
        tier: {
          thriving: "var(--tier-thriving)",
          steady: "var(--tier-steady)",
          strained: "var(--tier-strained)",
          struggling: "var(--tier-struggling)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "18px",
      },
      boxShadow: {
        card: "0 14px 32px -22px rgba(44,58,48,.22)",
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
