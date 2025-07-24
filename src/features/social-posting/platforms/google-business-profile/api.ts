/**
 * Google Business Profile API Configuration
 * 
 * Updated for 2024/2025 API structure using specialized APIs:
 * - Business Information API v1 for location management
 * - Account Management API v1.1 for account operations  
 * - Google My Business API v4.9 for reviews, posts, media
 */

export const GOOGLE_BUSINESS_PROFILE = {
  // Business Information API v1 - for location data, categories, attributes
  BUSINESS_INFO_BASE_URL: 'https://mybusinessbusinessinformation.googleapis.com',
  
  // Account Management API v1.1 - for account operations
  ACCOUNT_MGMT_BASE_URL: 'https://mybusinessaccountmanagement.googleapis.com',
  
  // Google My Business API v4.9 - for reviews, posts, media, insights
  LEGACY_BASE_URL: 'https://mybusiness.googleapis.com',

  ENDPOINTS: {
    // Account Management API v1.1 endpoints
    ACCOUNTS: '/v1/accounts',
    
    // Business Information API v1 endpoints
    CATEGORIES: '/v1/categories',
    LOCATIONS_LIST: '/v1/accounts/{accountId}/locations',
    LOCATION_GET: '/v1/locations/{locationId}',
    LOCATION_UPDATE: '/v1/locations/{locationId}', // PATCH method
    LOCATION_ATTRIBUTES: '/v1/locations/{locationId}/attributes',
    
    // Google My Business API v4.9 endpoints (legacy)
    REVIEWS: '/v4/accounts/{accountId}/locations/{locationId}/reviews',
    LOCAL_POSTS: '/v4/accounts/{accountId}/locations/{locationId}/localPosts',
    MEDIA: '/v4/accounts/{accountId}/locations/{locationId}/media',
    INSIGHTS: '/v4/accounts/{accountId}/locations/{locationId}/reportInsights'
  },

  SCOPES: [
    'https://www.googleapis.com/auth/business.manage'
  ],

  // Rate limiting and retry configuration
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 100,
    RETRY_DELAY_MS: 1000,
    MAX_RETRIES: 3
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