// Widget Styles Module
// Contains all CSS styles and theme configurations

window.PromptReviews = window.PromptReviews || {};
window.PromptReviews.styles = window.PromptReviews.styles || {};

(function() {
  'use strict';

  function injectStyles() {
    const styleId = 'prompt-reviews-widget-styles';
    
    // Don't inject if already exists
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
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
      .reviews-carousel-container::-webkit-scrollbar {
        display: none;
      }
      .reviews-carousel-container {
        scrollbar-width: none;
      }
    `;
    
    document.head.appendChild(style);
  }

  // Auto-inject styles when module loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }

  // Expose functions globally
  window.PromptReviews.styles.injectStyles = injectStyles;

  console.log('✅ Widget styles module loaded');
})(); 