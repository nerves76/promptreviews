// Calculate luminance of a color
function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

// Calculate contrast ratio between two hex colors
export function contrastRatio(hex1: string, hex2: string): number {
  function hexToRgb(hex: string) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex.split("").map((x) => x + x).join("");
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
  }
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Darken a hex color by a given amount (0-1)
export function darkenHexColor(hex: string, amount: number = 0.15): string {
  hex = hex.replace(/^#/, "");
  let num = parseInt(hex, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .toUpperCase()
  );
}

// Get a color with sufficient contrast against white
export function getAccessibleColor(hex: string, minContrast: number = 4.5): string {
  let color = hex;
  let tries = 0;
  while (contrastRatio(color, "#FFFFFF") < minContrast && tries < 10) {
    color = darkenHexColor(color, 0.15);
    tries++;
  }
  return color;
} 