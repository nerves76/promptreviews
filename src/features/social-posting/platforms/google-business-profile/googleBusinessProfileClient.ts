/**
 * Google Business Profile API Client
 * 
 * Updated for 2024/2025 API structure using specialized APIs:
 * - Business Information API v1 for location management
 * - Account Management API v1.1 for account operations  
 * - Google My Business API v4.9 for reviews, posts, media
 */

import { GOOGLE_BUSINESS_PROFILE } from './api';
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
  /**
   * Base configuration for the Google Business Profile client
   */
  private config = {
    baseUrl: GOOGLE_BUSINESS_PROFILE.BUSINESS_INFO_BASE_URL, // Default to Business Information API
    timeout: 30000,
    retries: 3
  };

  constructor(
    credentials: { accessToken: string; refreshToken: string; expiresAt?: number }, 
    config?: Partial<GoogleBusinessProfileClientConfig>
  ) {
    this.accessToken = credentials.accessToken;
    this.refreshToken = credentials.refreshToken;
    this.expiresAt = credentials.expiresAt || Date.now() + 3600000; // 1 hour default
    
    // Update config with any provided overrides
    if (config) {
      this.config = {
        ...this.config,
        ...config
      };
    }

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
   * Ensures the access token is valid and refreshes it if necessary
   */
  private async ensureAccessTokenValid(): Promise<void> {
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
  }

  /**
   * Refreshes the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      console.log('🔄 Server-side token refresh initiated');

      // Call the new server-side refresh endpoint
      const response = await fetch('/api/auth/google/refresh-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error?.includes('REFRESH_TOKEN_EXPIRED')) {
          throw new Error('GOOGLE_REAUTH_REQUIRED: Please reconnect your Google Business Profile account');
        }
        throw new Error(`Server-side token refresh failed: ${data.error || 'Unknown error'}`);
      }

      this.accessToken = data.accessToken;
      this.expiresAt = Date.now() + data.expiresIn * 1000; // expiresIn is in seconds
      this.refreshToken = data.refreshToken || this.refreshToken; // Refresh token might also be updated
      console.log('✅ Access token refreshed successfully via server-side endpoint.');
    } catch (refreshError: any) {
      if (refreshError.message?.includes('GOOGLE_REAUTH_REQUIRED')) {
        throw refreshError; // Re-throw specific re-auth error
      }
      console.error('❌ Error during server-side token refresh:', refreshError);
      throw new Error(`Failed to refresh access token: ${refreshError.message}`);
    }
  }

  // Note: Token saving is now handled by the server-side refresh endpoint
  // This ensures proper security and eliminates the need for client-side token management

  /**
   * Makes a request to the appropriate Google Business Profile API
   * Automatically selects the correct base URL based on the endpoint
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
    overrideBaseUrl?: string
  ): Promise<GoogleBusinessProfileApiResponse> {
    try {
      // CRITICAL: Ensure endpoint is always just a path, never a full URL
      if (endpoint.includes('://')) {
        console.error('❌ CRITICAL ERROR: Endpoint contains full URL instead of path:', endpoint);
        throw new Error(`Invalid endpoint format: ${endpoint}. Must be a path starting with '/'.`);
      }

      // Validate endpoint format
      if (!endpoint.startsWith('/')) {
        console.error('❌ CRITICAL ERROR: Endpoint must start with "/":', endpoint);
        throw new Error(`Invalid endpoint format: ${endpoint}. Must start with '/'.`);
      }

      // Check if token is expired or will expire in the next 5 minutes
      await this.ensureAccessTokenValid();

      // Determine the correct base URL based on the endpoint
      let apiBaseUrl: string;
      
      if (overrideBaseUrl) {
        apiBaseUrl = overrideBaseUrl;
      } else if (endpoint.startsWith('/v1/accounts')) {
        // Account Management API v1.1
        apiBaseUrl = GOOGLE_BUSINESS_PROFILE.ACCOUNT_MGMT_BASE_URL;
      } else if (endpoint.startsWith('/v1/')) {
        // Business Information API v1
        apiBaseUrl = GOOGLE_BUSINESS_PROFILE.BUSINESS_INFO_BASE_URL;
      } else if (endpoint.startsWith('/v4/')) {
        // Google My Business API v4.9
        apiBaseUrl = GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL;
      } else {
        // Default to Business Information API
        apiBaseUrl = GOOGLE_BUSINESS_PROFILE.BUSINESS_INFO_BASE_URL;
      }

      const url = `${apiBaseUrl}${endpoint}`;
      
      console.log('🔧 API Request Debug:', {
        endpoint,
        baseUrl: apiBaseUrl,
        finalUrl: url,
        endpointType: typeof endpoint,
        endpointLength: endpoint.length
      });

      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-GOOG-API-FORMAT-VERSION': '2', // Enable detailed error messages
        ...options.headers,
      };

      console.log(`🌐 Making API request to: ${url}`);
      console.log(`🔑 Using access token: ${this.accessToken.substring(0, 20)}...`);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      console.log(`📊 Response status: ${response.status}`);
      console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));

      // Get response text first to handle both JSON and error responses
      const responseText = await response.text();
      console.log(`📄 Response text (first 500 chars):`, responseText.substring(0, 500));

      // Try to parse as JSON
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('❌ Failed to parse response:', responseText);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        console.error('❌ API request failed:', responseData);
        
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (response.status === 401) {
          throw new Error('Authentication failed - token may be expired');
        } else if (response.status === 403) {
          throw new Error('Access forbidden - check permissions and API enablement');
        } else if (response.status === 404) {
          throw new Error(`Resource not found: ${endpoint}`);
        }
        
        throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(responseData)}`);
      }

      return responseData;
    } catch (error: any) {
      console.error('❌ API request failed:', error);

      // Handle specific errors that should trigger re-authentication
      if (error.message?.includes('GOOGLE_REAUTH_REQUIRED') || 
          error.message?.includes('token') || 
          error.message?.includes('401')) {
        throw error; // Re-throw auth errors as-is
      }

      // Handle retries for other errors
      if (retryCount < this.config.retries && 
          !error.message?.includes('Invalid endpoint format') &&
          !error.message?.includes('CRITICAL ERROR')) {
        console.log(`🔄 Retrying request (${retryCount + 1}/${this.config.retries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        return this.makeRequest(endpoint, options, retryCount + 1, overrideBaseUrl);
      }

      throw error;
    }
  }

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
        GOOGLE_BUSINESS_PROFILE.ACCOUNT_MGMT_BASE_URL
      );
      
      if (!response.accounts) {
        console.log('⚠️ No accounts found in response');
        return [];
      }

      console.log(`✅ Found ${response.accounts.length} accounts`);
      return response.accounts;

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
      console.log(`📍 Response data:`, response);
      console.log(`📍 Response data.locations:`, response.locations);
      
      if (!response.locations) {
        console.log('⚠️ No locations found in response');
        return [];
      }

      console.log(`✅ Found ${response.locations.length} locations`);
      return response.locations;

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
      
      const response = await this.makeRequest(endpoint, {}, 0, GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL);
      
      if (!response.localPosts) {
        console.log('⚠️ No local posts found in response');
        return [];
      }

      console.log(`✅ Found ${response.localPosts.length} local posts`);
      return response.localPosts;

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
      }, 0, GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL);

      console.log('✅ Local post created successfully');
      return response;

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
      return response;

    } catch (error) {
      console.error('❌ Failed to get location details:', error);
      throw error;
    }
  }

  /**
   * Updates business location information
   * Uses Business Information API v1 with PATCH method
   */
  async updateLocation(accountId: string, locationId: string, updates: any): Promise<any> {
    try {
      console.log(`🔄 Updating location: ${locationId}`);
      console.log('🚨 CACHE-BUSTING-V2: UPDATE LOCATION NEW CODE IS RUNNING! 🚨');
      console.log(`📝 Updates:`, updates);

      // Extract just the location ID if it's in full format
      let cleanLocationId = locationId;
      if (locationId.includes('/')) {
        cleanLocationId = locationId.split('/').pop() || locationId;
      }
      
      console.log(`🔧 Using location ID: ${cleanLocationId}`);

      // CRITICAL FIX: Use correct Business Information API v1 endpoint format
      // The correct format is /v1/locations/{locationId} NOT /v1/accounts/{accountId}/locations/{locationId}
      const endpoint = `/v1/locations/${cleanLocationId}`;
      
      console.log(`🔧 Update endpoint: ${endpoint}`);

      // Create update mask for the fields being updated
      const updateMask = [];
      if (updates.title) updateMask.push('title');
      if (updates.profile?.description) updateMask.push('profile.description');
      if (updates.regularHours) updateMask.push('regularHours');
      if (updates.serviceItems) updateMask.push('serviceItems');
      if (updates.categories) updateMask.push('categories');
      if (updates.primaryCategory) updateMask.push('primaryCategory');
      if (updates.additionalCategories) updateMask.push('additionalCategories');

      const queryParams = updateMask.length > 0 ? `?updateMask=${updateMask.join(',')}` : '';
      const fullEndpoint = `${endpoint}${queryParams}`;

      console.log(`🔧 Full endpoint with update mask: ${fullEndpoint}`);

      // Use Business Information API v1 explicitly with PATCH method
      const response = await this.makeRequest(
        fullEndpoint,
        {
          method: 'PATCH',
          body: JSON.stringify(updates)
        },
        0,
        GOOGLE_BUSINESS_PROFILE.BUSINESS_INFO_BASE_URL
      );

      console.log('✅ Successfully updated location');
      return response;
    } catch (error: any) {
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

      const url = `${GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL}${endpoint}`;

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
        mediaItem: response
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
      }, 0, GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL);

      console.log('✅ Successfully fetched reviews');
      return response?.reviews || [];

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
      }, 0, GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL);

      console.log('✅ Successfully replied to review');
      return response;

    } catch (error) {
      console.error('❌ Failed to reply to review:', error);
      throw error;
    }
  }

  /**
   * Lists all available Google Business Categories
   * Uses Business Information API v1
   */
  async listCategories(): Promise<Array<{ categoryId: string; displayName: string }>> {
    try {
      console.log('📋 Fetching Google Business categories...');
      console.log('🚨 CACHE-BUSTING-V2: NEW CODE IS RUNNING! 🚨');
      
      // CRITICAL FIX: Force endpoint to be just the path
      const endpoint = '/v1/categories';
      
      console.log('🔧 Categories endpoint (fixed):', endpoint);
      console.log('🔧 Endpoint validation:', {
        isString: typeof endpoint === 'string',
        startsWithSlash: endpoint.startsWith('/'),
        containsProtocol: endpoint.includes('://'),
        length: endpoint.length
      });
      
      // Use Business Information API v1 explicitly
      const response = await this.makeRequest(
        endpoint,
        { method: 'GET' },
        0,
        GOOGLE_BUSINESS_PROFILE.BUSINESS_INFO_BASE_URL
      );

      if (response.categories) {
        console.log('✅ Successfully fetched categories:', response.categories.length);
        return response.categories.map((cat: any) => ({
          categoryId: cat.categoryId || cat.name,
          displayName: cat.displayName
        }));
      }

      console.log('⚠️ No categories in response');
      return [];
    } catch (error: any) {
      console.error('❌ Failed to list categories:', error);
      throw error;
    }
  }
} 