// Photo Widget Embeddable Implementation
// This file is the vanilla JS Swiper-based implementation for the embeddable Photo widget.
// The dashboard preview version is rendered in src/app/dashboard/widget/page.tsx using the React PhotoWidget component.
// Related files:
// - src/widget-embed/photo/PhotoWidget.css (styles)
// - src/widget-embed/photo/embed-photo.jsx (embed entry point)
// - src/widget-embed/photo/dist/widget-embed.min.js (bundled JS)
// - src/widget-embed/photo/dist/widget.min.css (bundled CSS)

// Import Swiper and its CSS
import Swiper from 'swiper';
import 'swiper/css';

// Helper: Convert hex color to rgba
function hexToRgba(hex, alpha = 1) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Helper: Lighten a hex color by a given amount (default 0.7)
function lightenHex(hex, amount = 0.7) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Helper: Render star rating as SVGs (no React, just HTML)
function renderStars(rating, size = 16) {
  if (typeof rating !== 'number' || isNaN(rating)) return '';
  let html = '';
  for (let i = 1; i <= 5; i++) {
    const full = i <= Math.floor(rating);
    const half = !full && i - 0.5 <= rating;
    if (full) {
      html += `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="#FBBF24" stroke="#FBBF24" style="display:inline-block;margin-right:2px;"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>`;
    } else if (half) {
      html += `<svg width="${size}" height="${size}" viewBox="0 0 20 20" style="display:inline-block;margin-right:2px;"><defs><linearGradient id="half-star-gradient-${i}"><stop offset="50%" stop-color="#FBBF24" /><stop offset="50%" stop-color="#E5E7EB" /></linearGradient></defs><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" fill="url(#half-star-gradient-${i})" stroke="#FBBF24" /></svg>`;
    } else {
      html += `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="#E5E7EB" stroke="#FBBF24" style="display:inline-block;margin-right:2px;"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>`;
    }
  }
  return `<span style="display:inline-flex;align-items:center;margin-bottom:4px;">${html}</span>`;
}

// Helper: Get relative time string (e.g., '2 days ago')
function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

// Main Photo widget logic
async function initPhotoWidget() {
  const widgetElement = document.querySelector('.promptreviews-widget');
  if (!widgetElement) return;

  const widgetId = widgetElement.getAttribute('data-widget');
  if (!widgetId) {
    console.error('Widget ID not found');
    return;
  }

  try {
    const response = await fetch(`/api/widgets/${widgetId}`);
    if (!response.ok) throw new Error('Failed to load widget data');
    const data = await response.json();

    const { reviews, design } = data;
    if (!reviews || !reviews.length) {
      widgetElement.innerHTML = '<div class="error">No reviews available</div>';
      return;
    }

    // Render the widget
    const widgetHTML = `
      <div class="widget-container">
        <div class="swiper">
          <div class="swiper-wrapper">
            ${reviews.map(review => `
              <div class="swiper-slide">
                <div class="review-card">
                  <div class="photo-container">
                    <img src="${review.photo}" alt="Review photo" class="review-photo">
                  </div>
                  <div class="review-content">${review.content}</div>
                  <div class="reviewer-info">
                    <div class="reviewer-avatar">${review.reviewer.name.charAt(0)}</div>
                    <div class="reviewer-details">
                      <div class="reviewer-name">${review.reviewer.name}</div>
                      <div class="reviewer-role">${review.reviewer.role}</div>
                    </div>
                  </div>
                  <div class="star-rating">${renderStars(review.rating)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="swiper-pagination"></div>
        </div>
      </div>
    `;

    widgetElement.innerHTML = widgetHTML;

    // Initialize Swiper
    new Swiper('.swiper', {
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      loop: true,
      autoplay: {
        delay: 5000
      }
    });

  } catch (error) {
    console.error('Error initializing Photo widget:', error);
    widgetElement.innerHTML = '<div class="error">Failed to load widget</div>';
  }
}

// Initialize the widget when the DOM is ready
document.addEventListener('DOMContentLoaded', initPhotoWidget); 