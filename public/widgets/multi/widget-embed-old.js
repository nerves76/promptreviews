// Multi Widget Embeddable Implementation
// This file is the vanilla JS Swiper-based implementation for the embeddable Multi widget.
// The dashboard preview version is rendered in src/app/dashboard/widget/page.tsx using the React MultiWidget component.
// Related files:
// - src/widget-embed/multi/MultiWidget.css (styles)
// - src/widget-embed/multi/embed-multi.jsx (embed entry point)
// - src/widget-embed/multi/dist/widget-embed.min.js (bundled JS)
// - src/widget-embed/multi/dist/widget.min.css (bundled CSS)

if (!window.PromptReviews || !window.PromptReviews.renderMultiWidget) {


  (function() {
    console.log('IIFE starting...');
    // Create global namespace
    window.PromptReviews = window.PromptReviews || {};

    // Wait for Swiper to be available
    function waitForSwiper(callback, maxAttempts = 10) {
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
        }
      };
      checkSwiper();
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
        if (typeof rating !== 'number' || isNaN(rating)) return '';
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const full = i <= Math.floor(rating);
            const half = !full && i - 0.5 <= rating;
            const gradientId = `half-star-gradient-${i}-${Math.random()}`;
            stars += `<svg width="20" height="20" viewBox="0 0 20 20" fill="${full ? '#FBBF24' : half ? `url(#${gradientId})` : '#E5E7EB'}" stroke="#FBBF24" style="display: inline-block; margin-right: 2px;">${half ? `<defs><linearGradient id="${gradientId}"><stop offset="50%" stopColor="#FBBF24" /><stop offset="50%" stopColor="#E5E7EB" /></linearGradient></defs>` : ''}<polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>`;
        }
        return `<span class="stars-row">${stars}</span>`;
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

    // Generate scoped CSS for the widget
    function generateScopedCSS(widgetClass) {
        return `
            @import url('https://fonts.googleapis.com/css?family=Inter:100,200,300,400,500,600,700,800,900&display=swap');
            @font-face { 
                font-family:'Inter Fallback'; 
                src:local("Arial"); 
                ascent-override:90.44%; 
                descent-override:22.52%; 
                line-gap-override:0.00%; 
                size-adjust:107.12%; 
            }

            /* Base styles */
            .${widgetClass} {
                font-family: var(--pr-font, 'Inter'), 'Inter Fallback', system-ui, -apple-system, sans-serif;
                --pr-accent-color: #6a5acd;
                --pr-accent-hover: #4a3f8c;
                --pr-text-primary: #22223b;
                --pr-text-secondary: #6b7280;
                --pr-border-color: #cccccc;
                --pr-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                --pr-card-bg: var(--pr-bg-color, #ffffff);
                --pr-card-border: var(--pr-border-width, 2px) solid var(--pr-border-color, #cccccc);
                --pr-card-radius: var(--pr-border-radius, 16px);
                --pr-card-shadow: 0 4px 32px rgba(34, 34, 34, var(--pr-shadow-intensity, 0.2)) inset;
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
                padding: 1rem;
                box-sizing: border-box;
            }

            /* Widget Content */
            .${widgetClass} .widget-content {
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 1rem;
            }

            /* Carousel Container */
            .${widgetClass} .widget-carousel-container {
                position: relative;
                width: 100%;
                margin: 0 auto;
                padding: 0 2rem;
            }

            /* Swiper Container */
            .${widgetClass} .swiper {
                width: 100%;
                padding: 2rem 0;
                overflow: hidden;
            }

            /* Swiper Slides */
            .${widgetClass} .swiper-slide {
                display: flex;
                justify-content: center;
                align-items: stretch;
                height: auto;
            }

            .${widgetClass} .swiper-slide-active {
                z-index: 1;
            }

            /* Review Cards */
            .${widgetClass} .pr-review-card {
                background: var(--pr-card-bg, #fff);
                border: var(--pr-card-border, 2px solid #cccccc);
                border-radius: var(--pr-card-radius, 16px);
                box-shadow: var(--pr-card-shadow, 0 4px 32px rgba(34,34,34,0.2) inset);
                padding: 2rem;
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                width: 100%;
                min-width: 320px;
                max-width: 420px;
                margin: 0 auto;
            }

            .${widgetClass} .pr-review-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 32px rgba(34, 34, 34, 0.15);
            }

            /* Stars */
            .${widgetClass} .stars-row {
                display: flex;
                gap: 0.25rem;
                margin-bottom: 0.5rem;
            }

            /* Review Content */
            .${widgetClass} .review-content {
                position: relative;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .${widgetClass} .review-text {
                font-size: 1.125rem;
                line-height: 1.75;
                color: var(--pr-text-primary, #22223b);
                margin: 0.5rem 0;
            }

            .${widgetClass} .decorative-quote {
                font-size: 3rem;
                line-height: 1;
                color: var(--pr-accent-color, #6a5acd);
                opacity: 0.2;
                font-family: Georgia, serif;
            }

            .${widgetClass} .decorative-quote-open {
                margin-bottom: -1rem;
            }

            .${widgetClass} .decorative-quote-close {
                margin-top: -1rem;
                align-self: flex-end;
            }

            /* Reviewer Details */
            .${widgetClass} .reviewer-details {
                margin-top: auto;
                padding-top: 1rem;
                border-top: 1px solid var(--pr-border-color, #cccccc);
            }

            .${widgetClass} .reviewer-name {
                font-weight: 600;
                color: var(--pr-name-text-color, #111111);
                margin-bottom: 0.25rem;
            }

            .${widgetClass} .reviewer-role {
                font-size: 0.875rem;
                color: var(--pr-role-text-color, #666666);
                margin-bottom: 0.25rem;
            }

            .${widgetClass} .reviewer-date {
                font-size: 0.75rem;
                color: var(--pr-text-secondary, #6b7280);
            }

            /* Submit Review Button */
            .${widgetClass} .submit-review-row {
                display: flex;
                justify-content: flex-end;
                margin-top: 2rem;
            }

            .${widgetClass} .submit-review-btn {
                background: var(--pr-accent-color, #6a5acd);
                color: #fff;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                font-weight: 500;
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
            }

            .${widgetClass} .submit-review-btn:hover {
                background: var(--pr-accent-hover, #4a3f8c);
                transform: translateY(-2px);
            }

            /* Pagination */
            .${widgetClass} .swiper-pagination {
                position: relative;
                margin-top: 2rem;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .${widgetClass} .swiper-pagination-bullet {
                width: 8px !important;
                height: 8px !important;
                background: var(--pr-border-color, #d1d5db) !important;
                opacity: 1 !important;
                transition: all 0.3s ease;
                margin: 0 4px !important;
            }

            .${widgetClass} .swiper-pagination-bullet-active {
                background: var(--pr-accent-color, #6a5acd) !important;
                transform: scale(1.2);
            }

            /* Navigation */
            .${widgetClass} .swiper-button-next,
            .${widgetClass} .swiper-button-prev {
                color: var(--pr-accent-color, #6a5acd);
                background: var(--pr-card-bg, #fff);
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 50%;
                box-shadow: var(--pr-shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
                transition: all 0.3s ease;
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                z-index: 50;
                border: 1px solid var(--pr-border-color, #cccccc);
            }

            .${widgetClass} .swiper-button-next {
                right: -3rem;
            }

            .${widgetClass} .swiper-button-prev {
                left: -3rem;
            }

            .${widgetClass} .swiper-button-next:hover,
            .${widgetClass} .swiper-button-prev:hover {
                background: var(--pr-accent-color, #6a5acd);
                color: #fff;
            }

            /* Mobile Navigation Row */
            .${widgetClass} .mobile-nav-row {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                max-width: 400px;
                margin: 2rem auto 0;
                padding: 0 1rem;
                min-width: 0;
                flex-wrap: nowrap;
                overflow: visible;
            }

            .${widgetClass} .mobile-nav-row .swiper-pagination {
                flex: 1 1 0;
                min-width: 0;
                width: auto;
                margin: 0;
                justify-content: center;
            }

            .${widgetClass} .nav-button.mobile-nav {
                flex: 0 0 40px;
                min-width: 40px;
                max-width: 48px;
                width: 40px;
                height: 40px;
                position: relative;
                top: auto;
                transform: none;
                right: auto;
                left: auto;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Responsive Styles */
            @media (max-width: 768px) {
                .${widgetClass} .widget-carousel-container {
                    padding: 0 1rem;
                }

                .${widgetClass} .pr-review-card {
                    padding: 1.5rem;
                }

                .${widgetClass} .review-text {
                    font-size: 1rem;
                }

                .${widgetClass} .swiper-button-next.desktop-nav,
                .${widgetClass} .swiper-button-prev.desktop-nav {
                    display: none;
                }

                /* Mobile Layout Synchronization */
                .${widgetClass} .widget-carousel-container,
                .${widgetClass} .swiper,
                .${widgetClass} .pr-review-card,
                .${widgetClass} .mobile-nav-row {
                    max-width: 400px;
                    width: 100%;
                    margin-left: auto;
                    margin-right: auto;
                }

                .${widgetClass} .pr-review-card {
                    min-width: 320px;
                    max-width: 400px;
                }
            }

            @media (max-width: 900px) {
                .${widgetClass} .pr-review-card {
                    min-width: 320px;
                    max-width: 400px;
                    width: 100%;
                }

                .${widgetClass} .widget-carousel-container {
                    max-width: 400px;
                }

                .${widgetClass} .swiper {
                    max-width: 400px;
                }
            }

            @media (max-width: 400px) {
                .${widgetClass} .widget-carousel-container,
                .${widgetClass} .swiper,
                .${widgetClass} .pr-review-card,
                .${widgetClass} .mobile-nav-row {
                    max-width: 100%;
                    width: 100%;
                }

                .${widgetClass} .pr-review-card {
                    min-width: 280px;
                    max-width: 100%;
                }

                .${widgetClass} .mobile-nav-row {
                    padding: 0 0.5rem;
                }
            }
        `;
    }

    // Main widget rendering function
    function renderMultiWidget(container, widgetData) {
        console.log('renderMultiWidget called', widgetData);
        if (!container || !widgetData || !widgetData.reviews) {
            console.error('Invalid container or widget data');
            console.log('renderMultiWidget: returning early due to invalid data');
            return;
        }

        // Wait for Swiper before initializing
        waitForSwiper(() => {
            try {
                console.log('Inside renderMultiWidget try block');
                // Create widget container with unique class
                const widgetClass = `pr-multi-widget-${Math.random().toString(36).substr(2, 9)}`;
                const widgetContainer = document.createElement('div');
                widgetContainer.className = widgetClass;
                container.appendChild(widgetContainer);
                console.log('Widget container created:', widgetContainer);

                // Inject scoped CSS
                const styleElement = document.createElement('style');
                styleElement.textContent = generateScopedCSS(widgetClass);
                document.head.appendChild(styleElement);

                // Create widget content
                const widgetContent = document.createElement('div');
                widgetContent.className = 'widget-content';
                widgetContainer.appendChild(widgetContent);

                // Create carousel container
                let carouselContainer = document.createElement('div');
                carouselContainer.className = 'widget-carousel-container';
                widgetContent.appendChild(carouselContainer);

                // Create Swiper container with unique class
                const swiperContainer = document.createElement('div');
                swiperContainer.className = `swiper ${widgetClass}-swiper`;
                carouselContainer.appendChild(swiperContainer);

                // Create Swiper wrapper
                const swiperWrapper = document.createElement('div');
                swiperWrapper.className = 'swiper-wrapper';
                swiperContainer.appendChild(swiperWrapper);

                // Create pagination for desktop
                const pagination = document.createElement('div');
                pagination.className = 'swiper-pagination';
                swiperContainer.appendChild(pagination);

                // Create navigation buttons for desktop
                const prevButton = document.createElement('div');
                prevButton.className = 'swiper-button-prev nav-button desktop-nav';
                prevButton.setAttribute('aria-label', 'Previous');
                prevButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 16L8 10L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

                const nextButton = document.createElement('div');
                nextButton.className = 'swiper-button-next nav-button desktop-nav';
                nextButton.setAttribute('aria-label', 'Next');
                nextButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 4L12 10L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

                // Desktop: arrows beside cards, vertically centered
                carouselContainer.appendChild(prevButton);
                carouselContainer.appendChild(nextButton);

                // Mobile: arrows and dots in a row (positioned within carousel container)
                const navRow = document.createElement('div');
                navRow.className = 'mobile-nav-row';
                const prevMobile = document.createElement('div');
                prevMobile.className = 'swiper-button-prev nav-button mobile-nav';
                prevMobile.setAttribute('aria-label', 'Previous');
                prevMobile.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 16L8 10L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                const nextMobile = document.createElement('div');
                nextMobile.className = 'swiper-button-next nav-button mobile-nav';
                nextMobile.setAttribute('aria-label', 'Next');
                nextMobile.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 4L12 10L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                const mobilePagination = document.createElement('div');
                mobilePagination.className = 'swiper-pagination';
                navRow.appendChild(prevMobile);
                navRow.appendChild(mobilePagination);
                navRow.appendChild(nextMobile);
                carouselContainer.appendChild(navRow);

                // Submit review row (positioned after carousel container)
                const submitRow = document.createElement('div');
                submitRow.className = 'submit-review-row';
                const submitButton = document.createElement('button');
                submitButton.className = 'submit-review-btn';
                submitButton.textContent = 'Submit a Review';
                submitButton.addEventListener('click', () => {
                    console.log('Submit review clicked');
                });
                submitRow.appendChild(submitButton);
                widgetContent.appendChild(submitRow);

                // Before rendering reviews, map fields to expected names
                const mappedReviews = (widgetData.reviews || [])
                    .map((review) => ({
                        ...review,
                        content: review.content || review.review_content || '',
                        name: review.name || review.reviewer_name ||
                          ((review.first_name || review.reviewer_first_name || '') +
                           ((review.last_name || review.reviewer_last_name) ? ' ' + (review.last_name || review.reviewer_last_name) : '')) ||
                          (review.reviewer && (review.reviewer.name || ((review.reviewer.first_name || '') + ((review.reviewer.last_name) ? ' ' + review.reviewer.last_name : '')))) ||
                          'Anonymous',
                        role: review.role || review.reviewer_role || '',
                        rating: review.rating || review.star_rating || 5,
                        date: review.date || review.created_at || new Date().toISOString()
                    }))
                    .filter((review) => review && typeof review === 'object' && review.content && review.name);

                // Handle empty reviews gracefully
                if (!mappedReviews.length) {
                    widgetContainer.innerHTML = '<div class="text-center text-gray-400 py-12">No reviews to display.</div>';
                    console.log('renderMultiWidget: returning early due to no reviews');
                    return;
                }

                // Use mappedReviews in the rendering loop
                mappedReviews.forEach((review) => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    
                    const card = document.createElement('div');
                    card.className = 'pr-review-card';
                    
                    // Add stars
                    card.innerHTML = renderStars(review.rating);
                    
                    // Add review content with decorative quotes
                    const content = document.createElement('div');
                    content.className = 'review-content';
                    content.innerHTML = `
                        <div class="decorative-quote decorative-quote-open">\u201C</div>
                        <div class="review-text">${review.content}</div>
                        <div class="decorative-quote decorative-quote-close">\u201D</div>
                    `;
                    card.appendChild(content);
                    
                    // Add reviewer details
                    const details = document.createElement('div');
                    details.className = 'reviewer-details';
                    
                    const name = document.createElement('div');
                    name.className = 'reviewer-name';
                    name.textContent = review.name;
                    details.appendChild(name);
                    
                    if (review.role) {
                        const role = document.createElement('div');
                        role.className = 'reviewer-role';
                        role.textContent = review.role;
                        details.appendChild(role);
                    }
                    
                    if (review.date) {
                        const date = document.createElement('div');
                        date.className = 'reviewer-date';
                        date.textContent = getRelativeTime(review.date);
                        details.appendChild(date);
                    }
                    
                    card.appendChild(details);
                    slide.appendChild(card);
                    swiperWrapper.appendChild(slide);
                });

                // Find the current, visible widget container
                const liveWidgetContainer = carouselContainer.closest('.widget-container') || widgetContainer;
                console.log('Setting CSS variables on element:', liveWidgetContainer, 'classList:', liveWidgetContainer.classList);
                // Set CSS variables from design (after CSS injection)
                if (widgetData.design) {
                  const d = widgetData.design;
                  if (d.accentColor) liveWidgetContainer.style.setProperty('--pr-accent-color', d.accentColor);
                  if (d.bgColor) liveWidgetContainer.style.setProperty('--pr-bg-color', d.bgColor);
                  if (d.bgOpacity !== undefined) liveWidgetContainer.style.setProperty('--pr-bg-opacity', d.bgOpacity);
                  if (d.textColor) liveWidgetContainer.style.setProperty('--pr-text-color', d.textColor);
                  if (d.bodyTextColor) liveWidgetContainer.style.setProperty('--pr-body-text-color', d.bodyTextColor);
                  if (d.nameTextColor) liveWidgetContainer.style.setProperty('--pr-name-text-color', d.nameTextColor);
                  if (d.roleTextColor) liveWidgetContainer.style.setProperty('--pr-role-text-color', d.roleTextColor);
                  if (d.borderWidth !== undefined) liveWidgetContainer.style.setProperty('--pr-border-width', `${d.borderWidth}px`);
                  if (d.borderColor) liveWidgetContainer.style.setProperty('--pr-border-color', d.borderColor);
                  if (d.borderRadius) liveWidgetContainer.style.setProperty('--pr-border-radius', `${d.borderRadius}px`);
                  if (d.shadowColor) {
                    const hex = d.shadowColor.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    liveWidgetContainer.style.setProperty('--pr-shadow-color', `${r}, ${g}, ${b}`);
                  }
                  if (d.shadowIntensity !== undefined) liveWidgetContainer.style.setProperty('--pr-shadow-intensity', d.shadowIntensity);
                  if (d.attributionFontSize !== undefined) liveWidgetContainer.style.setProperty('--pr-attribution-font-size', `${d.attributionFontSize}px`);
                  if (d.quoteFontSize !== undefined) liveWidgetContainer.style.setProperty('--pr-quote-font-size', `${d.quoteFontSize}px`);
                  if (d.lineSpacing !== undefined) liveWidgetContainer.style.setProperty('--pr-line-spacing', d.lineSpacing);
                  if (d.font) {
                    liveWidgetContainer.style.fontFamily = d.font;
                    liveWidgetContainer.style.setProperty('--pr-font', d.font);
                  }
                }

                // Ensure we have a valid Swiper container element
                // Use the already declared carouselContainer if it exists, otherwise assign
                carouselContainer = widgetContainer.querySelector('.swiper');
                console.log('carouselContainer:', carouselContainer);
                if (!carouselContainer) {
                  console.error('Swiper container not found!');
                  return;
                }
                // Swiper navigation config
                const swiperOptions = {
                  slidesPerView: 1,
                  spaceBetween: 30,
                  centeredSlides: true,
                  loop: true,
                  observer: true,
                  observeParents: true,
                  breakpoints: {
                    0: {
                      slidesPerView: 1,
                      spaceBetween: 12,
                      centeredSlides: false,
                      navigation: {
                        nextEl: '.mobile-nav-row .swiper-button-next',
                        prevEl: '.mobile-nav-row .swiper-button-prev',
                      },
                      pagination: {
                        el: '.mobile-nav-row .swiper-pagination',
                        clickable: true,
                        bulletClass: 'swiper-pagination-bullet',
                        bulletActiveClass: 'swiper-pagination-bullet-active',
                        renderBullet: function (index, className) {
                          return '<span class="' + className + '"></span>';
                        }
                      },
                    },
                    901: {
                      slidesPerView: 2,
                      spaceBetween: 20,
                      centeredSlides: false,
                      navigation: {
                        nextEl: '.swiper-button-next.nav-button.desktop-nav',
                        prevEl: '.swiper-button-prev.nav-button.desktop-nav',
                      },
                      pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                        bulletClass: 'swiper-pagination-bullet',
                        bulletActiveClass: 'swiper-pagination-bullet-active',
                        renderBullet: function (index, className) {
                          return '<span class="' + className + '"></span>';
                        }
                      },
                    },
                    1200: {
                      slidesPerView: 3,
                      spaceBetween: 24,
                      centeredSlides: true,
                      navigation: {
                        nextEl: '.swiper-button-next.nav-button.desktop-nav',
                        prevEl: '.swiper-button-prev.nav-button.desktop-nav',
                      },
                      pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                        bulletClass: 'swiper-pagination-bullet',
                        bulletActiveClass: 'swiper-pagination-bullet-active',
                        renderBullet: function (index, className) {
                          return '<span class="' + className + '"></span>';
                        }
                      },
                    }
                  },
                  autoplay: widgetData.design?.autoAdvance ? {
                    delay: (widgetData.design?.slideshowSpeed || 4) * 1000,
                    disableOnInteraction: false,
                  } : false,
                };

                const swiper = new Swiper(carouselContainer, swiperOptions);

                // Add error handling for Swiper initialization
                if (!swiper) {
                    throw new Error('Failed to initialize Swiper');
                }

                // Add keyboard navigation
                const handleKeyDown = (e) => {
                    if (e.key === 'ArrowLeft') {
                        swiper.slidePrev();
                    } else if (e.key === 'ArrowRight') {
                        swiper.slideNext();
                    }
                };
                document.addEventListener('keydown', handleKeyDown);

                // Cleanup function
                const cleanup = () => {
                    document.removeEventListener('keydown', handleKeyDown);
                    styleElement.remove();
                    if (swiper && swiper.destroy) {
                        swiper.destroy(true, true);
                    }
                };

                // Store cleanup function on container
                widgetContainer._cleanup = cleanup;

                // Debug log: confirm class and style
                console.log('Widget container class:', widgetContainer.className, 'style:', widgetContainer.style.cssText);

            } catch (error) {
                console.error('Error rendering widget:', error);
                container.innerHTML = `
                    <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h3 class="text-red-800 font-semibold">Widget Error</h3>
                        <p class="text-red-600 text-sm mt-2">${error.message}</p>
                    </div>
                `;
                console.log('renderMultiWidget: returning early due to error');
            }
        });
    }

    // Load all multi widgets on the page
    async function loadMultiWidgets() {
        const widgets = document.querySelectorAll('.promptreviews-widget[data-widget-type="multi"]');
        for (const widget of widgets) {
            const widgetId = widget.getAttribute('data-widget');
            if (!widgetId) continue;

            try {
                const response = await fetch(`/api/widgets/${widgetId}`);
                if (!response.ok) throw new Error('Failed to load widget data');
                const data = await response.json();
                renderMultiWidget(widget, data);
            } catch (error) {
                console.error('Error loading widget:', error);
                widget.innerHTML = '<div class="error">Failed to load widget</div>';
            }
        }
    }

    // Initialize widgets when DOM is ready
    document.addEventListener('DOMContentLoaded', loadMultiWidgets);

    // Expose renderMultiWidget globally for embedding
    window.PromptReviews.renderMultiWidget = renderMultiWidget;

    console.log('Widget script loaded successfully');
  })();
}

// Function to fetch widget data from Supabase
async function fetchWidgetData(widgetId) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', widgetId)
    .single();

  if (error || !data) {
    console.error('Error fetching widget data:', error);
    return null;
  }

  return data;
}

// Function to get design with defaults
function getDesignWithDefaults(userDesign = {}, widgetType = 'multi') {
  const defaultDesign = {
    multi: {
      font: 'Inter, system-ui, -apple-system, sans-serif',
      accentColor: '#6a5acd',
      bgColor: 'white',
      bgOpacity: 1,
      textColor: '#333333',
      nameTextColor: '#111111',
      roleTextColor: '#666666',
      border: false,
      borderWidth: 2,
      borderColor: '#cccccc',
      borderRadius: '1.5rem',
      shadow: true,
      shadowColor: '#222222',
      shadowIntensity: 0.2,
      showQuotes: true,
      showRelativeDate: true,
      showSubmitReviewButton: true,
      autoAdvance: false,
      slideshowSpeed: 4,
      attributionFontSize: 14
    }
  };

  return { ...defaultDesign[widgetType], ...userDesign };
}

// Initialize widget
async function initializeWidget(widgetId) {
  const data = await fetchWidgetData(widgetId);
  if (!data) {
    console.error('Failed to fetch widget data');
    return;
  }

  const design = getDesignWithDefaults(data.design, data.widget_type);
  const container = document.getElementById('promptreviews-widget');
  if (!container) {
    console.error('Widget container not found');
    return;
  }

  // Set CSS variables for design
  container.style.setProperty('--pr-accent-color', design.accentColor);
  container.style.setProperty('--pr-bg-color', design.bgColor);
  container.style.setProperty('--pr-bg-opacity', design.bgOpacity);
  container.style.setProperty('--pr-text-color', design.textColor);
  container.style.setProperty('--pr-name-text-color', design.nameTextColor);
  container.style.setProperty('--pr-role-text-color', design.roleTextColor);
  container.style.setProperty('--pr-border-width', `${design.borderWidth}px`);
  container.style.setProperty('--pr-border-color', design.borderColor);
  container.style.setProperty('--pr-border-radius', design.borderRadius);
  if (design.shadowColor) {
    // Convert hex to RGB values
    const hex = design.shadowColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    container.style.setProperty('--pr-shadow-color', `${r}, ${g}, ${b}`);
  }
  if (design.shadowIntensity !== undefined) container.style.setProperty('--pr-shadow-intensity', design.shadowIntensity);
  if (design.attributionFontSize !== undefined) container.style.setProperty('--pr-attribution-font-size', `${design.attributionFontSize}px`);

  // Initialize Swiper with design options
  const swiperOptions = {
    slidesPerView: 1,
    spaceBetween: 30,
    centeredSlides: true,
    loop: true,
    observer: true,
    observeParents: true,
    breakpoints: {
      0: {
        slidesPerView: 1,
        spaceBetween: 12,
        centeredSlides: false,
        navigation: {
          nextEl: '.mobile-nav-row .swiper-button-next',
          prevEl: '.mobile-nav-row .swiper-button-prev',
        },
        pagination: {
          el: '.mobile-nav-row .swiper-pagination',
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
          renderBullet: function (index, className) {
            return '<span class="' + className + '"></span>';
          }
        },
      },
      901: {
        slidesPerView: 2,
        spaceBetween: 20,
        centeredSlides: false,
        navigation: {
          nextEl: '.swiper-button-next.nav-button.desktop-nav',
          prevEl: '.swiper-button-prev.nav-button.desktop-nav',
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
          renderBullet: function (index, className) {
            return '<span class="' + className + '"></span>';
          }
        },
      },
      1200: {
        slidesPerView: 3,
        spaceBetween: 24,
        centeredSlides: true,
        navigation: {
          nextEl: '.swiper-button-next.nav-button.desktop-nav',
          prevEl: '.swiper-button-prev.nav-button.desktop-nav',
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
          renderBullet: function (index, className) {
            return '<span class="' + className + '"></span>';
          }
        },
      }
    },
    autoplay: design.autoAdvance ? {
      delay: (design.slideshowSpeed || 4) * 1000,
      disableOnInteraction: false,
    } : false,
  };

  // ... rest of the existing initialization code ...
} 