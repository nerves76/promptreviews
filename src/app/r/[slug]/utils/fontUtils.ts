/**
 * Font Utilities
 * 
 * Utilities for handling font class mappings and font-related functions.
 * Extracted from the main prompt page component for better organization.
 */

const fontClassMap: { [key: string]: string } = {
  "Inter": "font-inter",
  "Roboto": "font-roboto", 
  "Open Sans": "font-open-sans",
  "Lato": "font-lato",
  "Montserrat": "font-montserrat",
  "Poppins": "font-poppins",
  "Nunito": "font-nunito",
  "Source Sans Pro": "font-source-sans-pro",
  "Ubuntu": "font-ubuntu",
  "Raleway": "font-raleway",
  "Oswald": "font-oswald",
  "Merriweather": "font-merriweather",
  "Playfair Display": "font-playfair-display",
  "Lora": "font-lora",
  "PT Sans": "font-pt-sans",
  "Noto Sans": "font-noto-sans",
  "Fira Sans": "font-fira-sans",
  "Work Sans": "font-work-sans",
  "Roboto Slab": "font-roboto-slab",
  "Crimson Text": "font-crimson-text",
  "EB Garamond": "font-eb-garamond",
  "Libre Baskerville": "font-libre-baskerville",
  "Cormorant Garamond": "font-cormorant-garamond",
  "Vollkorn": "font-vollkorn",
  "Alegreya": "font-alegreya",
  "Spectral": "font-spectral",
  "Abril Fatface": "font-abril-fatface",
  "Dancing Script": "font-dancing-script",
  "Pacifico": "font-pacifico",
  "Lobster": "font-lobster",
  "Righteous": "font-righteous",
  "Fredoka One": "font-fredoka-one",
  "Bangers": "font-bangers",
  "Creepster": "font-creepster",
  "Orbitron": "font-orbitron",
  "Exo": "font-exo",
  "Rajdhani": "font-rajdhani",
  "Teko": "font-teko",
  "Russo One": "font-russo-one",
  "Bungee": "font-bungee",
  "Press Start 2P": "font-press-start-2p",
  "VT323": "font-vt323",
  "Courier New": "font-courier-new",
  "Lucida Console": "font-lucida-console",
  "Palatino": "font-palatino",
  "Garamond": "font-garamond",
};

export function getFontClass(fontName: string): string {
  return fontClassMap[fontName] || "";
} 