/**
 * Google Analytics utility functions for tracking custom events
 * This file provides helper functions for tracking user interactions and business events
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// GA4 Event Types
export const GA_EVENTS = {
  // User interactions
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  
  // Widget interactions
  WIDGET_CREATED: 'widget_created',
  WIDGET_VIEWED: 'widget_viewed',
  WIDGET_REVIEW_SUBMITTED: 'widget_review_submitted',
  WIDGET_PHOTO_UPLOADED: 'widget_photo_uploaded',
  
  // Business actions
  BUSINESS_CREATED: 'business_created',
  BUSINESS_UPDATED: 'business_updated',
  CONTACTS_UPLOADED: 'contacts_uploaded',
  REVIEW_REQUEST_SENT: 'review_request_sent',
  
  // Subscription events
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  
  // Admin actions
  ANNOUNCEMENT_CREATED: 'announcement_created',
  QUOTE_CREATED: 'quote_created',
  QUOTE_UPDATED: 'quote_updated',
  QUOTE_DELETED: 'quote_deleted',
  
  // Navigation
  PAGE_VIEW: 'page_view',
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
} as const;

/**
 * Track a custom event in Google Analytics
 * @param eventName - The name of the event
 * @param parameters - Additional parameters for the event
 */
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
};

/**
 * Track page views for client-side navigation
 * @param url - The URL of the page being viewed
 * @param title - The title of the page
 */
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-22JHGCL1T7', {
      page_title: title || document.title,
      page_location: url,
    });
  }
};

/**
 * Track user sign up events
 * @param method - The sign up method used (email, google, etc.)
 */
export const trackSignUp = (method: string) => {
  trackEvent(GA_EVENTS.SIGN_UP, {
    method,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track widget creation events
 * @param widgetType - The type of widget created (single, multi, photo)
 * @param businessId - The ID of the business the widget belongs to
 */
export const trackWidgetCreated = (widgetType: string, businessId?: string) => {
  trackEvent(GA_EVENTS.WIDGET_CREATED, {
    widget_type: widgetType,
    business_id: businessId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track widget view events
 * @param widgetType - The type of widget viewed
 * @param businessId - The ID of the business the widget belongs to
 */
export const trackWidgetViewed = (widgetType: string, businessId?: string) => {
  trackEvent(GA_EVENTS.WIDGET_VIEWED, {
    widget_type: widgetType,
    business_id: businessId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track review submission events
 * @param widgetType - The type of widget used
 * @param rating - The rating given (1-5)
 * @param hasPhoto - Whether a photo was included
 */
export const trackReviewSubmitted = (widgetType: string, rating: number, hasPhoto: boolean = false) => {
  trackEvent(GA_EVENTS.WIDGET_REVIEW_SUBMITTED, {
    widget_type: widgetType,
    rating,
    has_photo: hasPhoto,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track business creation events
 * @param businessType - The type of business (restaurant, service, etc.)
 */
export const trackBusinessCreated = (businessType: string) => {
  trackEvent(GA_EVENTS.BUSINESS_CREATED, {
    business_type: businessType,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track subscription events
 * @param plan - The subscription plan
 * @param action - The action taken (started, cancelled, updated)
 */
export const trackSubscription = (plan: string, action: string) => {
  trackEvent(`subscription_${action}`, {
    plan,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track admin actions
 * @param action - The admin action performed
 * @param details - Additional details about the action
 */
export const trackAdminAction = (action: string, details?: Record<string, any>) => {
  trackEvent(action, {
    ...details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track error events
 * @param error - The error object or message
 * @param context - Additional context about where the error occurred
 */
export const trackError = (error: Error | string, context?: Record<string, any>) => {
  trackEvent(GA_EVENTS.ERROR_OCCURRED, {
    error_message: typeof error === 'string' ? error : error.message,
    error_stack: typeof error === 'object' ? error.stack : undefined,
    ...context,
    timestamp: new Date().toISOString(),
  });
}; 