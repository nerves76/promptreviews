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
  
  // --- End of Shared Canonical Functions ---

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
    
    const firstItem = carousel.querySelector('.pr-carousel-item');
    if (!firstItem) return;
    
    const itemWidth = firstItem.offsetWidth;
    const offset = -currentIndex * itemWidth * itemsPerView;
    carousel.style.transform = `translateX(${offset}px)`;
    
    updateDots();
    updateArrowButtons();
  }

  function updateDots() {
    const dots = document.querySelectorAll('.pr-dot');
    const bgColor = designData.bgColor || '#ffffff';
    const accentColor = designData.accentColor || '#4f46e5';
    const bgOpacity = designData.bgOpacity !== undefined ? designData.bgOpacity : 1;
    
    dots.forEach((dot, index) => {
      const isActive = index === currentIndex;
      dot.classList.toggle('active', isActive);
      
      if (isActive) {
        dot.style.backgroundColor = bgColor;
        dot.style.opacity = bgOpacity;
      } else {
        dot.style.backgroundColor = accentColor;
        dot.style.opacity = bgOpacity * 0.5;
      }
    });
  }

  function updateArrowButtons() {
    const prevBtn = document.querySelector('.pr-prev-btn');
    const nextBtn = document.querySelector('.pr-next-btn');
    
    if (!prevBtn || !nextBtn) return;
    
    const bgColor = designData.bgColor || '#ffffff';
    const borderWidth = designData.borderWidth || 2;
    const borderColor = designData.borderColor || '#cccccc';
    const accentColor = designData.accentColor || '#4f46e5';
    const bgOpacity = designData.bgOpacity !== undefined ? designData.bgOpacity : 1;
    
    const buttonStyle = `
      background: ${bgColor};
      border: ${borderWidth}px solid ${borderColor};
      opacity: ${bgOpacity};
    `;
    
    prevBtn.style.cssText += buttonStyle;
    nextBtn.style.cssText += buttonStyle;
    
    const leftTriangle = prevBtn.querySelector('div');
    const rightTriangle = nextBtn.querySelector('div');
    
    if (leftTriangle) {
      leftTriangle.style.borderRightColor = accentColor;
    }
    if (rightTriangle) {
      rightTriangle.style.borderLeftColor = accentColor;
    }
    
    if (designData.shadow) {
      const shadowIntensity = designData.shadowIntensity || 0.2;
      const shadowStyle = `box-shadow: inset 0 0 20px rgba(0, 0, 0, ${shadowIntensity});`;
      prevBtn.style.cssText += shadowStyle;
      nextBtn.style.cssText += shadowStyle;
    }
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
      `<button class="pr-dot" data-index="${i}" style="height: 12px; width: 12px; background-color: ${design.accentColor || '#4f46e5'}; border: none; border-radius: 50%; display: inline-block; transition: all 0.3s ease; cursor: pointer; padding: 0; margin: 0 8px; opacity: ${design.bgOpacity !== undefined ? design.bgOpacity * 0.5 : 0.5};"></button>`
    ).join('');
    
    const bgColor = design.bgColor || '#ffffff';
    const borderRadius = design.borderRadius || 16;
    const borderWidth = design.borderWidth || 2;
    const borderColor = design.borderColor || '#cccccc';
    const textColor = design.textColor || '#22223b';
    const accentColor = design.accentColor || '#4f46e5';
    const bgOpacity = design.bgOpacity !== undefined ? design.bgOpacity : 1;
    
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
      opacity: ${bgOpacity};
    `;
    
    let arrowButtonStyle = `
      cursor: pointer;
      width: 40px;
      height: 40px;
      background: ${bgColor};
      border: ${borderWidth}px solid ${borderColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      position: relative;
      opacity: ${bgOpacity};
    `;
    
    if (design.shadow) {
      const shadowIntensity = design.shadowIntensity || 0.2;
      submitButtonStyle += `box-shadow: inset 0 0 20px rgba(0, 0, 0, ${shadowIntensity});`;
      arrowButtonStyle += `box-shadow: inset 0 0 20px rgba(0, 0, 0, ${shadowIntensity});`;
    }
    
    const leftTriangle = `<div style="width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-right: 8px solid ${accentColor}; margin-left: 4px;"></div>`;
    const rightTriangle = `<div style="width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 8px solid ${accentColor}; margin-right: 4px;"></div>`;
    
    return `
      <div class="pr-carousel-container" style="position: relative;">
        <div class="pr-carousel-track" style="display: flex; transition: transform 0.5s ease;">
          ${reviewCardsHTML}
        </div>
      </div>
      <div class="pr-carousel-controls" style="text-align: center; margin-top: 1rem;">
        <button class="pr-prev-btn" style="${arrowButtonStyle}">${leftTriangle}</button>
        <div class="pr-dots-container" style="display: inline-block; margin: 0 10px;">
          ${dotsHTML}
        </div>
        <button class="pr-next-btn" style="${arrowButtonStyle}">${rightTriangle}</button>
      </div>
      ${design.showSubmitReviewButton ? `<div class="pr-submit-review-container" style="text-align: right; margin-top: 0.5rem;"><a href="/r/${businessSlug}" target="_blank" class="pr-submit-btn" style="${submitButtonStyle}">Submit a Review</a></div>` : ''}
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
    
    let autoAdvanceInterval = null;
    if (designData.autoAdvance && designData.slideshowSpeed) {
      const speedMs = (designData.slideshowSpeed || 4) * 1000;
      autoAdvanceInterval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % totalPages;
        moveToIndex(nextIndex);
      }, speedMs);
    }
    
    updateCarousel();
    
    window.addEventListener('beforeunload', () => {
      if (autoAdvanceInterval) {
        clearInterval(autoAdvanceInterval);
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

  // Auto-initialize widgets with data-widget-id
  function autoInitializeWidgets() {
    console.log('🔍 Auto-initializing widgets...');
    const widgets = document.querySelectorAll('[data-widget-id]');
    console.log(`Found ${widgets.length} widgets to initialize`);
    
    const loadCSS = () => {
      if (document.querySelector('link[href="/widgets/multi/multi-widget.css"]')) {
        console.log('✅ CSS already loaded');
        return Promise.resolve();
      }
      
      console.log('📥 Loading CSS from /widgets/multi/multi-widget.css...');
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/widgets/multi/multi-widget.css';
        link.onload = () => {
          console.log('✅ CSS loaded successfully');
          resolve();
        };
        link.onerror = (error) => {
          console.error('❌ Failed to load CSS:', error);
          reject(error);
        };
        document.head.appendChild(link);
      });
    };
    
    loadCSS().then(() => {
      widgets.forEach(widget => {
        const widgetId = widget.getAttribute('data-widget-id');
        console.log(`🎯 Initializing widget: ${widgetId}`);
        
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
              initializeWidget(widget.id, data.reviews, data.design, data.businessSlug || 'default');
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
    }).catch(error => {
      console.error('❌ Failed to load CSS, widgets may not display correctly:', error);
      widgets.forEach(widget => {
        const widgetId = widget.getAttribute('data-widget-id');
        console.log(`🎯 Initializing widget without CSS: ${widgetId}`);
        
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
              initializeWidget(widget.id, data.reviews, data.design, data.businessSlug || 'default');
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