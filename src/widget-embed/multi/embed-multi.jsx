import './widget.js';

// Expose a global mount function for embedding
window.PromptReviews = window.PromptReviews || {};
window.PromptReviews.mountMultiWidget = function (container, data) {
  if (!container) return;
  // Use the vanilla JS widget renderer
  renderMultiWidget(container, data);
};

// Optionally, auto-mount if a container is found (for local testing)
document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.promptreviews-widget[data-widget-type="multi"]');
  if (el && window.PromptReviewsWidgetData) {
    window.PromptReviews.mountMultiWidget(el, window.PromptReviewsWidgetData);
  }
}); 