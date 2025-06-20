// Multi Widget Embeddable Implementation
// This file is the vanilla JS Swiper-based implementation for the embeddable Multi widget.
// The dashboard preview version is rendered in src/app/dashboard/widget/page.tsx using the React MultiWidget component.
// Related files:
// - src/widget-embed/multi/MultiWidget.css (styles)
// - src/widget-embed/multi/embed-multi.jsx (embed entry point)
// - src/widget-embed/multi/dist/widget-embed.min.js (bundled JS)
// - src/widget-embed/multi/dist/widget.min.css (bundled CSS)

console.log('🔄 Multi Widget Script Loading...', new Date().toISOString());

if (!window.PromptReviews || !window.PromptReviews.renderMultiWidget) {


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
      addSwiperCSS(); // Ensure CSS is loaded first
      loadGoogleFonts(); // Ensure fonts are loaded first
      let attempts = 0;
      const checkSwiper = () => {
        if (typeof Swiper !== 'undefined') {
          console.log('Swiper is available');
          callback();
        } else if (attempts < maxAttempts) {
          attempts++;
          console.log(`Waiting for Swiper... Attempt ${attempts}`);
          setTimeout(checkSwiper, 100);
        } else {
          console.error('Swiper failed to load after maximum attempts');
          callback(); // Call callback anyway to show error in widget
        }
      };
      checkSwiper();
    }

    // Helper: Find the script's own URL to load assets relative to it
    function getScriptURL() {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src && scripts[i].src.includes('widget-embed.js')) {
                return scripts[i].src;
            }
        }
        return null;
    }

    // Helper: Dynamically load the widget's CSS file
    function loadWidgetCSS() {
        const cssId = 'pr-multi-widget-css';
        if (document.getElementById(cssId)) return; // CSS already loaded

        const scriptSrc = getScriptURL();
        if (!scriptSrc) {
            console.error('PromptReviews Widget: Could not determine script URL to load styles.');
            return;
        }
        
        // Add a cache-busting query string. Using a timestamp for simplicity.
        const cacheBuster = `?v=${new Date().getTime()}`;

        // e.g., "https://host.com/.../widget-embed.js" -> "https://host.com/.../multi-widget.css?v=123456789"
        const cssHref = scriptSrc.replace('widget-embed.js', 'multi-widget.css') + cacheBuster;
        
        console.log('PromptReviews Widget: Attempting to load CSS from:', cssHref); // DEBUG

        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssHref;

        link.onload = () => {
          console.log('PromptReviews Widget: CSS loaded successfully.'); // DEBUG
        };
        link.onerror = () => {
          console.error('PromptReviews Widget: FAILED to load CSS.'); // DEBUG
        };

        document.head.appendChild(link);
    }

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

    // Helper: Render star rating as SVGs
    function renderStars(rating) {
      if (typeof rating !== 'number' || rating < 0 || rating > 5) {
        rating = 5; // Default to 5 stars on invalid input
      }
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 !== 0;
      const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
      
      const stars = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
      return `<span class="stars" style="color: gold;">${stars}</span>`;
    }

    // Helper: Get relative time string
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

    function getInitials(first, last) {
        let f = first ? first[0] : '';
        let l = last ? last[0] : '';
        return (f + l).toUpperCase();
    }

    // Create widget HTML
    function createWidgetHTML(reviews, design, businessSlug) {
      // Use bgType to decide background style
      const backgroundStyle = design.bgType === 'solid'
        ? `background-color: ${hexToRgba(design.bgColor, design.bgOpacity)};`
        : 'background: transparent;';

      const font = design.font || 'Inter';

      const showSubmitButton = design.showSubmitReviewButton !== false && businessSlug;

      return `
        <div 
          class="pr-widget-container" 
          style="
            ${backgroundStyle}
            color: ${design.textColor}; 
            border-radius: ${design.borderRadius}px; 
            font-family: '${font}', sans-serif;
            ${design.border ? `border: ${design.borderWidth}px solid ${design.borderColor};` : ''}
            ${design.shadow ? `box-shadow: inset 0 0 70px 35px ${hexToRgba(design.shadowColor, design.shadowIntensity)};` : ''}
          "
        >
          <div class="pr-widget-inner">
            <div class="swiper">
              <div class="swiper-wrapper">
                ${reviews.map(review => `
                  <div class="swiper-slide">
                    <div class="review-card">
                      <div class="stars-row">${renderStars(review.star_rating)}</div>
                      <div class="review-content" style="line-height: ${design.lineSpacing || 1.4};">
                        ${design.showQuotes ? '<div class="decorative-quote decorative-quote-open">“</div>' : ''}
                        <div class="review-text">${review.review_content}</div>
                        ${design.showQuotes ? '<div class="decorative-quote decorative-quote-close">”</div>' : ''}
                      </div>
                      <div class="reviewer-details">
                        <div class="reviewer-photo">
                          <div class="reviewer-info">
                            <div class="reviewer-name" style="color: ${design.nameTextColor};">${review.first_name || ''} ${review.last_name || ''}</div>
                            <div class="reviewer-role" style="color: ${design.roleTextColor};">${review.reviewer_role || ''}</div>
                          </div>
                        </div>
                      </div>
                      ${design.showRelativeDate !== false ? `<div class="review-date">${getRelativeTime(review.created_at)}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="swiper-navigation">
              <div class="swiper-button-prev"></div>
              <div class="swiper-pagination"></div>
              <div class="swiper-button-next"></div>
            </div>
            
            ${showSubmitButton ? `
              <div class="submit-review-button-container">
                  <a href="/r/${businessSlug}" target="_blank" class="submit-review-button" style="background-color: ${design.accentColor};">
                    Submit a review
                  </a>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Initialize Swiper with the widget
    function initializeSwiper(container, design) {
      const widgetContainer = container.querySelector('.pr-multi-widget');
      if (widgetContainer && design) {
          console.log('%cApplying design settings:', 'color: blue; font-weight: bold;', design);
          const d = design;
          
          // Set the raw values first
          widgetContainer.style.setProperty('--pr-accent-color', d.accentColor || '#6a5acd');
          widgetContainer.style.setProperty('--pr-bg-color', d.bgColor || '#ffffff');
          widgetContainer.style.setProperty('--pr-text-primary', d.textColor || '#22223b');
          widgetContainer.style.setProperty('--pr-name-text-color', d.nameTextColor || '#1a237e');
          widgetContainer.style.setProperty('--pr-role-text-color', d.roleTextColor || '#6b7280');
          widgetContainer.style.setProperty('--pr-border-width', `${d.borderWidth || 2}px`);
          widgetContainer.style.setProperty('--pr-border-color', d.borderColor || '#cccccc');
          widgetContainer.style.setProperty('--pr-border-radius', `${d.borderRadius || 16}px`);
          widgetContainer.style.setProperty('--pr-attribution-font-size', `${d.attributionFontSize || 15}px`);
          widgetContainer.style.setProperty('--pr-line-spacing', d.lineSpacing || 1.4);
          widgetContainer.style.setProperty('--pr-shadow-intensity', d.shadowIntensity || 0.2);
          widgetContainer.style.setProperty('--pr-shadow-color-raw', d.shadowColor || '#222222');
          widgetContainer.style.setProperty('--pr-font', d.font || 'Inter');

          // Construct composite properties for the card
          if (d.border !== false) {
              const borderWidth = d.borderWidth || 2;
              const borderColor = d.borderColor || '#cccccc';
              widgetContainer.style.setProperty('--pr-card-border', `${borderWidth}px solid ${borderColor}`);
              widgetContainer.style.setProperty('--pr-button-border', `${borderWidth}px solid ${borderColor}`);
          } else {
              widgetContainer.style.setProperty('--pr-card-border', 'none');
              widgetContainer.style.setProperty('--pr-button-border', 'none');
          }

          if (d.shadow !== false) {
              const shadowColor = d.shadowColor || '#222222';
              const shadowIntensity = d.shadowIntensity || 0.2;
              const rgba = hexToRgba(shadowColor, shadowIntensity);
              // The dashboard ONLY uses an inset shadow. There is no outer box-shadow.
              widgetContainer.style.setProperty('--pr-card-shadow', `0 4px 32px ${rgba} inset`);
              
              // Also set button shadow with the same color but lower intensity and smaller blur for pill shapes
              const buttonRgba = hexToRgba(shadowColor, shadowIntensity * 0.75); // 75% of card intensity
              widgetContainer.style.setProperty('--pr-button-shadow', `0 1px 4px ${buttonRgba} inset`);
          } else {
              widgetContainer.style.setProperty('--pr-card-shadow', 'none');
              widgetContainer.style.setProperty('--pr-button-shadow', 'none');
          }

          // Apply background color for the entire widget section, exactly like the dashboard component
          if (d.sectionBgType === 'custom' && d.sectionBgColor) {
              const sectionContainer = widgetContainer.parentElement; // The .promptreviews-widget div
              if(sectionContainer) {
                  sectionContainer.style.backgroundColor = d.sectionBgColor;
                  sectionContainer.style.padding = '2rem 0'; // Add padding only when bg is set
              }
          }
      }

      // Desktop Swiper
      const desktopSwiperContainer = container.querySelector('.swiper-desktop');
      if (desktopSwiperContainer) {
        new Swiper(desktopSwiperContainer, {
                    slidesPerView: 1,
          spaceBetween: 0,
                    observer: true,
                    observeParents: true,
                    navigation: {
            nextEl: '.widget-desktop .swiper-button-next',
            prevEl: '.widget-desktop .swiper-button-prev',
                    },
                    pagination: {
            el: '.widget-desktop .swiper-pagination',
                        clickable: true,
                    },
                    breakpoints: {
            768: { slidesPerView: 2, spaceBetween: 0 },
            1280: { slidesPerView: 3, spaceBetween: 0 }
          }
        });
      }

      // Mobile Swiper
      const mobileSwiperContainer = container.querySelector('.swiper-mobile');
      if (mobileSwiperContainer) {
        new Swiper(mobileSwiperContainer, {
                            slidesPerView: 1,
          spaceBetween: 0,
          centeredSlides: true,
          observer: true,
          observeParents: true,
          pagination: {
            el: '.widget-mobile .swiper-pagination',
            clickable: true,
          },
          navigation: {
            nextEl: '.widget-mobile .swiper-button-next',
            prevEl: '.widget-mobile .swiper-button-prev',
          },
          breakpoints: {
            768: { slidesPerView: 2, spaceBetween: 0 },
            1280: { slidesPerView: 3, spaceBetween: 0 }
          }
        });
      }
    }

    // Main render function
    function renderMultiWidget(container, data) {
      // Add CSS and fonts right away
      loadWidgetCSS();
      addSwiperCSS();
      loadGoogleFonts();
      
      console.log('🎯 renderMultiWidget called. Full data from API:', data);

      // Ensure Swiper is loaded before proceeding
      loadSwiperJS().then(() => {
        // Clear container
        container.innerHTML = '';

        // --- Define default design settings ---
        const defaultDesign = {
          bgColor: "#ffffff",
          textColor: "#22223b",
          accentColor: "#6a5acd",
          bodyTextColor: "#22223b",
          nameTextColor: "#1a237e",
          roleTextColor: "#6b7280",
          borderColor: "#cccccc",
          font: "Inter",
          showSubmitReviewButton: true,
        };

        // Extract data and merge design with defaults
        const { reviews = [], design: userDesign = {}, businessSlug } = data;
        console.log('%cUser design from data:', 'color: green; font-weight: bold;', userDesign);
        const design = { ...defaultDesign, ...userDesign };
        console.log('%cFinal merged design:', 'color: purple; font-weight: bold;', design);
        
        if (!reviews || reviews.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-400 py-8">No reviews available</div>';
          return;
        }

        // Create widget HTML
        const widgetHTML = createWidgetHTML(reviews, design, businessSlug);
        container.innerHTML = widgetHTML;

        // Initialize Swiper after a short delay to ensure DOM is ready
        setTimeout(() => {
          initializeSwiper(container, design);
          
          // Update Swiper after a brief delay to ensure all content is rendered and heights are calculated
          setTimeout(() => {
            const swiper = container.querySelector('.swiper')?.swiper;
            if (swiper) {
              swiper.update();
              swiper.updateSize();
              swiper.updateSlides();
              console.log('Swiper updated after content render');
            }
          }, 200);
        }, 100);
      }).catch(error => {
        console.error('Failed to load Swiper:', error);
                container.innerHTML = `
          <div class="text-center text-gray-400 py-8">
            <p>Widget loading failed</p>
            <p class="text-sm">${error.message}</p>
                    </div>
                `;
        });
    }

    // Load all multi widgets on the page
    async function loadMultiWidgets() {
        console.log('🔍 loadMultiWidgets called - searching for widgets...');
        const widgets = document.querySelectorAll('.promptreviews-widget[data-widget-type="multi"]');
        console.log('Found widgets:', widgets.length, widgets);
        
        for (const widget of widgets) {
            const widgetId = widget.getAttribute('data-widget');
            console.log('Processing widget with ID:', widgetId);
            if (!widgetId) {
                console.log('No widget ID found, skipping...');
                continue;
            }

            try {
                console.log('Fetching data for widget:', widgetId);
                const response = await fetch(`/api/widgets/${widgetId}`);
                if (!response.ok) throw new Error('Failed to load widget data');
                const data = await response.json();
                console.log('Widget data received:', data);
                renderMultiWidget(widget, data);
            } catch (error) {
                console.error('Error loading widget:', error);
                widget.innerHTML = '<div class="error">Failed to load widget</div>';
            }
        }
    }

    // Initialize widgets when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📅 DOMContentLoaded event fired');
        loadMultiWidgets();
    });
    
    // Also try on window load as a fallback
    window.addEventListener('load', () => {
        console.log('🌐 Window load event fired');
        // Only load if not already loaded
        if (!document.querySelector('.promptreviews-widget[data-widget-type="multi"] .widget-content')) {
            loadMultiWidgets();
        }
    });

    // Expose renderMultiWidget globally for embedding
    window.PromptReviews.renderMultiWidget = renderMultiWidget;

    // Add the function that the dashboard expects
    window.initializePromptReviewsWidget = async function(widgetId) {
        console.log('initializePromptReviewsWidget called with widgetId:', widgetId);
        // This function is called by the dashboard but we don't need it
        // since the dashboard calls renderMultiWidget directly
        return Promise.resolve();
    };

    console.log('Widget script loaded successfully');
  })();
}
