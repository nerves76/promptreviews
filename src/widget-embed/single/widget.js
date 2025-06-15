// Single Widget Embeddable Implementation
// This file is the vanilla JS implementation for the embeddable Single widget.
// The dashboard preview version is rendered in src/app/dashboard/widget/page.tsx using the React SingleWidget component.
// Related files:
// - src/widget-embed/single/SingleWidget.css (styles)
// - src/widget-embed/single/embed-single.jsx (embed entry point)
// - src/widget-embed/single/dist/widget-embed.min.js (bundled JS)
// - src/widget-embed/single/dist/widget.min.css (bundled CSS)

(function() {
    // Create global namespace
    window.PromptReviews = window.PromptReviews || {};

    /**
     * Render the SingleWidget into a target element using fetched data.
     * @param {HTMLElement} container - The target div to render into
     * @param {Object} widgetData - The widget data from the API
     */
    function renderSingleWidget(container, widgetData) {
        // Remove any previous content
        container.innerHTML = '';

        // Create widget element
        const widget = document.createElement('div');
        widget.className = 'promptreviews-single-widget';

        // Apply design variables (with fallbacks)
        const design = widgetData.design || {};
        widget.style.setProperty('--bg-color', design.bgColor || '#fff');
        widget.style.setProperty('--text-color', design.textColor || '#22223b');
        widget.style.setProperty('--accent-color', design.accentColor || '#1A237E');
        widget.style.setProperty('--body-text-color', design.bodyTextColor || '#22223b');
        widget.style.setProperty('--name-text-color', design.nameTextColor || '#1a237e');
        widget.style.setProperty('--role-text-color', design.roleTextColor || '#6b7280');
        widget.style.setProperty('--quote-font-size', `${design.quoteFontSize || 18}px`);
        widget.style.setProperty('--attribution-font-size', `${design.attributionFontSize || 15}px`);
        widget.style.setProperty('--border-radius', `${design.borderRadius || 16}px`);
        widget.style.setProperty('--line-spacing', design.lineSpacing || 1.4);
        widget.style.setProperty('--border-width', `${design.borderWidth || 2}px`);
        widget.style.setProperty('--border-color', design.borderColor || '#cccccc');
        widget.style.setProperty('--shadow-color', design.shadowColor || '#222222');
        widget.style.setProperty('--shadow-intensity', design.shadowIntensity || 0.2);

        // Get the first review (or show a placeholder)
        const review = (widgetData.reviews && widgetData.reviews[0]) || {
            review_content: 'No reviews yet.',
            first_name: '',
            last_name: '',
            reviewer_role: '',
            star_rating: 0,
        };

        // Create widget content
        widget.innerHTML = `
            <div class="widget-container">
                <div class="widget-content">
                    <div class="review-card">
                        <div class="review-content">
                            ${design.showQuotes ? '<span class="quote-mark">"</span>' : ''}
                            <p class="review-text">${review.review_content}</p>
                            ${design.showQuotes ? '<span class="quote-mark">"</span>' : ''}
                        </div>
                        <div class="reviewer-info">
                            <div class="reviewer-details">
                                <p class="reviewer-name">${review.first_name} ${review.last_name}</p>
                                ${review.reviewer_role ? `<p class="reviewer-role">${review.reviewer_role}</p>` : ''}
                            </div>
                            <div class="star-rating">
                                ${Array(5).fill(0).map((_, i) => `
                                    <span class="star ${i < review.star_rating ? 'filled' : ''}">★</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to container
        container.appendChild(widget);
    }

    /**
     * Loader: Finds all .promptreviews-widget[data-widget-type="single"] divs,
     * fetches widget data from /api/widgets/[id], and renders the widget.
     */
    async function loadSingleWidgets() {
        // Find all matching widget containers
        const containers = document.querySelectorAll('.promptreviews-widget[data-widget-type="single"][data-widget]');
        containers.forEach(async (container) => {
            const widgetId = container.getAttribute('data-widget');
            if (!widgetId) return;

            // Show loading state
            container.innerHTML = '<div style="text-align:center;padding:2em;color:#888;">Loading widget…</div>';

            try {
                // Fetch widget data from the API
                const res = await fetch(`/api/widgets/${widgetId}`);
                if (!res.ok) throw new Error('Widget not found');
                const widgetData = await res.json();
                renderSingleWidget(container, widgetData);
            } catch (err) {
                // Show error state
                container.innerHTML = '<div style="color:red;text-align:center;padding:2em;">Failed to load widget.</div>';
            }
        });
    }

    // Expose manual init for advanced use, but auto-load on script load
    window.PromptReviews.init = loadSingleWidgets;

    // Auto-load widgets on script load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSingleWidgets);
    } else {
        loadSingleWidgets();
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
})(); 