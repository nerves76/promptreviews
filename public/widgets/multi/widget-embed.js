// PromptReviews Multi-Widget
// Self-contained vanilla JavaScript widget for embedding

(function() {
  'use strict';

  // Utility functions
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
    // Using the HSP value, determine whether the color is light or dark
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp < 127.5;
  }

  function createReviewCard(review, design) {
    // Automatically set text color based on background brightness
    const bgColor = design.bgColor || '#ffffff';
    let textColor = design.textColor || '#22223b';
    if (isColorDark(bgColor)) {
      textColor = '#ffffff'; // Force white text on dark backgrounds
    }
    
    // Use design properties with fallbacks
    const nameColor = design.nameColor || textColor;
    const roleColor = design.roleColor || textColor;
    const accentColor = design.accentColor || '#4f46e5';
    const cardBorderRadius = design.cardBorderRadius !== undefined ? `${design.cardBorderRadius}px` : '1rem';
    
    const cardStyle = `background-color: ${bgColor}; color: ${textColor}; border-radius: ${cardBorderRadius}; padding: 1.5rem; display: flex; flex-direction: column; height: 100%;`;
    
    const quoteHTML = design.showQuotes ? `<span class="decorative-quote" style="color: ${accentColor}; font-size: 2rem; font-weight: bold; line-height: 1;">"</span>` : '';
    const starsHTML = review.star_rating ? `<div class="stars-row" style="margin-bottom: 0.75rem;">${renderStars(review.star_rating)}</div>` : '';
    const dateHTML = design.showRelativeDate && review.created_at ? `<div class="reviewer-date" style="font-size: 0.875rem; color: ${roleColor}; margin-top: 0.5rem;">${getRelativeTime(review.created_at)}</div>` : '';

    return `
      <div class="pr-review-card" style="${cardStyle}">
        ${starsHTML}
        <div class="review-content" style="flex-grow: 1;">
          ${quoteHTML}
          <p class="review-text" style="margin: 0; font-size: 1rem; line-height: 1.5;">${review.review_content}</p>
        </div>
        <div class="reviewer-details" style="margin-top: 1rem; text-align: left;">
          <div class="reviewer-name" style="font-weight: bold; color: ${nameColor};">${review.first_name || ''} ${review.last_name || ''}</div>
          ${review.reviewer_role ? `<div class="reviewer-role" style="font-size: 0.875rem; color: ${roleColor};">${review.reviewer_role}</div>` : ''}
          ${dateHTML}
        </div>
      </div>
    `;
  }

  // Carousel state
  let currentIndex = 0;
  let itemsPerView = 3;
  let totalPages = 0;
  let reviewsData = [];
  let designData = {};

  function calculateItemsPerView(containerWidth) {
    const cardWidth = 320;
    const gap = 16;
    return Math.max(1, Math.floor(containerWidth / (cardWidth + gap)));
  }

  function updateCarousel() {
    const carousel = document.querySelector('.pr-carousel-track');
    if (!carousel) return;

    const container = document.querySelector('.pr-carousel-container');
    const containerWidth = container.offsetWidth;
    itemsPerView = calculateItemsPerView(containerWidth);
    totalPages = Math.ceil(reviewsData.length / itemsPerView);
    
    const offset = -currentIndex * (containerWidth / itemsPerView) * itemsPerView;
    carousel.style.transform = `translateX(${offset}px)`;
    
    updateDots();
  }

  function updateDots() {
    const dots = document.querySelectorAll('.pr-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function moveToIndex(index) {
    const newIndex = Math.max(0, Math.min(index, totalPages - 1));
    if (newIndex !== currentIndex) {
      currentIndex = newIndex;
      updateCarousel();
    }
  }

  function createCarouselHTML(reviews, design, businessSlug) {
    reviewsData = reviews;
    designData = design;
    
    const reviewCardsHTML = reviews.map(review => 
      `<div class="pr-carousel-item">${createReviewCard(review, design)}</div>`
    ).join('');

    const dotsHTML = Array.from({ length: Math.ceil(reviews.length / itemsPerView) }, (_, i) => 
      `<button class="pr-dot" data-index="${i}"></button>`
    ).join('');
    
    return `
      <div class="pr-carousel-container" style="position: relative;">
        <div class="pr-carousel-track" style="display: flex; transition: transform 0.5s ease;">
          ${reviewCardsHTML}
        </div>
      </div>
      <div class="pr-carousel-controls" style="text-align: center; margin-top: 1rem;">
        <button class="pr-prev-btn">&lt;</button>
        <div class="pr-dots-container" style="display: inline-block; margin: 0 10px;">
          ${dotsHTML}
        </div>
        <button class="pr-next-btn">&gt;</button>
      </div>
      ${design.showSubmitReviewButton ? `<div class="pr-submit-review-container" style="text-align: center; margin-top: 1rem;"><a href="/r/${businessSlug}" target="_blank" class="pr-submit-btn">Submit a Review</a></div>` : ''}
    `;
  }

  function initializeCarousel() {
    const prevBtn = document.querySelector('.pr-prev-btn');
    const nextBtn = document.querySelector('.pr-next-btn');
    const dotsContainer = document.querySelector('.pr-dots-container');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => moveToIndex(currentIndex - 1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => moveToIndex(currentIndex + 1));
    }
    if (dotsContainer) {
      dotsContainer.addEventListener('click', (e) => {
        if (e.target.matches('.pr-dot')) {
          moveToIndex(parseInt(e.target.dataset.index, 10));
        }
      });
    }

    window.addEventListener('resize', updateCarousel);
    
    // Initial setup
    updateCarousel();
  }

  // Main widget initialization
  function initializeWidget(containerId, reviews, design, businessSlug) {
    console.log('🎯 Widget: initializeWidget called with:', { containerId, reviewsCount: reviews?.length, design, businessSlug });
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ Widget: Container not found:', containerId);
      return;
    }

    console.log('✅ Widget: Container found:', container);

    if (!reviews || reviews.length === 0) {
      console.log('⚠️ Widget: No reviews to display');
      container.innerHTML = '<div style="text-align: center; padding: 2rem;">No reviews to display.</div>';
      return;
    }

    console.log('🎨 Widget: Creating carousel HTML with', reviews.length, 'reviews');
    container.innerHTML = createCarouselHTML(reviews, design, businessSlug);
    console.log('✅ Widget: Carousel HTML created, initializing carousel...');
    initializeCarousel();
    console.log('✅ Widget: Carousel initialized successfully');
  }

  // Expose to global scope for embedding
  window.PromptReviews = window.PromptReviews || {};
  window.PromptReviews.initializeWidget = initializeWidget;
  window.PromptReviews.createCarouselHTML = createCarouselHTML;
  window.PromptReviews.initializeCarousel = initializeCarousel;

  console.log('✅ PromptReviews Multi-Widget loaded');

})(); 