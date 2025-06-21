// Multi Widget Embeddable Implementation
// This file is the vanilla JS Swiper-based implementation for the embeddable Multi widget.
console.log('🔄 Multi Widget Script Loading...', new Date().toISOString());

(function() {
  'use strict';

  window.PromptReviews = window.PromptReviews || {};

  function hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') {
      return 'rgba(255, 255, 255, 1)';
    }
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return 'rgba(255, 255, 255, 1)';
    }
    const validAlpha = Math.max(0, Math.min(1, isNaN(alpha) ? 1 : alpha));
    return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
  }

  function renderStars(rating) {
    if (typeof rating !== 'number' || rating < 0 || rating > 5) rating = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const stars = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    return `<span class="stars" style="color: gold;">${stars}</span>`;
  }

  function getRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }

  function loadDependencies(callback) {
    // Try multiple Swiper URLs in case one fails
    const swiperUrls = [
      'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
      'https://unpkg.com/swiper/swiper-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.js'
    ];
    const cssUrl = '/widgets/multi/multi-widget.css';

    let loaded = 0;
    const total = 2;

    function checkDone() {
      loaded++;
      if (loaded === total) {
        // Add a small delay to ensure Swiper is fully initialized
        setTimeout(() => {
          console.log('All dependencies loaded, Swiper available:', typeof Swiper !== 'undefined');
          callback();
        }, 100);
      }
    }

    // Load Swiper script with fallback URLs
    function loadSwiperScript(urlIndex = 0) {
      if (urlIndex >= swiperUrls.length) {
        console.error('All Swiper URLs failed to load');
        checkDone();
        return;
      }

      const swiperUrl = swiperUrls[urlIndex];
      console.log(`Trying to load Swiper from: ${swiperUrl}`);
      
      const swiperScript = document.createElement('script');
      swiperScript.src = swiperUrl;
      swiperScript.onload = () => {
        console.log(`Swiper script loaded from: ${swiperUrl}`);
        checkDone();
      };
      swiperScript.onerror = () => {
        console.warn(`Failed to load Swiper from: ${swiperUrl}`);
        loadSwiperScript(urlIndex + 1); // Try next URL
      };
      document.head.appendChild(swiperScript);
    }

    // Check if Swiper is already loaded
    if (typeof Swiper !== 'undefined') {
      console.log('Swiper already available globally');
      checkDone();
    } else if (document.querySelector('script[src*="swiper"]')) {
      console.log('Swiper script already in DOM, waiting...');
      checkDone();
    } else {
      loadSwiperScript();
    }

    // Load CSS
    if (!document.querySelector(`link[href="${cssUrl}"]`)) {
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';
      styleLink.href = cssUrl;
      styleLink.onload = () => {
        console.log('CSS loaded');
        checkDone();
      };
      styleLink.onerror = () => {
        console.error('Failed to load CSS');
        checkDone(); // Continue anyway
      };
      document.head.appendChild(styleLink);
    } else {
      console.log('CSS already loaded');
      checkDone();
    }
  }

  function createWidgetHTML(reviews, design, businessSlug) {
    const reviewSlides = reviews.map(review => `
      <div class="swiper-slide">
        <div class="pr-review-card">
          <div class="stars-row">${renderStars(review.star_rating)}</div>
          <div class="review-content">
            ${design.showQuotes ? '<div class="decorative-quote decorative-quote-open">"</div>' : ''}
            <div class="review-text">${review.review_content}</div>
            ${design.showQuotes ? '<div class="decorative-quote decorative-quote-close">"</div>' : ''}
          </div>
          <div class="reviewer-details">
            <div class="reviewer-name">${review.first_name || 'Anonymous'} ${review.last_name || ''}</div>
            <div class="reviewer-role">${review.reviewer_role || ''}</div>
            ${design.showRelativeDate ? `<div class="reviewer-date">${getRelativeTime(review.created_at)}</div>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="widget-outer-container">
        <div class="widget-carousel-container">
          <div class="swiper">
            <div class="swiper-wrapper">${reviewSlides}</div>
          </div>
          <div class="swiper-pagination"></div>
          <div class="swiper-navigation">
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
          </div>
        </div>
        ${design.showSubmitReviewButton ? `
        <div class="submit-review-button-container">
          <a href="/r/${businessSlug}" target="_blank" class="submit-review-button">Submit a review</a>
        </div>
        ` : ''}
      </div>
    `;
  }

  function initializeSwiper(container, design) {
    try {
      const swiperEl = container.querySelector('.swiper');
      if (!swiperEl) {
        console.error('Swiper element not found in container');
        return;
      }

      const slides = swiperEl.querySelectorAll('.swiper-slide');
      console.log('Found slides:', slides.length);
      
      if (slides.length <= 3 && window.innerWidth > 768) {
          container.classList.add('is-multi-static');
          console.log('Using static layout (no Swiper needed)');
          return;
      }

      console.log('Creating Swiper instance...');
      const swiper = new Swiper(swiperEl, {
        loop: slides.length > 3,
        slidesPerView: 1, // Base: 1 card on mobile
        spaceBetween: 16,
        centeredSlides: false, // Changed from true to false for better responsive behavior
        autoplay: design.autoAdvance ? { delay: design.slideshowSpeed * 1000 } : false,
        pagination: {
          el: container.querySelector('.swiper-pagination'),
          clickable: true,
        },
        navigation: {
          nextEl: container.querySelector('.swiper-button-next'),
          prevEl: container.querySelector('.swiper-button-prev'),
        },
        breakpoints: {
          // Mobile: 1 card (default, no breakpoint needed)
          // Tablet: 2 cards
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
            centeredSlides: false,
          },
          // Desktop: 3 cards
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
            centeredSlides: false,
          },
        },
      });

      // Store swiper instance for debugging
      container.swiperInstance = swiper;

      // Add resize listener to update Swiper when container size changes
      const resizeObserver = new ResizeObserver(() => {
        if (swiper && !swiper.destroyed) {
          swiper.update();
          console.log('Swiper updated on resize. Current breakpoint:', swiper.currentBreakpoint);
        }
      });
      resizeObserver.observe(container);

      // Add window resize listener as fallback
      const handleResize = () => {
        if (swiper && !swiper.destroyed) {
          swiper.update();
          console.log('Swiper updated on window resize. Current breakpoint:', swiper.currentBreakpoint);
        }
      };
      window.addEventListener('resize', handleResize);

      // Cleanup function
      container.cleanupSwiper = () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
        if (swiper && !swiper.destroyed) {
          swiper.destroy();
        }
      };

      console.log('Swiper initialized successfully with responsive breakpoints:', {
        currentBreakpoint: swiper.currentBreakpoint,
        slidesPerView: swiper.params.slidesPerView,
        containerWidth: container.offsetWidth
      });
    } catch (error) {
      console.error('Error initializing Swiper:', error);
      container.innerHTML += `<div style="color: red; padding: 10px;">Swiper Error: ${error.message}</div>`;
    }
  }
  
  function applyDesign(container, design) {
      const widgetContent = container.querySelector('.widget-content');
      if (widgetContent) {
          // Example of applying design:
          // widgetContent.style.setProperty('--pr-accent-color', design.accentColor);
      }
  }

  window.PromptReviews.renderMultiWidget = function(container, data) {
    console.log('renderMultiWidget called with:', data);
    
    if (!container || container.dataset.widgetInitialized) return;
    
    // Cleanup existing Swiper instance if it exists
    if (container.cleanupSwiper) {
      container.cleanupSwiper();
    }
    
    // Add the required CSS class for styling
    container.classList.add('pr-multi-widget');
    
    container.dataset.widgetInitialized = 'true';
    
    const { reviews, design, businessSlug } = data;

    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<div>No reviews to display.</div>';
      return;
    }

    loadDependencies(() => {
        try {
            console.log('Dependencies loaded, creating widget HTML...');
            const widgetHTML = createWidgetHTML(reviews, design, businessSlug);
            container.innerHTML = widgetHTML;
            applyDesign(container, design);
            
            console.log('Swiper available in render:', typeof Swiper !== 'undefined');
            if (typeof Swiper !== 'undefined') {
                initializeSwiper(container, design);
            } else {
                console.warn('Swiper not available, using static layout');
                // Fallback to static layout when Swiper is not available
                container.classList.add('is-multi-static');
                container.innerHTML += '<div style="color: orange; padding: 10px; font-size: 12px;">Note: Carousel disabled (Swiper not loaded)</div>';
            }
        } catch (error) {
            console.error('Error in widget initialization:', error);
            container.innerHTML = `<div style="color: red; padding: 10px;">Widget Error: ${error.message}</div>`;
        }
    });
  };

  // Add cleanup function to global scope
  window.PromptReviews.cleanupWidget = function(container) {
    if (container && container.cleanupSwiper) {
      container.cleanupSwiper();
    }
    if (container) {
      delete container.dataset.widgetInitialized;
      delete container.swiperInstance;
      delete container.cleanupSwiper;
    }
  };

  function init() {
      const widgets = document.querySelectorAll('#promptreviews-widget[data-widget-id]');
      widgets.forEach(widget => {
          const widgetId = widget.dataset.widgetId;
          if (widgetId) {
              fetch(`/api/widgets/${widgetId}`)
                  .then(res => res.json())
                  .then(data => {
                      if (data) {
                          window.PromptReviews.renderMultiWidget(widget, data);
                      }
                  })
                  .catch(console.error);
          }
      });
  }
  
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
  } else {
      init();
  }

})();
