// PromptReviews Single Widget - Vanilla JS
// This file contains the core widget logic for the single card carousel widget

(function() {
  'use strict';

  // Global state for carousel management
  const carouselState = {};

  // Initialize the widget
  window.PromptReviewsSingle = window.PromptReviewsSingle || {};
  
  // Only define initializeWidget if it doesn't already exist (to avoid conflicts with multi widget)
  if (!window.PromptReviewsSingle.initializeWidget) {
    window.PromptReviewsSingle.initializeWidget = function(containerId, reviews, design, businessSlug) {
      console.log('🚀 SingleWidget: Initializing widget', { containerId, reviewsCount: reviews?.length, design });
      
      if (!reviews || reviews.length === 0) {
        console.warn('⚠️ SingleWidget: No reviews provided');
        return;
      }

      const widgetElement = document.getElementById(containerId);
      if (!widgetElement) {
        console.error('❌ SingleWidget: Widget container not found:', containerId);
        return;
      }

      // Create and insert the widget HTML
      const widgetHTML = createCarouselHTML(containerId, reviews, design, businessSlug);
      widgetElement.innerHTML = widgetHTML;

      // Initialize carousel functionality
      initCarousel(containerId, reviews, design);
      
      console.log('✅ SingleWidget: Widget initialized successfully');
    };
  }

  function initCarouselState(widgetId, reviews, design) {
    carouselState[widgetId] = {
      currentIndex: 0,
      totalItems: reviews.length,
      itemsPerView: 1, // Single card always shows 1 item
      autoAdvance: design.autoAdvance || false,
      slideshowSpeed: design.slideshowSpeed || 4,
      autoAdvanceInterval: null
    };
  }

  function calculateItemsPerView(widgetId) {
    // Single widget always shows 1 item
    return 1;
  }

  function initCarousel(widgetId, reviews, design) {
    const state = carouselState[widgetId];
    if (!state) return;

    const widgetElement = document.getElementById(widgetId);
    const track = widgetElement.querySelector('.pr-single-carousel-track');
    const prevBtn = widgetElement.querySelector('.pr-single-prev-btn');
    const nextBtn = widgetElement.querySelector('.pr-single-next-btn');

    // Set up event listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.currentIndex > 0) {
          state.currentIndex--;
          updateCarousel(widgetId);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state.currentIndex < state.totalItems - 1) {
          state.currentIndex++;
          updateCarousel(widgetId);
        }
      });
    }

    // Set up auto-advance if enabled
    if (state.autoAdvance && state.totalItems > 1) {
      state.autoAdvanceInterval = setInterval(() => {
        if (state.currentIndex < state.totalItems - 1) {
          state.currentIndex++;
        } else {
          state.currentIndex = 0;
        }
        updateCarousel(widgetId);
      }, state.slideshowSpeed * 1000);
    }

    // Initial update
    updateCarousel(widgetId);
  }

  function updateCarousel(widgetId) {
    const state = carouselState[widgetId];
    if (!state) return;

    const widgetElement = document.getElementById(widgetId);
    const track = widgetElement.querySelector('.pr-single-carousel-track');
    if (!track) return;

    // Recalculate items per view on each update for responsiveness
    state.itemsPerView = calculateItemsPerView(widgetId);
    
    // Use precise pixel values for transform to account for gaps
    const firstItem = widgetElement.querySelector('.pr-single-carousel-item');
    if (!firstItem) return; // Can't calculate transform without an item

    const gapStyle = window.getComputedStyle(track).gap;
    const gap = parseFloat(gapStyle) || 0; // No gap for single widget

    const itemTotalWidth = firstItem.offsetWidth + gap;
    const offset = -state.currentIndex * itemTotalWidth;
    track.style.transform = `translateX(${offset}px)`;
    
    updateDots(widgetId);
    updateArrowButtons(widgetId);
  }

  function updateDots(widgetId) {
    const state = carouselState[widgetId];
    if (!state) return;

    const widgetElement = document.getElementById(widgetId);
    const dotsContainer = widgetElement.querySelector('.pr-single-dots-container');
    if (!dotsContainer) return;

    // Clear existing dots
    dotsContainer.innerHTML = '';

    // Create dots for each review
    for (let i = 0; i < state.totalItems; i++) {
      const dot = document.createElement('button');
      dot.className = `pr-single-dot ${i === state.currentIndex ? 'active' : ''}`;
      dot.style.backgroundColor = i === state.currentIndex ? '#4f46e5' : '#d1d5db';
      dot.addEventListener('click', () => {
        state.currentIndex = i;
        updateCarousel(widgetId);
      });
      dotsContainer.appendChild(dot);
    }
  }

  function updateArrowButtons(widgetId) {
    const state = carouselState[widgetId];
    if (!state) return;

    const widgetElement = document.getElementById(widgetId);
    const prevBtn = widgetElement.querySelector('.pr-single-prev-btn');
    const nextBtn = widgetElement.querySelector('.pr-single-next-btn');

    if (prevBtn) {
      prevBtn.style.opacity = state.currentIndex === 0 ? '0.5' : '1';
      prevBtn.disabled = state.currentIndex === 0;
    }

    if (nextBtn) {
      nextBtn.style.opacity = state.currentIndex === state.totalItems - 1 ? '0.5' : '1';
      nextBtn.disabled = state.currentIndex === state.totalItems - 1;
    }
  }

  function createReviewCard(review, design) {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const reviewText = design.showQuotes ? `"${review.review_text}"` : review.review_text;
    const dateText = design.showRelativeDate ? getRelativeDate(review.created_at) : new Date(review.created_at).toLocaleDateString();
    
    return `
      <div class="pr-single-review-card" style="
        background-color: ${design.bgColor || '#ffffff'};
        border: ${design.borderWidth || 2}px solid ${design.borderColor || '#cccccc'};
        border-radius: ${design.borderRadius || 16}px;
        opacity: ${design.bgOpacity !== undefined ? design.bgOpacity : 1};
        color: ${design.textColor || '#22223b'};
        font-family: ${design.font || 'Inter'}, sans-serif;
        line-height: ${design.lineSpacing || 1.4};
        box-shadow: ${design.shadow ? `0 4px 6px -1px rgba(0, 0, 0, ${design.shadowIntensity || 0.2})` : 'none'};
      ">
        <div class="pr-single-review-content">
          <div class="pr-single-stars-row" style="color: ${design.accentColor || '#4f46e5'}; margin-bottom: 1rem;">
            ${stars}
          </div>
          <p class="pr-single-review-text" style="margin-bottom: 1rem;">${reviewText}</p>
        </div>
        <div class="pr-single-reviewer-details">
          <div style="
            color: ${design.nameTextColor || '#1a237e'};
            font-weight: 600;
            margin-bottom: 0.25rem;
          ">${review.reviewer_name}</div>
          ${review.reviewer_role ? `<div style="
            color: ${design.roleTextColor || '#6b7280'};
            font-size: ${design.attributionFontSize || 15}px;
          ">${review.reviewer_role}</div>` : ''}
          <div style="
            color: ${design.roleTextColor || '#6b7280'};
            font-size: ${design.attributionFontSize || 15}px;
            margin-top: 0.25rem;
          ">${dateText}</div>
        </div>
      </div>
    `;
  }

  function getRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  function createCarouselHTML(widgetId, reviews, design, businessSlug) {
    initCarouselState(widgetId, reviews, design);
    const state = carouselState[widgetId];

    const reviewCardsHTML = reviews.map(review => 
      `<div class="pr-single-carousel-item">${createReviewCard(review, design)}</div>`
    ).join('');
    
    // Dots are generated dynamically in updateDots, so we just need the container.
    const dotsHTML = '<div class="pr-single-dots-container"></div>';

    // --- Dynamic Styles ---
    const bgColor = design.bgColor || '#ffffff';
    const borderColor = design.borderColor || '#cccccc';
    const borderWidth = design.borderWidth || 2;
    const bgOpacity = design.bgOpacity !== undefined ? design.bgOpacity : 1;
    const accentColor = design.accentColor || '#4f46e5';
    
    // Base style for arrow buttons
    const buttonStyle = `
      background-color: ${bgColor};
      border: ${borderWidth}px solid ${borderColor};
      opacity: ${bgOpacity};
    `;

    // Style for the "Submit a Review" button
    const submitButtonStyle = `
      background-color: ${bgColor};
      border: ${borderWidth}px solid ${borderColor};
      border-radius: ${design.buttonBorderRadius || 8}px;
      opacity: ${bgOpacity};
      color: ${accentColor};
    `;
    
    // --- Embedded <style> tag for hover effects and dynamic arrow colors ---
    const embeddedStyles = `
      <style>
        /* Arrow Color */
        .pr-single-prev-btn::before { border-color: transparent ${accentColor} transparent transparent !important; }
        .pr-single-next-btn::before { border-color: transparent transparent transparent ${accentColor} !important; }
        
        /* Arrow & Submit Button Hover: Invert colors */
        .pr-single-prev-btn:hover, .pr-single-next-btn:hover, .pr-single-submit-btn:hover {
          background-color: ${accentColor} !important;
          color: ${bgColor} !important;
        }
        
        /* Arrow Icon Hover: Change to background color */
        .pr-single-prev-btn:hover::before { border-color: transparent ${bgColor} transparent transparent !important; }
        .pr-single-next-btn:hover::before { border-color: transparent transparent transparent ${bgColor} !important; }

        /* Card Hover: Lift effect */
        .pr-single-review-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .pr-single-review-card:hover {
          transform: ${design.liftOnHover ? 'translateY(-5px)' : 'none'};
          box-shadow: ${design.liftOnHover ? `0 10px 15px -3px rgba(0, 0, 0, ${design.shadowIntensity || 0.2})` : (design.shadow ? `0 4px 6px -1px rgba(0, 0, 0, ${design.shadowIntensity || 0.2})` : 'none')};
        }
      </style>
    `;

    // --- HTML components ---
    const controlsHTML = state.totalItems > 1 ? `
      <div class="pr-single-carousel-controls">
        <button class="pr-single-prev-btn" style="${buttonStyle}" title="Previous review"></button>
        ${dotsHTML}
        <button class="pr-single-next-btn" style="${buttonStyle}" title="Next review"></button>
      </div>
    ` : '';

    const submitReviewHTML = design.showSubmitReviewButton ? `
      <div class="pr-single-submit-review-container">
        <a href="/r/${businessSlug}?source=widget" target="_blank" class="pr-single-submit-btn" style="${submitButtonStyle}">
          Submit a Review
        </a>
      </div>
    ` : '';
    
    // --- Final Widget HTML ---
    return `
      ${embeddedStyles}
      <div class="pr-single-carousel-container">
        <div class="pr-single-carousel-track">
          ${reviewCardsHTML}
        </div>
      </div>
      ${controlsHTML}
      ${submitReviewHTML}
    `;
  }

  // Expose the render function for direct use
  window.PromptReviewsSingle.renderSingleWidget = function(containerId, reviews, design, businessSlug) {
    window.PromptReviewsSingle.initializeWidget(containerId, reviews, design, businessSlug);
  };

  console.log('✅ SingleWidget: Widget script loaded successfully');
})(); 