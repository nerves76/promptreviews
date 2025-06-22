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
        width: 320px;
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

  function createGridHTML(reviews, design, businessSlug) {
    console.log('🎨 Creating Responsive Carousel for', reviews.length, 'reviews');
    
    const reviewCards = reviews.map(review => createReviewCard(review, design)).join('');

    return `
      <div class="widget-outer-container" style="
        position: relative;
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        padding: 0;
        box-sizing: border-box;
      ">
        <div class="reviews-carousel-container" style="
          overflow: hidden;
          position: relative;
          width: 100%;
        ">
          <div class="reviews-carousel" style="
            display: flex;
            gap: 1.5rem;
            padding: 2rem 1.5rem 1rem 1.5rem;
            transition: transform 0.5s ease-in-out;
            transform: translateX(0px);
          ">
            ${reviewCards}
          </div>
        </div>
        
        <!-- All Controls Container -->
        <div class="all-controls-container" style="
            padding: 1rem 1rem 0 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
        ">
            <!-- Navigation and Pagination Container -->
            <div class="carousel-controls" style="
              display: flex;
              align-items: center;
              gap: 1rem;
              z-index: 10;
            ">
              <!-- Left Arrow -->
              <button class="carousel-button-prev" style="
                width: 36px;
                height: 36px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border: 2px solid ${design.accentColor || '#6a5acd'};
                font-size: 20px;
                font-weight: bold;
                color: ${design.accentColor || '#6a5acd'};
                transition: all 0.2s ease;
                box-shadow: 0 1px 4px rgba(0,0,0,0.1);
              ">‹</button>
              
              <!-- Pagination Dots -->
              <div class="carousel-pagination" style="
                display: flex;
                gap: 8px;
              "></div>
              
              <!-- Right Arrow -->
              <button class="carousel-button-next" style="
                width: 36px;
                height: 36px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border: 2px solid ${design.accentColor || '#6a5acd'};
                font-size: 20px;
                font-weight: bold;
                color: ${design.accentColor || '#6a5acd'};
                transition: all 0.2s ease;
                box-shadow: 0 1px 4px rgba(0,0,0,0.1);
              ">›</button>
            </div>
            
            ${design.showSubmitReviewButton ? `
            <div class="submit-review-button-container" style="text-align: center;">
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
      </div>
      
      <style>
        .pr-review-card {
          flex: 0 0 320px;
          width: 320px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .pr-review-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 40px rgba(34,34,34,0.3) !important;
        }
        .carousel-button-prev:hover,
        .carousel-button-next:hover {
          background: rgba(255,255,255,1) !important;
          transform: scale(1.1);
        }
      </style>
    `;
  }

  function initializeGridNavigation(container, totalReviews) {
    console.log('🔧 Initializing responsive carousel navigation for', totalReviews, 'reviews');
    
    const carouselControls = container.querySelector('.carousel-controls');
    const carouselButtonPrev = container.querySelector('.carousel-button-prev');
    const carouselButtonNext = container.querySelector('.carousel-button-next');
    const carouselPagination = container.querySelector('.carousel-pagination');
    const carouselContainer = container.querySelector('.reviews-carousel-container');
    const carousel = container.querySelector('.reviews-carousel');
    const reviewCards = container.querySelectorAll('.pr-review-card');

    console.log('🔧 Found elements:', {
      carouselControls: !!carouselControls,
      carouselButtonPrev: !!carouselButtonPrev,
      carouselButtonNext: !!carouselButtonNext,
      carouselPagination: !!carouselPagination,
      carouselContainer: !!carouselContainer,
      carousel: !!carousel,
      reviewCards: reviewCards.length
    });

    if (reviewCards.length === 0) {
      console.log('⚠️ No review cards found, skipping navigation');
      return;
    }

    if (!carouselContainer || !carousel) {
      console.error('❌ Required carousel elements not found');
      return;
    }

    const cardWidth = 320;
    const gap = 24;
    let currentIndex = 0;
    
    function getCardsPerView() {
        const outerContainer = container.querySelector('.widget-outer-container');
        const containerWidth = outerContainer ? outerContainer.offsetWidth : carouselContainer.offsetWidth;
        console.log('🔧 Outer container width:', containerWidth);
        
        if (containerWidth === 0) {
          console.log('⚠️ Container width is 0, using fallback');
          return 1;
        }
        
        // Calculate how many full cards can fit in the available space
        // Account for the horizontal padding (48px total) and gaps between cards
        const availableWidth = containerWidth - 48; // Subtract padding
        const cards = Math.floor(availableWidth / (cardWidth + gap));
        const result = Math.max(1, Math.min(cards, totalReviews)); // Don't exceed total reviews
        
        console.log('🔧 Cards per view calculation:', {
          containerWidth,
          availableWidth,
          cardWidth,
          gap,
          calculatedCards: cards,
          finalResult: result
        });
        
        return result;
    }

    function updateContainerWidth() {
        const cardsPerView = getCardsPerView();
        
        // Calculate the exact width needed for the cards and gaps
        const cardTotalWidth = cardsPerView * cardWidth;
        const gapTotalWidth = (cardsPerView - 1) * gap;
        const contentWidth = cardTotalWidth + gapTotalWidth;
        
        // Add the horizontal padding (1.5rem = 24px on each side)
        const totalContainerWidth = contentWidth + 48;
        
        carouselContainer.style.width = `${totalContainerWidth}px`;
        carouselContainer.style.margin = '0 auto';
        carouselContainer.style.maxWidth = '100%';
        
        console.log('🔧 Container calculation:', {
            cardsPerView,
            cardTotalWidth,
            gapTotalWidth,
            contentWidth,
            totalContainerWidth
        });
        
        return cardsPerView;
    }

    let cardsPerView = updateContainerWidth();

    if (totalReviews <= cardsPerView) {
        console.log('🔧 All reviews fit in view, hiding controls');
        if (carouselControls) {
            carouselControls.style.display = 'none';
        }
        return;
    }

    function updateCarousel() {
        const offset = currentIndex * (cardWidth + gap);
        carousel.style.transform = `translateX(-${offset}px)`;

        // Always show both arrow buttons
        if (carouselButtonPrev) {
          carouselButtonPrev.style.display = 'flex';
        }
        
        if (carouselButtonNext) {
          carouselButtonNext.style.display = 'flex';
        }
        
        updatePagination();
    }
    
    function updatePagination() {
        if (!carouselPagination) return;
        
        carouselPagination.innerHTML = '';
        const pageCount = Math.ceil(totalReviews / cardsPerView);
        
        if (pageCount <= 1) return;

        const currentPage = Math.round(currentIndex / cardsPerView);

        for (let i = 0; i < pageCount; i++) {
            const dot = document.createElement('button');
            dot.style.cssText = `
              width: 12px; height: 12px; border-radius: 50%; border: none;
              background: ${i === currentPage ? '#6a5acd' : '#ddd'}; 
              cursor: pointer; transition: background 0.3s ease;
            `;
            dot.addEventListener('click', () => {
              let targetIndex = i * cardsPerView;
              if (targetIndex > totalReviews - cardsPerView) {
                targetIndex = totalReviews - cardsPerView;
              }
              currentIndex = targetIndex;
              updateCarousel();
            });
            carouselPagination.appendChild(dot);
        }
    }

    if (carouselButtonPrev) {
      carouselButtonPrev.addEventListener('click', () => {
          const prevIndex = currentIndex - cardsPerView;
          currentIndex = Math.max(0, prevIndex);
          updateCarousel();
      });
    }

    if (carouselButtonNext) {
      carouselButtonNext.addEventListener('click', () => {
          const nextIndex = currentIndex + cardsPerView;
          currentIndex = Math.min(nextIndex, totalReviews - cardsPerView);
          updateCarousel();
      });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            console.log('🔄 Window resized, recalculating...');
            const oldCardsPerView = cardsPerView;
            const newCardsPerView = updateContainerWidth();
            
            console.log('🔧 Old cards per view:', oldCardsPerView, 'New cards per view:', newCardsPerView);
            
            if (newCardsPerView !== oldCardsPerView) {
                cardsPerView = newCardsPerView;
                
                // Recalculate current index to maintain relative position
                const oldPage = Math.round(currentIndex / oldCardsPerView);
                let targetIndex = oldPage * cardsPerView;
                
                // Ensure we don't go beyond the last valid position
                if (targetIndex > totalReviews - cardsPerView) {
                    targetIndex = totalReviews - cardsPerView;
                }
                currentIndex = Math.max(0, targetIndex);
                
                console.log('🔧 Updated current index to:', currentIndex, 'for', cardsPerView, 'cards per view');
                updateCarousel();
            }
        }, 100);
    });

    updateCarousel();
    console.log('✅ Responsive carousel navigation initialized successfully');
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
    
    const widgetHTML = createGridHTML(reviews, design, businessSlug);
    container.innerHTML = widgetHTML;
    
    // Defer initialization to ensure DOM is ready
    setTimeout(() => {
      initializeGridNavigation(container, reviews.length);
    }, 100);
    
    console.log('✅ Widget rendered successfully');
  };

  console.log('✅ Working widget script loaded successfully');
  console.log('🔧 PromptReviews object available:', !!window.PromptReviews);
  console.log('🔧 renderMultiWidget available:', !!(window.PromptReviews && window.PromptReviews.renderMultiWidget));

})(); 