// Multi Widget Embeddable Implementation
// This file is the vanilla JS Swiper-based implementation for the embeddable Multi widget.
// The dashboard preview version is rendered in src/app/dashboard/widget/page.tsx using the React MultiWidget component.
// Related files:
// - src/widget-embed/multi/MultiWidget.css (styles)
// - src/widget-embed/multi/embed-multi.jsx (embed entry point)
// - src/widget-embed/multi/dist/widget-embed.min.js (bundled JS)
// - src/widget-embed/multi/dist/widget.min.css (bundled CSS)

// Add build timestamp
const buildTimestamp = new Date().toLocaleString();
console.log('Widget script starting... Build time:', buildTimestamp);

(function() {
    console.log('IIFE starting...');
    // Create global namespace
    window.PromptReviews = window.PromptReviews || {};
    console.log('Swiper available:', typeof Swiper !== 'undefined');

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

    // Helper: Render star rating as SVGs (no React, just HTML)
    function renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<svg width="18" height="18" viewBox="0 0 20 20" fill="${i <= rating ? '#FBBF24' : '#E5E7EB'}" stroke="#FBBF24" style="display: inline-block; margin-right: 2px;"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36"></polygon></svg>`;
        }
        return stars;
    }

    // Helper: Get relative time string (e.g., '2 days ago')
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
                font-family: 'Inter', 'Inter Fallback', system-ui, -apple-system, sans-serif;
                --pr-accent-color: slateblue;
                --pr-accent-hover: #4a3f8c;
                --pr-text-primary: #22223b;
                --pr-text-secondary: #6b7280;
                --pr-border-color: #cccccc;
                --pr-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                --pr-card-bg: #ffffff;
                --pr-card-border: 2px solid var(--pr-border-color);
                --pr-card-radius: 16px;
                --pr-card-shadow: 0 4px 32px rgba(34, 34, 34, 0.2) inset;
            }

            /* Build timestamp */
            .${widgetClass} .build-timestamp {
                position: fixed;
                bottom: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 4px 8px;
                font-size: 12px;
                z-index: 9999;
                border-top-left-radius: 4px;
            }

            /* Swiper pagination styles */
            .${widgetClass} .swiper-pagination {
                position: relative !important;
                bottom: auto !important;
                display: flex !important;
                justify-content: center;
                align-items: center;
                gap: 8px;
                margin-top: 24px;
                width: auto !important;
            }

            .${widgetClass} .swiper-pagination-bullet {
                width: 8px !important;
                height: 8px !important;
                background: #d1d5db !important;
                opacity: 1 !important;
                transition: all 0.3s ease;
                margin: 0 4px !important;
            }

            .${widgetClass} .swiper-pagination-bullet-active {
                background: var(--pr-accent-color, slateblue) !important;
                transform: scale(1.2);
            }

            /* Layout */
            .${widgetClass} .hidden {
                display: none;
            }

            @media (min-width: 768px) {
                .${widgetClass} .md\\:flex {
                    display: flex;
                }
            }

            .${widgetClass} .w-full {
                width: 100%;
            }

            .${widgetClass} .justify-center {
                justify-content: center;
            }

            .${widgetClass} .relative {
                position: relative;
            }

            .${widgetClass} .max-w-5xl {
                max-width: 64rem;
            }

            .${widgetClass} .mx-auto {
                margin-left: auto;
                margin-right: auto;
            }

            .${widgetClass} .px-8 {
                padding-left: 2rem;
                padding-right: 2rem;
            }

            /* Navigation Buttons */
            .${widgetClass} .group {
                position: relative;
            }

            .${widgetClass} .absolute {
                position: absolute;
            }

            .${widgetClass} .-left-8 {
                left: -2rem;
            }

            .${widgetClass} .-right-8 {
                right: -2rem;
            }

            .${widgetClass} .top-1\\/2 {
                top: 50%;
            }

            .${widgetClass} .-translate-y-1\\/2 {
                transform: translateY(-50%);
            }

            .${widgetClass} .z-10 {
                z-index: 10;
            }

            .${widgetClass} .rounded-full {
                border-radius: 9999px;
            }

            .${widgetClass} .border {
                border-width: 1px;
            }

            .${widgetClass} .border-gray-200 {
                border-color: #e5e7eb;
            }

            .${widgetClass} .w-10 {
                width: 2.5rem;
            }

            .${widgetClass} .h-10 {
                height: 2.5rem;
            }

            .${widgetClass} .flex {
                display: flex;
            }

            .${widgetClass} .items-center {
                align-items: center;
            }

            .${widgetClass} .transition {
                transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                transition-duration: 150ms;
            }

            .${widgetClass} .hover\\:bg-opacity-80:hover {
                --tw-bg-opacity: 0.8;
            }

            .${widgetClass} .active\\:scale-95:active {
                transform: scale(0.95);
            }

            .${widgetClass} .focus\\:scale-95:focus {
                transform: scale(0.95);
            }

            .${widgetClass} .focus\\:outline-none:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
            }

            .${widgetClass} .focus-visible\\:outline:focus-visible {
                outline-style: solid;
            }

            .${widgetClass} .focus-visible\\:outline-2:focus-visible {
                outline-width: 2px;
            }

            .${widgetClass} .focus-visible\\:outline-\\[var\\(--pr-accent-color\\)\\]:focus-visible {
                outline-color: var(--pr-accent-color);
            }

            .${widgetClass} .focus-visible\\:outline-offset-2:focus-visible {
                outline-offset: 2px;
            }

            /* Swiper Styles */
            .${widgetClass} .swiper {
                width: 100%;
                padding: 2rem 0;
            }

            .${widgetClass} .swiper-slide {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .${widgetClass} .swiper-slide-active {
                z-index: 1;
            }

            /* Card Styles */
            .${widgetClass} .w-full {
                width: 100%;
            }

            .${widgetClass} .h-\\[380px\\] {
                height: 380px;
            }

            .${widgetClass} .flex-col {
                flex-direction: column;
            }

            .${widgetClass} .rounded-3xl {
                border-radius: 1.5rem;
            }

            .${widgetClass} .overflow-hidden {
                overflow: hidden;
            }

            .${widgetClass} .bg-white {
                background-color: #ffffff;
            }

            .${widgetClass} .px-2 {
                padding-left: 0.5rem;
                padding-right: 0.5rem;
            }

            .${widgetClass} .py-4 {
                padding-top: 1rem;
                padding-bottom: 1rem;
            }

            .${widgetClass} .shadow {
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
            }

            .${widgetClass} .text-sm {
                font-size: 0.875rem;
                line-height: 1.25rem;
            }

            /* Star Rating */
            .${widgetClass} .mb-2 {
                margin-bottom: 0.5rem;
            }

            .${widgetClass} .mt-0 {
                margin-top: 0;
            }

            /* Review Content */
            .${widgetClass} .flex-1 {
                flex: 1 1 0%;
            }

            .${widgetClass} .min-h-0 {
                min-height: 0;
            }

            .${widgetClass} .text-center {
                text-align: center;
            }

            .${widgetClass} .text-gray-800 {
                color: #1f2937;
            }

            .${widgetClass} .break-words {
                word-break: break-word;
            }

            .${widgetClass} .whitespace-pre-line {
                white-space: pre-line;
            }

            .${widgetClass} .relative {
                position: relative;
            }

            .${widgetClass} .overflow-hidden {
                overflow: hidden;
            }

            .${widgetClass} .line-clamp-5 {
                display: -webkit-box;
                -webkit-line-clamp: 5;
                -webkit-box-orient: vertical;
            }

            .${widgetClass} .mx-6 {
                margin-left: 1.5rem;
                margin-right: 1.5rem;
            }

            .${widgetClass} .text-\\[14px\\] {
                font-size: 14px;
            }

            .${widgetClass} .md\\:text-\\[16px\\] {
                font-size: 16px;
            }

            .${widgetClass} .z-10 {
                z-index: 10;
            }

            .${widgetClass} .leading-relaxed {
                line-height: 1.625;
            }

            /* Reviewer Info */
            .${widgetClass} .gap-1 {
                gap: 0.25rem;
            }

            .${widgetClass} .mt-auto {
                margin-top: auto;
            }

            .${widgetClass} .font-semibold {
                font-weight: 600;
            }

            .${widgetClass} .text-xs {
                font-size: 0.75rem;
                line-height: 1rem;
            }
        `;
    }

    // Render the multi widget
    function renderMultiWidget(container, widgetData) {
        console.log("renderMultiWidget called with:", { container, widgetData });
        console.log("Swiper available in render:", typeof Swiper !== "undefined");
        container.innerHTML = "";

        // Add build timestamp
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'build-timestamp';
        timestampDiv.textContent = `Build: ${buildTimestamp}`;
        container.appendChild(timestampDiv);

        // OUTER: w-full flex flex-col items-center justify-center
        const outer = document.createElement("div");
        outer.className = "w-full flex flex-col items-center justify-center";

        // INNER: relative w-full max-w-5xl mx-auto px-8 flex flex-col items-center
        const inner = document.createElement("div");
        inner.className = "relative w-full max-w-5xl mx-auto px-8 flex flex-col items-center";

        // SWIPER CONTAINER
        const swiperContainer = document.createElement("div");
        swiperContainer.className = "swiper w-full";
        swiperContainer.setAttribute("role", "region");
        swiperContainer.setAttribute("aria-label", "Reviews carousel");

        // SWIPER WRAPPER
        const swiperWrapper = document.createElement("div");
        swiperWrapper.className = "swiper-wrapper";
        swiperWrapper.setAttribute("role", "list");

        // Slides
        (widgetData.reviews || []).forEach((review, idx) => {
            const slide = document.createElement("div");
            slide.className = "swiper-slide flex flex-col items-center w-full h-[380px] rounded-3xl overflow-hidden bg-white shadow-lg p-8";
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-label', `${idx + 1} / ${widgetData.reviews.length}`);
            slide.id = idx === 0 ? 'style-UiHWZ' : idx === 1 ? 'style-ppbHr' : 'style-RwrbB';

            const card = document.createElement('div');
            card.className = 'w-full h-[380px] flex flex-col rounded-3xl overflow-hidden bg-white px-2 py-4 shadow text-sm style-UmL5Y';
            card.id = 'style-UmL5Y';

            // Stars
            const starsContainer = document.createElement('div');
            starsContainer.className = 'flex items-center justify-center mb-2 mt-0 style-JwAMc';
            starsContainer.id = 'style-JwAMc';
            starsContainer.innerHTML = `<span id="style-peIpo" class="style-peIpo">${renderStars(review.rating)}</span>`;

            // Review content
            const contentContainer = document.createElement('div');
            contentContainer.className = 'flex-1 min-h-0 w-full flex flex-col justify-center text-center text-[14px] md:text-[16px] text-gray-800 break-words whitespace-pre-line relative overflow-hidden line-clamp-5';
            const content = document.createElement('p');
            content.className = 'mx-6 md:mt-0 text-[14px] md:text-[16px] text-center z-10 relative leading-relaxed style-M7nAj';
            content.id = 'style-M7nAj';
            content.textContent = review.content;
            contentContainer.appendChild(content);

            // Reviewer info
            const reviewerContainer = document.createElement('div');
            reviewerContainer.className = 'flex flex-col items-center gap-1 w-full mt-auto mb-2';
            const name = document.createElement('span');
            name.className = 'font-semibold style-1eDJP';
            name.setAttribute('itemprop', 'author');
            name.setAttribute('itemscope', '');
            name.setAttribute('itemtype', 'https://schema.org/Person');
            name.id = 'style-1eDJP';
            name.innerHTML = `<span itemprop="name">${review.reviewer.name}</span>`;
            const role = document.createElement('span');
            role.className = 'text-xs style-QAonL';
            role.setAttribute('itemprop', 'author');
            role.setAttribute('itemscope', '');
            role.setAttribute('itemtype', 'https://schema.org/Person');
            role.id = 'style-QAonL';
            role.innerHTML = `<span itemprop="jobTitle">${review.reviewer.role}</span>`;
            reviewerContainer.appendChild(name);
            reviewerContainer.appendChild(role);

            // Assemble card
            card.appendChild(starsContainer);
            card.appendChild(contentContainer);
            card.appendChild(reviewerContainer);
            slide.appendChild(card);
            swiperWrapper.appendChild(slide);
        });
        swiperContainer.appendChild(swiperWrapper);

        // PAGINATION (single persistent element)
        const pagination = document.createElement("div");
        pagination.className = "swiper-pagination flex items-center justify-center mt-6";
        pagination.setAttribute("role", "tablist");

        // Helper to get accent color
        const accentColor = widgetData.design?.accentColor || 'slateblue';
        const accentHover = widgetData.design?.accentHover || '#4a3f8c';
        const cardBg = '#fff';
        const cardShadow = '0 6px 32px 0 rgba(34,34,34,0.10), 0 1px 3px 0 rgb(0 0 0 / 0.1)';
        const cardRadius = '1.5rem';

        // Add card inner shadow variable
        const cardInnerShadow = 'inset 0 4px 32px rgba(34,34,34,0.08)';

        // DESKTOP ARROWS (absolute, sides)
        const leftArrow = document.createElement("button");
        leftArrow.className = "group absolute -left-8 top-1/2 -translate-y-1/2 z-10 rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2 hidden md:flex";
        leftArrow.setAttribute("aria-label", "Previous slide");
        leftArrow.setAttribute("tabindex", "0");
        leftArrow.innerHTML = `<svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"none\" style=\"display: block; margin: auto;\"><polygon points=\"12.5,3 5.5,10 12.5,17\" fill=\"currentColor\"/></svg>`;

        const rightArrow = document.createElement("button");
        rightArrow.className = "group absolute -right-8 top-1/2 -translate-y-1/2 z-10 rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2 hidden md:flex";
        rightArrow.setAttribute("aria-label", "Next slide");
        rightArrow.setAttribute("tabindex", "0");
        rightArrow.innerHTML = `<svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"none\" style=\"display: block; margin: auto;\"><polygon points=\"7.5,3 14.5,10 7.5,17\" fill=\"currentColor\"/></svg>`;

        // MOBILE ARROWS (for nav row)
        const leftArrowMobile = document.createElement("button");
        leftArrowMobile.className = "group rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2";
        leftArrowMobile.setAttribute("aria-label", "Previous slide");
        leftArrowMobile.setAttribute("tabindex", "0");
        leftArrowMobile.innerHTML = `<svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"none\" style=\"display: block; margin: auto;\"><polygon points=\"12.5,3 5.5,10 12.5,17\" fill=\"currentColor\"/></svg>`;

        const rightArrowMobile = document.createElement("button");
        rightArrowMobile.className = "group rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2";
        rightArrowMobile.setAttribute("aria-label", "Next slide");
        rightArrowMobile.setAttribute("tabindex", "0");
        rightArrowMobile.innerHTML = `<svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"none\" style=\"display: block; margin: auto;\"><polygon points=\"7.5,3 14.5,10 7.5,17\" fill=\"currentColor\"/></svg>`;

        // SUBMIT REVIEW BUTTONS (separate for mobile and desktop)
        function createSubmitBtn() {
            const btn = document.createElement('button');
            btn.className = 'submit-review-btn font-semibold transition focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2';
            btn.textContent = 'Submit a Review';
            btn.style.background = cardBg;
            btn.style.color = accentColor;
            btn.style.borderRadius = cardRadius;
            btn.style.boxShadow = cardShadow;
            btn.style.padding = '0.6em 2em';
            btn.style.fontSize = '1.08rem';
            btn.style.border = '1.5px solid #e5e7eb';
            btn.style.marginLeft = '1rem';
            btn.style.marginRight = '1rem';
            btn.addEventListener('mouseenter', () => {
                btn.style.background = accentColor;
                btn.style.color = '#fff';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = cardBg;
                btn.style.color = accentColor;
            });
            btn.addEventListener('focus', () => {
                btn.style.background = accentColor;
                btn.style.color = '#fff';
            });
            btn.addEventListener('blur', () => {
                btn.style.background = cardBg;
                btn.style.color = accentColor;
            });
            return btn;
        }
        const submitBtnMobile = createSubmitBtn();
        submitBtnMobile.className += ' inline-flex';
        const submitBtnDesktop = createSubmitBtn();
        submitBtnDesktop.className += ' hidden md:inline-flex';

        // Dedicated container for nav dots (pagination)
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pr-pagination-row w-full flex justify-center mt-6 mb-2';
        paginationContainer.appendChild(pagination);

        // NAV ROW: contains both mobile and desktop elements, use responsive classes to show/hide
        const navRow = document.createElement('div');
        navRow.className = 'pr-nav-row w-full flex items-center justify-center gap-2 mt-8 mb-2';
        // Mobile arrows: only visible on mobile
        leftArrowMobile.className += ' inline-flex md:hidden';
        rightArrowMobile.className += ' inline-flex md:hidden';
        // Submit button: always visible
        submitBtnMobile.className += ' inline-flex';
        // Desktop button: not needed, use only one submit button
        // Side arrows: only visible on desktop
        leftArrow.className += ' hidden md:flex';
        rightArrow.className += ' hidden md:flex';
        // Nav row: always contains submit button and mobile arrows
        navRow.appendChild(leftArrowMobile);
        navRow.appendChild(rightArrowMobile);
        navRow.appendChild(submitBtnMobile);

        // Add nav row and pagination container after swiperContainer
        inner.appendChild(swiperContainer);
        inner.appendChild(navRow);
        inner.appendChild(paginationContainer);

        // Add desktop arrows to inner (absolute, sides)
        inner.appendChild(leftArrow);
        inner.appendChild(rightArrow);
        outer.appendChild(inner);

        // Add to container
        container.appendChild(outer);

        // Swiper init
        const swiper = new Swiper(swiperContainer, {
            slidesPerView: 1,
            spaceBetween: 24,
            navigation: {
                nextEl: [rightArrow, rightArrowMobile],
                prevEl: [leftArrow, leftArrowMobile],
                disabledClass: 'swiper-button-disabled',
                lockClass: 'swiper-button-lock',
                hiddenClass: 'swiper-button-hidden',
            },
            pagination: {
                el: pagination,
                clickable: true,
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active',
                renderBullet: function (index, className) {
                    const isActive = className.includes('swiper-pagination-bullet-active');
                    const color = isActive ? widgetData.design?.accentColor || 'slateblue' : lightenHex(widgetData.design?.accentColor || 'slateblue', 0.7);
                    return '<span class="' + className + '" style="background: ' + color + ';"></span>';
                }
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                },
                1024: {
                    slidesPerView: 3,
                },
            },
            on: {
                init: function() {
                    this.navigation.update();
                },
                slideChange: function() {
                    this.navigation.update();
                }
            }
        });

        // Keyboard and mouse event listeners for all arrows
        [leftArrow, rightArrow, leftArrowMobile, rightArrowMobile].forEach(btn => {
            btn.style.background = cardBg;
            btn.style.borderRadius = cardRadius;
            btn.style.boxShadow = cardShadow;
            btn.style.color = accentColor;
            btn.querySelector('polygon').style.fill = accentColor;
            btn.addEventListener('mouseenter', () => {
                btn.style.background = accentColor;
                btn.style.color = '#fff';
                btn.querySelector('polygon').style.fill = '#fff';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = cardBg;
                btn.style.color = accentColor;
                btn.querySelector('polygon').style.fill = accentColor;
            });
            btn.addEventListener('focus', () => {
                btn.style.background = accentColor;
                btn.style.color = '#fff';
                btn.querySelector('polygon').style.fill = '#fff';
            });
            btn.addEventListener('blur', () => {
                btn.style.background = cardBg;
                btn.style.color = accentColor;
                btn.querySelector('polygon').style.fill = accentColor;
            });
        });

        console.log('Swiper initialized:', swiper);
        swiper.update && swiper.update();
        return swiper;
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