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

    function renderMultiWidget(container, widgetData) {
        container.innerHTML = '';
        const design = widgetData.design || {};
        const reviews = widgetData.reviews || [];
        const accentColor = design.accentColor || 'slateblue';
        const shadow = design.shadow ? `0 4px 24px 0 ${hexToRgba(design.shadowColor || '#222222', design.shadowIntensity ?? 0.2)}` : 'none';
        const border = design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none';

        // Widget container
        const widget = document.createElement('div');
        widget.className = 'widget-container';
        widget.style.setProperty('--bg-color', design.bgColor || '#fff');
        widget.style.setProperty('--text-color', design.textColor || '#22223b');
        widget.style.setProperty('--accent-color', accentColor);
        widget.style.setProperty('--body-text-color', design.bodyTextColor || '#22223b');
        widget.style.setProperty('--name-text-color', design.nameTextColor || '#1a237e');
        widget.style.setProperty('--role-text-color', design.roleTextColor || '#6b7280');
        widget.style.setProperty('--quote-font-size', `${design.quoteFontSize || 18}px`);
        widget.style.setProperty('--attribution-font-size', `${design.attributionFontSize || 15}px`);
        widget.style.setProperty('--border-radius', `${design.borderRadius || 16}px`);
        widget.style.setProperty('--line-spacing', design.lineSpacing || 1.4);
        widget.style.setProperty('--border-width', `${design.borderWidth || 2}px`);
        widget.style.setProperty('--border-color', design.borderColor || '#cccccc');
        widget.style.setProperty('--shadow', shadow);
        widget.style.setProperty('--shadow-color', design.shadowColor || '#222222');
        widget.style.setProperty('--shadow-intensity', design.shadowIntensity || 0.2);
        widget.style.setProperty('--accent-color-hover', lightenHex(accentColor, 0.2));

        // Inject Inter font and critical CSS for pixel-perfect match
        widget.innerHTML = `
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                .widget-container, .widget-container * { font-family: 'Inter', sans-serif !important; }
                .widget-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                }
                .swiper {
                    width: 100%;
                    padding: 2rem 0;
                }
                .swiper-wrapper {
                    display: flex;
                    align-items: center;
                }
                .swiper-slide {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .review-card {
                    background: var(--bg-color, #fff);
                    border-radius: var(--border-radius, 16px);
                    padding: 2rem;
                    box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
                    border: none;
                    margin: 0 1rem;
                    width: 340px;
                    max-width: 100%;
                    min-height: 340px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 1;
                    transition: opacity 0.3s ease-in-out;
                }
                .star-rating {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 1rem;
                }
                .review-content {
                    font-size: 1.15rem;
                    line-height: 1.6;
                    color: var(--body-text-color, #22223b);
                    text-align: center;
                    margin-bottom: 2rem;
                    min-height: 80px;
                    position: relative;
                }
                .review-content.show-quotes::before, .review-content.show-quotes::after {
                    content: '"';
                    position: absolute;
                    font-size: 2em;
                    color: var(--accent-color, slateblue);
                    opacity: 0.3;
                }
                .review-content.show-quotes::before {
                    left: -1rem;
                    top: -0.5rem;
                }
                .review-content.show-quotes::after {
                    right: -1rem;
                    bottom: -0.5rem;
                }
                .reviewer-info {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }
                .reviewer-name {
                    font-weight: 700;
                    color: #2d3be7;
                    font-size: 1rem;
                    text-align: center;
                }
                .reviewer-role {
                    color: #888;
                    font-size: 0.95rem;
                    text-align: center;
                }
                .review-date {
                    color: #aaa;
                    font-size: 0.85rem;
                    text-align: center;
                }
                .navigation-buttons {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    max-width: 1100px;
                    margin: 0 auto 1.5rem auto;
                    position: relative;
                    top: 0;
                }
                .nav-button {
                    background: #fff;
                    color: #6c4ee6;
                    border: none;
                    border-radius: 50%;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                    font-size: 1.5rem;
                }
                .nav-button:hover {
                    background: #f3f0ff;
                    color: #4a3f8c;
                }
                .swiper-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-top: 1.5rem;
                    gap: 0.5rem;
                }
                .swiper-pagination-bullet {
                    width: 10px;
                    height: 10px;
                    background: #ccc;
                    opacity: 0.5;
                    border-radius: 50%;
                    margin: 0 3px;
                }
                .swiper-pagination-bullet-active {
                    background: #6c4ee6;
                    opacity: 1;
                }
                .submit-review-btn {
                    background: #6c4ee6;
                    color: #fff;
                    border-radius: 999px;
                    padding: 0.7rem 2.2rem;
                    font-weight: 600;
                    font-size: 1.1rem;
                    text-decoration: none;
                    cursor: pointer;
                    transition: background 0.2s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    margin-top: 2.5rem;
                    margin-bottom: 0.5rem;
                    display: inline-block;
                }
                .submit-review-btn:hover {
                    background: #4a3f8c;
                }
                @media (max-width: 1100px) {
                    .navigation-buttons { max-width: 100%; }
                }
                @media (max-width: 900px) {
                    .review-card { width: 90vw; min-width: 0; }
                }
                @media (max-width: 600px) {
                    .review-card { padding: 1rem; width: 98vw; }
                    .widget-content { padding: 0; }
                }
            </style>
            <div class="widget-content">
                <div class="navigation-buttons">
                    <button class="nav-button prev-btn" aria-label="Previous">
                        <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="white"/><polygon points="14,7 9,12 14,17" fill="#6c4ee6"/></svg>
                    </button>
                    <button class="nav-button next-btn" aria-label="Next">
                        <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="white"/><polygon points="10,7 15,12 10,17" fill="#6c4ee6"/></svg>
                    </button>
                </div>
                <div class="swiper">
                    <div class="swiper-wrapper">
                        ${reviews.map(review => `
                        <div class="swiper-slide">
                            <div class="review-card">
                                <div class="star-rating">${typeof review.star_rating === 'number' && !isNaN(review.star_rating) ? renderStars(review.star_rating, 22) : ''}</div>
                                <div class="review-content${design.showQuotes ? ' show-quotes' : ''}">${review.review_content}</div>
                                <div class="reviewer-info">
                                    <div class="reviewer-name">${review.first_name} ${review.last_name}</div>
                                    <div class="reviewer-role">${review.reviewer_role || ''}</div>
                                    ${design.showRelativeDate && review.created_at ? `<div class="review-date">${getRelativeTime(review.created_at)}${review.platform && !/^custom$/i.test(review.platform.trim()) ? ` via ${review.platform}` : ''}</div>` : ''}
                                </div>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                    <div class="swiper-pagination"></div>
                </div>
                ${design.showSubmitReviewButton ? `<div style="display:flex;justify-content:flex-end;width:100%;max-width:1100px;"><a href="/r/${widgetData.universalPromptSlug}" class="submit-review-btn">Submit a review</a></div>` : ''}
            </div>
        `;

        container.appendChild(widget);

        // Swiper initialization: 3 cards on desktop, 1 on mobile
        const swiper = new Swiper(widget.querySelector('.swiper'), {
            loop: true,
            navigation: {
                nextEl: widget.querySelector('.next-btn'),
                prevEl: widget.querySelector('.prev-btn'),
            },
            pagination: {
                el: widget.querySelector('.swiper-pagination'),
                clickable: true,
            },
            autoplay: design.autoAdvance ? { delay: (design.slideshowSpeed || 4) * 1000 } : false,
            slidesPerView: 3,
            spaceBetween: 32,
            breakpoints: {
                0: { slidesPerView: 1, spaceBetween: 8 },
                600: { slidesPerView: 1, spaceBetween: 8 },
                900: { slidesPerView: 2, spaceBetween: 16 },
                1200: { slidesPerView: 3, spaceBetween: 32 },
            },
        });
    }

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

    document.addEventListener('DOMContentLoaded', loadMultiWidgets);
})(); 