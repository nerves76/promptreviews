/**
 * Optimized Font Configuration with next/font
 * 
 * This file defines the most commonly used fonts from the application
 * using Next.js font optimization for better Core Web Vitals
 */

import { Inter, Roboto, Open_Sans, Montserrat, Poppins, Lato } from 'next/font/google';

// Primary fonts (most commonly used)
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', 'arial']
});

export const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
  fallback: ['system-ui', 'arial']
});

export const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
  fallback: ['system-ui', 'arial']
});

export const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  fallback: ['system-ui', 'arial']
});

export const poppins = Poppins({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  fallback: ['system-ui', 'arial']
});

export const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lato',
  fallback: ['system-ui', 'arial']
});

// Export all font classes for easy CSS usage
export const fontVariables = [
  inter.variable,
  roboto.variable,
  openSans.variable,
  montserrat.variable,
  poppins.variable,
  lato.variable
].join(' ');

// Font mapping for dynamic usage
export const fontMap = {
  'Inter': inter.className,
  'Roboto': roboto.className,
  'Open Sans': openSans.className,
  'Montserrat': montserrat.className,
  'Poppins': poppins.className,
  'Lato': lato.className,
};

// Get optimized font class if available, fallback to original for Google Fonts loading
export function getOptimizedFontClass(fontName: string): string {
  return fontMap[fontName as keyof typeof fontMap] || '';
}