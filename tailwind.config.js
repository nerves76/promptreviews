/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/widget-embed/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "bg-white", "rounded-3xl", "flex", "flex-col", "items-center", "justify-center", "w-full", "max-w-4xl", "max-w-3xl", "max-w-6xl", "mx-auto", "px-2", "px-4", "px-8", "md:px-4", "md:px-6", "md:px-8", "md:px-16", "gap-4", "gap-6", "gap-15", "order-1", "order-2", "order-3", "sm:flex-row", "sm:order-none", "sm:gap-6", "sm:gap-15", "sm:absolute", "sm:left-0", "sm:top-1/2", "sm:-translate-y-1/2", "sm:-ml-16", "sm:right-0", "sm:-mr-16", "relative", "rounded-full", "rounded-3xl", "rounded-l-2xl", "border", "border-gray-200", "bg-white", "bg-gray-50", "bg-gray-100", "shadow", "transition", "z-10", "min-w-10", "min-h-10", "h-10", "w-10", "mb-2", "mt-1", "mt-4", "text-xs", "font-semibold", "text-gray-400", "text-gray-900", "text-center", "text-sm", "text-gray-500", "text-gray-600", "text-gray-700", "text-purple-700", "text-blue-700", "text-green-700", "text-indigo-600", "text-indigo-700", "text-slate-blue", "pr-widget-pagination", "pr-widget-photo-content", "pr-widget-photo-img", "pr-widget-photo-author"
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
        "slate-blue": "#2E4A7D", // Primary Dark
        indigo: "#3730A3", // Secondary Dark
        "lavender-haze": "#D8C8DC", // Primary Light
        "soft-peach": "#FFC8A2", // Accent Warm
        "pale-gold": "#F9E79F", // Accent Gold
        "sky-glass": "#89CFEF", // Secondary Light
        "light-glass": "#E7F6FF", // Secondary Light
        "pure-white": "#FFFFFF", // Neutral Light
        "charcoal-black": "#342D2D", // Neutral Dark
      },
    },
  },
  plugins: [],
};
