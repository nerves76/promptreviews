// PromptReviews Photo Widget - Vanilla JS
// This file contains the core widget logic for the photo card carousel widget

(function() {
  'use strict';

  // Global state for carousel management
  const carouselState = {};

  // Initialize the widget
  window.PromptReviewsPhoto = window.PromptReviewsPhoto || {};
  
  // Only define initializeWidget if it doesn't already exist (to avoid conflicts with other widgets)
  if (!window.PromptReviewsPhoto.initializeWidget) {
    window.PromptReviewsPhoto.initializeWidget = function(containerId, reviews, design, businessSlug) {
      console.log('🚀 PhotoWidget: Initializing widget', { containerId, reviewsCount: reviews?.length, design });
      
      if (!reviews || reviews.length === 0) {
        console.warn('⚠️ PhotoWidget: No reviews provided');
        return;
      }

      const widgetElement = document.getElementById(containerId);
      if (!widgetElement) {
        console.error('❌ PhotoWidget: Widget container not found:', containerId);
        return;
      }

      // Create and insert the widget HTML
      const widgetHTML = createCarouselHTML(containerId, reviews, design, businessSlug);
      widgetElement.innerHTML = widgetHTML;

      // Initialize carousel functionality
      initCarousel(containerId, reviews, design);
      
      console.log('✅ PhotoWidget: Widget initialized successfully');
    };
  }

  function initCarouselState(widgetId, reviews, design) {
    carouselState[widgetId] = {
      currentIndex: 0,
      totalItems: reviews.length,
      itemsPerView: 1, // Photo card always shows 1 item
      autoAdvance: design.autoAdvance || false,
      slideshowSpeed: design.slideshowSpeed || 4,
      autoAdvanceInterval: null
    };
  }

  function calculateItemsPerView(widgetId) {
    // Photo widget always shows 1 item
    return 1;
  }

  function initCarousel(widgetId, reviews, design) {
    const state = carouselState[widgetId];
    if (!state) return;

    const widgetElement = document.getElementById(widgetId);
    const track = widgetElement.querySelector('.pr-photo-carousel-track');
    const prevBtn = widgetElement.querySelector('.pr-photo-prev-btn');
    const nextBtn = widgetElement.querySelector('.pr-photo-next-btn');

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
    const track = widgetElement.querySelector('.pr-photo-carousel-track');
    if (!track) return;

    // Recalculate items per view on each update for responsiveness
    state.itemsPerView = calculateItemsPerView(widgetId);
    
    // Use precise pixel values for transform to account for gaps
    const firstItem = widgetElement.querySelector('.pr-photo-carousel-item');
    if (!firstItem) return; // Can't calculate transform without an item

    const gapStyle = window.getComputedStyle(track).gap;
    const gap = parseFloat(gapStyle) || 0; // No gap for photo widget

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
    const dotsContainer = widgetElement.querySelector('.pr-photo-dots-container');
    if (!dotsContainer) return;

    // Clear existing dots
    dotsContainer.innerHTML = '';

    // Create dots for each review
    for (let i = 0; i < state.totalItems; i++) {
      const dot = document.createElement('button');
      dot.className = `pr-photo-dot ${i === state.currentIndex ? 'active' : ''}`;
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
    const prevBtn = widgetElement.querySelector('.pr-photo-prev-btn');
    const nextBtn = widgetElement.querySelector('.pr-photo-next-btn');

    if (prevBtn) {
      prevBtn.style.opacity = state.currentIndex === 0 ? '0.5' : '1';
      prevBtn.disabled = state.currentIndex === 0;
    }

    if (nextBtn) {
      nextBtn.style.opacity = state.currentIndex === state.totalItems - 1 ? '0.5' : '1';
      nextBtn.disabled = state.currentIndex === state.totalItems - 1;
    }
  }

  function renderStars(rating, design) {
    const accentColor = design.accentColor || '#4f46e5';
    const emptyColor = '#cccccc';
    let starsHTML = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            // Full star
            starsHTML += `<span style="color: ${accentColor};">&#9733;</span>`;
        } else if (i - 0.5 <= rating) {
            // Half star (clipped)
            starsHTML += `<span style="position: relative; display: inline-block; color: ${emptyColor};">
                            &#9733;
                            <span style="position: absolute; left: 0; top: 0; width: 50%; overflow: hidden; color: ${accentColor};">
                                &#9733;
                            </span>
                        </span>`;
        } else {
            // Empty star
            starsHTML += `<span style="color: ${emptyColor};">&#9733;</span>`;
        }
    }
    return `<div class="pr-photo-stars-row" style="display: flex; justify-content: center; margin-bottom: 1rem;">${starsHTML}</div>`;
  }

  function createReviewCard(review, design) {
    const reviewText = design.showQuotes ? `"${review.review_content}"` : review.review_content;
    const dateText = design.showRelativeDate ? getRelativeDate(review.created_at) : new Date(review.created_at).toLocaleDateString();
    
    // Use the new renderStars function
    const starsHTML = review.star_rating ? renderStars(review.star_rating, design) : '';

    // Check if review has a photo
    const hasPhoto = review.photo_url && review.photo_url.trim() !== '';
    
    // Calculate background color with opacity
    const bgColor = design.bgColor || '#ffffff';
    const bgOpacity = design.bgOpacity !== undefined ? design.bgOpacity : 1;
    
    // Convert hex to rgba for transparency
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    const backgroundColorWithOpacity = hexToRgba(bgColor, bgOpacity);
    
    // Create photo HTML if available - now fills the full left side
    const photoHTML = hasPhoto ? `
      <div class="pr-photo-review-image" style="
        width: 50%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        overflow: hidden;
        border-top-left-radius: ${design.borderRadius || 16}px;
        border-bottom-left-radius: ${design.borderRadius || 16}px;
      ">
        <img src="${review.photo_url}" alt="Review photo" style="
          width: 100%;
          height: 100%;
          object-fit: cover;
        " />
      </div>
    ` : '';

    return `
      <div class="pr-photo-review-card" style="
        background-color: ${backgroundColorWithOpacity};
        border: ${design.borderWidth || 2}px solid ${design.borderColor || '#cccccc'};
        border-radius: ${design.borderRadius || 16}px;
        color: ${design.textColor || '#22223b'};
        font-family: ${design.font || 'Inter'}, sans-serif;
        line-height: ${design.lineSpacing || 1.4};
        box-shadow: ${design.shadow ? `0 4px 6px -1px rgba(0, 0, 0, ${design.shadowIntensity || 0.2})` : 'none'};
        padding: 0;
        position: relative;
        overflow: hidden;
        min-height: 300px;
      ">
        ${hasPhoto ? photoHTML : ''}
        <div class="pr-photo-review-content" style="
          display: flex;
          height: 100%;
          min-height: 300px;
        ">
          <div class="pr-photo-review-text-content" style="
            flex: 1;
            padding: 1.5rem;
            ${hasPhoto ? 'margin-left: 50%;' : ''}
          ">
            ${starsHTML}
            <p class="pr-photo-review-text" style="margin-bottom: 1rem;">${reviewText}</p>
            <div class="pr-photo-reviewer-details">
              <div style="
                color: ${design.nameTextColor || '#1a237e'};
                font-weight: 600;
                margin-bottom: 0.25rem;
              ">${review.first_name || ''} ${review.last_name || ''}</div>
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
      `<div class="pr-photo-carousel-item">${createReviewCard(review, design)}</div>`
    ).join('');
    
    // Dots are generated dynamically in updateDots, so we just need the container.
    const dotsHTML = '<div class="pr-photo-dots-container"></div>';

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
        .pr-photo-prev-btn::before { border-color: transparent ${accentColor} transparent transparent !important; }
        .pr-photo-next-btn::before { border-color: transparent transparent transparent ${accentColor} !important; }
        
        /* Arrow & Submit Button Hover: Invert colors */
        .pr-photo-prev-btn:hover, .pr-photo-next-btn:hover, .pr-photo-submit-btn:hover {
          background-color: ${accentColor} !important;
          color: ${bgColor} !important;
        }
        
        /* Arrow Icon Hover: Change to background color */
        .pr-photo-prev-btn:hover::before { border-color: transparent ${bgColor} transparent transparent !important; }
        .pr-photo-next-btn:hover::before { border-color: transparent transparent transparent ${bgColor} !important; }

        /* Card Hover: Lift effect */
        .pr-photo-review-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .pr-photo-review-card:hover {
          transform: ${design.liftOnHover ? 'translateY(-5px)' : 'none'};
          box-shadow: ${design.liftOnHover ? `0 10px 15px -3px rgba(0, 0, 0, ${design.shadowIntensity || 0.2})` : (design.shadow ? `0 4px 6px -1px rgba(0, 0, 0, ${design.shadowIntensity || 0.2})` : 'none')};
        }

        /* Responsive design for photo widget */
        @media (max-width: 768px) {
          .pr-photo-review-content {
            flex-direction: column !important;
            height: auto !important;
            min-height: auto !important;
          }
          .pr-photo-review-image {
            width: 100% !important;
            height: 200px !important;
            position: relative !important;
            border-radius: ${design.borderRadius || 16}px ${design.borderRadius || 16}px 0 0 !important;
            margin-bottom: 0 !important;
          }
          .pr-photo-review-text-content {
            margin-left: 0 !important;
            padding: 1.5rem !important;
          }
        }
      </style>
    `;

    // --- HTML components ---
    const controlsHTML = state.totalItems > 1 ? `
      <div class="pr-photo-carousel-controls">
        <button class="pr-photo-prev-btn" style="${buttonStyle}" title="Previous review"></button>
        ${dotsHTML}
        <button class="pr-photo-next-btn" style="${buttonStyle}" title="Next review"></button>
      </div>
    ` : '';

    const submitReviewHTML = design.showSubmitReviewButton ? `
      <div class="pr-photo-submit-review-container">
        <a href="/r/${businessSlug}?source=widget" target="_blank" class="pr-photo-submit-btn" style="${submitButtonStyle}">
          Submit a Review
        </a>
      </div>
    ` : '';
    
    // --- Final Widget HTML ---
    return `
      ${embeddedStyles}
      <div class="pr-photo-carousel-container">
        <div class="pr-photo-carousel-track">
          ${reviewCardsHTML}
        </div>
      </div>
      ${controlsHTML}
      ${submitReviewHTML}
    `;
  }

  // Expose the render function for direct use
  window.PromptReviewsPhoto.renderPhotoWidget = function(containerId, reviews, design, businessSlug) {
    window.PromptReviewsPhoto.initializeWidget(containerId, reviews, design, businessSlug);
  };

  // Main function to initialize all widgets on the page
  async function autoInitializeWidgets() {
    const widgets = document.querySelectorAll('[data-prompt-reviews-id], [data-widget-id]');
    if (widgets.length === 0) return;

    for (const widgetContainer of widgets) {
      const widgetId = widgetContainer.getAttribute('data-prompt-reviews-id') || widgetContainer.getAttribute('data-widget-id');
      const businessSlug = widgetContainer.getAttribute('data-business-slug');
      // Do NOT change the container's ID here
      // widgetContainer.id = `pr-photo-widget-container-${widgetId}`;

      try {
        const response = await fetch(`http://localhost:3001/api/widgets/${widgetId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch widget data: ${response.statusText}`);
        }
        const { reviews, design } = await response.json();
        
        if (reviews && reviews.length > 0) {
          widgetContainer.innerHTML = createCarouselHTML(widgetContainer.id, reviews, design, businessSlug);
          initCarousel(widgetContainer.id, reviews, design);
        } else {
          widgetContainer.innerHTML = '<p>No reviews to display.</p>';
        }

      } catch (error) {
        console.error('Error initializing PromptReviews Photo widget:', error);
        widgetContainer.innerHTML = '<p>Error loading reviews.</p>';
      }
    }
  }

  // Self-executing initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitializeWidgets);
  } else {
    autoInitializeWidgets();
  }

  console.log('✅ PhotoWidget: Widget script loaded successfully');
})(); 