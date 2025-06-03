/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
