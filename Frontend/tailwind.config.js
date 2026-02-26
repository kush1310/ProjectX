/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'kiosk': '1440px',
        'tv': '1920px',
      },
      colors: {
        // CharusatNeeds brand colors - warm cream and vibrant orange
        cream: {
          50: "#FFFDF7",
          100: "#FFF9EB",
          200: "#FFF3D6",
          300: "#FFECC2",
          400: "#FFE5AD",
          500: "#FFDE99",
        },
        brand: {
          50: "#fef2f2", // red-50
          100: "#fee2e2", // red-100
          200: "#fecaca", // red-200
          300: "#fca5a5", // red-300
          400: "#f87171", // red-400
          500: "#ef4444", // red-500 (Primary)
          600: "#dc2626", // red-600
          700: "#b91c1c", // red-700
          800: "#991b1b", // red-800
          900: "#7f1d1d", // red-900
          950: "#450a0a", // red-950
        },
        canteen: {
          50: "#ecfdf5", // emerald-50
          100: "#d1fae5", // emerald-100
          200: "#a7f3d0", // emerald-200
          300: "#6ee7b7", // emerald-300
          400: "#34d399", // emerald-400
          500: "#10b981", // emerald-500 (Primary)
          600: "#059669", // emerald-600
          700: "#047857", // emerald-700
          800: "#065f46", // emerald-800
          900: "#064e3b", // emerald-900
          950: "#022c22", // emerald-950
        },
        dark: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
          950: "#09090B",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
        logo: ["Poppins", "system-ui", "sans-serif"],
      },
      animation: {
        // Basic animations
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "fade-in-down": "fadeInDown 0.6s ease-out forwards",
        "slide-in-left": "slideInLeft 0.6s ease-out forwards",
        "slide-in-right": "slideInRight 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        "bounce-subtle": "bounceSubtle 2s infinite",
        "pulse-glow": "pulseGlow 2s infinite",
        shimmer: "shimmer 2s infinite linear",

        // 3D Animations
        "rotate-3d": "rotate3d 8s linear infinite",
        "flip-in": "flipIn 0.8s ease-out forwards",
        swing: "swing 1s ease-out forwards",
        "float-3d": "float3d 6s ease-in-out infinite",
        tilt: "tilt 10s ease-in-out infinite",
        "perspective-shift": "perspectiveShift 8s ease-in-out infinite",

        // Logo animations
        "logo-bounce":
          "logoBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "logo-glow": "logoGlow 3s ease-in-out infinite",
        "letter-pop":
          "letterPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",

        // Preloader animations
        "spin-slow": "spin 3s linear infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "preloader-bar": "preloaderBar 2s ease-in-out infinite",
        "preloader-dot": "preloaderDot 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-50px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(50px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(249, 115, 22, 0.5)" },
          "50%": { boxShadow: "0 0 30px 10px rgba(249, 115, 22, 0.2)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },

        // 3D Keyframes
        rotate3d: {
          "0%": { transform: "perspective(1000px) rotateY(0deg)" },
          "100%": { transform: "perspective(1000px) rotateY(360deg)" },
        },
        flipIn: {
          "0%": {
            opacity: "0",
            transform: "perspective(1000px) rotateX(-90deg)",
          },
          "100%": {
            opacity: "1",
            transform: "perspective(1000px) rotateX(0deg)",
          },
        },
        swing: {
          "0%": { transform: "perspective(1000px) rotateX(0deg)" },
          "20%": { transform: "perspective(1000px) rotateX(15deg)" },
          "40%": { transform: "perspective(1000px) rotateX(-10deg)" },
          "60%": { transform: "perspective(1000px) rotateX(5deg)" },
          "80%": { transform: "perspective(1000px) rotateX(-5deg)" },
          "100%": { transform: "perspective(1000px) rotateX(0deg)" },
        },
        float3d: {
          "0%, 100%": {
            transform:
              "perspective(1000px) translateY(0) rotateX(0deg) rotateY(0deg)",
          },
          "25%": {
            transform:
              "perspective(1000px) translateY(-10px) rotateX(2deg) rotateY(2deg)",
          },
          "50%": {
            transform:
              "perspective(1000px) translateY(-5px) rotateX(0deg) rotateY(-2deg)",
          },
          "75%": {
            transform:
              "perspective(1000px) translateY(-15px) rotateX(-2deg) rotateY(1deg)",
          },
        },
        tilt: {
          "0%, 100%": {
            transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
          },
          "25%": {
            transform: "perspective(1000px) rotateX(3deg) rotateY(3deg)",
          },
          "50%": {
            transform: "perspective(1000px) rotateX(-3deg) rotateY(-3deg)",
          },
          "75%": {
            transform: "perspective(1000px) rotateX(2deg) rotateY(-2deg)",
          },
        },
        perspectiveShift: {
          "0%, 100%": { transform: "perspective(1000px) translateZ(0)" },
          "50%": { transform: "perspective(1000px) translateZ(20px)" },
        },

        // Logo keyframes
        logoBounce: {
          "0%": { opacity: "0", transform: "scale(0.3) translateY(50px)" },
          "50%": { transform: "scale(1.05) translateY(-10px)" },
          "70%": { transform: "scale(0.95) translateY(5px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        logoGlow: {
          "0%, 100%": {
            textShadow:
              "0 0 20px rgba(249, 115, 22, 0.3), 0 0 40px rgba(249, 115, 22, 0.1)",
          },
          "50%": {
            textShadow:
              "0 0 40px rgba(249, 115, 22, 0.5), 0 0 80px rgba(249, 115, 22, 0.2)",
          },
        },
        letterPop: {
          "0%": { opacity: "0", transform: "scale(0) translateY(20px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },

        // Preloader keyframes
        preloaderBar: {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(100%)" },
        },
        preloaderDot: {
          "0%, 100%": { transform: "scale(0.8)", opacity: "0.5" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
        },
      },
      boxShadow: {
        "glow-brand": "0 0 20px rgba(249, 115, 22, 0.3)",
        "glow-brand-lg": "0 0 40px rgba(249, 115, 22, 0.4)",
        "glow-brand-xl": "0 0 60px rgba(249, 115, 22, 0.5)",
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        "soft-lg": "0 10px 40px -10px rgba(0, 0, 0, 0.1)",
        "soft-xl": "0 20px 60px -15px rgba(0, 0, 0, 0.12)",
        "3d": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        "3d-lg": "0 35px 60px -15px rgba(0, 0, 0, 0.3)",
        "inner-glow": "inset 0 0 20px rgba(249, 115, 22, 0.1)",
      },
      backdropBlur: {
        xs: "2px",
      },
      perspective: {
        500: "500px",
        1000: "1000px",
        2000: "2000px",
      },
      transformStyle: {
        "3d": "preserve-3d",
        flat: "flat",
      },
      backfaceVisibility: {
        visible: "visible",
        hidden: "hidden",
      },
    },
  },
  plugins: [
    // Custom plugin for 3D transforms
    function ({ addUtilities }) {
      addUtilities({
        ".preserve-3d": {
          "transform-style": "preserve-3d",
        },
        ".backface-hidden": {
          "backface-visibility": "hidden",
        },
        ".perspective-500": {
          perspective: "500px",
        },
        ".perspective-1000": {
          perspective: "1000px",
        },
        ".perspective-2000": {
          perspective: "2000px",
        },
        ".rotate-y-180": {
          transform: "rotateY(180deg)",
        },
        ".rotate-x-180": {
          transform: "rotateX(180deg)",
        },
        ".translate-z-10": {
          transform: "translateZ(10px)",
        },
        ".translate-z-20": {
          transform: "translateZ(20px)",
        },
        ".translate-z-50": {
          transform: "translateZ(50px)",
        },
        ".gpu-accelerate": {
          transform: "translateZ(0)",
          "will-change": "transform",
        },
      });
    },
  ],
};
