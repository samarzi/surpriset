/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "sm": "640px",
        "md": "768px", 
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      // Централизованная система отступов
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px', 
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        // Touch targets
        'touch-min': '44px',
        'touch-comfortable': '48px',
        'touch-spacious': '56px',
      },
      
      // Централизованная система скругления
      borderRadius: {
        'none': '0px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      
      // Централизованная система теней
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
        // Темная тема
        'dark-xs': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'dark-sm': '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
        'dark-md': '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)',
        'dark-xl': '0 20px 25px rgba(0, 0, 0, 0.4), 0 10px 10px rgba(0, 0, 0, 0.2)',
        'dark-2xl': '0 25px 50px rgba(0, 0, 0, 0.5)',
        // Устаревшие (для совместимости)
        'elegant': '0 8px 30px rgb(0,0,0,0.04)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'dark-elegant': '0 8px 30px rgb(0,0,0,0.5)',
        'dark-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
      },
      
      // Централизованная система z-index
      zIndex: {
        'hide': '-1',
        'auto': 'auto',
        'base': '0',
        'docked': '10',
        'dropdown': '1000',
        'sticky': '1020',
        'banner': '1030',
        'overlay': '1040',
        'modal': '1050',
        'popover': '1060',
        'skipLink': '1070',
        'toast': '1080',
        'tooltip': '1090',
      },
      
      // Централизованная система максимальных ширин
      maxWidth: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1728px',
        '4xl': '1920px',
        'full': '100%',
        'screen': '100vw',
      },
      
      backdropBlur: {
        'glass': '12px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#C6FF00", // Neon Lime
          foreground: "#000000",
          50: "#F2FFD1",
          100: "#E6FFA3",
          200: "#CCFF66",
          300: "#B3FF33",
          400: "#9AFF00",
          500: "#85F000",
          600: "#6ED400",
          700: "#57AC00",
          800: "#407F00",
          900: "#294F00",
          950: "#162B00",
        },
        secondary: {
          DEFAULT: "#000000", // Pure Black
          foreground: "#FFFFFF",
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
          gold: "#F59E0B",
          green: "#10B981",
          purple: "#8B5CF6",
          violet: "#7C3AED",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Premium dark theme colors
        dark: {
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
          950: "#020617",
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #C6FF00 0%, #A8FF00 50%, #85F000 100%)',
        'brand-gradient-light': 'linear-gradient(135deg, #E6FFA3 0%, #C6FF00 50%, #A8FF00 100%)',
        'brand-gradient-dark': 'linear-gradient(135deg, #9AFF00 0%, #85F000 50%, #6ED400 100%)',
        'gradient-modern': 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)/0.3) 100%)',
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Manrope", "system-ui", "sans-serif"],
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(198, 255, 0, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(198, 255, 0, 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}