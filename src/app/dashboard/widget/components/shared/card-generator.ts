// This file will contain the canonical function for generating review card HTML.
// It will be used by both the dashboard preview and the live embeddable widget
// to ensure that the output is always identical.

// TODO: Move the createReviewCard function here. 

// These utility functions are dependencies for createReviewCard
function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star${i <= rating ? ' filled' : ''}" style="color: ${i <= rating ? '#ffc107' : '#e0e0e0'};">&#9733;</span>`;
  }
  return stars;
}

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
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

function isColorDark(hexColor) {
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
export function createReviewCardHTML(review, design) {
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
  
  // Card style without height: 100%
  let cardStyle = `
    background-color: ${bgColor};
    color: ${textColor};
    border-radius: ${borderRadius}px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    font-family: ${font}, sans-serif;
    opacity: ${bgOpacity};
  `;
  
  if (design.border) {
    cardStyle += `border: ${borderWidth}px solid ${borderColor};`;
  }
  
  if (design.shadow) {
    const shadowColor = design.shadowColor || '#222222';
    const shadowIntensity = design.shadowIntensity || 0.2;
    cardStyle += `box-shadow: inset 0 0 20px rgba(0, 0, 0, ${shadowIntensity});`;
  }
  
  const openingQuote = design.showQuotes ? `<span class="decorative-quote-opening" style="color: ${accentColor}; font-size: 1.5rem; font-weight: bold; line-height: 1; opacity: 0.3; margin-bottom: 0.5rem; display: block; text-align: left; width: 100%;">"</span>` : '';
  const closingQuote = design.showQuotes ? `<span class="decorative-quote-closing" style="color: ${accentColor}; font-size: 1.5rem; font-weight: bold; line-height: 1; opacity: 0.3; position: absolute; bottom: 1rem; right: 1rem;">"</span>` : '';
  
  // Added justify-content: center to stars row
  const starsHTML = review.star_rating ? `<div class="stars-row" style="margin-bottom: 0.75rem; display: flex; justify-content: center;">${renderStars(review.star_rating)}</div>` : '';
  const dateHTML = design.showRelativeDate && review.created_at ? `<div class="reviewer-date" style="font-size: 0.875rem; color: ${roleColor}; margin-top: 0.5rem;">${getRelativeTime(review.created_at)}</div>` : '';

  return `
    <div class="pr-review-card" style="${cardStyle}">
      ${starsHTML}
      <div class="review-content" style="flex-grow: 1; position: relative;">
        ${openingQuote}
        <p class="review-text" style="margin: 0; font-size: 1rem; line-height: 1.5; color: ${textColor}; padding-left: ${design.showQuotes ? '1rem' : '0'}; padding-right: ${design.showQuotes ? '2rem' : '0'}; padding-bottom: ${design.showQuotes ? '2rem' : '0'};">${review.review_content}</p>
        ${closingQuote}
      </div>
      <div class="reviewer-details" style="margin-top: 1rem; text-align: center;">
        <div class="reviewer-name" style="font-weight: bold; color: ${nameColor};">${review.first_name || ''} ${review.last_name || ''}</div>
        ${review.reviewer_role ? `<div class="reviewer-role" style="font-size: 0.875rem; color: ${roleColor};">${review.reviewer_role}</div>` : ''}
        ${dateHTML}
      </div>
    </div>
  `;
} 