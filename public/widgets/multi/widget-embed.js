// PromptReviews Multi-Widget
// Self-contained vanilla JavaScript widget for embedding

(function() {
  'use strict';

  // --- Start of Shared Canonical Functions ---
  // This section is now the single source of truth for card generation.

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
    
    const starsHTML = review.star_rating ? `<div class="stars-row" style="margin-bottom: 0.75rem; display: flex; justify-content: center;">${renderStars(review.star_rating)}</div>` : '';
    const dateHTML = design.showRelativeDate && review.created_at ? `<div class="reviewer-date" style="font-size: 0.875rem; color: ${roleColor}; margin-top: 0.5rem;">${getRelativeTime(review.created_at)}</div>` : '';

    return `
      <div class="pr-review-card swiper-slide" style="${cardStyle}">
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
  
  // --- End of Shared Canonical Functions ---

  function createCarouselHTML(containerId, reviews, design, businessSlug) {
    const reviewCardsHTML = reviews.map(review => createReviewCard(review, design)).join('');

    const bgColor = design.bgColor || '#ffffff';
    const borderRadius = design.borderRadius || 16;
    const borderWidth = design.borderWidth || 2;
    const borderColor = design.borderColor || '#cccccc';
    const textColor = design.textColor || '#22223b';
    const accentColor = design.accentColor || '#4f46e5';
    
    let submitButtonStyle = `
      display: inline-block;
      background: ${bgColor};
      color: ${textColor};
      padding: 8px 16px;
      border: ${borderWidth}px solid ${borderColor};
      border-radius: ${borderRadius}px;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      margin-top: 1.5rem;
    `;
    
    if (design.shadow) {
      const shadowIntensity = design.shadowIntensity || 0.2;
      submitButtonStyle += `box-shadow: inset 0 0 10px rgba(0, 0, 0, ${shadowIntensity * 0.5});`;
    }

    const swiperControls = `
      <div class="swiper-pagination" style="position: relative; bottom: auto; margin-top: 1.5rem;"></div>
      <div class="swiper-button-prev" style="color: ${accentColor};"></div>
      <div class="swiper-button-next" style="color: ${accentColor};"></div>
    `;

    return `
      <div class="swiper-container pr-multi-widget-swiper" style="width: 100%; overflow: hidden;">
        <div class="swiper-wrapper">
          ${reviewCardsHTML}
        </div>
        ${swiperControls}
      </div>
      ${design.showSubmitReviewButton ? `<div class="pr-submit-review-container" style="text-align: right; margin-top: 1rem;"><a href="/r/${businessSlug}" target="_blank" class="pr-submit-btn" style="${submitButtonStyle}">Submit a Review</a></div>` : ''}
    `;
  }

  function initializeCarousel(containerId, design) {
    const swiper = new Swiper(`#${containerId} .pr-multi-widget-swiper`, {
      loop: design.autoAdvance || false,
      slidesPerView: 1,
      spaceBetween: 16,
      pagination: {
        el: `#${containerId} .swiper-pagination`,
        clickable: true,
      },
      navigation: {
        nextEl: `#${containerId} .swiper-button-next`,
        prevEl: `#${containerId} .swiper-button-prev`,
      },
      autoplay: design.autoAdvance ? {
        delay: (design.slideshowSpeed || 4) * 1000,
        disableOnInteraction: true,
      } : false,
      breakpoints: {
        640: {
          slidesPerView: 2,
          spaceBetween: 20,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 30,
        },
      }
    });
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
    container.innerHTML = createCarouselHTML(containerId, reviews, design, businessSlug);
    console.log('✅ Widget: Carousel HTML created, initializing swiper...');
    initializeCarousel(containerId, design);
    console.log('✅ Widget: Swiper carousel initialized successfully');
  }

  // Expose to global scope for embedding
  window.PromptReviews = window.PromptReviews || {};
  window.PromptReviews.initializeWidget = initializeWidget;

  // --- Dependency Loader ---
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadCSS(url) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${url}"]`)) {
        resolve();
        return;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  // Auto-initialize widgets with data-widget-id
  async function autoInitializeWidgets() {
    console.log('🔍 Auto-initializing widgets...');
    const widgets = document.querySelectorAll('[data-widget-id]');
    console.log(`Found ${widgets.length} widgets to initialize`);
    
    if (widgets.length === 0) return;

    try {
      // Load Swiper JS and CSS from CDN
      await Promise.all([
        loadCSS('https://unpkg.com/swiper/swiper-bundle.min.css'),
        loadScript('https://unpkg.com/swiper/swiper-bundle.min.js')
      ]);
      console.log('✅ Swiper assets loaded successfully.');
    } catch (error) {
      console.error('❌ Failed to load Swiper assets. Widget may not function correctly.', error);
      // We can still try to render, but it will not be a carousel
    }

    widgets.forEach(widget => {
      const widgetId = widget.getAttribute('data-widget-id');
      const containerId = widget.id || `promptreviews-widget-${widgetId}`;
      if (!widget.id) {
        widget.id = containerId;
      }
      
      console.log(`🎯 Initializing widget: ${widgetId} in container #${containerId}`);
      
      fetch(`/api/widgets/${widgetId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log(`✅ Widget data loaded for ${widgetId}:`, data);
          if (data.reviews && data.design) {
            // Use the containerId for initialization
            initializeWidget(containerId, data.reviews, data.design, data.businessSlug || 'default');
          } else {
            console.error(`❌ Invalid widget data for ${widgetId}:`, data);
            widget.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Widget data not available.</div>';
          }
        })
        .catch(error => {
          console.error(`❌ Failed to load widget data for ${widgetId}:`, error);
          widget.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Failed to load widget.</div>';
        });
    });
  }

  // Initialize widgets when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitializeWidgets);
  } else {
    // DOM is already ready
    autoInitializeWidgets();
  }

  console.log('✅ PromptReviews Multi-Widget loaded');

})(); 