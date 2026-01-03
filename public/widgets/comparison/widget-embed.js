/**
 * PromptReviews Comparison Table Widget
 *
 * Embeddable vanilla JavaScript widget for displaying competitor comparison tables.
 * Follows F-pattern scanning with PromptReviews in leftmost column.
 *
 * Usage:
 * <div id="promptreviews-comparison" data-comparison-id="your-table-slug"></div>
 * <script src="https://app.promptreviews.app/widgets/comparison/widget-embed.min.js" async></script>
 */

(function() {
  'use strict';

  // --- Configuration ---
  const API_BASE = window.location.hostname === 'app.promptreviews.app'
    ? ''
    : 'https://app.promptreviews.app';

  // --- CSS Styles ---
  const CSS_STYLES = `
    .pr-comparison-widget {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 100%;
      color: #1f2937;
      font-size: 14px;
      line-height: 1.5;
    }

    .pr-comparison-widget * {
      box-sizing: border-box;
    }

    .pr-comparison-container {
      position: relative;
      overflow: hidden;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .pr-comparison-container::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%);
      pointer-events: none;
    }

    .pr-comparison-table-wrapper {
      position: relative;
      z-index: 1;
      overflow-x: auto;
    }

    .pr-comparison-table {
      width: 100%;
      border-collapse: collapse;
      background: transparent;
    }

    .pr-comparison-table th,
    .pr-comparison-table td {
      padding: 16px 20px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }

    .pr-comparison-table th {
      background: rgba(255, 255, 255, 0.1);
      font-weight: 600;
      font-size: 13px;
      color: white;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .pr-comparison-table th:first-child,
    .pr-comparison-table td:first-child {
      text-align: left;
      width: 30%;
      font-weight: 500;
      color: white;
    }

    .pr-comparison-header-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .pr-comparison-logo-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .pr-comparison-logo-wrapper-pr {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
    }

    .pr-comparison-logo-wrapper-comp {
      background: linear-gradient(135deg, rgba(165, 180, 252, 0.5) 0%, rgba(192, 132, 252, 0.5) 100%);
    }

    .pr-comparison-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    .pr-comparison-logo-placeholder {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.7);
    }

    .pr-comparison-name {
      font-size: 15px;
      font-weight: 600;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pr-comparison-name-pr {
      color: #4338ca;
    }

    .pr-comparison-name-comp {
      color: white;
    }

    /* Highlight column for Prompt Reviews (F-pattern) */
    .pr-comparison-highlight {
      background-color: rgba(99, 102, 241, 0.08) !important;
      border-left: 1px solid rgba(99, 102, 241, 0.15);
      border-right: 1px solid rgba(99, 102, 241, 0.15);
    }

    .pr-comparison-highlight-header {
      background-color: #e0e7ff !important;
      color: #4338ca;
    }

    .pr-comparison-category-row td {
      background: rgba(0, 0, 0, 0.1);
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: white;
      padding: 12px 16px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    }

    .pr-comparison-feature-name {
      font-weight: 500;
      color: white;
    }

    /* Feature value indicators */
    .pr-comparison-check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      font-size: 16px;
      font-weight: bold;
    }

    .pr-comparison-x {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
      font-size: 16px;
      font-weight: bold;
    }

    .pr-comparison-limited {
      display: inline-block;
      padding: 2px 8px;
      background: #fef3c7;
      color: #92400e;
      font-size: 11px;
      font-weight: 500;
      border-radius: 4px;
    }

    .pr-comparison-text-value {
      font-size: 13px;
      color: white;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .pr-comparison-table th,
      .pr-comparison-table td {
        padding: 8px 10px;
        font-size: 12px;
      }

      .pr-comparison-table th:first-child,
      .pr-comparison-table td:first-child {
        width: 40%;
      }

      .pr-comparison-logo-wrapper {
        width: 40px;
        height: 40px;
        border-radius: 10px;
      }

      .pr-comparison-logo {
        width: 24px;
        height: 24px;
      }

      .pr-comparison-logo-placeholder {
        font-size: 14px;
      }

      .pr-comparison-name {
        font-size: 12px;
        max-width: 70px;
      }

      .pr-comparison-check,
      .pr-comparison-x {
        width: 24px;
        height: 24px;
        font-size: 14px;
      }
    }

    /* Loading state */
    .pr-comparison-loading {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }

    .pr-comparison-loading-spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 2px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: pr-spin 0.8s linear infinite;
    }

    @keyframes pr-spin {
      to { transform: rotate(360deg); }
    }

    /* Error state */
    .pr-comparison-error {
      text-align: center;
      padding: 40px 20px;
      color: #ef4444;
      background: #fef2f2;
      border-radius: 8px;
    }
  `;

  // --- Utility Functions ---

  /**
   * Map icon names to SVG icons or Unicode symbols
   */
  var ICON_MAP = {
    'FaStar': '⭐',
    'FaComments': '💬',
    'FaMapMarker': '📍',
    'FaCoins': '💰',
    'FaChartLine': '📊',
    'FaCog': '⚙️',
    'FaCheck': '✓',
    'FaTimes': '✗',
    'FaUser': '👤',
    'FaUsers': '👥',
    'FaEnvelope': '✉️',
    'FaPhone': '📞',
    'FaGlobe': '🌐',
    'FaSearch': '🔍',
    'FaRocket': '🚀',
    'FaLightbulb': '💡',
    'FaShieldAlt': '🛡️',
    'FaCalendarAlt': '📅',
    'FaBell': '🔔',
    'FaImage': '🖼️',
    'FaLink': '🔗'
  };

  /**
   * Get icon for a given icon name
   */
  function getIcon(iconName) {
    if (!iconName) return '';
    return ICON_MAP[iconName] || '';
  }

  /**
   * Render a feature value indicator
   */
  function renderFeatureValue(hasFeature, isLimited, value, featureType) {
    if (isLimited) {
      return '<span class="pr-comparison-limited">Limited</span>';
    }

    if (featureType === 'text' && value) {
      return '<span class="pr-comparison-text-value">' + escapeHtml(value) + '</span>';
    }

    if (featureType === 'number' && value !== null) {
      return '<span class="pr-comparison-text-value">' + value + '</span>';
    }

    if (hasFeature) {
      return '<span class="pr-comparison-check" aria-label="Yes">✓</span>';
    }

    return '<span class="pr-comparison-x" aria-label="No">✗</span>';
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Table Rendering ---

  /**
   * Render a multi-competitor comparison table
   */
  function renderMultiComparisonTable(data) {
    var html = '<div class="pr-comparison-widget">';
    html += '<div class="pr-comparison-container">';
    html += '<div class="pr-comparison-table-wrapper">';
    html += '<table class="pr-comparison-table">';

    // Header row
    html += '<thead><tr>';
    html += '<th class="pr-comparison-feature-header">';
    html += '<div class="pr-comparison-header-cell">';
    html += '<div class="pr-comparison-logo-wrapper pr-comparison-logo-wrapper-comp">';
    html += '<svg viewBox="0 0 24 24" class="pr-comparison-logo" fill="white" style="width: 36px; height: 36px;"><path d="M12 2C11.45 2 11 2.45 11 3V4.29L5.71 6.59C5.28 6.78 5 7.2 5 7.67L5 8L2 14C2 15.66 3.34 17 5 17C6.66 17 8 15.66 8 14L5 8L11 5.5V19H7V21H17V19H13V5.5L19 8L16 14C16 15.66 17.34 17 19 17C20.66 17 22 15.66 22 14L19 8V7.67C19 7.2 18.72 6.78 18.29 6.59L13 4.29V3C13 2.45 12.55 2 12 2ZM5 9.33L6.77 13H3.23L5 9.33ZM19 9.33L20.77 13H17.23L19 9.33Z"/></svg>';
    html += '</div>';
    html += '<span class="pr-comparison-name" style="color: rgba(255,255,255,0.8);">Features</span>';
    html += '</div></th>';

    // Prompt Reviews column (always first - F-pattern)
    html += '<th class="pr-comparison-highlight-header">';
    html += '<div class="pr-comparison-header-cell">';
    html += '<div class="pr-comparison-logo-wrapper pr-comparison-logo-wrapper-pr">';
    html += '<svg viewBox="0 0 225 225" class="pr-comparison-logo" fill="white"><path fill-rule="evenodd" d="M 82.375 7.867188 C 75.75 11.171875 67.027344 24.929688 59.957031 43.238281 C 55.550781 54.644531 56.246094 56.117188 69.203125 62.855469 C 76.160156 66.476562 76.519531 67.210938 70.445312 65.410156 C 63.566406 63.367188 59.089844 60.738281 46.339844 51.253906 C 31.546875 40.246094 29.222656 39.117188 22.179688 39.515625 C -2.902344 40.933594 -2.007812 84.523438 23.425781 100.242188 C 26.636719 102.226562 27.363281 107.472656 24.546875 108.367188 C 16.679688 110.863281 16.078125 146.238281 23.832031 150.417969 L 26.625 151.925781 L 27.109375 161.332031 C 28.25 183.464844 35.175781 193.601562 52.15625 197.996094 C 59.113281 199.796875 166.875 199.796875 173.832031 197.996094 C 190.46875 193.6875 197.679688 183.132812 198.886719 161.308594 L 199.363281 152.65625 L 202.039062 151.214844 C 206.609375 148.753906 206.9375 147.308594 206.917969 129.660156 C 206.898438 112.15625 206.804688 111.800781 201.671875 109.21875 C 197.058594 106.902344 197.972656 103.710938 204.875 98.042969 C 225.203125 81.359375 228.429688 51.421875 211.003906 41.171875 C 203.277344 36.625 195.855469 39 179.648438 51.207031 C 168.914062 59.289062 159.210938 64.585938 153.53125 65.464844 C 150.714844 65.898438 151.011719 65.632812 156.652344 62.699219 C 169.683594 55.917969 170.105469 55.113281 166.320312 44.316406 C 154.664062 11.066406 143.5 1.761719 123.367188 8.519531 C 113.101562 11.964844 112.375 11.96875 102.792969 8.605469 C 93.066406 5.195312 88.101562 5.015625 82.375 7.867188 M 85.371094 49.585938 C 69.445312 50.890625 67.394531 52.152344 76.160156 55.265625 C 99.246094 63.464844 140.515625 62.109375 155.457031 52.667969 C 159.820312 49.910156 108.796875 47.667969 85.371094 49.585938 M 44.234375 79.988281 C 41.246094 81.902344 37.332031 87.59375 36 91.960938 C 34.726562 96.136719 34.972656 164.753906 36.285156 171.132812 C 38.050781 179.726562 44.109375 186.835938 52.015625 189.59375 C 58.28125 191.777344 167.707031 191.777344 173.972656 189.59375 C 189 184.351562 190.730469 177.890625 190.40625 128.257812 C 190.140625 87.800781 190.175781 88.035156 183.085938 81.5 C 178.941406 77.679688 178.410156 77.675781 171.09375 81.421875 L 165.269531 84.402344 L 168.542969 84.957031 C 180.753906 87.019531 181.609375 90.527344 181 136.019531 C 180.332031 185.933594 187.40625 181.234375 112.992188 181.234375 C 38.015625 181.234375 45.40625 186.398438 44.933594 133.695312 C 44.546875 90.324219 45.074219 88.113281 56.402344 85.394531 L 60.363281 84.445312 L 54.070312 81.40625 C 46.734375 77.855469 47.410156 77.953125 44.234375 79.988281 M 76.710938 106.621094 C 63.355469 115.625 71.667969 142.847656 85.699219 136.054688 C 98.148438 130.03125 95.476562 104.867188 82.390625 104.867188 C 80.488281 104.867188 78.316406 105.539062 76.710938 106.621094 M 138.453125 106.835938 C 128.171875 115.484375 131.820312 136.808594 143.613281 136.96875 C 155.996094 137.140625 160.914062 114.828125 150.332031 106.5 C 147.265625 104.089844 141.523438 104.25 138.453125 106.835938 M 88.59375 148.679688 C 86.675781 150.597656 87.574219 153.722656 91.203125 157.757812 C 103.015625 170.898438 130.242188 168.609375 138.003906 153.828125 C 141.296875 147.550781 135.140625 145.519531 129.988281 151.179688 C 121.070312 160.976562 105.605469 161.347656 96.601562 151.976562 C 92.566406 147.777344 90.390625 146.882812 88.59375 148.679688" /></svg>';
    html += '</div>';
    html += '<span class="pr-comparison-name pr-comparison-name-pr">Prompt Reviews</span>';
    html += '</div></th>';

    // Competitor columns
    for (var i = 0; i < data.competitors.length; i++) {
      var comp = data.competitors[i];
      html += '<th>';
      html += '<div class="pr-comparison-header-cell">';
      html += '<div class="pr-comparison-logo-wrapper pr-comparison-logo-wrapper-comp">';
      if (comp.logo) {
        html += '<img src="' + escapeHtml(comp.logo) + '" alt="' + escapeHtml(comp.name) + '" class="pr-comparison-logo" onerror="this.outerHTML=\'<div class=pr-comparison-logo-placeholder>' + escapeHtml(comp.name.charAt(0)) + '</div>\'">';
      } else {
        html += '<div class="pr-comparison-logo-placeholder">' + escapeHtml(comp.name.charAt(0)) + '</div>';
      }
      html += '</div>';
      html += '<span class="pr-comparison-name pr-comparison-name-comp">' + escapeHtml(comp.name) + '</span>';
      html += '</div></th>';
    }
    html += '</tr></thead>';

    // Body
    html += '<tbody>';

    // Categories and features
    for (var c = 0; c < data.categories.length; c++) {
      var category = data.categories[c];

      // Category header row
      html += '<tr class="pr-comparison-category-row">';
      html += '<td colspan="' + (2 + data.competitors.length) + '">';
      var categoryIcon = getIcon(category.icon);
      if (categoryIcon) {
        html += '<span style="margin-right: 8px;">' + categoryIcon + '</span>';
      }
      html += escapeHtml(category.name);
      html += '</td></tr>';

      // Feature rows
      var features = category.features || [];
      for (var f = 0; f < features.length; f++) {
        var feature = features[f];

        html += '<tr>';
        html += '<td class="pr-comparison-feature-name">' + escapeHtml(feature.benefitName || feature.name) + '</td>';

        // PromptReviews value (highlighted column)
        var prFeature = data.promptReviews.features[feature.slug] || { hasFeature: true, isLimited: false };
        html += '<td class="pr-comparison-highlight">';
        html += renderFeatureValue(prFeature.hasFeature, prFeature.isLimited, prFeature.value, feature.type);
        html += '</td>';

        // Competitor values
        for (var ci = 0; ci < data.competitors.length; ci++) {
          var compFeatures = data.competitors[ci].features || {};
          var compFeature = compFeatures[feature.slug] || { hasFeature: false, isLimited: false };
          html += '<td>';
          html += renderFeatureValue(compFeature.hasFeature, compFeature.isLimited, compFeature.value, feature.type);
          html += '</td>';
        }

        html += '</tr>';
      }
    }

    // Pricing notes section
    if (data.pricingNotes && Object.keys(data.pricingNotes).length > 0) {
      // Pricing category header
      html += '<tr class="pr-comparison-category-row">';
      html += '<td colspan="' + (2 + data.competitors.length) + '">';
      html += '<span style="margin-right: 8px;">💰</span>Pricing';
      html += '</td></tr>';

      // Pricing row
      html += '<tr>';
      html += '<td class="pr-comparison-feature-name">Starting price</td>';
      html += '<td class="pr-comparison-highlight">';
      html += '<span class="pr-comparison-text-value">' + escapeHtml(data.pricingNotes.promptreviews || '—') + '</span>';
      html += '</td>';

      for (var pi = 0; pi < data.competitors.length; pi++) {
        var compSlug = data.competitors[pi].slug;
        html += '<td>';
        html += '<span class="pr-comparison-text-value">' + escapeHtml(data.pricingNotes[compSlug] || '—') + '</span>';
        html += '</td>';
      }
      html += '</tr>';
    }

    html += '</tbody></table>';
    html += '</div></div></div>'; // Close table-wrapper, container, widget
    return html;
  }

  /**
   * Render a 1-on-1 comparison table
   */
  function renderSingleComparisonTable(data) {
    // Same structure but optimized for 2 columns
    return renderMultiComparisonTable(data);
  }

  // --- Initialization ---

  /**
   * Inject CSS styles
   */
  function injectStyles() {
    if (document.getElementById('pr-comparison-styles')) return;

    var style = document.createElement('style');
    style.id = 'pr-comparison-styles';
    style.textContent = CSS_STYLES;
    document.head.appendChild(style);
  }

  /**
   * Initialize a single widget container
   */
  async function initializeWidget(container) {
    var slug = container.getAttribute('data-comparison-id');
    if (!slug) {
      container.innerHTML = '<div class="pr-comparison-error">Missing data-comparison-id attribute</div>';
      return;
    }

    // Show loading state
    container.innerHTML = '<div class="pr-comparison-loading"><div class="pr-comparison-loading-spinner"></div><p>Loading comparison...</p></div>';

    try {
      var response = await fetch(API_BASE + '/api/comparisons/embed/' + encodeURIComponent(slug));

      if (!response.ok) {
        throw new Error('Failed to load comparison table');
      }

      var data = await response.json();

      if (!data || !data.categories || data.categories.length === 0) {
        container.innerHTML = '<div class="pr-comparison-error">No comparison data available</div>';
        return;
      }

      // Render the table
      if (data.tableType === 'single') {
        container.innerHTML = renderSingleComparisonTable(data);
      } else {
        container.innerHTML = renderMultiComparisonTable(data);
      }

    } catch (error) {
      console.error('PromptReviews Comparison Widget Error:', error);
      container.innerHTML = '<div class="pr-comparison-error">Error loading comparison table</div>';
    }
  }

  /**
   * Auto-initialize all widgets on the page
   */
  function autoInitialize() {
    injectStyles();

    // Find all containers with data-comparison-id
    var containers = document.querySelectorAll('[data-comparison-id]');
    for (var i = 0; i < containers.length; i++) {
      initializeWidget(containers[i]);
    }
  }

  // --- Entry Point ---

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    autoInitialize();
  }

  // Expose API for manual initialization
  window.PromptReviews = window.PromptReviews || {};
  window.PromptReviews.initComparison = initializeWidget;
  window.PromptReviews.refreshComparisons = autoInitialize;

})();
