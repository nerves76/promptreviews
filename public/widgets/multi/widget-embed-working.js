// Working Multi Widget Embeddable Implementation
// This version has better error handling and fallbacks
console.log('🔄 Working Multi Widget Script Loading...', new Date().toISOString());

(function() {
  'use strict';

  window.PromptReviews = window.PromptReviews || {};

  function renderStars(rating) {
    if (typeof rating !== 'number' || rating < 0 || rating > 5) rating = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const stars = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    return `<span class="stars" style="color: gold; font-size: 1.25rem;">${stars}</span>`;
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

  function createReviewCard(review, design) {
    return `
      <div class="pr-review-card" style="
        background: ${design.bgColor || '#fff'};
        border: ${design.borderWidth || 2}px solid ${design.borderColor || '#cccccc'};
        border-radius: ${design.borderRadius || 16}px;
        box-shadow: 0 4px 32px rgba(34,34,34,${design.shadowIntensity || 0.2}) inset;
        padding: 1.5rem;
        min-height: 350px;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
        max-width: 420px;
        margin: 0 auto;
        box-sizing: border-box;
        text-align: center;
      ">
        <div class="stars-row" style="display: flex; gap: 0.25rem; margin-bottom: 0.5rem; justify-content: center;">
          ${renderStars(review.star_rating)}
        </div>
        <div class="review-content" style="flex-grow: 1; display: flex; flex-direction: column; gap: 0.25rem; align-items: center; justify-content: center;">
          ${design.showQuotes ? '<div style="font-size: 3.5rem; line-height: 1; color: ' + (design.accentColor || '#6a5acd') + '; opacity: 0.2; font-family: Georgia, serif; margin-bottom: -1.5rem; margin-left: -1rem; align-self: flex-start;">"</div>' : ''}
          <div class="review-text" style="
            font-size: 1rem;
            line-height: ${design.lineSpacing || 1.75};
            color: ${design.textColor || '#22223b'};
            margin: 0;
            text-align: center;
            word-wrap: break-word;
            overflow-wrap: break-word;
          ">${review.review_content}</div>
          ${design.showQuotes ? '<div style="font-size: 3.5rem; line-height: 1; color: ' + (design.accentColor || '#6a5acd') + '; opacity: 0.2; font-family: Georgia, serif; margin-top: -1.5rem; margin-right: -1rem; align-self: flex-end;">"</div>' : ''}
        </div>
        <div class="reviewer-details" style="margin-top: auto; padding-top: 1rem; border-top: 1px solid ${design.borderColor || '#cccccc'};">
          <div class="reviewer-name" style="
            font-weight: 600;
            font-size: ${design.attributionFontSize || 1}rem;
            color: ${design.nameTextColor || '#111111'};
            margin-bottom: 0.25rem;
            line-height: 1.2;
          ">${review.first_name || 'Anonymous'} ${review.last_name || ''}</div>
          <div class="reviewer-role" style="
            font-size: calc(${design.attributionFontSize || 1}rem * 0.875);
            color: ${design.roleTextColor || '#666666'};
            margin-bottom: 0.75rem;
          ">${review.reviewer_role || ''}</div>
          ${design.showRelativeDate ? `<div class="reviewer-date" style="font-size: 0.75rem; color: ${design.textColor || '#6b7280'}; opacity: 0.7;">${getRelativeTime(review.created_at)}</div>` : ''}
        </div>
      </div>
    `;
  }

  function createSwiperHTML(reviews, design, businessSlug) {
    console.log('🎨 Creating Swiper HTML for', reviews.length, 'reviews');
    
    const reviewSlides = reviews.map(review => `
      <div class="swiper-slide">
        ${createReviewCard(review, design)}
      </div>
    `).join('');

    return `
      <div class="widget-outer-container" style="
        position: relative;
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        padding: 0;
        box-sizing: border-box;
        overflow: visible;
      ">
        <div class="widget-carousel-container" style="
          position: relative;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
          overflow: visible;
        ">
          <div class="swiper" style="
            position: static;
            z-index: 1;
            overflow: hidden;
            padding-top: 10px;
            padding-bottom: 60px;
          ">
            <div class="swiper-wrapper" style="display: flex; align-items: stretch;">
              ${reviewSlides}
            </div>
          </div>
          <div class="swiper-pagination" style="
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 10;
          "></div>
          <div class="swiper-navigation" style="
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            transform: translateY(-50%);
            display: flex;
            justify-content: space-between;
            pointer-events: none;
            z-index: 10;
          ">
            <div class="swiper-button-prev" style="
              width: 40px;
              height: 40px;
              background: rgba(255,255,255,0.9);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              pointer-events: auto;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            ">‹</div>
            <div class="swiper-button-next" style="
              width: 40px;
              height: 40px;
              background: rgba(255,255,255,0.9);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              pointer-events: auto;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            ">›</div>
          </div>
        </div>
        ${design.showSubmitReviewButton ? `
        <div class="submit-review-button-container" style="text-align: center; margin-top: 2rem;">
          <a href="/r/${businessSlug}" target="_blank" class="submit-review-button" style="
            display: inline-block;
            background: ${design.accentColor || '#6a5acd'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: background-color 0.3s ease;
          ">Submit a review</a>
        </div>
        ` : ''}
      </div>
    `;
  }

  function createGridHTML(reviews, design, businessSlug) {
    console.log('🎨 Creating Grid HTML for', reviews.length, 'reviews');
    
    const reviewCards = reviews.map(review => createReviewCard(review, design)).join('');

    return `
      <div class="widget-outer-container" style="
        position: relative;
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        padding: 0;
        box-sizing: border-box;
        overflow: visible;
      ">
        <div class="widget-carousel-container" style="
          position: relative;
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0 1rem;
          overflow: visible;
        ">
          <div class="reviews-grid" style="
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 2rem;
            padding: 2rem 0;
          ">
            ${reviewCards}
          </div>
        </div>
        ${design.showSubmitReviewButton ? `
        <div class="submit-review-button-container" style="text-align: center; margin-top: 2rem;">
          <a href="/r/${businessSlug}" target="_blank" class="submit-review-button" style="
            display: inline-block;
            background: ${design.accentColor || '#6a5acd'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: background-color 0.3s ease;
          ">Submit a review</a>
        </div>
        ` : ''}
      </div>
      
      <style>
        @media (min-width: 768px) {
          .reviews-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .reviews-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      </style>
    `;
  }

  function loadSwiper(callback) {
    console.log('🔄 Loading Swiper...');
    
    // Check if Swiper is already loaded
    if (typeof Swiper !== 'undefined') {
      console.log('✅ Swiper already available');
      callback(true);
      return;
    }

    // Try multiple CDN sources for better reliability
    const swiperUrls = [
      'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
      'https://unpkg.com/swiper@11/swiper-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.js'
    ];
    
    const swiperCssUrls = [
      'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
      'https://unpkg.com/swiper@11/swiper-bundle.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/Swiper/11.0.5/swiper-bundle.min.css'
    ];
    
    let currentUrlIndex = 0;
    let cssLoaded = false;
    let jsLoaded = false;
    
    function checkBothLoaded() {
      if (cssLoaded && jsLoaded) {
        console.log('✅ Swiper CSS and JS both loaded successfully');
        callback(true);
      }
    }
    
    function tryNextUrl() {
      if (currentUrlIndex >= swiperUrls.length) {
        console.log('❌ All Swiper CDN sources failed');
        callback(false);
        return;
      }
      
      const swiperUrl = swiperUrls[currentUrlIndex];
      const swiperCssUrl = swiperCssUrls[currentUrlIndex];
      console.log(`📦 Trying Swiper from: ${swiperUrl}`);
      
      // Check if this script is already loading
      if (document.querySelector(`script[src="${swiperUrl}"]`)) {
        console.log('📦 Swiper script already loading, waiting...');
        // Wait for it to load
        const checkSwiper = setInterval(() => {
          if (typeof Swiper !== 'undefined') {
            clearInterval(checkSwiper);
            console.log('✅ Swiper loaded successfully');
            jsLoaded = true;
            checkBothLoaded();
          }
        }, 100);
        
        // Timeout after 3 seconds
        setTimeout(() => {
          clearInterval(checkSwiper);
          console.log('❌ Swiper loading timed out, trying next URL');
          currentUrlIndex++;
          tryNextUrl();
        }, 3000);
        return;
      }

      // Load Swiper CSS first
      const swiperCss = document.createElement('link');
      swiperCss.rel = 'stylesheet';
      swiperCss.href = swiperCssUrl;
      swiperCss.onload = () => {
        console.log('✅ Swiper CSS loaded successfully');
        cssLoaded = true;
        checkBothLoaded();
      };
      swiperCss.onerror = () => {
        console.error('❌ Failed to load Swiper CSS from', swiperCssUrl);
      };
      document.head.appendChild(swiperCss);

      // Load Swiper script
      const swiperScript = document.createElement('script');
      swiperScript.src = swiperUrl;
      swiperScript.onload = () => {
        console.log('✅ Swiper JS loaded successfully from', swiperUrl);
        jsLoaded = true;
        checkBothLoaded();
      };
      swiperScript.onerror = () => {
        console.error('❌ Failed to load Swiper from', swiperUrl);
        currentUrlIndex++;
        tryNextUrl();
      };
      document.head.appendChild(swiperScript);
    }
    
    tryNextUrl();
  }

  function initializeSwiper(container) {
    console.log('🎯 Initializing Swiper...');
    
    const swiperEl = container.querySelector('.swiper');
    if (!swiperEl) {
      console.log('❌ Swiper element not found');
      return;
    }

    const slides = swiperEl.querySelectorAll('.swiper-slide');
    console.log('📊 Found', slides.length, 'slides');
    
    if (slides.length <= 1) {
      console.log('📱 Single review, hiding Swiper controls');
      const pagination = container.querySelector('.swiper-pagination');
      const navigation = container.querySelector('.swiper-navigation');
      if (pagination) pagination.style.display = 'none';
      if (navigation) navigation.style.display = 'none';
      return;
    }

    try {
      const swiperInstance = new Swiper(swiperEl, {
        loop: false,
        spaceBetween: 16,
        centeredSlides: false,
        autoplay: false,
        breakpoints: {
          320: {
            slidesPerView: 1,
            spaceBetween: 16,
            centeredSlides: true
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
            centeredSlides: false
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 24,
            centeredSlides: false
          }
        },
        pagination: {
          el: container.querySelector('.swiper-pagination'),
          clickable: true,
          type: 'bullets',
          dynamicBullets: false
        },
        navigation: {
          nextEl: container.querySelector('.swiper-button-next'),
          prevEl: container.querySelector('.swiper-button-prev'),
        },
        on: {
          init: function() {
            console.log('✅ Swiper initialized successfully');
          }
        }
      });
      
      console.log('✅ Swiper initialized with responsive breakpoints');
    } catch (error) {
      console.error('❌ Failed to initialize Swiper:', error);
    }
  }

  window.PromptReviews.renderMultiWidget = function(container, data) {
    console.log('🎯 renderMultiWidget called');
    console.log('Container:', container);
    console.log('Data:', data);
    
    if (!container) {
      console.error('❌ No container provided');
      return;
    }
    
    if (container.dataset.widgetInitialized) {
      console.log('⚠️ Widget already initialized, skipping');
      return;
    }
    
    container.dataset.widgetInitialized = 'true';
    
    const { reviews, design, businessSlug } = data;

    console.log('🎯 renderMultiWidget called with', reviews.length, 'reviews');

    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No reviews to display.</div>';
      return;
    }
    
    // Try to load Swiper first
    loadSwiper((swiperAvailable) => {
      try {
        if (swiperAvailable && reviews.length > 1) {
          console.log('🎠 Using Swiper carousel');
          const widgetHTML = createSwiperHTML(reviews, design, businessSlug);
          container.innerHTML = widgetHTML;
          
          // Initialize Swiper after a short delay
          setTimeout(() => {
            initializeSwiper(container);
          }, 100);
        } else {
          console.log('📱 Using grid layout (Swiper not available or single review)');
          const widgetHTML = createGridHTML(reviews, design, businessSlug);
          container.innerHTML = widgetHTML;
        }
        
        console.log('✅ Widget rendered successfully');
      } catch (error) {
        console.error('❌ Error rendering widget:', error);
        // Fallback to grid layout
        console.log('🔄 Falling back to grid layout');
        const widgetHTML = createGridHTML(reviews, design, businessSlug);
        container.innerHTML = widgetHTML;
      }
    });
  };

  console.log('✅ Working widget script loaded successfully');
  console.log('🔧 PromptReviews object available:', !!window.PromptReviews);
  console.log('🔧 renderMultiWidget available:', !!(window.PromptReviews && window.PromptReviews.renderMultiWidget));

})(); 