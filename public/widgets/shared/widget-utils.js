// PromptReviews Shared Widget Utilities
// This file contains utility functions shared across all widget types.
// These functions are injected into each widget at build time.

/**
 * Generates JSON-LD schema markup for SEO (Google rich snippets).
 * @param {Array} reviews - Array of review objects
 * @param {string} businessName - Optional business name (falls back to document.title)
 * @returns {string} HTML script tag with JSON-LD schema
 */
function __PR_generateSchemaMarkup(reviews, businessName) {
  if (!reviews || reviews.length === 0) return '';

  // Calculate aggregate rating
  const totalRating = reviews.reduce((sum, review) => sum + (review.star_rating || 0), 0);
  const averageRating = (totalRating / reviews.length).toFixed(1);
  const reviewCount = reviews.length;

  // Get business name from the page or use a default
  const name = businessName || document.title || 'Business';

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating,
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": reviewCount,
      "reviewCount": reviewCount
    },
    "review": reviews.slice(0, 5).map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.star_rating || 5,
        "bestRating": "5",
        "worstRating": "1"
      },
      "author": {
        "@type": "Person",
        "name": `${review.first_name || ''} ${review.last_name || ''}`.trim() || "Anonymous"
      },
      "datePublished": review.created_at,
      "reviewBody": review.review_content
    }))
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * Converts a date string to a relative time string (e.g., "2 hours ago").
 * @param {string} dateString - The date string to convert
 * @param {boolean} verbose - If true, uses verbose format (e.g., "2 days ago"). If false, uses short format.
 * @returns {string} A relative time string
 */
function __PR_getRelativeTime(dateString, verbose) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44);
  const years = Math.round(days / 365.25);

  if (verbose) {
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  } else {
    // Short format used by single and photo widgets
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }
}

/**
 * Converts a hex color to rgba format with opacity.
 * @param {string} hex - The hex color string (e.g., '#ffffff')
 * @param {number} opacity - The opacity value (0-1)
 * @returns {string} The rgba color string
 */
function __PR_hexToRgba(hex, opacity) {
  if (!hex || !hex.startsWith('#')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
