// PromptReviews Single Widget - Vanilla JS
// This file contains the core widget logic for the single card carousel widget

(function() {
  'use strict';

  // Global state for carousel management
  const carouselState = {};

  // Initialize the widget
  window.PromptReviewsSingle = window.PromptReviewsSingle || {};
  
  // Only define initializeWidget if it doesn't already exist (to avoid conflicts with multi widget)
  if (!window.PromptReviewsSingle.initializeWidget) {
    window.PromptReviewsSingle.initializeWidget = function(containerId, reviews, design, businessSlug) {
      console.log('--- WIDGET INITIALIZATION - BUILD VERSION 5.0 ---');
      console.log('🚀 SingleWidget: Initializing widget', { containerId, reviewsCount: reviews?.length, design });
      
      if (!reviews || reviews.length === 0) {
        console.warn('⚠️ SingleWidget: No reviews provided');
        return;
      }

      const widgetElement = document.getElementById(containerId);
      if (!widgetElement) {
        console.error('❌ SingleWidget: Widget container not found:', containerId);
        return;
      }

      single_injectCSS();
      single_loadGoogleFont(design.font);
      single_setCSSVariables(widgetElement, design);

      // Create and insert the widget HTML
      const widgetHTML = single_createCarouselHTML(containerId, reviews, design, businessSlug);
      widgetElement.innerHTML = widgetHTML;
      
      // Add the main CSS classes to the container so styles are applied
      widgetElement.classList.add('pr-widget-container', 'pr-single-widget');

      // Initialize carousel functionality
      single_initCarousel(containerId, reviews, design);
      
      console.log('✅ SingleWidget: Widget initialized successfully');
    };
  }

  function single_injectCSS() {
    const styleId = 'promptreviews-single-widget-styles';
    if (document.getElementById(styleId)) return;

    const link = document.createElement('link');
    link.id = styleId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
  
    let cssUrl;
    const scriptSrc = document.currentScript ? document.currentScript.src : null;
  
    if (scriptSrc) {
      // For external embeds, create a URL relative to the script's path
      cssUrl = new URL('single-widget.css', scriptSrc).href;
    } else {
      // For dashboard preview, use a fixed root-relative path
      cssUrl = '/widgets/single/single-widget.css';
    }
  
    link.href = `${cssUrl}?v=${new Date().getTime()}`;
    console.log('Attempting to load CSS from:', link.href);
    document.head.appendChild(link);
  }

  function single_setCSSVariables(container, design) {
    // Set CSS variables for theming on the specific widget container
    const a = (color, fallback) => design[color] || fallback;
    
    // Convert hex color to rgba with opacity
    const hexToRgba = (hex, opacity) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    
    // Handle background color with opacity
    const bgColor = a('bgColor', '#ffffff');
    const bgOpacity = design.bgOpacity !== undefined ? design.bgOpacity : 1;
    const backgroundWithOpacity = bgOpacity < 1 && bgColor.startsWith('#') 
      ? hexToRgba(bgColor, bgOpacity)
      : bgColor;
    
    // Handle border color with opacity
    const borderColor = a('borderColor', '#cccccc');
    const borderOpacity = design.borderOpacity !== undefined ? design.borderOpacity : 1;
    const borderWithOpacity = borderOpacity < 1 && borderColor.startsWith('#')
      ? hexToRgba(borderColor, borderOpacity)
      : borderColor;
    
    container.style.setProperty('--pr-card-bg', backgroundWithOpacity);
    container.style.setProperty('--pr-text-color', a('textColor', '#22223b'));
    container.style.setProperty('--pr-accent-color', a('accentColor', '#4f46e5'));
    container.style.setProperty('--pr-name-text-color', a('nameTextColor', '#1a237e'));
    container.style.setProperty('--pr-role-text-color', a('roleTextColor', '#6b7280'));

    container.style.setProperty('--pr-card-border-width', `${design.borderWidth || 2}px`);
    container.style.setProperty('--pr-card-border-color', borderWithOpacity);
    container.style.setProperty('--pr-card-radius', `${design.borderRadius || 16}px`);
    
    // Remove opacity property - we handle it in the colors themselves
    container.style.setProperty('--pr-card-opacity', '1');
    container.style.setProperty('--pr-font-family', design.font || 'Inter, sans-serif');
    container.style.setProperty('--pr-line-spacing', design.lineSpacing || 1.4);
    
    // Handle both outer shadow and inner shadow
    let shadows = [];
    
    if (design.shadow) {
      const shadowColor = design.shadowColor || '#000000';
      const shadowIntensity = design.shadowIntensity || 0.2;
      const shadowColorWithOpacity = shadowColor.startsWith('#') 
        ? hexToRgba(shadowColor, shadowIntensity)
        : `rgba(0, 0, 0, ${shadowIntensity})`;
      shadows.push(`0 4px 6px -1px ${shadowColorWithOpacity}`);
    }
    
    // Add inner shadow for frosty glass effect
    if (design.innerShadow) {
      const innerShadowColor = design.innerShadowColor || '#FFFFFF';
      const innerShadowOpacity = design.innerShadowOpacity || 0.5;
      const innerShadowRgba = innerShadowColor.startsWith('#')
        ? hexToRgba(innerShadowColor, innerShadowOpacity)
        : `rgba(255, 255, 255, ${innerShadowOpacity})`;
      shadows.push(`inset 0 1px 3px ${innerShadowRgba}`);
    }
    
    container.style.setProperty('--pr-card-shadow', shadows.length > 0 ? shadows.join(', ') : 'none');
    
    // Always apply backdrop blur
    const backdropBlur = design.backdropBlur || 10;
    container.style.setProperty('--pr-backdrop-blur', `${backdropBlur}px`);
    
    container.style.setProperty('--pr-attribution-font-size', `${design.attributionFontSize || 15}px`);
  }

  function single_initCarouselState(widgetId, reviews, design) {
    carouselState[widgetId] = {
      currentIndex: 0,
      totalItems: reviews.length,
      itemsPerView: 1, // Single card always shows 1 item
      autoAdvance: design.autoAdvance || false,
      slideshowSpeed: design.slideshowSpeed || 4,
      autoAdvanceInterval: null
    };
  }

  function single_calculateItemsPerView(widgetId) {
    // Single widget always shows 1 item
    return 1;
  }

  function single_initCarousel(widgetId, reviews, design) {
    console.log(`🚀 single_initCarousel: Initializing for widgetId: "${widgetId}"`);
    const widgetElement = document.getElementById(widgetId);

    if (!widgetElement) {
      console.error(`❌ single_initCarousel: FAILED to find element with ID: "${widgetId}". The widget cannot be initialized.`);
      return;
    }
    console.log('✅ single_initCarousel: Found widgetElement:', widgetElement);

    // CRITICAL FIX: Initialize the state here. All event listeners below depend on it.
    single_initCarouselState(widgetId, reviews, design);
    const state = carouselState[widgetId];

    if (!state) {
      console.error(`❌ single_initCarousel: FAILED to initialize state for widgetId: "${widgetId}"`);
      return;
    }

    const track = widgetElement.querySelector('.pr-single-carousel-track');
    const prevBtn = widgetElement.querySelector('.pr-single-prev-btn');
    const nextBtn = widgetElement.querySelector('.pr-single-next-btn');

    // Set up event listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (state.currentIndex > 0) {
          state.currentIndex--;
          single_updateCarousel(widgetId);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (state.currentIndex < state.totalItems - 1) {
          state.currentIndex++;
          single_updateCarousel(widgetId);
        }
      });
    }

    // Set up auto-advance if enabled
    if (state.autoAdvance && state.totalItems > 1) {
      state.autoAdvanceInterval = setInterval(() => {
        if (state.currentIndex < state.totalItems - 1) {
          state.currentIndex++;
        } else {
          state.currentIndex = 0;
        }
        single_updateCarousel(widgetId);
      }, state.slideshowSpeed * 1000);
    }

    // Initial update
    single_updateCarousel(widgetId);
  }

  function single_updateCarousel(widgetId) {
    const state = carouselState[widgetId];
    if (!state) return;

    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement) return; // Widget element doesn't exist, likely removed from DOM

    const track = widgetElement.querySelector('.pr-single-carousel-track');
    if (!track) return;

    // Recalculate items per view on each update for responsiveness
    state.itemsPerView = single_calculateItemsPerView(widgetId);
    
    // Use precise pixel values for transform to account for gaps
    const firstItem = widgetElement.querySelector('.pr-single-carousel-item');
    if (!firstItem) return; // Can't calculate transform without an item

    const gapStyle = window.getComputedStyle(track).gap;
    const gap = parseFloat(gapStyle) || 0; // No gap for single widget

    const itemTotalWidth = firstItem.offsetWidth + gap;
    const offset = -state.currentIndex * itemTotalWidth;
    track.style.transform = `translateX(${offset}px)`;
    
    single_updateDots(widgetId);
    single_updateArrowButtons(widgetId);
  }

  function single_updateDots(widgetId) {
    const state = carouselState[widgetId];
    if (!state) return;

    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement) return; // Widget element doesn't exist, likely removed from DOM

    const dotsContainer = widgetElement.querySelector('.pr-single-dots-container');
    if (!dotsContainer) return;

    // Clear existing dots
    dotsContainer.innerHTML = '';

    // Create dots for each review
    for (let i = 0; i < state.totalItems; i++) {
      const dot = document.createElement('button');
      dot.className = `pr-single-dot ${i === state.currentIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        state.currentIndex = i;
        single_updateCarousel(widgetId);
      });
      dotsContainer.appendChild(dot);
    }
  }

  function single_updateArrowButtons(widgetId) {
    const state = carouselState[widgetId];
    if (!state) return;

    const widgetElement = document.getElementById(widgetId);
    if (!widgetElement) return; // Widget element doesn't exist, likely removed from DOM

    const prevBtn = widgetElement.querySelector('.pr-single-prev-btn');
    const nextBtn = widgetElement.querySelector('.pr-single-next-btn');

    if (prevBtn) {
      prevBtn.style.opacity = state.currentIndex === 0 ? '0.5' : '1';
      prevBtn.disabled = state.currentIndex === 0;
    }

    if (nextBtn) {
      nextBtn.style.opacity = state.currentIndex === state.totalItems - 1 ? '0.5' : '1';
      nextBtn.disabled = state.currentIndex === state.totalItems - 1;
    }
  }

  function single_renderStars(rating, design) {
    // CSS classes now control the color, so we don't need inline styles here.
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
      starsHTML += `<span class="pr-single-star ${i <= rating ? 'filled' : ''}">&#9733;</span>`;
    }
    return starsHTML;
  }

  function single_createReviewCard(review, design) {
    const reviewText = review.review_content;
    const dateText = design.showRelativeDate ? single_getRelativeDate(review.created_at) : new Date(review.created_at).toLocaleDateString();
    const starsHTML = single_renderStars(review.star_rating, design);

    return `
      <div class="pr-single-review-card">
        <div class="pr-single-stars-row">${starsHTML}</div>
        <div class="pr-single-review-content">
          <p class="pr-single-review-text">${reviewText}</p>
        </div>
        <div class="pr-single-reviewer-details">
          <div class="pr-single-reviewer-name">${review.first_name || ""} ${review.last_name || ""}</div>
          ${review.reviewer_role ? `<div class="pr-single-reviewer-role">${review.reviewer_role}</div>` : ""}
          <div class="pr-single-review-date">${dateText}</div>
        </div>
      </div>
    `;
  }

  function single_getRelativeDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  function single_generateSchemaMarkup(reviews, businessName) {
    if (!reviews || reviews.length === 0) return '';
    
    // Calculate aggregate rating
    const totalRating = reviews.reduce((sum, review) => sum + (review.star_rating || 0), 0);
    const averageRating = (totalRating / reviews.length).toFixed(1);
    const reviewCount = reviews.length;
    
    // Get business name from the page or use a default
    const name = businessName || document.title || 'Business';
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product", // Can also use "LocalBusiness" or "Organization"
      "name": name,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": reviewCount,
        "reviewCount": reviewCount
      },
      "review": reviews.slice(0, 5).map(review => ({ // Google typically shows first 5
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": review.star_rating || 5,
          "bestRating": "5",
          "worstRating": "1"
        },
        "author": {
          "@type": "Person",
          "name": `${review.first_name || ''} ${review.last_name || ''}`.trim() || "Anonymous"
        },
        "datePublished": review.created_at,
        "reviewBody": review.review_content
      }))
    };
    
    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  }

  function single_createCarouselHTML(widgetId, reviews, design, businessSlug) {
    const carouselItemsHTML = reviews.map(review => 
        `<div class="pr-single-carousel-item">${single_createReviewCard(review, design)}</div>`
    ).join('');

    const controlsHTML = `
      <div class="pr-single-carousel-controls">
        <button class="pr-single-prev-btn" title="Previous review"></button>
        <div class="pr-single-dots-container"></div>
        <button class="pr-single-next-btn" title="Next review"></button>
      </div>
    `;

    const submitReviewHTML = `
      <div class="pr-single-submit-review-container">
        <a href="https://promptreviews.app/r/${businessSlug}?source=widget" target="_blank" class="pr-single-submit-btn">
          Submit a Review
        </a>
      </div>
    `;

    // Generate schema markup for SEO
    const schemaMarkup = single_generateSchemaMarkup(reviews, null); // Will use document.title as fallback

    return `
      ${schemaMarkup}
      <div class="pr-single-carousel-container">
        <div class="pr-single-carousel-track">
          ${carouselItemsHTML}
        </div>
      </div>
      ${reviews.length > 1 ? controlsHTML : ""}
      ${design.showSubmitReviewButton ? submitReviewHTML : ""}
    `;
  }

  // Expose the render function for direct use
  window.PromptReviewsSingle.renderSingleWidget = function(containerId, reviews, design, businessSlug) {
    window.PromptReviewsSingle.initializeWidget(containerId, reviews, design, businessSlug);
  };

  // Main function to initialize all widgets on the page
  async function single_autoInitializeWidgets() {
    // Skip auto-initialization if we're in a dashboard context
    // Dashboard components will call initializeWidget manually
    if (window.location.pathname.includes('/dashboard')) {
      console.log('🔄 SingleWidget: Dashboard context detected, skipping auto-initialization');
      return;
    }

    console.log('🚀 AUTO INIT STARTED - Single Widget');
    console.log('🔍 Auto-initialization: Looking for widget containers...');
    
    // Debug: Check all elements with data attributes (using a valid approach)
    const allElements = document.querySelectorAll('*');
    const elementsWithData = Array.from(allElements).filter(el => {
      const dataAttrs = Object.keys(el.dataset);
      return dataAttrs.length > 0;
    });
    console.log('🔍 All elements with data attributes:', elementsWithData.length);
    elementsWithData.forEach(el => {
      console.log("🔍 Element:", el.tagName, "data attributes:", Object.keys(el.dataset));
    });

    const allPotentialContainers = document.querySelectorAll('[data-widget-id]');
    const widgetContainers = Array.from(allPotentialContainers).filter(
      el => el.dataset.widgetType === 'single'
    );
    
    console.log('🔍 Auto-initialization: Found single widget containers:', widgetContainers.length);

    if (widgetContainers.length > 0) {
      console.log('🔍 Auto-initialization: Processing containers...');
      single_injectCSS();

      for (const container of widgetContainers) {
        const widgetId = container.dataset.widgetId;
        const businessSlug = container.getAttribute('data-business-slug');
        console.log("🔍 Auto-initialization: Processing widget:", widgetId, "business slug:", businessSlug);

        try {
          // Use absolute URL for cross-domain embedding
          const apiUrl = window.location.hostname === 'app.promptreviews.app' 
            ? `/api/widgets/${widgetId}`
            : `https://app.promptreviews.app/api/widgets/${widgetId}`;
          
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch widget data: ${response.statusText}`);
          }
          
          const { reviews, design, businessSlug } = await response.json();
          console.log("🔍 Auto-initialization: Fetched data for widget:", widgetId, "reviews:", reviews?.length);
          
          if (reviews && reviews.length > 0) {
            container.id = `pr-single-widget-${widgetId}`;

            // Load dynamic assets
            single_loadGoogleFont(design.font);
            single_setCSSVariables(container, design);
            
            // Set content and classes
            container.innerHTML = single_createCarouselHTML(container.id, reviews, design, businessSlug);
            container.classList.add('pr-widget-container', 'pr-single-widget');
            
            // Initialize functionality
            single_initCarousel(container.id, reviews, design);
            
            console.log("🔍 Auto-initialization: Successfully initialized widget:", widgetId);
          } else {
            container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; min-height: 200px; color: white; font-size: 18px;">
            <div style="text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                <svg style="width: 24px; height: 24px;" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
                </svg>
                <span>Add reviews to your widget</span>
              </div>
              <p style="font-size: 14px; opacity: 0.8;">Click talk bubble icon to add and manage reviews.</p>
            </div>
          </div>
        `;
            console.log("🔍 Auto-initialization: No reviews for widget:", widgetId);
          }
        } catch (error) {
          console.error('Error initializing PromptReviews Single widget:', error);
          container.innerHTML = "<p>Error loading reviews.</p>";
        }
      }
    } else {
        console.log("🔍 Auto-initialization: No single widget containers found.");
        console.log("🔍 Available data attributes on page:", elementsWithData.map(el => Object.keys(el.dataset)).flat());
    }
  }

  // Self-executing initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', single_autoInitializeWidgets);
  } else {
    single_autoInitializeWidgets();
  }

  console.log('✅ SingleWidget: Widget script loaded successfully');

  // Dynamically load a font from Google Fonts
  function single_loadGoogleFont(fontFamily) {
    if (!fontFamily || fontFamily === 'Inter') {
        fontFamily = 'Inter'; // Default to Inter
    }

    const fontId = `google-font-${fontFamily.replace(/\s+/g, '-')}`;
    if (document.getElementById(fontId)) return;

    const link = document.createElement('link');
    link.id = fontId;
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
})(); 