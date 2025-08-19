// PromptReviews Multi-Widget
// Self-contained vanilla JavaScript widget for embedding

(function() {
  'use strict';

  // --- Start of Shared Canonical Functions ---
  // This section is now the single source of truth for card generation.

  function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span class="star${i <= rating ? ' filled' : ''}" style="color: ${i <= rating ? '#ffc107' : '#e0e0e0'}; font-size: 1.2rem;">&#9733;</span>`;
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
    const bgColor = design.bgColor || '#ffffff';
    let textColor = design.textColor || '#22223b';
    if (isColorDark(bgColor)) {
      textColor = '#ffffff';
    }
    
    const nameColor = design.nameTextColor || textColor;
    const roleColor = design.nameTextColor || textColor;
    const accentColor = design.accentColor || '#4f46e5';
    const borderRadius = design.borderRadius || 16;
    const borderWidth = design.borderWidth || 2;
    const borderColor = design.borderColor || '#cccccc';
    const bgOpacity = design.bgOpacity !== undefined ? design.bgOpacity : 1;
    const font = design.font || 'Inter';
    const quoteSize = design.quoteSize || 1.5; // Default quote size in rem
    
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
    
    const starsHTML = review.star_rating ? `<div class="stars-row" style="margin-bottom: 0.75rem; display: flex; justify-content: center;">${renderStars(review.star_rating)}</div>` : '';
    const dateHTML = design.showRelativeDate && review.created_at ? `<div class="reviewer-date" style="font-size: 0.875rem; color: ${roleColor}; opacity: 0.65; margin-top: 0.5rem;">${getRelativeTime(review.created_at)}</div>` : '';
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
          ${review.reviewer_role ? `<div class="reviewer-role" style="font-size: 0.8rem; color: ${roleColor}; opacity: 0.65;">${review.reviewer_role}</div>` : ''}
          ${dateHTML}
          ${platformHTML}
        </div>
      </div>
    `;
  }
  
  // --- End of Shared Canonical Functions ---

  // --- Start of Carousel Logic ---
  let carouselState = {};

  function initCarouselState(widgetId, reviews, design) {
    carouselState[widgetId] = {
      currentIndex: 0,
      itemsPerView: 3, // Default, will be recalculated
      reviews: reviews,
      design: design,
      autoAdvance: design.autoAdvance || false,
      slideshowSpeed: design.slideshowSpeed || 4,
      autoAdvanceInterval: null,
      get totalPages() {
        return Math.ceil(this.reviews.length / this.itemsPerView);
      }
    };
  }

  function calculateItemsPerView(widgetId) {
    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement) return 3;

    const container = widgetElement.querySelector('.pr-carousel-container');
    const firstItem = widgetElement.querySelector('.pr-carousel-item');
    
    if (!container || !firstItem || firstItem.offsetWidth === 0) {
      // Return default based on viewport width if item not rendered yet
      if (window.innerWidth <= 640) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }
    
    const gapStyle = getComputedStyle(firstItem.parentElement).gap;
    const gap = parseFloat(gapStyle) || 16; // Default gap to 16px if not found

    const containerWidth = container.offsetWidth;
    const itemWidth = firstItem.offsetWidth;

    // Calculation needs to account for the gaps between items
    const items = Math.round((containerWidth + gap) / (itemWidth + gap));
    return Math.max(1, items);
  }


  function updateCarousel(widgetId) {
    const state = carouselState[widgetId];
    if (!state) return;

    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement) return;

    const track = widgetElement.querySelector('.pr-carousel-track');
    if (!track) return;
    
    // Recalculate items per view on each update for responsiveness
    state.itemsPerView = calculateItemsPerView(widgetId);
    
    // Use precise pixel values for transform to account for gaps
    const firstItem = widgetElement.querySelector('.pr-carousel-item');
    if (!firstItem) return; // Can't calculate transform without an item

    const gapStyle = window.getComputedStyle(track).gap;
    const gap = parseFloat(gapStyle) || 16; // Default fallback for safety

    const itemTotalWidth = firstItem.offsetWidth + gap;
    const offset = -state.currentIndex * itemTotalWidth;
    track.style.transform = `translateX(${offset}px)`;
    
    updateDots(widgetId);
    updateArrowButtons(widgetId);
  }

  function updateDots(widgetId) {
    const state = carouselState[widgetId];
    const widgetElement = document.getElementById(widgetId);
    if (!state || !widgetElement) return;

    const dotsContainer = widgetElement.querySelector('.pr-dots-container');
    if (!dotsContainer) return;
    
    const totalPages = Math.ceil(state.reviews.length / state.itemsPerView);

    // Regenerate dots if the number of pages has changed
    if (dotsContainer.children.length !== totalPages) {
        let dotsHTML = '';
        for (let i = 0; i < totalPages; i++) {
            dotsHTML += `<button class="pr-dot" data-index="${i}"></button>`;
        }
        dotsContainer.innerHTML = dotsHTML;
        
        // Re-add event listeners
        dotsContainer.querySelectorAll('.pr-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const state = carouselState[widgetId];
                if (!state) return;
                const pageIndex = parseInt(e.target.dataset.index, 10);
                const cardIndex = pageIndex * state.itemsPerView;
                moveToIndex(widgetId, cardIndex);
            });
        });
    }

    const dots = dotsContainer.querySelectorAll('.pr-dot');
    const activeDot = state.currentIndex;
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === activeDot);
      dot.style.backgroundColor = index === activeDot ? (state.design.accentColor || '#4f46e5') : '#cccccc';
    });
  }

  function updateArrowButtons(widgetId) {
    const state = carouselState[widgetId];
    const widgetElement = document.getElementById(widgetId);
    if (!state || !widgetElement) return;

    const prevBtn = widgetElement.querySelector('.pr-prev-btn');
    const nextBtn = widgetElement.querySelector('.pr-next-btn');
    if (!prevBtn || !nextBtn) return;
    
    const maxIndex = Math.max(0, state.reviews.length - state.itemsPerView);
    
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.disabled = state.currentIndex >= maxIndex;
  }

  function moveToIndex(widgetId, index) {
    const state = carouselState[widgetId];
    if (!state) return;
    
    const maxIndex = Math.max(0, state.reviews.length - state.itemsPerView);
    const newIndex = Math.max(0, Math.min(index, maxIndex));

    if (newIndex !== state.currentIndex) {
      state.currentIndex = newIndex;
      updateCarousel(widgetId);
    }
  }

  function generateSchemaMarkup(reviews, businessName) {
    if (!reviews || reviews.length === 0) return '';
    
    // Calculate aggregate rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.star_rating || 0), 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);
    const reviewCount = reviews.length;
    
    // Get business name from the page or use a default
    const name = businessName || document.title || 'Business';
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product", // Can also use "LocalBusiness" or "Organization"
      "name": name,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": reviewCount,
        "reviewCount": reviewCount
      },
      "review": reviews.slice(0, 5).map(review => ({ // Google typically shows first 5
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

  function createCarouselHTML(widgetId, reviews, design, businessSlug) {
    initCarouselState(widgetId, reviews, design);
    const state = carouselState[widgetId];

    // Handle empty reviews case
    if (!reviews || reviews.length === 0) {
      return `
        <div class="pr-multi-widget">
          <div style="display: flex; align-items: center; justify-content: center; min-height: 200px; color: white; font-size: 18px;">
            <div style="text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                <svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
                </svg>
                <span>Add reviews to your widget</span>
              </div>
              <p style="font-size: 14px; opacity: 0.8;">Click the speech bubble icon above to add and manage reviews.</p>
            </div>
          </div>
        </div>
      `;
    }

    const reviewCardsHTML = reviews.map(review => 
      `<div class="pr-carousel-item">${createReviewCard(review, design)}</div>`
    ).join('');
    
    // Dots are now generated in updateDots
    const dotsHTML = '';

    // Style arrow buttons to match the design settings
    const bgColor = design.bgColor || '#ffffff';
    const borderColor = design.borderColor || '#cccccc';
    const borderWidth = design.borderWidth || 2;
    const bgOpacity = design.bgOpacity !== undefined ? design.bgOpacity : 1;
    const accentColor = design.accentColor || '#4f46e5';
    
    const buttonStyle = `
      background-color: ${bgColor};
      ${design.border ? `border: ${borderWidth}px solid ${borderColor};` : 'border: none;'}
      opacity: ${bgOpacity};
    `;

    const arrowStyle = `
      .pr-prev-btn::before {
        border-color: transparent ${accentColor} transparent transparent !important;
      }
      .pr-next-btn::before {
        border-color: transparent transparent transparent ${accentColor} !important;
      }
      
      /* Hover effects for arrow buttons - invert colors */
      .pr-prev-btn:hover,
      .pr-next-btn:hover {
        background-color: ${accentColor} !important;
        border-color: ${accentColor} !important;
      }
      
      .pr-prev-btn:hover::before {
        border-color: transparent ${bgColor} transparent transparent !important;
      }
      
      .pr-next-btn:hover::before {
        border-color: transparent transparent transparent ${bgColor} !important;
      }
      
      /* Hover effect for submit button - invert colors */
      .pr-submit-btn:hover {
        background-color: ${accentColor} !important;
        color: ${bgColor} !important;
      }
      
      /* Hover effect for review cards - lift up */
      .pr-review-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .pr-review-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
    `;

    const submitReviewButton = design.showSubmitReviewButton ? `
      <div class="pr-submit-review-container">
        <a href="https://prompt.reviews/r/${businessSlug}" target="_blank" rel="noopener noreferrer" class="pr-submit-btn"
           style="
             background-color: ${bgColor};
             ${design.border ? `border: ${borderWidth}px solid ${borderColor};` : 'border: none;'}
             opacity: ${bgOpacity};
             color: ${accentColor};
             padding: 8px 16px;
             text-decoration: none;
             font-weight: 500;
             border-radius: 8px;
             display: inline-block;
           ">
          Submit a Review
        </a>
      </div>
    ` : '';
    
    // Generate schema markup for SEO
    const schemaMarkup = generateSchemaMarkup(reviews, null); // Will use document.title as fallback
    
    return `
      ${schemaMarkup}
      <div class="pr-multi-widget">
        <style>
          ${arrowStyle}
        </style>
        <div class="pr-carousel-container">
          <div class="pr-carousel-track">
            ${reviewCardsHTML}
          </div>
        </div>
        <div class="pr-carousel-controls">
          <button class="pr-prev-btn" style="${buttonStyle}"></button>
          <div class="pr-dots-container">${dotsHTML}</div>
          <button class="pr-next-btn" style="${buttonStyle}"></button>
        </div>
        ${submitReviewButton}
      </div>
    `;
  }

  function initializeCarousel(widgetId) {
    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement) return;

    const state = carouselState[widgetId];
    if (!state) return;

    const prevBtn = widgetElement.querySelector('.pr-prev-btn');
    const nextBtn = widgetElement.querySelector('.pr-next-btn');

    // Check if buttons exist before adding listeners (they won't exist when there are no reviews)
    if (!prevBtn || !nextBtn) {
      console.log('🔍 Widget: Navigation buttons not found (likely no reviews to display)');
      return;
    }

    prevBtn.addEventListener('click', () => {
      const state = carouselState[widgetId];
      moveToIndex(widgetId, state.currentIndex - 1);
    });

    nextBtn.addEventListener('click', () => {
      const state = carouselState[widgetId];
      moveToIndex(widgetId, state.currentIndex + 1);
    });

    // Set up auto-advance if enabled
    if (state.autoAdvance && state.reviews.length > state.itemsPerView) {
      state.autoAdvanceInterval = setInterval(() => {
        const maxIndex = Math.max(0, state.reviews.length - state.itemsPerView);
        if (state.currentIndex >= maxIndex) {
          state.currentIndex = 0;
        } else {
          state.currentIndex++;
        }
        updateCarousel(widgetId);
      }, state.slideshowSpeed * 1000);
    }

    // Initial setup
    updateCarousel(widgetId);

    // Add resize listener to handle responsive changes
    window.addEventListener('resize', () => updateCarousel(widgetId));
  }
  // --- End of Carousel Logic ---

  // --- Start of Initialization Logic ---

  // Function to inject CSS styles inline
  const injectCSS = () => {
    // Check if CSS is already injected
    if (document.getElementById('promptreviews-widget-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'promptreviews-widget-styles';
    style.textContent = `
      /* 
        Canonical CSS for the Multi-Widget.
        This file is the single source of truth for styling the multi-widget,
        used by both the dashboard preview and the live embeddable widget.
      */

      /* 
        Container styles to mimic the dashboard preview environment.
        This ensures the embedded widget has a consistent, centered,
        and responsive container, just like in the app.
      */
      #promptreviews-widget,
      #promptreviews-multi-widget,
      #promptreviews-single-widget,
      #promptreviews-photo-widget {
          position: relative;
          width: 100%;
          max-width: 64rem; /* 1024px */
          margin-left: auto;
          margin-right: auto;
          font-size: 16px; /* Set a consistent base font size for rem calculations */
        }
        
        /* Base widget styling reset */
        .pr-multi-widget {
          all: revert;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          padding: 0 1rem; /* Add horizontal padding here */
        }
        
        /* Carousel Layout */
        .pr-carousel-container {
            position: relative;
            overflow: hidden;
            width: 100%;
            /* Padding removed from here */
        }
        
        .pr-carousel-track {
            display: flex;
            transition: transform 0.5s ease;
            gap: 1rem;
        }
        
        /* This is a key part of the fix: making the item a flex container */
        .pr-carousel-item {
            flex-shrink: 0;
            width: calc(100% / 3 - 1rem * 2 / 3);
            display: flex;
            padding-top: 8px; /* Space for hover lift effect */
        }
        
        /* Review Card Styles */
        .pr-multi-widget .pr-review-card {
            background: var(--pr-card-bg, #fff);
            border: var(--pr-card-border, 2px solid #cccccc);
            border-radius: var(--pr-card-radius, 16px);
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            width: 100%;
            text-align: center;
            /* This is the other key part: making the card grow */
            flex-grow: 1; 
        }
        
        .pr-multi-widget .review-content {
            flex-grow: 1; /* Ensures the text content area grows, pushing footer down */
        }
        
        .pr-multi-widget .reviewer-details {
            margin-top: auto; /* Pushes details to the bottom of the card */
        }
        
        /* --- Other existing styles below --- */
        
        .pr-multi-widget .stars-row {
            display: flex;
            justify-content: center;
        }
        
        .pr-multi-widget .review-text {
            margin: 0;
        }
        
        .pr-carousel-controls {
            text-align: center;
            margin-top: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .pr-prev-btn,
        .pr-next-btn {
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .pr-prev-btn::before,
        .pr-next-btn::before {
            content: '';
            width: 0;
            height: 0;
            border-style: solid;
        }
        
        .pr-prev-btn::before {
            border-width: 6px 8px 6px 0;
            border-color: transparent #4f46e5 transparent transparent;
            margin-left: -2px;
        }
        
        .pr-next-btn::before {
            border-width: 6px 0 6px 8px;
            border-color: transparent transparent transparent #4f46e5;
            margin-right: -2px;
        }
        
        .pr-dots-container {
            display: flex;
            gap: 16px;
            align-items: center;
        }
        
        .pr-dot {
            height: 12px;
            width: 12px;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            padding: 0;
            margin: 0;
        }
        
        .pr-submit-review-container {
            text-align: right;
            margin-top: 0.5rem;
        }
        
        .pr-submit-btn {
            display: inline-block;
            padding: 8px 16px;
            text-decoration: none;
            font-weight: 500;
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
            .pr-carousel-item {
                width: calc(100% / 2 - 1rem * 1 / 2); /* Two cards */
                padding-top: 8px; /* Maintain hover space */
            }
        }
        
        @media (max-width: 640px) {
            .pr-carousel-item {
                width: 100%; /* One card */
                gap: 0;
                padding-top: 8px; /* Maintain hover space */
            }
            .pr-carousel-track {
              gap: 0;
            }
        }
    `;
    document.head.appendChild(style);
  };

  // Main function to initialize all widgets on the page
  async function autoInitializeWidgets() {
    // Skip auto-initialization if we're in a dashboard context
    // Dashboard components will call initializeWidget manually
    if (window.location.pathname.includes('/dashboard')) {
      console.log('🔄 MultiWidget: Dashboard context detected, skipping auto-initialization');
      return;
    }

    const widgets = document.querySelectorAll('[data-prompt-reviews-id], [data-widget-id]');
    if (widgets.length === 0) return;

    injectCSS();

    for (const widgetContainer of widgets) {
      const widgetId = widgetContainer.getAttribute('data-prompt-reviews-id') || widgetContainer.getAttribute('data-widget-id');
      const businessSlug = widgetContainer.getAttribute('data-business-slug');
      widgetContainer.id = `pr-widget-container-${widgetId}`;

      try {
        // Use absolute URL for cross-domain embedding
        const apiUrl = window.location.hostname === 'app.promptreviews.app' 
          ? `/api/widgets/${widgetId}`
          : `https://app.promptreviews.app/api/widgets/${widgetId}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch widget data: ${response.statusText}`);
        }
        const { reviews, design } = await response.json();
        
        if (reviews && reviews.length > 0) {
          widgetContainer.innerHTML = createCarouselHTML(widgetContainer.id, reviews, design, businessSlug);
          initializeCarousel(widgetContainer.id);
        } else {
          widgetContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 200px; color: white; font-size: 18px;">
          <div style="text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
              <svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
              </svg>
              <span>Add reviews to your widget</span>
            </div>
            <p style="font-size: 14px; opacity: 0.8;">Click talk bubble icon to add and manage reviews.</p>
          </div>
        </div>
      `;
        }

      } catch (error) {
        console.error('Error initializing PromptReviews widget:', error);
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

  // Expose to global scope for dashboard compatibility
  window.PromptReviews = window.PromptReviews || {};
  window.PromptReviews.initializeWidget = function(containerId, reviews, design, businessSlug) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return;
    }
    
    // Set the data attributes for auto-initialization
    container.setAttribute('data-prompt-reviews-id', containerId.replace('promptreviews-widget-container-', ''));
    if (businessSlug) {
      container.setAttribute('data-business-slug', businessSlug);
    }
    
    // Create the widget HTML
    container.innerHTML = createCarouselHTML(containerId, reviews, design, businessSlug);
    initializeCarousel(containerId);
  };

})(); 