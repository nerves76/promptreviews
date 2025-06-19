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
      if (!document.querySelector('link[href*="swiper.min.css"]')) {
        const swiperCSS = document.createElement('link');
        swiperCSS.rel = 'stylesheet';
        swiperCSS.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
        document.head.appendChild(swiperCSS);
        console.log('Swiper CSS added to page');
      }
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
            /* Base styles */
            .${widgetClass} {
                font-family: var(--pr-font, 'Inter'), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
                padding: 0;
                box-sizing: border-box;
                position: relative;
            }

            /* Widget Content */
            .${widgetClass} .widget-content {
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
                padding: 0;
                position: relative;
            }

            /* Outer Container */
            .${widgetClass} .widget-outer-container {
                position: relative;
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
                padding: 0 60px;
                box-sizing: border-box;
            }

            /* Carousel Container */
            .${widgetClass} .widget-carousel-container {
                position: relative;
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
                padding: 0;
                overflow: visible;
            }

            /* Swiper Container */
            .${widgetClass} .swiper {
                width: 100%;
                padding: 2rem 0;
                overflow: visible;
            }

            /* Swiper Slides */
            .${widgetClass} .swiper-slide {
                display: flex;
                justify-content: center;
                align-items: stretch;
                height: auto;
                opacity: 1;
                transition: transform 0.3s ease;
            }

            .${widgetClass} .swiper-slide-active {
                z-index: 1;
            }

            .${widgetClass} .swiper-slide-next,
            .${widgetClass} .swiper-slide-prev {
                z-index: 0;
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
                min-width: 280px;
                max-width: 420px;
                margin: 0 auto;
                box-sizing: border-box;
                text-align: center;
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
                justify-content: center;
            }

            /* Review Content */
            .${widgetClass} .review-content {
                position: relative;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                align-items: center;
            }

            .${widgetClass} .review-text {
                font-size: 1.125rem;
                line-height: 1.75;
                color: var(--pr-text-primary, #22223b);
                margin: 0.5rem 0;
                text-align: center;
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

            /* Navigation Controls - Desktop */
            .${widgetClass} .swiper-button-next,
            .${widgetClass} .swiper-button-prev {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 40px;
                height: 40px;
                margin: 0;
                padding: 0;
                background: white;
                border: 2px solid var(--pr-accent-color, #6a5acd);
                border-radius: 50%;
                cursor: pointer;
                z-index: 100;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--pr-accent-color, #6a5acd);
                font-size: 24px;
                font-weight: bold;
                line-height: 1;
                text-align: center;
                transition: all 0.3s ease;
            }

            .${widgetClass} .swiper-button-next {
                right: 10px;
            }

            .${widgetClass} .swiper-button-prev {
                left: 10px;
            }

            .${widgetClass} .swiper-button-next:hover,
            .${widgetClass} .swiper-button-prev:hover {
                background: var(--pr-accent-color, #6a5acd);
                color: white;
            }

            .${widgetClass} .swiper-button-next::after,
            .${widgetClass} .swiper-button-prev::after {
                display: none;
            }

            /* Mobile Navigation Row */
            .${widgetClass} .mobile-nav-row {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                max-width: 280px;
                margin: -24px auto 0;
                padding: 0;
                position: relative;
                z-index: 10;
            }

            .${widgetClass} .mobile-nav-row .swiper-pagination {
                flex: 0 1 auto;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 0.5rem;
            }

            .${widgetClass} .mobile-nav-row .swiper-button-next,
            .${widgetClass} .mobile-nav-row .swiper-button-prev {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: relative;
                top: auto;
                left: auto;
                right: auto;
                transform: none;
                width: 40px;
                height: 40px;
                margin: 0;
                font-size: 24px;
                flex: 0 0 auto;
            }

            .${widgetClass} .mobile-nav-row .swiper-button-next:hover,
            .${widgetClass} .mobile-nav-row .swiper-button-prev:hover {
                background: var(--pr-accent-color, #6a5acd);
                color: white;
            }

            /* Pagination */
            .${widgetClass} .swiper-pagination {
                position: relative;
                bottom: auto;
                left: auto;
                width: auto;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 0.5rem;
                margin-top: 1rem;
            }

            .${widgetClass} .swiper-pagination-bullet {
                width: 8px;
                height: 8px;
                background: #d1d5db;
                opacity: 1;
                transition: all 0.3s ease;
                margin: 0;
                display: block;
            }

            .${widgetClass} .swiper-pagination-bullet-active {
                background: var(--pr-accent-color, #6a5acd);
                transform: scale(1.2);
            }

            /* Responsive Styles */
            @media screen and (max-width: 1200px) {
                .${widgetClass} .widget-outer-container {
                    padding: 0 50px;
                }

                .${widgetClass} .swiper-button-next {
                    right: 5px;
                }

                .${widgetClass} .swiper-button-prev {
                    left: 5px;
                }
            }

            @media screen and (max-width: 1024px) {
                .${widgetClass} .widget-outer-container {
                    padding: 0 20px;
                }

                .${widgetClass} .swiper-button-next,
                .${widgetClass} .swiper-button-prev {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                }

                .${widgetClass} .mobile-nav-row {
                    display: flex;
                }

                .${widgetClass} .pr-review-card {
                    padding: 1.5rem;
                    min-width: 300px;
                    max-width: 100%;
                    margin: 0 1rem;
                }
            }

            @media screen and (max-width: 880px) and (min-width: 651px) {
                .${widgetClass} .pr-review-card {
                    margin: 0 2rem;
                }
            }

            @media screen and (max-width: 480px) {
                .${widgetClass} .widget-outer-container {
                    padding: 0 16px;
                }

                .${widgetClass} .mobile-nav-row {
                    max-width: 320px;
                    padding: 0 0.5rem;
                }

                .${widgetClass} .pr-review-card {
                    min-width: 280px;
                    padding: 1.25rem;
                    margin: 0 1.5rem;
                }

                .${widgetClass} .review-text {
                    font-size: 1rem;
                }
            }
        `;
    }

    // Helper: Add widget CSS to page
    function addWidgetCSS(widgetClass, cssContent) {
      const styleId = `pr-widget-style-${widgetClass}`;
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = cssContent;
        document.head.appendChild(styleElement);
        console.log(`Widget CSS added to page for class: ${widgetClass}`);
      }
    }

    // Main widget rendering function
    function renderMultiWidget(container, widgetData) {
        console.log('🎯 renderMultiWidget called with data:', widgetData);
        console.log('🎯 Container:', container);
        
        if (!container || !widgetData || !widgetData.reviews) {
            console.error('Invalid container or widget data');
            return;
        }

        // Wait for Swiper before initializing
        waitForSwiper(() => {
            try {
                console.log('Inside renderMultiWidget try block');
                
                // Create widget container with unique class
                const widgetClass = `pr-multi-widget-${Math.random().toString(36).substr(2, 9)}`;
                container.className = `${container.className} ${widgetClass}`;
                
                // Generate and inject scoped CSS
                const cssContent = generateScopedCSS(widgetClass);
                addWidgetCSS(widgetClass, cssContent);
                
                // Create widget content
                const widgetContent = document.createElement('div');
                widgetContent.className = 'widget-content';
                container.appendChild(widgetContent);

                // Create outer container with overflow hidden to constrain navigation
                const outerContainer = document.createElement('div');
                outerContainer.className = 'widget-outer-container';
                widgetContent.appendChild(outerContainer);

                // Create carousel container
                const carouselContainer = document.createElement('div');
                carouselContainer.className = 'widget-carousel-container';
                outerContainer.appendChild(carouselContainer);

                // Create Swiper container
                const swiperContainer = document.createElement('div');
                swiperContainer.className = 'swiper';
                carouselContainer.appendChild(swiperContainer);

                // Create Swiper wrapper
                const swiperWrapper = document.createElement('div');
                swiperWrapper.className = 'swiper-wrapper';
                swiperContainer.appendChild(swiperWrapper);

                // Create navigation elements
                const prevButton = document.createElement('div');
                prevButton.className = 'swiper-button-prev';
                prevButton.setAttribute('aria-label', 'Previous slide');
                prevButton.innerHTML = '‹';

                const nextButton = document.createElement('div');
                nextButton.className = 'swiper-button-next';
                nextButton.setAttribute('aria-label', 'Next slide');
                nextButton.innerHTML = '›';

                const pagination = document.createElement('div');
                pagination.className = 'swiper-pagination';

                // Create mobile navigation row
                const mobileNavRow = document.createElement('div');
                mobileNavRow.className = 'mobile-nav-row';

                const mobilePrevButton = document.createElement('div');
                mobilePrevButton.className = 'swiper-button-prev';
                mobilePrevButton.setAttribute('aria-label', 'Previous slide');
                mobilePrevButton.innerHTML = '‹';

                const mobileNextButton = document.createElement('div');
                mobileNextButton.className = 'swiper-button-next';
                mobileNextButton.setAttribute('aria-label', 'Next slide');
                mobileNextButton.innerHTML = '›';

                const mobilePagination = document.createElement('div');
                mobilePagination.className = 'swiper-pagination';

                // Append mobile navigation elements
                mobileNavRow.appendChild(mobilePrevButton);
                mobileNavRow.appendChild(mobilePagination);
                mobileNavRow.appendChild(mobileNextButton);

                // Append navigation elements to the outer container (not carousel container)
                outerContainer.appendChild(prevButton);
                outerContainer.appendChild(nextButton);
                outerContainer.appendChild(pagination);
                outerContainer.appendChild(mobileNavRow);

                // Debug: Force navigation buttons to be visible
                setTimeout(() => {
                    console.log('Navigation buttons created:', {
                        prevButton: prevButton,
                        nextButton: nextButton,
                        outerContainer: outerContainer
                    });
                    
                    // Force visibility for debugging
                    prevButton.style.display = 'flex';
                    prevButton.style.visibility = 'visible';
                    prevButton.style.opacity = '1';
                    prevButton.style.zIndex = '9999';
                    prevButton.style.backgroundColor = 'white';
                    prevButton.style.border = '2px solid #6a5acd';
                    
                    nextButton.style.display = 'flex';
                    nextButton.style.visibility = 'visible';
                    nextButton.style.opacity = '1';
                    nextButton.style.zIndex = '9999';
                    nextButton.style.backgroundColor = 'white';
                    nextButton.style.border = '2px solid #6a5acd';
                    
                    console.log('Forced navigation buttons to be visible');
                }, 100);

                // Use mappedReviews in the rendering loop
                widgetData.reviews.forEach((review) => {
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
                        <div class="decorative-quote decorative-quote-open">"</div>
                        <div class="review-text">${review.content}</div>
                        <div class="decorative-quote decorative-quote-close">"</div>
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

                // Set CSS variables from design
                if (widgetData.design) {
                    const d = widgetData.design;
                    if (d.accentColor) container.style.setProperty('--pr-accent-color', d.accentColor);
                    if (d.bgColor) container.style.setProperty('--pr-bg-color', d.bgColor);
                    if (d.bgOpacity !== undefined) container.style.setProperty('--pr-bg-opacity', d.bgOpacity);
                    if (d.textColor) container.style.setProperty('--pr-text-color', d.textColor);
                    if (d.bodyTextColor) container.style.setProperty('--pr-body-text-color', d.bodyTextColor);
                    if (d.nameTextColor) container.style.setProperty('--pr-name-text-color', d.nameTextColor);
                    if (d.roleTextColor) container.style.setProperty('--pr-role-text-color', d.roleTextColor);
                    if (d.borderWidth !== undefined) container.style.setProperty('--pr-border-width', `${d.borderWidth}px`);
                    if (d.borderColor) container.style.setProperty('--pr-border-color', d.borderColor);
                    if (d.borderRadius) container.style.setProperty('--pr-border-radius', `${d.borderRadius}px`);
                    if (d.shadowColor) {
                        const hex = d.shadowColor.replace('#', '');
                        const r = parseInt(hex.substr(0, 2), 16);
                        const g = parseInt(hex.substr(2, 2), 16);
                        const b = parseInt(hex.substr(4, 2), 16);
                        container.style.setProperty('--pr-shadow-color', `${r}, ${g}, ${b}`);
                    }
                    if (d.shadowIntensity !== undefined) container.style.setProperty('--pr-shadow-intensity', d.shadowIntensity);
                    if (d.font) {
                        container.style.fontFamily = d.font;
                        container.style.setProperty('--pr-font', d.font);
                    }
                }

                // Initialize Swiper
                const swiper = new Swiper(swiperContainer, {
                    slidesPerView: 'auto',
                    spaceBetween: 24,
                    loop: false,
                    observer: true,
                    observeParents: true,
                    watchOverflow: true,
                    resizeObserver: true,
                    effect: 'slide',
                    speed: 400,
                    preventInteractionOnTransition: true,
                    slideVisibleClass: 'swiper-slide-visible',
                    watchSlidesProgress: true,
                    navigation: {
                        nextEl: nextButton,
                        prevEl: prevButton,
                        disabledClass: 'swiper-button-disabled',
                        hiddenClass: 'swiper-button-hidden',
                        lockClass: 'swiper-button-lock'
                    },
                    pagination: {
                        el: pagination,
                        clickable: true,
                        type: 'bullets',
                        bulletClass: 'swiper-pagination-bullet',
                        bulletActiveClass: 'swiper-pagination-bullet-active'
                    },
                    breakpoints: {
                        0: {
                            slidesPerView: 1,
                            spaceBetween: 16,
                            centeredSlides: false
                        },
                        480: {
                            slidesPerView: 1,
                            spaceBetween: 20,
                            centeredSlides: false
                        },
                        900: {
                            slidesPerView: 2,
                            spaceBetween: 24,
                            centeredSlides: false
                        },
                        1200: {
                            slidesPerView: 3,
                            spaceBetween: 32,
                            centeredSlides: false
                        }
                    }
                });

                // Add overflow hidden to prevent extra card from showing
                swiperContainer.style.overflow = 'hidden';
                
                // Force update after initialization
                setTimeout(() => {
                    swiper.update();
                }, 100);

                // Add keyboard navigation
                const handleKeyDown = (e) => {
                    if (e.key === 'ArrowLeft') {
                        swiper.slidePrev();
                    } else if (e.key === 'ArrowRight') {
                        swiper.slideNext();
                    }
                };
                document.addEventListener('keydown', handleKeyDown);

                // Store cleanup function
                container._cleanup = () => {
                    document.removeEventListener('keydown', handleKeyDown);
                    const styleElement = document.getElementById(`pr-widget-style-${widgetClass}`);
                    if (styleElement) {
                        styleElement.remove();
                    }
                    if (swiper && swiper.destroy) {
                        swiper.destroy(true, true);
                    }
                };

            } catch (error) {
                console.error('Error rendering widget:', error);
                container.innerHTML = `
                    <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h3 class="text-red-800 font-semibold">Widget Error</h3>
                        <p class="text-red-600 text-sm mt-2">${error.message}</p>
                    </div>
                `;
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
    loop: true,
    observer: true,
    observeParents: true,
    breakpoints: {
      0: {
        slidesPerView: 1,
        spaceBetween: 16,
        centeredSlides: true,
        navigation: {
          nextEl: '.mobile-nav-row .swiper-button-next',
          prevEl: '.mobile-nav-row .swiper-button-prev',
        },
        pagination: {
          el: '.mobile-nav-row .swiper-pagination',
          clickable: true,
        }
      },
      1025: {
        slidesPerView: 2,
        spaceBetween: 24,
        centeredSlides: false,
        navigation: {
          nextEl: '.swiper-button-next.nav-button.desktop-nav',
          prevEl: '.swiper-button-prev.nav-button.desktop-nav',
        },
        pagination: {
          el: '.swiper-pagination.desktop-pagination',
          clickable: true,
        }
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
          el: '.swiper-pagination.desktop-pagination',
          clickable: true,
        }
      }
    }
  };

  // ... rest of the existing initialization code ...
} 