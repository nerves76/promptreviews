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
})(); 