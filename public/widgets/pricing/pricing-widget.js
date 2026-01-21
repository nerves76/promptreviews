// Prompt Reviews Embeddable Pricing Widget
// Self-contained vanilla JavaScript widget for embedding on external websites

(function() {
  'use strict';

  // Static pricing data - matches PricingModal.tsx exactly
  const TIERS = [
    {
      key: 'grower',
      name: 'Grower',
      description: 'Great for solo operators getting started',
      priceMonthly: 24,
      priceAnnual: 20, // per month when billed annually
      annualTotal: 245,
      savings: 43,
      features: [
        '500 credits/month',
        'Universal Prompt Page',
        '3 custom Prompt Pages',
        'Review widgets',
        'Local & AI visibility tracking',
        'Analytics',
        '1 managed Google Business Profile'
      ]
    },
    {
      key: 'builder',
      name: 'Builder',
      description: 'For teams scaling review & visibility',
      priceMonthly: 40,
      priceAnnual: 34,
      annualTotal: 408,
      savings: 72,
      popular: true,
      features: [
        '1,000 credits/month',
        '3 team members',
        'Campaign management',
        'Universal Prompt Page',
        '50 Prompt Pages',
        'Contact management (up to 1000)',
        'Review widgets',
        'Local & AI visibility tracking',
        'Analytics',
        '3 managed Google Business Profiles'
      ]
    },
    {
      key: 'maven',
      name: 'Maven',
      description: 'Great for multi-location brands',
      priceMonthly: 100,
      priceAnnual: 85,
      annualTotal: 1020,
      savings: 180,
      features: [
        '2,000 credits/month',
        '5 team members',
        'Campaign management',
        'Up to 10 business locations',
        '500 Prompt Pages',
        'Contact management (up to 10,000)',
        'Review widgets',
        'Local & AI visibility tracking',
        'Analytics',
        '10 managed Google Business Profiles'
      ]
    }
  ];

  // State
  let billingPeriod = 'annual'; // Default to annual (better value)

  // Base URL for sign-up links
  const SIGNUP_BASE_URL = 'https://app.promptreviews.app/auth/sign-up';

  // Inject CSS styles inline
  function injectCSS() {
    if (document.getElementById('promptreviews-pricing-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'promptreviews-pricing-styles';
    style.textContent = `
      /* Prompt Reviews Embeddable Pricing Widget */
      #promptreviews-pricing {
        position: relative;
        width: 100%;
        max-width: 80rem;
        margin-left: auto;
        margin-right: auto;
        font-size: 16px;
        padding: 2rem 1rem;
      }

      .pr-pricing-widget {
        all: revert;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 16px !important;
      }

      .pr-pricing-widget *,
      .pr-pricing-widget *::before,
      .pr-pricing-widget *::after {
        box-sizing: border-box;
      }

      .pr-pricing-toggle-container {
        display: flex;
        justify-content: center;
        margin-bottom: 2rem;
      }

      .pr-pricing-toggle {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 1rem;
        padding: 0.25rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        align-items: center;
        border: 2px solid white;
      }

      .pr-pricing-toggle-btn {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.2s ease;
        background: transparent;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .pr-pricing-toggle-btn:hover {
        background: #f3f4f6;
      }

      .pr-pricing-toggle-btn.active {
        background: #2E4A7D;
        color: white;
      }

      .pr-pricing-toggle-btn.active:hover {
        background: #2E4A7D;
      }

      .pr-pricing-save-badge {
        font-size: 0.75rem;
        background: #22c55e;
        color: white;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        white-space: nowrap;
      }

      .pr-pricing-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
        width: 100%;
      }

      .pr-pricing-card {
        border-radius: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        padding: 2rem 2.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 420px;
        position: relative;
      }

      .pr-pricing-card--grower {
        background: #dbeafe;
      }

      .pr-pricing-card--builder {
        background: #e9d5ff;
        box-shadow: 0 0 0 4px #facc15;
      }

      .pr-pricing-card--maven {
        background: #fef08a;
      }

      .pr-pricing-card-name {
        font-size: 1.875rem;
        font-weight: 700;
        color: #2E4A7D;
        margin: 0 0 0.25rem 0;
      }

      .pr-pricing-card-description {
        font-size: 0.875rem;
        color: #2E4A7D;
        opacity: 0.8;
        margin: 0 0 0.75rem 0;
        text-align: center;
      }

      .pr-pricing-price-container {
        color: #2E4A7D;
        margin-bottom: 1rem;
        text-align: center;
      }

      .pr-pricing-price {
        font-size: 1.5rem;
        font-weight: 600;
      }

      .pr-pricing-period {
        font-size: 1.125rem;
      }

      .pr-pricing-annual-note {
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }

      .pr-pricing-features {
        list-style: none;
        padding: 0;
        margin: 0 0 2rem 0;
        flex-grow: 1;
        width: 100%;
      }

      .pr-pricing-feature {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 1rem;
        color: #1f2937;
        padding: 0.375rem 0;
      }

      .pr-pricing-feature-check {
        color: #22c55e;
        flex-shrink: 0;
        margin-top: 0.125rem;
      }

      .pr-pricing-feature-text {
        text-align: left;
      }

      .pr-pricing-cta {
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        border: none;
        font-size: 1.125rem;
        font-weight: 600;
        cursor: pointer;
        background: #2E4A7D;
        color: white;
        transition: background 0.2s ease;
        text-decoration: none;
        display: block;
        text-align: center;
        margin-top: auto;
      }

      .pr-pricing-cta:hover {
        background: rgba(46, 74, 125, 0.9);
      }

      .pr-pricing-footer-note {
        font-size: 0.75rem;
        color: #6b7280;
        text-align: center;
        margin-top: 0.5rem;
        min-height: 1.25rem;
      }

      @media (max-width: 1024px) {
        .pr-pricing-grid {
          grid-template-columns: 1fr;
          max-width: 420px;
          margin: 0 auto;
          gap: 1.5rem;
        }

        .pr-pricing-card {
          padding: 1.5rem 1.5rem;
          min-height: auto;
        }

        .pr-pricing-card--builder {
          order: -1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Create checkmark SVG
  function createCheckSVG() {
    return `<svg class="pr-pricing-feature-check" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
    </svg>`;
  }

  // Create card HTML for a tier
  function createCardHTML(tier, billing) {
    const price = billing === 'annual' ? tier.priceAnnual : tier.priceMonthly;
    const signupUrl = `${SIGNUP_BASE_URL}?plan=${tier.key}&billing=${billing}&src=pricing-widget`;

    const featuresHTML = tier.features.map(feature => `
      <li class="pr-pricing-feature">
        ${createCheckSVG()}
        <span class="pr-pricing-feature-text">${feature}</span>
      </li>
    `).join('');

    const priceDisplayHTML = billing === 'annual'
      ? `<div class="pr-pricing-price-container">
          <span class="pr-pricing-price">$${price}</span>
          <span class="pr-pricing-period"> / month</span>
          <div class="pr-pricing-annual-note">$${tier.annualTotal}/year - Save $${tier.savings}</div>
        </div>`
      : `<div class="pr-pricing-price-container">
          <span class="pr-pricing-price">$${price}</span>
          <span class="pr-pricing-period"> / month</span>
        </div>`;

    return `
      <div class="pr-pricing-card pr-pricing-card--${tier.key}">
        <h3 class="pr-pricing-card-name">${tier.name}</h3>
        <p class="pr-pricing-card-description">${tier.description}</p>
        ${priceDisplayHTML}
        <ul class="pr-pricing-features">
          ${featuresHTML}
        </ul>
        <a href="${signupUrl}" class="pr-pricing-cta" target="_blank" rel="noopener noreferrer">
          Get started
        </a>
        <div class="pr-pricing-footer-note">
          ${tier.key === 'grower' ? '14-day free trial available' : ''}
        </div>
      </div>
    `;
  }

  // Create the full widget HTML
  function createWidgetHTML(billing) {
    const cardsHTML = TIERS.map(tier => createCardHTML(tier, billing)).join('');

    return `
      <div class="pr-pricing-widget">
        <div class="pr-pricing-toggle-container">
          <div class="pr-pricing-toggle">
            <button type="button" class="pr-pricing-toggle-btn ${billing === 'monthly' ? 'active' : ''}" data-billing="monthly">
              Monthly
            </button>
            <button type="button" class="pr-pricing-toggle-btn ${billing === 'annual' ? 'active' : ''}" data-billing="annual">
              Annual
              <span class="pr-pricing-save-badge">Save 15%</span>
            </button>
          </div>
        </div>
        <div class="pr-pricing-grid">
          ${cardsHTML}
        </div>
      </div>
    `;
  }

  // Handle billing toggle clicks
  function handleToggleClick(event) {
    const btn = event.target.closest('.pr-pricing-toggle-btn');
    if (!btn) return;

    const newBilling = btn.getAttribute('data-billing');
    if (newBilling && newBilling !== billingPeriod) {
      billingPeriod = newBilling;
      renderWidget();
    }
  }

  // Render the widget
  function renderWidget() {
    const container = document.getElementById('promptreviews-pricing');
    if (!container) return;

    container.innerHTML = createWidgetHTML(billingPeriod);

    // Add toggle event listeners
    const toggleBtns = container.querySelectorAll('.pr-pricing-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', handleToggleClick);
    });
  }

  // Initialize the widget
  function initializePricingWidget() {
    const container = document.getElementById('promptreviews-pricing');
    if (!container) {
      console.log('PromptReviews Pricing: No container found with id "promptreviews-pricing"');
      return;
    }

    // Check for default billing preference from data attribute
    const defaultBilling = container.getAttribute('data-default-billing');
    if (defaultBilling === 'monthly' || defaultBilling === 'annual') {
      billingPeriod = defaultBilling;
    }

    injectCSS();
    renderWidget();
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePricingWidget);
  } else {
    initializePricingWidget();
  }

  // Expose to global scope for manual initialization
  window.PromptReviewsPricing = {
    initialize: initializePricingWidget,
    setBilling: function(billing) {
      if (billing === 'monthly' || billing === 'annual') {
        billingPeriod = billing;
        renderWidget();
      }
    }
  };

})();
