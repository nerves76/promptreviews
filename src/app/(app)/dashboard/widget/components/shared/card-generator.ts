// This file will contain the canonical function for generating review card HTML.
// It will be used by both the dashboard preview and the live embeddable widget
// to ensure that the output is always identical.

// TypeScript interfaces for type safety
interface Review {
  first_name: string;
  last_name: string;
  review_content: string;
  star_rating: number;
  created_at: string;
  reviewer_role?: string;
  platform?: string;
}

interface Design {
  bgColor?: string;
  textColor?: string;
  nameTextColor?: string;
  roleTextColor?: string;
  accentColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderOpacity?: number;
  bgOpacity?: number;
  font?: string;
  border?: boolean;
  shadow?: boolean;
  shadowColor?: string;
  shadowIntensity?: number;
  showQuotes?: boolean;
  quoteSize?: number;
  showRelativeDate?: boolean;
  showPlatform?: boolean;
  glassmorphism?: boolean;
  backdropBlur?: number;
}

// TODO: Move the createReviewCard function here. 

// These utility functions are dependencies for createReviewCard
/**
 * Renders star rating HTML for a given rating value.
 * @param rating - The number of stars to fill (typically 0-5)
 * @returns HTML string of star elements
 */
function renderStars(rating: number) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star${i <= rating ? ' filled' : ''}" style="color: ${i <= rating ? '#ffc107' : '#e0e0e0'}; font-size: 1.2rem;">&#9733;</span>`;
  }
  return stars;
}

/**
 * Converts a date string to a relative time string (e.g., "2 hours ago").
 * @param dateString - The date string to convert
 * @returns A relative time string
 */
function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44);
  const years = Math.round(days / 365.25);

  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Determines if a hex color is dark.
 * @param hexColor - The hex color string (e.g., '#ffffff')
 * @returns True if the color is dark, false otherwise
 */
function isColorDark(hexColor: string) {
  if (!hexColor || hexColor.length < 4) return false;
  let color = (hexColor.charAt(0) === '#') ? hexColor.substring(1) : hexColor;
  if (color.length === 3) {
    color = color.split('').map(char => char + char).join('');
  }
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return hsp < 127.5;
}

// Canonical function for generating a review card.
export function createReviewCardHTML(review: Review, design: Design) {
  const bgColor = design.bgColor || '#ffffff';
  let textColor = design.textColor || '#22223b';
  if (isColorDark(bgColor)) {
    textColor = '#ffffff';
  }
  
  const nameColor = design.nameTextColor || textColor;
  const roleColor = design.roleTextColor || textColor;
  const accentColor = design.accentColor || '#4f46e5';
  const borderRadius = design.borderRadius || 16;
  const borderWidth = design.borderWidth || 2;
  const borderColor = design.borderColor || '#cccccc';
  const borderOpacity = design.borderOpacity !== undefined ? design.borderOpacity : 1;
  const bgOpacity = design.bgOpacity !== undefined ? design.bgOpacity : 1;
  const font = design.font || 'Inter';
  const quoteSize = design.quoteSize || 1.5; // Default quote size in rem
  
  // Card style without height: 100%
  let cardStyle = `
    border-radius: ${borderRadius}px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    font-family: ${font}, sans-serif;
  `;
  
  // Convert hex color to rgba with opacity if needed
  let backgroundColorWithOpacity = bgColor;
  if (bgOpacity < 1 && bgColor.startsWith('#')) {
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    backgroundColorWithOpacity = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;
  }
  
  // Convert border color to rgba with opacity if needed
  let borderColorWithOpacity = borderColor;
  if (borderOpacity < 1 && borderColor.startsWith('#')) {
    const r = parseInt(borderColor.slice(1, 3), 16);
    const g = parseInt(borderColor.slice(3, 5), 16);
    const b = parseInt(borderColor.slice(5, 7), 16);
    borderColorWithOpacity = `rgba(${r}, ${g}, ${b}, ${borderOpacity})`;
  }
  
  // Apply backdrop blur and styles
  const backdropBlur = design.backdropBlur || 10;
  
  cardStyle += `
    background-color: ${backgroundColorWithOpacity};
    backdrop-filter: blur(${backdropBlur}px);
    -webkit-backdrop-filter: blur(${backdropBlur}px);
    color: ${textColor};
  `;
  
  // Apply border settings
  if (design.border === true) {
    cardStyle += `border: ${borderWidth}px solid ${borderColorWithOpacity};`;
  } else {
    cardStyle += `border: none;`;
  }
  
  // Handle both outer shadow and inner shadow
  let shadows = [];
  
  if (design.shadow) {
    const shadowColor = design.shadowColor || '#222222';
    const shadowIntensity = design.shadowIntensity || 0.2;
    
    // Convert hex shadow color to rgba
    let shadowRgba = `rgba(0, 0, 0, ${shadowIntensity})`;
    if (shadowColor.startsWith('#')) {
      const r = parseInt(shadowColor.slice(1, 3), 16);
      const g = parseInt(shadowColor.slice(3, 5), 16);
      const b = parseInt(shadowColor.slice(5, 7), 16);
      shadowRgba = `rgba(${r}, ${g}, ${b}, ${shadowIntensity})`;
    }
    
    shadows.push(`0 4px 6px -1px ${shadowRgba}`);
  }
  
  // Add inner shadow for frosty glass effect
  if (design.innerShadow) {
    const innerShadowColor = design.innerShadowColor || '#FFFFFF';
    const innerShadowOpacity = design.innerShadowOpacity || 0.5;
    
    // Convert hex to rgba for inner shadow
    let innerShadowRgba = `rgba(255, 255, 255, ${innerShadowOpacity})`;
    if (innerShadowColor.startsWith('#')) {
      const r = parseInt(innerShadowColor.slice(1, 3), 16);
      const g = parseInt(innerShadowColor.slice(3, 5), 16);
      const b = parseInt(innerShadowColor.slice(5, 7), 16);
      innerShadowRgba = `rgba(${r}, ${g}, ${b}, ${innerShadowOpacity})`;
    }
    
    shadows.push(`inset 0 1px 3px ${innerShadowRgba}`);
  }
  
  if (shadows.length > 0) {
    cardStyle += `box-shadow: ${shadows.join(', ')};`;
  }
  
  // Use SVG decorative quotes - positioned absolutely so they don't affect layout
  const quoteWidth = quoteSize * 16; // Convert rem to px (assuming 16px base)
  const openingQuote = design.showQuotes ? `<svg class="decorative-quote-opening" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 379.51" style="position: absolute; top: -16px; left: -16px; width: ${quoteWidth}px; height: ${quoteWidth * 0.74}px; opacity: 0.2; pointer-events: none; fill: ${accentColor};"><path d="M212.27 33.98C131.02 56.52 78.14 103.65 64.99 185.67c-3.58 22.32 1.42 5.46 16.55-5.86 49.4-36.96 146.53-23.88 160.01 60.56 27.12 149.48-159.79 175.36-215.11 92.8-12.87-19.19-21.39-41.59-24.46-66.19C-11.35 159.99 43.48 64.7 139.8 19.94c17.82-8.28 36.6-14.76 56.81-19.51 10.12-2.05 17.47 3.46 20.86 12.77 2.87 7.95 3.85 16.72-5.2 20.78zm267.78 0c-81.25 22.54-134.14 69.67-147.28 151.69-3.58 22.32 1.42 5.46 16.55-5.86 49.4-36.96 146.53-23.88 160 60.56 27.13 149.48-159.78 175.36-215.1 92.8-12.87-19.19-21.39-41.59-24.46-66.19C256.43 159.99 311.25 64.7 407.58 19.94 425.4 11.66 444.17 5.18 464.39.43c10.12-2.05 17.47 3.46 20.86 12.77 2.87 7.95 3.85 16.72-5.2 20.78z"/></svg>` : '';
  const closingQuote = design.showQuotes ? `<svg class="decorative-quote-closing" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 379.51" style="position: absolute; bottom: -16px; right: -16px; width: ${quoteWidth}px; height: ${quoteWidth * 0.74}px; opacity: 0.2; pointer-events: none; fill: ${accentColor};"><path d="M299.73 345.54c81.25-22.55 134.13-69.68 147.28-151.7 3.58-22.31-1.42-5.46-16.55 5.86-49.4 36.97-146.53 23.88-160.01-60.55C243.33-10.34 430.24-36.22 485.56 46.34c12.87 19.19 21.39 41.59 24.46 66.19 13.33 106.99-41.5 202.28-137.82 247.04-17.82 8.28-36.6 14.76-56.81 19.52-10.12 2.04-17.47-3.46-20.86-12.78-2.87-7.95-3.85-16.72 5.2-20.77zm-267.78 0c81.25-22.55 134.14-69.68 147.28-151.7 3.58-22.31-1.42-5.46-16.55 5.86-49.4 36.97-146.53 23.88-160-60.55-27.14-149.49 159.78-175.37 215.1-92.81 12.87 19.19 21.39 41.59 24.46 66.19 13.33 106.99-41.5 202.28-137.82 247.04-17.82 8.28-36.59 14.76-56.81 19.52-10.12 2.04-17.47-3.46-20.86-12.78-2.87-7.95-3.85-16.72 5.2-20.77z"/></svg>` : '';
  
  // Added justify-content: center to stars row
  const starsHTML = review.star_rating ? `<div class="stars-row" style="margin-bottom: 0.75rem; display: flex; justify-content: center;">${renderStars(review.star_rating)}</div>` : '';
  const dateHTML = design.showRelativeDate && review.created_at ? `<div class="reviewer-date" style="font-size: 0.875rem; color: ${roleColor}; margin-top: 0.5rem;">${getRelativeTime(review.created_at)}</div>` : '';
  const platformHTML = design.showPlatform && review.platform ? `<div class="reviewer-platform" style="font-size: 0.8rem; color: ${roleColor}; opacity: 0.7; margin-top: 0.125rem;">via ${review.platform}</div>` : '';

  return `
    <div class="pr-review-card" style="${cardStyle}">
      ${starsHTML}
      <div class="review-content" style="flex-grow: 1; position: relative; overflow: visible;">
        ${openingQuote}
        <p class="review-text" style="margin: 0; font-size: 0.9rem; line-height: 1.4; color: ${textColor};">${review.review_content}</p>
        ${closingQuote}
      </div>
      <div class="reviewer-details" style="margin-top: 0.75rem; text-align: center;">
        <div class="reviewer-name" style="font-weight: bold; font-size: 0.9rem; color: ${nameColor};">${review.first_name || ''} ${review.last_name || ''}</div>
        ${review.reviewer_role ? `<div class="reviewer-role" style="font-size: 0.8rem; color: ${roleColor};">${review.reviewer_role}</div>` : ''}
        ${dateHTML}
        ${platformHTML}
      </div>
    </div>
  `;
} 