// Single Widget Embeddable Implementation
// This file is the vanilla JS Swiper-based implementation for the embeddable Single widget.
// The dashboard preview version is rendered in src/app/dashboard/widget/page.tsx using the React SingleWidget component.
// Related files:
// - src/widget-embed/single/SingleWidget.css (styles)
// - src/widget-embed/single/embed-single.jsx (embed entry point)
// - src/widget-embed/single/dist/widget-embed.min.js (bundled JS)
// - src/widget-embed/single/dist/widget.min.css (bundled CSS)

console.log('🔄 Single Widget Script Loading...', new Date().toISOString());

if (!window.PromptReviews || !window.PromptReviews.renderSingleWidget) {


  (function() {
    console.log('IIFE starting...');
    // Create global namespace
    window.PromptReviews = window.PromptReviews || {};

    // Add Swiper CSS if not already present
    function addSwiperCSS() {
      if (document.getElementById('swiper-css')) return;
      
      const style = document.createElement('style');
      style.id = 'swiper-css';
      style.textContent = `
        .swiper-button-next,
        .swiper-button-prev {
          position: absolute;
          top: 50%;
          width: 27px;
          height: 44px;
          margin-top: calc(0px - (44px / 2));
          z-index: 10;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--swiper-navigation-color, var(--swiper-theme-color));
        }
        .swiper-button-next.swiper-button-disabled,
        .swiper-button-prev.swiper-button-disabled {
          opacity: 0.35;
          cursor: auto;
          pointer-events: none;
        }
        .swiper-button-next:after,
        .swiper-button-prev:after {
          font-family: swiper-icons;
          font-size: 44px;
          text-transform: none !important;
          letter-spacing: 0;
          text-transform: none;
          font-variant: initial;
          line-height: 1;
        }
        .swiper-button-prev,
        .swiper-rtl .swiper-button-next {
          left: 10px;
          right: auto;
        }
        .swiper-button-prev:after,
        .swiper-rtl .swiper-button-next:after {
          content: 'prev';
        }
        .swiper-button-next,
        .swiper-rtl .swiper-button-prev {
          right: 10px;
          left: auto;
        }
        .swiper-button-next:after,
        .swiper-rtl .swiper-button-prev:after {
          content: 'next';
        }
        .swiper-button-lock {
          display: none;
        }
        .swiper-pagination {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 16px;
        }
        .swiper-pagination.swiper-pagination-hidden {
          opacity: 0;
        }
        .swiper-pagination-disabled > .swiper-pagination,
        .swiper-pagination.swiper-pagination-disabled {
          display: none !important;
        }
        .swiper-pagination-bullet {
          width: 8px !important;
          height: 8px !important;
          background: #ccc;
          opacity: 1;
          margin: 0 4px;
          transition: all 0.2s ease;
          border-radius: 50%;
          display: inline-block;
        }
        .swiper-pagination-bullet-active {
          transform: scale(1.2);
          background: var(--swiper-pagination-color, var(--swiper-theme-color));
        }
        .swiper-button-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Responsive classes for embedded widget */
        .hidden { display: none !important; }
        .block { display: block !important; }
        .flex { display: flex !important; }
        .flex-col { flex-direction: column !important; }
        .items-center { align-items: center !important; }
        .justify-center { justify-content: center !important; }
        .justify-end { justify-content: flex-end !important; }
        .w-full { width: 100% !important; }
        .max-w-5xl { max-width: 64rem !important; }
        .max-w-\\[400px\\] { max-width: 400px !important; }
        .mx-auto { margin-left: auto !important; margin-right: auto !important; }
        .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
        .px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
        .mt-4 { margin-top: 1rem !important; }
        .pr-8 { padding-right: 2rem !important; }
        .relative { position: relative !important; }
        .absolute { position: absolute !important; }
        .top-1\\/2 { top: 50% !important; }
        .-translate-y-1\\/2 { transform: translateY(-50%) !important; }
        .-left-8 { left: -2rem !important; }
        .-right-8 { right: -2rem !important; }
        .left-0 { left: 0 !important; }
        .right-0 { right: 0 !important; }
        .z-10 { z-index: 10 !important; }
        .rounded-full { border-radius: 9999px !important; }
        .w-10 { width: 2.5rem !important; }
        .h-10 { height: 2.5rem !important; }
        .min-w-10 { min-width: 2.5rem !important; }
        .min-h-10 { min-height: 2.5rem !important; }
        .border { border-width: 1px !important; }
        .border-gray-200 { border-color: #e5e7eb !important; }
        .transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter !important; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important; transition-duration: 150ms !important; }
        .hover\\:bg-opacity-80:hover { --tw-bg-opacity: 0.8 !important; }
        .md\\:block { display: none; }
        .md\\:hidden { display: block; }
        
        @media (min-width: 768px) {
          .md\\:block { display: block !important; }
          .md\\:hidden { display: none !important; }
        }
        .group:focus .group-focus\\:fill-white { fill: white !important; }
        .overflow-hidden { overflow: hidden !important; }
        
        .md\\:block { display: none; }
        .md\\:flex { display: none; }
      `;
      document.head.appendChild(style);
    }

    // Load Google Fonts if not already present
    function loadGoogleFonts() {
      if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap';
        document.head.appendChild(fontLink);
        console.log('Google Fonts (Inter) added to page');
      }
    }

    // Load Swiper JS if not already present
    function loadSwiperJS() {
      return new Promise((resolve, reject) => {
        // Check if Swiper is already loaded
        if (typeof Swiper !== 'undefined') {
          console.log('Swiper already loaded');
          resolve();
          return;
        }

        // Check if Swiper script is already being loaded
        if (document.querySelector('script[src*="swiper"]')) {
          console.log('Swiper script already loading, waiting...');
          waitForSwiper(resolve, 20);
          return;
        }

        // Load Swiper script
        console.log('Loading Swiper script...');
        const swiperScript = document.createElement('script');
        swiperScript.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
        swiperScript.async = true;
        swiperScript.onload = () => {
          console.log('Swiper script loaded successfully');
          resolve();
        };
        swiperScript.onerror = () => {
          console.error('Failed to load Swiper script');
          reject(new Error('Failed to load Swiper'));
        };
        document.head.appendChild(swiperScript);
      });
    }

    // Wait for Swiper to be available
    function waitForSwiper(callback, maxAttempts = 10) {
      let attempts = 0;
      const checkSwiper = () => {
        attempts++;
        if (typeof Swiper !== 'undefined') {
          console.log('Swiper detected after', attempts, 'attempts');
          callback();
        } else if (attempts < maxAttempts) {
          setTimeout(checkSwiper, 100);
        } else {
          console.error('Swiper not available after', maxAttempts, 'attempts');
          callback(); // Continue anyway
        }
      };
      checkSwiper();
    }

    // Get the script URL to determine the base path for loading CSS
    function getScriptURL() {
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('widget-embed.js')) {
          return scripts[i].src;
        }
      }
      return null;
    }

    // Load widget CSS
    function loadWidgetCSS() {
      const scriptSrc = getScriptURL();
      if (!scriptSrc) {
        console.error("PromptReviews Widget: Could not determine script URL to load styles.");
        return;
      }
      
      const cacheBuster = `?v=${new Date().getTime()}`;
      // e.g., "https://host.com/.../widget-embed.js" -> "https://host.com/.../single-widget.css?v=123456789"
      const cssHref = scriptSrc.replace('widget-embed.js', 'single-widget.css') + cacheBuster;
      
      console.log("PromptReviews Widget: Attempting to load CSS from:", cssHref);
      
      const link = document.createElement('link');
      link.id = 'promptreviews-widget-css';
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = cssHref;
      
      link.onload = () => {
        console.log("PromptReviews Widget: CSS loaded successfully");
      };
      
      link.onerror = () => {
        console.error("PromptReviews Widget: Failed to load CSS from:", cssHref);
      };
      
      document.head.appendChild(link);
    }

    // Utility functions
    function hexToRgba(hex, alpha = 1) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function lightenHex(hex, amount = 0.7) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const lightR = Math.min(255, r + (255 - r) * amount);
      const lightG = Math.min(255, g + (255 - g) * amount);
      const lightB = Math.min(255, b + (255 - b) * amount);
      return `#${Math.round(lightR).toString(16).padStart(2, '0')}${Math.round(lightG).toString(16).padStart(2, '0')}${Math.round(lightB).toString(16).padStart(2, '0')}`;
    }

    function renderStars(rating) {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
      
      return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
    }

    function getRelativeTime(dateString) {
      const now = new Date();
      const date = new Date(dateString);
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
      return `${Math.floor(diffInSeconds / 31536000)}y ago`;
    }

    function getInitials(first, last) {
      return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();
    }

    // Create widget HTML
    function createWidgetHTML(reviews, design, businessSlug) {
      const widgetId = 'promptreviews-single-widget-' + Math.random().toString(36).substr(2, 9);
      
      // Generate CSS variables for dynamic styling
      const cssVars = `
        --pr-bg-color: ${design.bgColor || '#ffffff'};
        --pr-text-primary: ${design.textColor || '#22223b'};
        --pr-text-secondary: ${design.bodyTextColor || '#6b7280'};
        --pr-accent-color: ${design.accentColor || '#6a5acd'};
        --pr-border-color: ${design.borderColor || '#cccccc'};
        --pr-border-width: ${design.borderWidth || 2}px;
        --pr-border-radius: ${design.borderRadius || 16}px;
        --pr-shadow-intensity: ${design.shadowIntensity || 0.2};
        --pr-shadow-color: ${design.shadowColor || '#222222'};
        --pr-line-spacing: ${design.lineSpacing || 1.75};
        --pr-attribution-font-size: ${design.attributionFontSize || 16}px;
        --pr-name-text-color: ${design.nameTextColor || '#111111'};
        --pr-role-text-color: ${design.roleTextColor || '#666666'};
        --pr-font: ${design.font || 'Inter'};
      `;

      // Generate button shadow color (75% intensity of card shadow)
      const shadowColor = design.shadowColor || '#222222';
      const buttonShadowColor = hexToRgba(shadowColor, (design.shadowIntensity || 0.2) * 0.75);
      
      const additionalVars = `
        --pr-button-shadow: 0 1px 4px ${buttonShadowColor};
        --pr-button-border: ${design.border ? `${design.borderWidth || 2}px solid ${design.borderColor || '#cccccc'}` : 'none'};
      `;

      const reviewCards = reviews.map((review, index) => {
        const initials = getInitials(review.first_name, review.last_name);
        const relativeDate = design.showRelativeDate ? getRelativeTime(review.created_at) : new Date(review.created_at).toLocaleDateString();
        
        return `
          <div class="swiper-slide">
            <div class="pr-review-card">
              <div class="stars-row">
                <span style="color: #FFD700; font-size: 18px;">${renderStars(review.star_rating || 5)}</span>
              </div>
              
              <div class="review-content">
                ${design.showQuotes ? `<span class="decorative-quote decorative-quote-open">"</span>` : ''}
                <div class="review-text">${review.review_content}</div>
                ${design.showQuotes ? `<span class="decorative-quote decorative-quote-close">"</span>` : ''}
              </div>
              
              <div class="reviewer-details">
                <div class="reviewer-name">${review.first_name} ${review.last_name}</div>
                ${review.reviewer_role ? `<div class="reviewer-role">${review.reviewer_role}</div>` : ''}
                <div class="reviewer-date">${relativeDate}</div>
              </div>

              ${design.showSubmitReviewButton && businessSlug ? `
                <div class="submit-review-button-container">
                  <a href="https://promptreviews.app/r/${businessSlug}"
                     class="submit-review-button"
                     target="_blank"
                     rel="noopener noreferrer">
                    Submit a review
                  </a>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div id="${widgetId}" class="pr-single-widget" style="${cssVars} ${additionalVars}">
          <div class="widget-content">
            <div class="widget-outer-container">
              <div class="widget-carousel-container">
                <div class="swiper">
                  <div class="swiper-wrapper">
                    ${reviewCards}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Initialize Swiper
    function initializeSwiper(container, design) {
      if (typeof Swiper === 'undefined') {
        console.error('Swiper not available');
        return;
      }

      const swiperContainer = container.querySelector('.swiper');
      if (!swiperContainer) {
        console.error('Swiper container not found');
        return;
      }

      const swiper = new Swiper(swiperContainer, {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: false,
        autoplay: design.autoAdvance ? {
          delay: (design.slideshowSpeed || 4) * 1000,
          disableOnInteraction: false,
        } : false,
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        breakpoints: {
          768: {
            slidesPerView: 1,
            spaceBetween: 30,
          }
        }
      });

      return swiper;
    }

    // Main render function
    function renderSingleWidget(container, data) {
      console.log('Rendering Single Widget with data:', data);
      
      const { reviews, design, businessSlug } = data;
      
      if (!reviews || reviews.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">No reviews available</div>';
        return;
      }

      // Clear container
      container.innerHTML = '';
      
      // Create widget HTML
      const widgetHTML = createWidgetHTML(reviews, design, businessSlug);
      container.innerHTML = widgetHTML;
      
      // Initialize Swiper
      const widgetElement = container.querySelector('.pr-single-widget');
      if (widgetElement) {
        initializeSwiper(widgetElement, design);
      }
      
      console.log('Single Widget rendered successfully');
    }

    // Load all single widgets on the page
    async function loadSingleWidgets() {
      console.log('Loading Single Widgets...');
      
      // Add Swiper CSS
      addSwiperCSS();
      
      // Load Google Fonts
      loadGoogleFonts();
      
      // Load widget CSS
      loadWidgetCSS();
      
      // Load Swiper JS
      await loadSwiperJS();
      
      // Find all widget containers
      const containers = document.querySelectorAll('[data-widget-type="single"]');
      console.log('Found', containers.length, 'single widget containers');
      
      containers.forEach(async (container) => {
        const widgetId = container.getAttribute('data-widget');
        if (!widgetId) {
          console.error('No widget ID found');
          return;
        }
        
        try {
          // For now, we'll use mock data - in production this would fetch from your API
          const mockData = {
            reviews: [
              {
                id: '1',
                review_content: 'This is an amazing product! I love how easy it is to use and the results are fantastic.',
                first_name: 'John',
                last_name: 'Doe',
                reviewer_role: 'Product Manager',
                platform: 'Google',
                created_at: '2024-01-15T10:30:00Z',
                star_rating: 5
              },
              {
                id: '2',
                review_content: 'Excellent service and great value for money. Highly recommend!',
                first_name: 'Jane',
                last_name: 'Smith',
                reviewer_role: 'Marketing Director',
                platform: 'Yelp',
                created_at: '2024-01-10T14:20:00Z',
                star_rating: 5
              }
            ],
            design: {
              bgColor: '#ffffff',
              textColor: '#22223b',
              accentColor: '#6a5acd',
              borderColor: '#cccccc',
              borderWidth: 2,
              borderRadius: 16,
              shadowIntensity: 0.2,
              shadowColor: '#222222',
              lineSpacing: 1.75,
              attributionFontSize: 16,
              nameTextColor: '#111111',
              roleTextColor: '#666666',
              font: 'Inter',
              showQuotes: true,
              showRelativeDate: false,
              showSubmitReviewButton: true,
              autoAdvance: false,
              slideshowSpeed: 4
            },
            businessSlug: 'demo-business'
          };
          
          renderSingleWidget(container, mockData);
        } catch (error) {
          console.error('Error rendering single widget:', error);
          container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">Error loading widget</div>';
        }
      });
    }

    // Expose the render function globally
    window.PromptReviews.renderSingleWidget = renderSingleWidget;

    // Auto-load widgets when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadSingleWidgets);
    } else {
      loadSingleWidgets();
    }

  })();
}
