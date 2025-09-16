(function() {
  'use strict';
  
  // ReviewDashboard Widget
  window.ReviewDashboard = {
    // Configuration defaults
    defaults: {
      apiUrl: 'https://app.promptreviews.app',
      showHeader: true,
      theme: 'light',
      components: ['overview', 'performance', 'optimization', 'engagement', 'recommendations']
    },
    
    // Initialize the widget
    init: function(containerId, options) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('ReviewDashboard: Container element not found:', containerId);
        return;
      }
      
      // Merge options with defaults
      const config = Object.assign({}, this.defaults, options);
      
      // Create iframe to embed the dashboard
      const iframe = document.createElement('iframe');
      iframe.src = `${config.apiUrl}/embed/review-dashboard?theme=${config.theme}&showHeader=${config.showHeader}&components=${config.components.join(',')}`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('title', 'Review Dashboard');
      
      // Clear container and add iframe
      container.innerHTML = '';
      container.appendChild(iframe);
      
      // Handle iframe resize
      this.handleResize(iframe, container);
      
      // Listen for messages from iframe
      window.addEventListener('message', function(event) {
        if (event.origin !== config.apiUrl) return;
        
        if (event.data.type === 'resize') {
          iframe.style.height = event.data.height + 'px';
        }
      });
    },
    
    // Handle responsive sizing
    handleResize: function(iframe, container) {
      // Set initial height based on container
      const setHeight = () => {
        const width = container.offsetWidth;
        // Aspect ratio for optimal viewing
        const aspectRatio = window.innerWidth < 768 ? 0.8 : 0.75;
        const height = width * aspectRatio;
        iframe.style.height = height + 'px';
      };
      
      setHeight();
      window.addEventListener('resize', setHeight);
    },
    
    // Create multiple widgets
    createMultiple: function(configs) {
      configs.forEach(config => {
        this.init(config.containerId, config.options);
      });
    }
  };
  
  // Auto-initialize if data attributes are present
  document.addEventListener('DOMContentLoaded', function() {
    const widgets = document.querySelectorAll('[data-review-dashboard]');
    widgets.forEach(widget => {
      const options = {
        showHeader: widget.getAttribute('data-show-header') !== 'false',
        theme: widget.getAttribute('data-theme') || 'light',
        components: (widget.getAttribute('data-components') || '').split(',').filter(Boolean)
      };
      
      if (options.components.length === 0) {
        delete options.components;
      }
      
      ReviewDashboard.init(widget.id || widget.getAttribute('data-container-id'), options);
    });
  });
})();