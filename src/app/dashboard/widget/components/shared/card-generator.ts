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
    stars += `<span class="star${i <= rating ? ' filled' : ''}" style="color: ${i <= rating ? '#ffc107' : '#e0e0e0'};">&#9733;</span>`;
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
  const bgOpacity = design.bgOpacity !== undefined ? design.bgOpacity : 1;
  const font = design.font || 'Inter';
  const quoteSize = design.quoteSize || 1.5; // Default quote size in rem
  
  // Card style without height: 100%
  let cardStyle = `
    background-color: ${bgColor};
    color: ${textColor};
    border-radius: ${borderRadius}px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    font-family: ${font}, sans-serif;
    opacity: ${bgOpacity};
  `;
  
  // Only add border if explicitly enabled
  if (design.border === true) {
    cardStyle += `border: ${borderWidth}px solid ${borderColor};`;
  } else {
    cardStyle += `border: none;`;
  }
  
  if (design.shadow) {
    const shadowColor = design.shadowColor || '#222222';
    const shadowIntensity = design.shadowIntensity || 0.2;
    cardStyle += `box-shadow: inset 0 0 20px rgba(0, 0, 0, ${shadowIntensity});`;
  }
  
  // Use curly quotes and apply quote size
  const openingQuote = design.showQuotes ? `<span class="decorative-quote-opening" style="color: ${accentColor}; font-size: ${quoteSize}rem; font-weight: bold; line-height: 1; opacity: 0.3; margin-bottom: 0.5rem; display: block; text-align: left; width: 100%;">&#8220;</span>` : '';
  const closingQuote = design.showQuotes ? `<span class="decorative-quote-closing" style="color: ${accentColor}; font-size: ${quoteSize}rem; font-weight: bold; line-height: 1; opacity: 0.3; position: absolute; bottom: 1rem; right: 1rem;">&#8221;</span>` : '';
  
  // Added justify-content: center to stars row
  const starsHTML = review.star_rating ? `<div class="stars-row" style="margin-bottom: 0.75rem; display: flex; justify-content: center;">${renderStars(review.star_rating)}</div>` : '';
  const dateHTML = design.showRelativeDate && review.created_at ? `<div class="reviewer-date" style="font-size: 0.875rem; color: ${roleColor}; margin-top: 0.5rem;">${getRelativeTime(review.created_at)}</div>` : '';
  const platformHTML = design.showPlatform && review.platform ? `<div class="reviewer-platform" style="font-size: 0.8rem; color: ${roleColor}; opacity: 0.7; margin-top: 0.25rem;">via ${review.platform}</div>` : '';

  return `
    <div class="pr-review-card" style="${cardStyle}">
      ${starsHTML}
      <div class="review-content" style="flex-grow: 1; position: relative;">
        ${openingQuote}
        <p class="review-text" style="margin: 0; font-size: 0.9rem; line-height: 1.4; color: ${textColor}; padding-left: ${design.showQuotes ? '0.75rem' : '0'}; padding-right: ${design.showQuotes ? '1.5rem' : '0'}; padding-bottom: ${design.showQuotes ? '1.5rem' : '0'};">${review.review_content}</p>
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