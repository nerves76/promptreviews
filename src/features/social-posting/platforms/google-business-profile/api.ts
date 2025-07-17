/**
 * Google Business Profile API Configuration
 * Contains all constants related to Google Business Profile API integration
 */

// Google Business Profile API Configuration
export const GOOGLE_BUSINESS_PROFILE = {
  // API Base URLs
  BASE_URL: 'https://mybusinessaccountmanagement.googleapis.com',
  API_VERSION: 'v1',
  ENDPOINTS: {
    ACCOUNTS: '/v1/accounts',
    LOCATIONS: '/v1/accounts/{accountId}/locations',
    LOCAL_POSTS: '/v1/accounts/{accountId}/locations/{locationId}/localPosts',
    MEDIA: '/v1/accounts/{accountId}/locations/{locationId}/media',
    REVIEWS: '/v1/accounts/{accountId}/locations/{locationId}/reviews'
  },
  
  // OAuth 2.0 Scopes
  SCOPES: [
    'https://www.googleapis.com/auth/plus.business.manage',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ],
  
  // Post Types
  POST_TYPES: {
    STANDARD: 'STANDARD',
    EVENT: 'EVENT',
    OFFER: 'OFFER',
    ALERT: 'ALERT'
  },
  
  // Media Types
  MEDIA_TYPES: {
    PHOTO: 'PHOTO',
    VIDEO: 'VIDEO',
    LOGO: 'LOGO',
    COVER: 'COVER'
  }
};

// API Error Messages
export const GBP_ERROR_MESSAGES = {
  OAUTH_FAILED: 'Failed to authenticate with Google Business Profile',
  LOCATIONS_FETCH_FAILED: 'Failed to fetch business locations',
  POST_CREATION_FAILED: 'Failed to create Google Business Profile post',
  INVALID_LOCATION: 'Invalid or unauthorized business location',
  RATE_LIMIT_EXCEEDED: 'API rate limit exceeded, please try again later'
} as const;

// Default values
export const GBP_DEFAULTS = {
  POST_PREVIEW_LINES: 3,
  MAX_RETRIES: 3,
  TIMEOUT_MS: 30000
} as const; 