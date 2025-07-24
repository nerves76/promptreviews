/**
 * @fileoverview
 * Google Business Profile API Client
 * Handles authentication, API requests, and error handling for Google Business Profile integration
 * Updated to use the correct Google Business Profile API v4 endpoints and improved rate limiting
 */

import { GOOGLE_BUSINESS_PROFILE, LEGACY_GOOGLE_BUSINESS_PROFILE } from './api';
import type {
  GoogleBusinessProfileAuth,
  GoogleBusinessProfileCredentials,
  GoogleBusinessProfileClientConfig,
  GoogleBusinessProfileApiResponse,
  BusinessAccount,
  BusinessLocation,
  LocalPost,
  CreateLocalPostRequest,
  ListAccountsResponse,
  ListLocationsResponse,
  ListLocalPostsResponse,
  GoogleBusinessProfileError
} from './googleBusinessProfile';

export class GoogleBusinessProfileClient {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: number;
  private config: GoogleBusinessProfileClientConfig;

  constructor(
    credentials: { accessToken: string; refreshToken: string; expiresAt?: number }, 
    config?: Partial<GoogleBusinessProfileClientConfig>
  ) {
    this.accessToken = credentials.accessToken;
    this.refreshToken = credentials.refreshToken;
    this.expiresAt = credentials.expiresAt || Date.now() + 3600000; // 1 hour default
    this.config = {
      baseUrl: GOOGLE_BUSINESS_PROFILE.BASE_URL,
      apiVersion: GOOGLE_BUSINESS_PROFILE.API_VERSION,
      timeout: 30000,
      retryAttempts: GOOGLE_BUSINESS_PROFILE.RATE_LIMITS.RETRY_ATTEMPTS,
      retryDelay: GOOGLE_BUSINESS_PROFILE.RATE_LIMITS.RETRY_DELAY_MS,
      ...config
    };
    
    console.log('🔍 GoogleBusinessProfileClient created - Real API calls only');
    console.log('🔑 Token info at creation:', {
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      expiresAt: new Date(this.expiresAt).toISOString(),
      timeUntilExpiry: Math.round((this.expiresAt - Date.now()) / 1000 / 60) + ' minutes',
      isExpiredAtCreation: Date.now() >= this.expiresAt
    });
  }

  /**
   * Makes an authenticated API request with rate limiting and retry logic
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
    baseUrl?: string
  ): Promise<GoogleBusinessProfileApiResponse> {
    try {
      // Check if token is expired or will expire in the next 5 minutes
      const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
      const isExpired = Date.now() >= this.expiresAt;
      const willExpireSoon = fiveMinutesFromNow >= this.expiresAt;
      
      console.log('🔍 Token expiry check:', {
        currentTime: new Date(Date.now()).toISOString(),
        expiresAt: new Date(this.expiresAt).toISOString(),
        isExpired,
        willExpireSoon,
        timeUntilExpiry: Math.round((this.expiresAt - Date.now()) / 1000 / 60) + ' minutes'
      });
      
      if (isExpired || willExpireSoon) {
        console.log('🔄 Token refresh needed:', isExpired ? 'EXPIRED' : 'EXPIRES_SOON');
        try {
          await this.refreshAccessToken();
        } catch (refreshError: any) {
          console.error('❌ Token refresh failed:', refreshError);
          // If refresh token expired, throw a specific error
          if (refreshError.message?.includes('REFRESH_TOKEN_EXPIRED') || 
              refreshError.message?.includes('invalid_grant') || 
              refreshError.message?.includes('requiresReauth')) {
            throw new Error('GOOGLE_REAUTH_REQUIRED: Please reconnect your Google Business Profile account');
          }
          throw refreshError;
        }
      } else {
        console.log('✅ Token is still valid, no refresh needed');
      }

      // Use custom base URL or default to the main Business Information API
      const apiBaseUrl = baseUrl || this.config.baseUrl;
      const url = `${apiBaseUrl}${endpoint}`;
      
      // Debug URL construction to catch double accounts/ issues
      console.log(`🔧 URL Construction Debug:`);
      console.log(`   Base URL: ${apiBaseUrl}`);
      console.log(`   Endpoint: ${endpoint}`);
      console.log(`   Final URL: ${url}`);
      
      // Safety check for double accounts prefix
      if (url.includes('/accounts/accounts/')) {
        console.error(`❌ DOUBLE ACCOUNTS PREFIX DETECTED!`);
        console.error(`   Base URL: ${apiBaseUrl}`);
        console.error(`   Endpoint: ${endpoint}`);
        console.error(`   Final URL: ${url}`);
        throw new Error(`Double accounts prefix detected in URL: ${url}`);
      }
      
      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      };

      console.log(`🌐 Making API request to: ${url}`);
      console.log(`🔑 Using access token: ${this.accessToken.substring(0, 20)}...`);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse response:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log(`📊 Response status: ${response.status}`);
      console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
      console.log(`📄 Response text (first 500 chars):`, responseText.substring(0, 500));

      // Handle rate limiting - Google Business Profile API has strict rate limits
      if (response.status === GOOGLE_BUSINESS_PROFILE.ERROR_CODES.RATE_LIMIT_EXCEEDED) {
        // Don't retry on rate limits - return immediately to avoid hanging the frontend
        console.log(`❌ Rate limit exceeded - returning immediately to avoid frontend timeout`);
        
        // Extract retry-after header if available
        const retryAfter = response.headers.get('retry-after');
        const retryDelay = retryAfter ? parseInt(retryAfter) : 60; // Default 60 seconds
        
        console.log(`💡 Google Business Profile API quota exhausted. Wait ${retryDelay} seconds before trying again.`);
        console.log(`💡 Consider requesting higher quota limits in Google Cloud Console if this persists.`);
        
        const error: GoogleBusinessProfileError = new Error(
          `Rate limit exceeded. Please wait ${retryDelay} seconds before trying again. Consider requesting higher quota limits if this persists.`
        ) as GoogleBusinessProfileError;
        error.code = 429;
        error.status = 'RESOURCE_EXHAUSTED';
        error.details = data.error?.details || [];
        error.retryAfter = retryDelay;
        throw error;
      }

      // Handle other errors
      if (!response.ok) {
        // Special handling for Google API internal errors
        if (response.status === 500 && data.error?.status === 'INTERNAL') {
          console.warn('⚠️ Google Business Profile API experiencing internal issues. This is temporary.');
          const error: GoogleBusinessProfileError = new Error(
            'Google Business Profile API is temporarily unavailable. Please try again later.'
          ) as GoogleBusinessProfileError;
          error.code = 500;
          error.status = 'INTERNAL';
          error.details = data.error?.details;
          error.isTemporary = true;
          throw error;
        }

        const error: GoogleBusinessProfileError = new Error(
          data.error?.message || `API request failed: ${response.statusText}`
        ) as GoogleBusinessProfileError;
        error.code = data.error?.code || response.status;
        error.status = data.error?.status;
        error.details = data.error?.details;
        throw error;
      }

      return { data, status: response.status };

    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }



  /**
   * Refreshes the access token using the server-side refresh endpoint
   * This ensures client secrets are kept secure on the server
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      console.log('🔄 Refreshing access token via server-side endpoint...');
      console.log('🔑 Current token expires at:', new Date(this.expiresAt).toISOString());
      
      const response = await fetch('/api/auth/google/refresh-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📊 Server refresh response:', {
        ok: response.ok,
        status: response.status,
        success: data.success,
        hasAccessToken: !!data.access_token,
        requiresReauth: data.requiresReauth
      });

      if (!response.ok) {
        // If refresh token expired, user needs to re-authentication
        if (data.requiresReauth) {
          throw new Error('REFRESH_TOKEN_EXPIRED: User needs to re-authenticate');
        }
        throw new Error(`Token refresh failed: ${data.error}`);
      }

      const oldExpiresAt = this.expiresAt;
      this.accessToken = data.access_token;
      this.expiresAt = new Date(data.expires_at).getTime();
      
      console.log('✅ Access token refreshed successfully via server');
      console.log('🔄 Token expiry updated:', {
        oldExpiresAt: new Date(oldExpiresAt).toISOString(),
        newExpiresAt: new Date(this.expiresAt).toISOString()
      });

    } catch (error) {
      console.error('❌ Failed to refresh access token:', error);
      throw error;
    }
  }

  // Note: Token saving is now handled by the server-side refresh endpoint
  // This ensures proper security and eliminates the need for client-side token management

  /**
   * Lists all business accounts for the authenticated user
   */
  async listAccounts(): Promise<BusinessAccount[]> {
    try {
      console.log('📋 Fetching Google Business Profile accounts...');
      
      // Use Account Management API for listing accounts
      const response = await this.makeRequest(
        GOOGLE_BUSINESS_PROFILE.ENDPOINTS.ACCOUNTS,
        {},
        0,
        GOOGLE_BUSINESS_PROFILE.ACCOUNT_MANAGEMENT_URL
      );
      
      if (!response.data.accounts) {
        console.log('⚠️ No accounts found in response');
        return [];
      }

      console.log(`✅ Found ${response.data.accounts.length} accounts`);
      return response.data.accounts;

    } catch (error) {
      console.error('❌ Failed to list accounts:', error);
      throw error;
    }
  }

  /**
   * Lists locations for a specific business account
   */
  async listLocations(accountId: string): Promise<BusinessLocation[]> {
    try {
      console.log(`📍 Fetching locations for account: ${accountId}`);
      
      // Extract just the numeric account ID from various formats
      // Handle multiple formats: "accounts/123", "accounts/accounts/123", or just "123"
      let cleanAccountId: string = accountId;
      
      // Remove any "accounts/" prefixes (handle multiple instances)
      while (cleanAccountId.startsWith('accounts/')) {
        cleanAccountId = cleanAccountId.replace('accounts/', '');
      }
      
      // Ensure we only have the numeric ID
      if (!cleanAccountId || cleanAccountId.includes('/')) {
        throw new Error(`Invalid account ID format: ${accountId}. Expected numeric ID.`);
      }
      
      console.log(`📍 Using clean account ID: ${cleanAccountId}`);
      
      // Debug: Log the endpoint template before replacement
      console.log(`📍 Endpoint template: ${GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCATIONS}`);
      
      // The template is /v1/accounts/{parent}/locations, so {parent} should just be the account ID
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCATIONS.replace('{parent}', cleanAccountId);
      console.log(`📍 Constructed endpoint: ${endpoint}`);
      
      // Additional validation to catch any remaining issues
      if (endpoint.includes('/accounts/accounts/')) {
        throw new Error(`Double accounts prefix detected in endpoint: ${endpoint}. Original accountId: ${accountId}, cleaned: ${cleanAccountId}`);
      }
      
      // Add required readMask parameter for Business Information API
      const readMask = 'name,title,storefrontAddress,phoneNumbers,categories,websiteUri,regularHours,serviceItems,profile,latlng,metadata';
      const endpointWithParams = `${endpoint}?readMask=${encodeURIComponent(readMask)}`;
      console.log(`📍 Final URL to call: ${this.config.baseUrl}${endpointWithParams}`);
      
      // Use Business Information API for listing locations - explicit baseUrl to avoid URL construction issues
      const response = await this.makeRequest(
        endpointWithParams,
        {},
        0,
        'https://mybusinessbusinessinformation.googleapis.com'
      );
      console.log(`📍 Response data:`, response.data);
      console.log(`📍 Response data.locations:`, response.data.locations);
      
      if (!response.data.locations) {
        console.log('⚠️ No locations found in response');
        return [];
      }

      console.log(`✅ Found ${response.data.locations.length} locations`);
      return response.data.locations;

    } catch (error) {
      console.error('❌ Failed to list locations:', error);
      
      // Provide more helpful error messages for common issues
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('internal error encountered')) {
          throw new Error('Google Business Profile API returned an internal error. This usually means your account needs to be set up as a verified business account with locations. Personal accounts cannot access business locations.');
        }
        
        if (errorMessage.includes('permission denied') || errorMessage.includes('unauthorized')) {
          throw new Error('Permission denied. Please ensure your account has a verified Google Business Profile with business locations set up.');
        }
        
        if (errorMessage.includes('not found')) {
          throw new Error('Account not found or has no business locations. Please verify your Google Business Profile is properly set up.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Lists all local posts for a specific location
   */
  async listLocalPosts(accountId: string, locationId: string): Promise<LocalPost[]> {
    try {
      console.log(`📝 Fetching local posts for location: ${locationId}`);
      
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCAL_POSTS
        .replace('{accountId}', accountId)
        .replace('{locationId}', locationId);
      
      const response = await this.makeRequest(endpoint, {}, 0, GOOGLE_BUSINESS_PROFILE.V4_BASE_URL);
      
      if (!response.data.localPosts) {
        console.log('⚠️ No local posts found in response');
        return [];
      }

      console.log(`✅ Found ${response.data.localPosts.length} local posts`);
      return response.data.localPosts;

    } catch (error) {
      console.error('❌ Failed to list local posts:', error);
      throw error;
    }
  }

  /**
   * Creates a new local post
   */
  async createLocalPost(
    accountId: string,
    locationId: string,
    postData: CreateLocalPostRequest
  ): Promise<LocalPost> {
    try {
      console.log(`📝 Creating local post for location: ${locationId}`);
      
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCAL_POSTS
        .replace('{accountId}', accountId)
        .replace('{locationId}', locationId);
      
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(postData)
      }, 0, GOOGLE_BUSINESS_PROFILE.V4_BASE_URL);

      console.log('✅ Local post created successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Failed to create local post:', error);
      throw error;
    }
  }

  /**
   * Gets the current authentication status
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.expiresAt;
  }

  /**
   * Gets the current access token
   */
  getAccessToken(): string {
    return this.accessToken;
  }

  /**
   * Gets the current refresh token
   */
  getRefreshToken(): string {
    return this.refreshToken;
  }

  /**
   * Gets detailed information for a specific location
   */
  async getLocationDetails(locationId: string): Promise<any> {
    try {
      console.log(`📍 Getting location details for: ${locationId}`);

      // Clean the location ID to remove "locations/" prefix if present
      const cleanLocationId = locationId.replace('locations/', '');

      // Get the account ID first
      const accounts = await this.listAccounts();
      if (accounts.length === 0) {
        throw new Error('No Google Business Profile accounts found');
      }

      const accountId = accounts[0].name.replace('accounts/', '');
      console.log(`📋 Using account ID: ${accountId}`);

      // Construct the location details endpoint using Business Information API v1
      const endpoint = `/v1/accounts/${accountId}/locations/${cleanLocationId}`;
      
      // Add required readMask parameter for detailed information
      const readMask = 'name,title,storefrontAddress,phoneNumbers,categories,websiteUri,regularHours,profile,latlng,metadata';
      const endpointWithParams = `${endpoint}?readMask=${encodeURIComponent(readMask)}`;

      console.log(`🔧 Location details endpoint: ${endpointWithParams}`);

      // Use Business Information API explicitly to avoid URL construction issues
      const response = await this.makeRequest(
        endpointWithParams,
        { method: 'GET' },
        0,
        'https://mybusinessbusinessinformation.googleapis.com'
      );

      console.log('✅ Location details fetched successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Failed to get location details:', error);
      throw error;
    }
  }

  /**
   * Updates business location information
   */
  async updateLocation(accountId: string, locationId: string, updates: any): Promise<any> {
    try {
      console.log(`🔄 Updating location: ${locationId}`);
      console.log(`📝 Updates:`, updates);

      // Clean IDs to remove prefixes if present
      const cleanAccountId = accountId.replace('accounts/', '');
      const cleanLocationId = locationId.replace('locations/', '');

      // Construct the location update endpoint using Business Information API v1
      const endpoint = `/v1/accounts/${cleanAccountId}/locations/${cleanLocationId}`;
      
      // Create update mask for the fields we're updating
      const updateMask = [];
      if (updates.title) updateMask.push('title');
      if (updates.profile) updateMask.push('profile.description');
      if (updates.regularHours) updateMask.push('regularHours');
      if (updates.serviceItems) updateMask.push('serviceItems');

      const endpointWithParams = `${endpoint}?updateMask=${encodeURIComponent(updateMask.join(','))}`;

      console.log(`🔧 Update endpoint: ${endpointWithParams}`);

      // Use Business Information API explicitly to avoid URL construction issues
      const response = await this.makeRequest(
        endpointWithParams,
        {
          method: 'PATCH',
          body: JSON.stringify(updates)
        },
        0,
        'https://mybusinessbusinessinformation.googleapis.com'
      );

      console.log('✅ Location updated successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Failed to update location:', error);
      throw error;
    }
  }

  /**
   * Uploads media (photos) to a Google Business Profile location
   */
  async uploadMedia(
    accountId: string,
    locationId: string,
    imageFile: File,
    mediaFormat: 'PHOTO' | 'VIDEO' = 'PHOTO'
  ): Promise<{ success: boolean; mediaItem?: any; error?: string }> {
    try {
      console.log(`📷 Uploading media to location: ${locationId}`);

      // Clean the account ID to remove "accounts/" prefix if present
      const cleanAccountId = accountId.replace('accounts/', '');
      const cleanLocationId = locationId.replace('locations/', '');

      // Construct the media upload endpoint
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.MEDIA
        .replace('{accountId}', cleanAccountId)
        .replace('{locationId}', cleanLocationId);

      const url = `${GOOGLE_BUSINESS_PROFILE.V4_BASE_URL}${endpoint}`;

      console.log(`🌐 Media upload URL: ${url}`);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('media', imageFile);
      
      // Create media metadata
      const mediaMetadata = {
        mediaFormat: mediaFormat,
        sourceUrl: '', // Will be filled by Google after upload
      };

      formData.append('metadata', JSON.stringify(mediaMetadata));

      const response = await this.makeRequest(url, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it for FormData
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      console.log('✅ Media uploaded successfully');
      return {
        success: true,
        mediaItem: response.data
      };

    } catch (error) {
      console.error('❌ Failed to upload media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Fetches reviews for a specific location
   */
  async getReviews(locationId: string): Promise<any[]> {
    console.log('🔄 Fetching reviews for location:', locationId);
    
    try {
      // First get the account ID if we don't have it
      const accounts = await this.listAccounts();
      if (accounts.length === 0) {
        throw new Error('No Google Business Profile accounts found');
      }
      
      // Use the first account ID
      const accountId = accounts[0].name.replace('accounts/', '');
      const cleanLocationId = locationId.replace('locations/', '');
      
      // Use the v4 API for reviews
      const endpoint = `/v4/accounts/${accountId}/locations/${cleanLocationId}/reviews`;
      
      const response = await this.makeRequest(endpoint, {
        method: 'GET'
      }, 0, GOOGLE_BUSINESS_PROFILE.V4_BASE_URL);

      console.log('✅ Successfully fetched reviews');
      return response.data?.reviews || [];

    } catch (error) {
      console.error('❌ Failed to fetch reviews:', error);
      throw error;
    }
  }

  /**
   * Replies to a specific review
   */
  async replyToReview(locationId: string, reviewId: string, replyText: string): Promise<any> {
    console.log('🔄 Replying to review:', reviewId);
    
    try {
      // First get the account ID if we don't have it
      const accounts = await this.listAccounts();
      if (accounts.length === 0) {
        throw new Error('No Google Business Profile accounts found');
      }
      
      // Use the first account ID
      const accountId = accounts[0].name.replace('accounts/', '');
      const cleanLocationId = locationId.replace('locations/', '');
      
      // Use the v4 API for review replies
      const endpoint = `/v4/accounts/${accountId}/locations/${cleanLocationId}/reviews/${reviewId}/reply`;
      
      const response = await this.makeRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify({
          comment: replyText
        }),
      }, 0, GOOGLE_BUSINESS_PROFILE.V4_BASE_URL);

      console.log('✅ Successfully replied to review');
      return response.data;

    } catch (error) {
      console.error('❌ Failed to reply to review:', error);
      throw error;
    }
  }

  /**
   * Lists all available Google Business Categories
   */
  async listCategories(): Promise<Array<{ categoryId: string; displayName: string }>> {
    try {
      console.log('📋 Fetching Google Business categories...');
      
      // Google Business Categories API endpoint - force just the path to avoid URL doubling
      const endpoint = '/v1/categories';
      
      // Use the Business Information API explicitly to avoid any URL construction issues
      const response = await this.makeRequest(
        endpoint,
        { method: 'GET' },
        0,
        'https://mybusinessbusinessinformation.googleapis.com'
      );
      
      console.log(`✅ Fetched ${response.data.categories?.length || 0} business categories`);
      
      // Transform categories to consistent format
      const categories = (response.data.categories || []).map((cat: any) => ({
        categoryId: cat.categoryId || cat.name || '',
        displayName: cat.displayName || cat.categoryId || ''
      }));
      
      return categories;
    } catch (error) {
      console.error('❌ Failed to list categories:', error);
      throw error;
    }
  }
} 