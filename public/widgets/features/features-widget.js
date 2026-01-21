/**
 * Prompt Reviews - Features Comparison Widget Embed Script
 *
 * Usage:
 * <div id="promptreviews-features"></div>
 * <script src="https://app.promptreviews.app/widgets/features/features-widget.js" async></script>
 *
 * This script automatically creates an iframe that resizes based on content,
 * handling both desktop and mobile layouts without manual height configuration.
 */

(function() {
  'use strict';

  var WIDGET_BASE_URL = 'https://app.promptreviews.app';
  var CONTAINER_ID = 'promptreviews-features';

  function init() {
    var container = document.getElementById(CONTAINER_ID);
    if (!container) {
      console.warn('Prompt Reviews Features Widget: Container #' + CONTAINER_ID + ' not found');
      return;
    }

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = WIDGET_BASE_URL + '/demo/features-widget-embed';
    iframe.style.cssText = 'width: 100%; border: none; display: block; overflow: hidden; min-height: 600px;';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('title', 'Prompt Reviews Features');
    iframe.setAttribute('loading', 'lazy');

    // Listen for height updates from the iframe
    window.addEventListener('message', function(event) {
      // Verify origin for security
      if (event.origin !== WIDGET_BASE_URL) return;

      // Handle height resize messages
      if (event.data && event.data.type === 'features-widget-resize' && typeof event.data.height === 'number') {
        var newHeight = event.data.height;
        // Add small buffer to prevent any potential scrollbars
        iframe.style.height = (newHeight + 10) + 'px';
      }
    });

    // Clear container and add iframe
    container.innerHTML = '';
    container.appendChild(iframe);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual initialization if needed
  window.PromptReviewsFeatures = {
    init: init
  };
})();
