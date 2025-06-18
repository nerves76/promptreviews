// Multi Widget Embeddable Implementation
// This file is the vanilla JS Swiper-based implementation for the embeddable Multi widget.
// The dashboard preview version is rendered in src/app/dashboard/widget/page.tsx using the React MultiWidget component.
// Related files:
// - src/widget-embed/multi/MultiWidget.css (styles)
// - src/widget-embed/multi/embed-multi.jsx (embed entry point)
// - src/widget-embed/multi/dist/widget-embed.min.js (bundled JS)
// - src/widget-embed/multi/dist/widget.min.css (bundled CSS)

if (!window.PromptReviews || !window.PromptReviews.renderMultiWidget) {
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
                z-index: 10;
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

    // Main widget rendering function
    function renderMultiWidget(container, widgetData) {
        if (!container || !widgetData || !widgetData.reviews) {
            console.error('Invalid container or widget data');
            return;
        }

        // Create widget container
        const widgetClass = 'pr-multi-widget';
        const widgetContainer = document.createElement('div');
        widgetContainer.className = widgetClass;
        container.appendChild(widgetContainer);

        // Add build timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'build-timestamp';
        timestamp.textContent = `Build: ${buildTimestamp}`;
        widgetContainer.appendChild(timestamp);

        // Create widget content
        const widgetContent = document.createElement('div');
        widgetContent.className = 'widget-content';
        widgetContainer.appendChild(widgetContent);

        // Create carousel container
        const carouselContainer = document.createElement('div');
        carouselContainer.className = 'widget-carousel-container';
        widgetContent.appendChild(carouselContainer);

        // Create Swiper container
        const swiperContainer = document.createElement('div');
        swiperContainer.className = 'swiper';
        carouselContainer.appendChild(swiperContainer);

        // Create Swiper wrapper
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';
        swiperContainer.appendChild(swiperWrapper);

        // Before rendering reviews, map fields to expected names
        const mappedReviews = (widgetData.reviews || [])
            .map((review) => ({
                ...review,
                content: review.content || review.review_content,
                name: review.name || review.reviewer_name,
                role: review.role || review.reviewer_role,
            }))
            .filter((review) => review && typeof review === 'object' && typeof review.name !== 'undefined');

        // Use mappedReviews in the rendering loop
        mappedReviews.forEach((review) => {
            if (!review || typeof review !== 'object') {
                console.warn('Skipping invalid review:', review);
                return;
            }
            console.log('Review object:', review);
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
            
            console.log('At reviewerName assignment:', review, 'name:', review && review.name);
            const reviewerName =
                (review.first_name && review.last_name && `${review.first_name} ${review.last_name}`) ||
                review.name ||
                (typeof review.reviewer === 'object' && review.reviewer && review.reviewer.name) ||
                "";

            const name = document.createElement('div');
            name.className = 'reviewer-name';
            name.textContent = reviewerName;
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

        // Create desktop navigation buttons
        const desktopPrevButton = document.createElement('button');
        desktopPrevButton.className = 'nav-button swiper-button-prev desktop-nav';
        desktopPrevButton.setAttribute('aria-label', 'Previous review');
        desktopPrevButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="display: block; margin: auto;"><polygon points="14,3 6,9 14,15" fill="currentColor"/></svg>';
        carouselContainer.appendChild(desktopPrevButton);

        const desktopNextButton = document.createElement('button');
        desktopNextButton.className = 'nav-button swiper-button-next desktop-nav';
        desktopNextButton.setAttribute('aria-label', 'Next review');
        desktopNextButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="display: block; margin: auto;"><polygon points="4,3 12,9 4,15" fill="currentColor"/></svg>';
        carouselContainer.appendChild(desktopNextButton);

        // Create desktop pagination
        const desktopPagination = document.createElement('div');
        desktopPagination.className = 'swiper-pagination desktop-pagination';
        carouselContainer.appendChild(desktopPagination);

        // Create mobile navigation row that appears below cards
        const mobileNavRow = document.createElement('div');
        mobileNavRow.className = 'mobile-nav-row';
        mobileNavRow.innerHTML = `
            <button class="nav-button swiper-button-prev mobile-nav" aria-label="Previous review">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="display: block; margin: auto;"><polygon points="14,3 6,9 14,15" fill="currentColor"/></svg>
            </button>
            <div class="swiper-pagination mobile-pagination"></div>
            <button class="nav-button swiper-button-next mobile-nav" aria-label="Next review">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="display: block; margin: auto;"><polygon points="4,3 12,9 4,15" fill="currentColor"/></svg>
            </button>
        `;

        // Insert mobile nav row after the swiper container
        const swiperEl = document.querySelector('.swiper');
        if (swiperEl && swiperEl.parentNode) {
          swiperEl.parentNode.insertBefore(mobileNavRow, swiperEl.nextSibling);
        } else {
          console.warn('renderMultiWidget: .swiper element not found or has no parentNode. Skipping mobile nav row insertion.');
          return; // Prevent further execution if swiperEl is missing
        }

        // Initialize Swiper with only desktop pagination
        const swiper = new Swiper('.swiper', {
                slidesPerView: 1,
            spaceBetween: 24,
            centeredSlides: true,
            loop: true,
                pagination: {
                el: '.desktop-pagination',
                    clickable: true,
                    type: 'bullets',
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active',
                    renderBullet: function (index, className) {
                        return '<span class="' + className + '"></span>';
                    },
                },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
                breakpoints: {
                900: {
                    slidesPerView: 2,
                    spaceBetween: 24,
                    centeredSlides: false,
                },
                1200: {
                    slidesPerView: 3,
                    spaceBetween: 24,
                    centeredSlides: true,
                }
            }
        });

        // --- Dual Pagination Sync Logic ---
        const mobilePagination = mobileNavRow.querySelector('.mobile-pagination');
        function renderMobilePagination() {
            // Remove all children
            while (mobilePagination.firstChild) mobilePagination.removeChild(mobilePagination.firstChild);
            // Get number of bullets from Swiper
            const numBullets = swiper.pagination.bullets.length;
            for (let i = 0; i < numBullets; i++) {
                const bullet = document.createElement('span');
                bullet.className = 'swiper-pagination-bullet' + (i === swiper.realIndex ? ' swiper-pagination-bullet-active' : '');
                bullet.addEventListener('click', () => {
                    swiper.slideToLoop(i);
                });
                mobilePagination.appendChild(bullet);
            }
        }
        swiper.on('paginationUpdate slideChange', renderMobilePagination);
        // Initial render
        renderMobilePagination();

        // Function to update navigation visibility
        function updateNavigationVisibility() {
            const isMobile = window.innerWidth < 900;
            const mobileNav = document.querySelector('.mobile-nav-row');
            const desktopNav = document.querySelectorAll('.desktop-nav');
            const desktopPagination = document.querySelector('.desktop-pagination');
            const mobilePagination = document.querySelector('.mobile-pagination');
            
            if (isMobile) {
                mobileNav.style.display = 'flex';
                desktopNav.forEach(nav => nav.style.display = 'none');
                if (desktopPagination) desktopPagination.style.display = 'none';
                if (mobilePagination) mobilePagination.style.display = 'flex';
        } else {
                mobileNav.style.display = 'none';
                desktopNav.forEach(nav => nav.style.display = 'flex');
                if (desktopPagination) desktopPagination.style.display = 'flex';
                if (mobilePagination) mobilePagination.style.display = 'none';
            }
        }

        // Initial call and window resize listener
        updateNavigationVisibility();
        window.addEventListener('resize', updateNavigationVisibility);

        // Add submit review button
        const submitRow = document.createElement('div');
        submitRow.className = 'submit-review-row';
        const submitButton = document.createElement('button');
        submitButton.className = 'submit-review-btn';
        submitButton.textContent = 'Submit a Review';
        submitButton.addEventListener('click', () => {
            // Handle submit review click
            console.log('Submit review clicked');
        });
        submitRow.appendChild(submitButton);
        widgetContent.appendChild(submitRow);

        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                swiper.slidePrev();
            } else if (e.key === 'ArrowRight') {
                swiper.slideNext();
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
      accentColor: 'slateblue',
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
  container.style.setProperty('--pr-shadow-color', design.shadowColor);
  container.style.setProperty('--pr-shadow-intensity', design.shadowIntensity);
  container.style.setProperty('--pr-attribution-font-size', `${design.attributionFontSize}px`);

  // Initialize Swiper with design options
  const swiperOptions = {
    modules: [Navigation, Pagination, A11y, ...(design.autoAdvance ? [Autoplay] : [])],
    spaceBetween: 24,
    slidesPerView: 1,
    breakpoints: {
      768: { slidesPerView: 2, spaceBetween: 24 },
      1024: { slidesPerView: 3, spaceBetween: 24 },
    },
    navigation: {
      prevEl: '.swiper-button-prev',
      nextEl: '.swiper-button-next',
    },
    pagination: {
      clickable: true,
      el: '.swiper-pagination',
      bulletClass: 'swiper-pagination-bullet',
      bulletActiveClass: 'swiper-pagination-bullet-active',
      renderBullet: function (index, className) {
        const isActive = className.includes('swiper-pagination-bullet-active');
        const color = isActive ? design.accentColor : lightenHex(design.accentColor, 0.7);
        return '<span class="' + className + '" style="background: ' + color + ';"></span>';
      }
    },
    ...(design.autoAdvance ? {
      autoplay: {
        delay: (design.slideshowSpeed ?? 4) * 1000,
        disableOnInteraction: false,
      }
    } : {})
  };

  // ... rest of the existing initialization code ...
} 