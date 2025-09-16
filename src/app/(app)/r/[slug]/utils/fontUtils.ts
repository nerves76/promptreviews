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

// Font loading cache to prevent duplicate loading
const loadedFonts = new Set<string>();

/**
 * Dynamically load a Google Font
 * @param fontName - The name of the font to load
 * @returns Promise that resolves when font is loaded
 */
export async function loadGoogleFont(fontName: string): Promise<void> {
  // Skip if already loaded
  if (loadedFonts.has(fontName)) {
    return;
  }

  // Map font names to Google Fonts URLs
  const fontUrlMap: { [key: string]: string } = {
    "Roboto": "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
    "Open Sans": "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap",
    "Montserrat": "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap",
    "Poppins": "https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap",
    "Lato": "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
    "Nunito": "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap",
    "Source Sans Pro": "https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;700&display=swap",
    "Ubuntu": "https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap",
    "Raleway": "https://fonts.googleapis.com/css2?family=Raleway:wght@400;700&display=swap",
    "Oswald": "https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap",
    "Merriweather": "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
    "Playfair Display": "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap",
    "Lora": "https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap",
    "PT Sans": "https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap",
    "Noto Sans": "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap",
    "Fira Sans": "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;700&display=swap",
    "Work Sans": "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;700&display=swap",
    "Roboto Slab": "https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap",
    "Crimson Text": "https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&display=swap",
    "EB Garamond": "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;700&display=swap",
    "Libre Baskerville": "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap",
    "Cormorant Garamond": "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&display=swap",
    "Vollkorn": "https://fonts.googleapis.com/css2?family=Vollkorn:wght@400;700&display=swap",
    "Alegreya": "https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&display=swap",
    "Spectral": "https://fonts.googleapis.com/css2?family=Spectral:wght@400;700&display=swap",
    "Abril Fatface": "https://fonts.googleapis.com/css2?family=Abril+Fatface:wght@400&display=swap",
    "Dancing Script": "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap",
    "Pacifico": "https://fonts.googleapis.com/css2?family=Pacifico:wght@400&display=swap",
    "Lobster": "https://fonts.googleapis.com/css2?family=Lobster:wght@400&display=swap",
    "Righteous": "https://fonts.googleapis.com/css2?family=Righteous:wght@400&display=swap",
    "Fredoka One": "https://fonts.googleapis.com/css2?family=Fredoka+One:wght@400&display=swap",
    "Bangers": "https://fonts.googleapis.com/css2?family=Bangers:wght@400&display=swap",
    "Creepster": "https://fonts.googleapis.com/css2?family=Creepster:wght@400&display=swap",
    "Orbitron": "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap",
    "Exo": "https://fonts.googleapis.com/css2?family=Exo:wght@400;700&display=swap",
    "Rajdhani": "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;700&display=swap",
    "Teko": "https://fonts.googleapis.com/css2?family=Teko:wght@400;700&display=swap",
    "Russo One": "https://fonts.googleapis.com/css2?family=Russo+One:wght@400&display=swap",
    "Bungee": "https://fonts.googleapis.com/css2?family=Bungee:wght@400&display=swap",
    "Press Start 2P": "https://fonts.googleapis.com/css2?family=Press+Start+2P:wght@400&display=swap",
    "VT323": "https://fonts.googleapis.com/css2?family=VT323:wght@400&display=swap",
  };

  const fontUrl = fontUrlMap[fontName];
  if (!fontUrl) {
    console.warn(`Font ${fontName} not found in URL map`);
    return;
  }

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`link[href="${fontUrl}"]`)) {
      loadedFonts.add(fontName);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    link.onload = () => {
      loadedFonts.add(fontName);
      resolve();
    };
    link.onerror = () => {
      console.error(`Failed to load font: ${fontName}`);
      reject(new Error(`Failed to load font: ${fontName}`));
    };
    document.head.appendChild(link);
  });
}

export function getFontClass(fontName: string): string {
  return fontClassMap[fontName] || "";
} 