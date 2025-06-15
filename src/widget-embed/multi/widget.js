// Multi Widget Embeddable Implementation
// This file is the vanilla JS Swiper-based implementation for the embeddable Multi widget.
// The dashboard preview version is rendered in src/app/dashboard/widget/page.tsx using the React MultiWidget component.
// Related files:
// - src/widget-embed/multi/MultiWidget.css (styles)
// - src/widget-embed/multi/embed-multi.jsx (embed entry point)
// - src/widget-embed/multi/dist/widget-embed.min.js (bundled JS)
// - src/widget-embed/multi/dist/widget.min.css (bundled CSS)

// Import Swiper and its CSS
import Swiper from 'swiper';
import 'swiper/css';

(function() {
    // Create global namespace
    window.PromptReviews = window.PromptReviews || {};

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
    function renderStars(rating, size = 16) {
        if (typeof rating !== 'number' || isNaN(rating)) return '';
        let html = '';
        for (let i = 1; i <= 5; i++) {
            const full = i <= Math.floor(rating);
            const half = !full && i - 0.5 <= rating;
            if (full) {
                html += `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="#FBBF24" stroke="#FBBF24" style="display:inline-block;margin-right:2px;"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>`;
            } else if (half) {
                html += `<svg width="${size}" height="${size}" viewBox="0 0 20 20" style="display:inline-block;margin-right:2px;"><defs><linearGradient id="half-star-gradient-${i}"><stop offset="50%" stop-color="#FBBF24" /><stop offset="50%" stop-color="#E5E7EB" /></linearGradient></defs><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" fill="url(#half-star-gradient-${i})" stroke="#FBBF24" /></svg>`;
            } else {
                html += `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="#E5E7EB" stroke="#FBBF24" style="display:inline-block;margin-right:2px;"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" /></svg>`;
            }
        }
        return `<span style="display:inline-flex;align-items:center;margin-bottom:4px;">${html}</span>`;
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

            /* Layout */
            .${widgetClass} .widget-container {
                width: 100%;
                max-width: 1000px;
                margin: 0 auto;
                padding: 2rem;
                box-sizing: border-box;
            }

            .${widgetClass} .widget-content {
                position: relative;
                width: 100%;
                min-height: 320px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                transition: min-height 0.3s;
            }

            /* Review Card */
            .${widgetClass} .review-card {
                background: var(--pr-card-bg);
                border-radius: var(--pr-card-radius);
                padding: 2rem;
                box-shadow: var(--pr-shadow);
                border: var(--pr-card-border);
                margin: 0 auto;
                width: 100%;
                max-width: 800px;
                opacity: 1;
                transition: opacity 0.3s ease-in-out;
            }

            .${widgetClass} .review-card.fade-out {
                opacity: 0;
            }

            /* Review Content */
            .${widgetClass} .review-content {
                font-size: 18px;
                line-height: 1.4;
                color: var(--pr-text-primary);
                margin-bottom: 1.5rem;
                position: relative;
            }

            .${widgetClass} .review-content::before,
            .${widgetClass} .review-content::after {
                content: '"';
                position: absolute;
                font-size: 2em;
                color: var(--pr-accent-color);
                opacity: 0.3;
            }

            .${widgetClass} .review-content::before {
                left: -1rem;
                top: -0.5rem;
            }

            .${widgetClass} .review-content::after {
                right: -1rem;
                bottom: -0.5rem;
            }

            /* Reviewer Info */
            .${widgetClass} .reviewer-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .${widgetClass} .reviewer-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background-color: var(--pr-accent-color);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 1.2rem;
            }

            .${widgetClass} .reviewer-details {
                display: flex;
                flex-direction: column;
            }

            .${widgetClass} .reviewer-name {
                font-weight: 600;
                color: var(--pr-text-primary);
                font-size: 15px;
            }

            .${widgetClass} .reviewer-role {
                color: var(--pr-text-secondary);
                font-size: 15px;
            }

            /* Navigation */
            .${widgetClass} .navigation-buttons {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-top: 2rem;
            }

            .${widgetClass} .nav-button {
                background: var(--pr-accent-color);
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color 0.3s;
            }

            .${widgetClass} .nav-button:hover {
                background-color: var(--pr-accent-hover);
            }

            .${widgetClass} .nav-button:disabled {
                background-color: #ccc;
                cursor: not-allowed;
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

            .${widgetClass} .swiper-pagination {
                position: relative;
                margin-top: 1rem;
            }

            .${widgetClass} .swiper-pagination-bullet {
                width: 8px;
                height: 8px;
                background: #ccc;
                opacity: 0.5;
            }

            .${widgetClass} .swiper-pagination-bullet-active {
                background: var(--pr-accent-color);
                opacity: 1;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .${widgetClass} .widget-container {
                    padding: 1rem;
                }

                .${widgetClass} .review-card {
                    padding: 1.5rem;
                }

                .${widgetClass} .review-content {
                    font-size: 16px;
                }
            }

            @media (max-width: 480px) {
                .${widgetClass} .review-card {
                    padding: 1rem;
                }

                .${widgetClass} .review-content {
                    font-size: 14px;
                }

                .${widgetClass} .reviewer-avatar {
                    width: 40px;
                    height: 40px;
                    font-size: 1rem;
                }
            }
        `;
    }

    // Render the multi widget
    function renderMultiWidget(container, widgetData) {
        container.innerHTML = '';
        const design = widgetData.design || {};
        const reviews = widgetData.reviews || [];
        
        // Add a unique class to the container for scoping
        const widgetClass = `pr-widget-${Math.random().toString(36).substr(2, 9)}`;
        container.classList.add(widgetClass);
        
        // Generate scoped CSS
        const scopedCSS = generateScopedCSS(widgetClass);

        // Inject the CSS into <head> if not already present for this widget instance
        if (!document.getElementById(`style-${widgetClass}`)) {
            const styleTag = document.createElement('style');
            styleTag.id = `style-${widgetClass}`;
            styleTag.textContent = scopedCSS;
            document.head.appendChild(styleTag);
        }

        // Build the HTML for the widget
        const slidesHtml = reviews.map((review, i) => `
            <div class="swiper-slide${i === 0 ? ' swiper-slide-active' : ''}" role="group" aria-label="${i + 1} / ${reviews.length}">
                <div class="review-card">
                    <div class="flex items-center justify-center mb-4">
                        ${typeof review.star_rating === 'number' && !isNaN(review.star_rating) ? renderStars(review.star_rating, 18) : ''}
                    </div>
                    <div class="review-content">
                        ${review.review_content}
                    </div>
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${getInitials(review.first_name, review.last_name)}
                        </div>
                        <div class="reviewer-details">
                            <span class="reviewer-name">${review.first_name} ${review.last_name}</span>
                            <span class="reviewer-role">${review.reviewer_role || ''}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Widget HTML template
        const widgetHtml = `
            <div class="widget-container">
                <div class="widget-content">
                    <div class="swiper">
                        <div class="swiper-wrapper">
                            ${slidesHtml}
                        </div>
                        <div class="navigation-buttons">
                            <button class="nav-button swiper-button-prev" aria-label="Previous slide">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <polygon points="12.5,3 5.5,10 12.5,17" fill="currentColor"/>
                                </svg>
                            </button>
                            <button class="nav-button swiper-button-next" aria-label="Next slide">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <polygon points="7.5,3 14.5,10 7.5,17" fill="currentColor"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert the widget HTML into the container
        container.innerHTML = widgetHtml;

        // Initialize Swiper
        const swiper = new Swiper(container.querySelector('.swiper'), {
            loop: true,
            navigation: {
                nextEl: container.querySelector('.swiper-button-next'),
                prevEl: container.querySelector('.swiper-button-prev'),
            },
            pagination: {
                el: null,
            },
            autoplay: design.autoAdvance ? { delay: (design.slideshowSpeed || 4) * 1000 } : false,
            slidesPerView: 3,
            spaceBetween: 24,
            breakpoints: {
                0: { slidesPerView: 1, spaceBetween: 8 },
                600: { slidesPerView: 1, spaceBetween: 8 },
                900: { slidesPerView: 2, spaceBetween: 16 },
                1200: { slidesPerView: 3, spaceBetween: 24 },
            },
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
    window.renderMultiWidget = renderMultiWidget;
})(); 