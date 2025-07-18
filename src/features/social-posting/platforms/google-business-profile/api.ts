/**
 * Google Business Profile API Configuration
 * Contains all constants related to Google Business Profile API integration
 * Updated to use the correct Google Business Profile API v4 endpoints
 */

// Google Business Profile API Configuration
export const GOOGLE_BUSINESS_PROFILE = {
  // API Base URLs - Updated to use the correct Google Business Profile API
  BASE_URL: 'https://mybusinessaccountmanagement.googleapis.com',
  API_VERSION: 'v1',
  ENDPOINTS: {
    ACCOUNTS: '/v1/accounts',
    LOCATIONS: '/v1/accounts/{accountId}/locations',
    LOCAL_POSTS: '/v1/accounts/{accountId}/locations/{locationId}/localPosts',
    MEDIA: '/v1/accounts/{accountId}/locations/{locationId}/media',
    REVIEWS: '/v1/accounts/{accountId}/locations/{locationId}/reviews',
    INSIGHTS: '/v1/accounts/{accountId}/locations/{locationId}/reportInsights'
  },

  // OAuth Configuration
  OAUTH: {
    AUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
    TOKEN_URL: 'https://oauth2.googleapis.com/token',
    SCOPES: [
      'https://www.googleapis.com/auth/plus.business.manage',
      'https://www.googleapis.com/auth/business.manage',
      'openid',
      'email',
      'profile'
    ]
  },

  // Rate Limiting Configuration
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 1,
    REQUESTS_PER_DAY: 1000,
    RETRY_ATTEMPTS: 1, // Only 1 retry attempt due to strict 1 request/minute limit
    RETRY_DELAY_MS: 120000, // 2 minutes minimum wait for Google Business Profile API
    EXPONENTIAL_BACKOFF: true, // Enable exponential backoff for strict rate limits
    MIN_WAIT_BETWEEN_REQUESTS: 60000 // Minimum 60 seconds between any requests
  },

  // Error Codes
  ERROR_CODES: {
    RATE_LIMIT_EXCEEDED: 429,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
  },

  // API Response Status
  STATUS: {
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED'
  }
};

// Legacy API endpoints (for backward compatibility)
export const LEGACY_GOOGLE_BUSINESS_PROFILE = {
  BASE_URL: 'https://mybusinessaccountmanagement.googleapis.com',
  API_VERSION: 'v1',
  ENDPOINTS: {
    ACCOUNTS: '/v1/accounts',
    LOCATIONS: '/v1/accounts/{accountId}/locations',
    LOCAL_POSTS: '/v1/accounts/{accountId}/locations/{locationId}/localPosts'
  }
};

// Environment Variables
export const ENV_VARS = {
  CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI
};

// Validation
export const validateEnvironment = () => {
  const missing = [];
  
  if (!ENV_VARS.CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
  if (!ENV_VARS.CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
  if (!ENV_VARS.REDIRECT_URI) missing.push('GOOGLE_REDIRECT_URI');
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

// API Error Messages
export const GBP_ERROR_MESSAGES = {
  OAUTH_FAILED: 'Failed to authenticate with Google Business Profile',
  LOCATIONS_FETCH_FAILED: 'Failed to fetch business locations',
  POST_CREATION_FAILED: 'Failed to create Google Business Profile post',
  INVALID_LOCATION: 'Invalid or unauthorized business location',
  RATE_LIMIT_EXCEEDED: 'API rate limit exceeded, please try again later',
  QUOTA_EXCEEDED: 'API quota exceeded. Please wait before making more requests.',
  ACCOUNT_NOT_FOUND: 'No Google Business Profile account found',
  LOCATION_NOT_VERIFIED: 'Business location is not verified'
} as const;

// Default values
export const GBP_DEFAULTS = {
  POST_PREVIEW_LINES: 3,
  MAX_RETRIES: 3,
  TIMEOUT_MS: 30000
} as const; 