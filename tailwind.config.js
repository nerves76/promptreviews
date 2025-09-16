/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/widget-embed/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Backdrop filter and transparency classes for dropdowns and glassmorphic elements
    "backdrop-blur-md", "backdrop-blur-sm", "backdrop-blur", "backdrop-filter",
    "bg-white/70", "bg-white/85", "bg-white/90", "bg-white/95", "border-white/30",
    "bg-white/10", "bg-white/20", "hover:bg-white/20", "hover:bg-white/30",
    // Dark glass effect classes for menus and dropdowns
    "bg-black/70", "bg-black/80", "bg-black/85", "bg-black/90", "bg-black/95",
    "bg-green-500/20", "bg-green-500/30", "hover:bg-green-500/30", "border-green-400/30",
    "text-white/90", "hover:text-white/90",
    "hover:bg-slate-blue/10", "hover:text-slate-blue", "focus:bg-slate-blue/10", "bg-slate-blue/10",
    // Layout and responsive classes for widgets
    "flex", "flex-col", "flex-row", "items-center", "items-stretch", "justify-center", "justify-between", "flex-1",
    "w-full", "w-2/5", "h-full", "h-[320px]", "sm:h-[320px]", "min-h-[180px]", "max-h-[320px]", "min-w-10", "min-h-10",
    "rounded-3xl", "rounded-full", "rounded-l-2xl", "border", "border-gray-200", "bg-white", "bg-gray-50", "bg-gray-100",
    "shadow", "transition", "z-10", "order-1", "order-2", "order-3", "sm:order-none", "sm:flex-row", "sm:gap-6", "sm:gap-15",
    "sm:absolute", "sm:left-0", "sm:top-1/2", "sm:right-0", "sm:-translate-y-1/2", "sm:-ml-16", "sm:-mr-16",
    "mx-auto", "mx-2", "px-0", "px-2", "px-4", "px-8", "md:px-0", "md:px-4", "md:px-6", "md:px-8", "md:px-16",
    "py-6", "h-10", "w-10", "mb-2", "mt-1", "mt-4", "mt-auto", "text-xs", "font-semibold", "text-gray-400", "text-gray-900",
    "text-center", "text-sm", "text-gray-500", "text-gray-600", "text-gray-700", "text-purple-700", "text-blue-700", "text-green-700",
    "text-indigo-600", "text-indigo-700", "text-slate-blue", "pr-widget-pagination",
    // Utility and spacing
    "gap-1", "gap-2", "gap-4", "gap-6", "gap-8", "gap-15", "sm:gap-6", "sm:gap-15",
    // Max widths
    "max-w-2xl", "max-w-3xl", "max-w-4xl", "max-w-5xl", "max-w-6xl",
    // Object fit
    "object-cover",
    // For Swiper and navigation
    "swiper-slide", "swiper-pagination-bullet", "swiper-pagination-bullet-active",
    // Any other classes used in widget JSX
    "overflow-hidden", "overflow-visible", "relative", "absolute",
    // Responsive visibility
    "md:hidden", "hidden", "hidden md:flex",
    'md:flex',
    'md:inline-flex',
    'inline-flex',
    'flex',
    'items-center',
    'justify-center',
    'gap-2',
    'mt-8',
    'mb-2',
    'w-full',
    'relative',
    'absolute',
    '-left-8',
    '-right-8',
    'top-1/2',
    '-translate-y-1/2',
    'z-10',
    'rounded-full',
    'border',
    'border-gray-200',
    'w-10',
    'h-10',
    'transition',
    'hover:bg-opacity-80',
    'active:scale-95',
    'focus:scale-95',
    'focus:outline-none',
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-[var(--pr-accent-color)]',
    'focus-visible:outline-offset-2'
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        "open-sans": ["Open Sans", "sans-serif"],
        lato: ["Lato", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        "source-sans": ["Source Sans 3", "sans-serif"],
        raleway: ["Raleway", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        playfair: ["Playfair Display", "serif"],
        merriweather: ["Merriweather", "serif"],
        "roboto-slab": ["Roboto Slab", "serif"],
        "pt-sans": ["PT Sans", "sans-serif"],
        oswald: ["Oswald", "sans-serif"],
        "roboto-condensed": ["Roboto Condensed", "sans-serif"],
        "source-serif": ["Source Serif 4", "serif"],
        "noto-sans": ["Noto Sans", "sans-serif"],
        ubuntu: ["Ubuntu", "sans-serif"],
        "work-sans": ["Work Sans", "sans-serif"],
        quicksand: ["Quicksand", "sans-serif"],
        "josefin-sans": ["Josefin Sans", "sans-serif"],
        mukta: ["Mukta", "sans-serif"],
        rubik: ["Rubik", "sans-serif"],
        "ibm-plex-sans": ["IBM Plex Sans", "sans-serif"],
        barlow: ["Barlow", "sans-serif"],
        mulish: ["Mulish", "sans-serif"],
        comfortaa: ["Comfortaa", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
        "plus-jakarta-sans": ["Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        "slate-blue": "#2E4A7D", // Primary slate blue used throughout the site
        indigo: "#3730A3", // Secondary Dark
        "lavender-haze": "#D8C8DC", // Primary Light
        "soft-peach": "#FFC8A2", // Accent Warm
        "pale-gold": "#F9E79F", // Accent Gold
        "sky-glass": "#89CFEF", // Secondary Light
        "light-glass": "#E7F6FF", // Secondary Light
        "pure-white": "#FFFFFF", // Neutral Light
        "charcoal-black": "#342D2D", // Neutral Dark
      },
      gap: {
        15: '3.75rem', // 60px
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
