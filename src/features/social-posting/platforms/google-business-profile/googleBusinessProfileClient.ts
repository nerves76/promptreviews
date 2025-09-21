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


  }

  /**
   * Ensures the access token is valid and refreshes it if necessary
   */
  private async ensureAccessTokenValid(): Promise<void> {
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    const isExpired = Date.now() >= this.expiresAt;
    const willExpireSoon = fiveMinutesFromNow >= this.expiresAt;
    
    
    if (isExpired || willExpireSoon) {
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

    }
  }

  /**
   * Refreshes the access token using the refresh token
   * Returns the new tokens if successful
   */
  public async refreshAccessToken(): Promise<{ access_token: string; expires_in: number; refresh_token?: string } | null> {
    try {

      // Construct the correct URL based on environment
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
      
      const refreshUrl = `${baseUrl}/api/auth/google/refresh-tokens`;
  

      // Call the server-side refresh endpoint
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token refresh response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();


      if (!data.success) {
        if (data.error?.includes('REFRESH_TOKEN_EXPIRED') || data.requiresReauth) {
          throw new Error('GOOGLE_REAUTH_REQUIRED: Please reconnect your Google Business Profile account');
        }
        throw new Error(`Server-side token refresh failed: ${data.error || 'Unknown error'}`);
      }

      this.accessToken = data.accessToken;
      this.expiresAt = Date.now() + data.expiresIn * 1000; // expiresIn is in seconds
      this.refreshToken = data.refreshToken || this.refreshToken; // Refresh token might also be updated

      // Return the new tokens
      return {
        access_token: data.accessToken,
        expires_in: data.expiresIn,
        refresh_token: data.refreshToken
      };

    } catch (refreshError: any) {
      if (refreshError.message?.includes('GOOGLE_REAUTH_REQUIRED')) {
        throw refreshError; // Re-throw specific re-auth error
      }
      console.error('❌ Error during server-side token refresh:', refreshError);
      
      // Check if it's a network/URL error and provide helpful message
      if (refreshError.code === 'ERR_INVALID_URL' || refreshError.message?.includes('Failed to parse URL')) {
        throw new Error('GOOGLE_REAUTH_REQUIRED: Token refresh endpoint unavailable. Please reconnect your Google Business Profile account');
      }
      
      throw new Error(`Failed to refresh access token: ${refreshError.message}`);
    }
    
    return null; // Return null if refresh fails
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
      
      const baseHeaders: Record<string, string> = {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-GOOG-API-FORMAT-VERSION': '2', // Enable detailed error messages
      };

      const customHeaders = options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options.headers as Record<string, string> | undefined) ?? {};

      const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
      if (!isFormData) {
        baseHeaders['Content-Type'] = 'application/json';
      }

      const headers = {
        ...baseHeaders,
        ...customHeaders,
      };

      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      // Get response text first to handle both JSON and error responses
      const responseText = await response.text();

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
  
      
      const response = await this.makeRequest(
        GOOGLE_BUSINESS_PROFILE.ENDPOINTS.ACCOUNTS,
        {},
        0,
        GOOGLE_BUSINESS_PROFILE.ACCOUNT_MGMT_BASE_URL
      ) as ListAccountsResponse;
      
      if (!response.accounts) {
        return [];
      }
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
      
      
      // Debug: Log the endpoint template before replacement
      
      // The template is /v1/accounts/{accountId}/locations, so {accountId} should be the account ID
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCATIONS_LIST.replace('{accountId}', cleanAccountId);
      
      // Additional validation to catch any remaining issues
      if (endpoint.includes('/accounts/accounts/')) {
        throw new Error(`Double accounts prefix detected in endpoint: ${endpoint}. Original accountId: ${accountId}, cleaned: ${cleanAccountId}`);
      }
      
      // Add required readMask parameter for Business Information API
      // Include all category fields to ensure we get the complete category data
      const readMask = 'name,title,storefrontAddress,phoneNumbers,categories.primaryCategory,categories.additionalCategories,websiteUri,regularHours,serviceItems,profile,latlng,metadata';
      const endpointWithParams = `${endpoint}?readMask=${encodeURIComponent(readMask)}`;
      
      // Use Business Information API for listing locations - explicit baseUrl to avoid URL construction issues
      const response = await this.makeRequest(
        endpointWithParams,
        {},
        0,
        'https://mybusinessbusinessinformation.googleapis.com'
      ) as ListLocationsResponse;
      
      if (!response.locations) {
        return [];
      }

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
      
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCAL_POSTS
        .replace('{accountId}', accountId)
        .replace('{locationId}', locationId);
      
      const response = await this.makeRequest(endpoint, {}, 0, GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL) as ListLocalPostsResponse;
      
      if (!response.localPosts) {
        return [];
      }

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
      
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCAL_POSTS
        .replace('{accountId}', accountId)
        .replace('{locationId}', locationId);
      
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(postData)
      }, 0, GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL);

      return response as LocalPost;

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

      // Clean the location ID to remove "locations/" prefix if present
      const cleanLocationId = locationId.replace('locations/', '');

      // Get the account ID first
      const accounts = await this.listAccounts();
      if (accounts.length === 0) {
        throw new Error('No Google Business Profile accounts found');
      }

      const accountId = accounts[0].name.replace('accounts/', '');


      // Construct the location details endpoint using Business Information API v1
      const endpoint = `/v1/accounts/${accountId}/locations/${cleanLocationId}`;
      
      // Add required readMask parameter for detailed information
      // Include all category fields to ensure we get the complete category data
      const readMask = 'name,title,storefrontAddress,phoneNumbers,categories.primaryCategory,categories.additionalCategories,websiteUri,regularHours,profile,latlng,metadata,serviceItems';
      const endpointWithParams = `${endpoint}?readMask=${encodeURIComponent(readMask)}`;


      // Use Business Information API explicitly to avoid URL construction issues
      const response = await this.makeRequest(
        endpointWithParams,
        { method: 'GET' },
        0,
        'https://mybusinessbusinessinformation.googleapis.com'
      );

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

      // Extract just the location ID if it's in full format
      let cleanLocationId = locationId;
      if (locationId.includes('/')) {
        cleanLocationId = locationId.split('/').pop() || locationId;
      }
      

      // CRITICAL FIX: Use correct Business Information API v1 endpoint format
      // The correct format is /v1/locations/{locationId} NOT /v1/accounts/{accountId}/locations/{locationId}
      const endpoint = `/v1/locations/${cleanLocationId}`;
      

      // Create update mask for the fields being updated
      const updateMask = [];
      if (updates.title) updateMask.push('title');
      if (updates.profile?.description) updateMask.push('profile.description');
      if (updates.regularHours) updateMask.push('regularHours');
      if (updates.serviceItems) updateMask.push('serviceItems');
      if (updates.categories) {
        // Google requires updating the entire categories object, not individual fields
        updateMask.push('categories');
      }

      const queryParams = updateMask.length > 0 ? `?updateMask=${updateMask.join(',')}` : '';
      const fullEndpoint = `${endpoint}${queryParams}`;


      // Use Business Information API v1 - let automatic base URL selection handle it
      
      const response = await this.makeRequest(
        fullEndpoint,
        {
          method: 'PATCH',
          body: JSON.stringify(updates)
        }
      );
      

      return response;
    } catch (error: any) {
      console.error('❌ Failed to update location:', error);
      console.error('❌ Update location error details:', {
        message: error.message,
        stack: error.stack?.substring(0, 1000),
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Uploads media (photos) to a Google Business Profile location
   */
  async uploadMedia(
    accountId: string,
    locationId: string,
    imageFile: Blob,
    options?: {
      mediaFormat?: 'PHOTO' | 'VIDEO';
      filename?: string;
      description?: string;
    }
  ): Promise<{ success: boolean; mediaItem?: any; error?: string }> {
    try {

      // Clean the account ID to remove "accounts/" prefix if present
      const cleanAccountId = accountId.replace('accounts/', '');
      const cleanLocationId = locationId.replace('locations/', '');

      // Construct the media upload endpoint
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.MEDIA
        .replace('{accountId}', cleanAccountId)
        .replace('{locationId}', cleanLocationId);

      const url = `${GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL}${endpoint}`;


      // Create FormData for file upload
      const formData = new FormData();
      const filename = options?.filename ?? `upload-${Date.now()}.jpg`;
      formData.append('media', imageFile, filename);
      
      // Create media metadata
      const mediaMetadata = {
        mediaFormat: options?.mediaFormat ?? 'PHOTO',
        sourceUrl: '', // Will be filled by Google after upload
        description: options?.description,
      };

      formData.append('metadata', JSON.stringify(mediaMetadata));

      const response = await this.makeRequest(url, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - FormData handles it
      });

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
   * Fetches media (photos) for a specific location
   */
  async getMedia(locationId: string): Promise<any[]> {
    
    try {
      // First get the account ID if we don't have it
      const accounts = await this.listAccounts();
      if (accounts.length === 0) {
        throw new Error('No Google Business Profile accounts found');
      }
      
      // Use the first account ID
      const accountId = accounts[0].name.replace('accounts/', '');
      const cleanLocationId = locationId.replace('locations/', '');
      
      // Use the v4 API for media
      const endpoint = `/v4/accounts/${accountId}/locations/${cleanLocationId}/media`;
      
      const response = await this.makeRequest(endpoint, {
        method: 'GET'
      }, 0, GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL) as { mediaItems?: any[] };

      return response?.mediaItems || [];

    } catch (error) {
      console.error('❌ Failed to fetch media:', error);
      throw error;
    }
  }

  /**
   * Fetches reviews for a specific location
   */
  async getReviews(locationId: string): Promise<any[]> {
    
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
      }, 0, GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL) as { reviews?: any[] };

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

      return response;

    } catch (error) {
      console.error('❌ Failed to reply to review:', error);
      throw error;
    }
  }

  /**
   * Updates an existing reply to a specific review
   */
  async updateReviewReply(locationId: string, reviewId: string, updatedReplyText: string): Promise<any> {
    
    try {
      // First get the account ID if we don't have it
      const accounts = await this.listAccounts();
      if (accounts.length === 0) {
        throw new Error('No Google Business Profile accounts found');
      }
      
      // Use the first account ID
      const accountId = accounts[0].name.replace('accounts/', '');
      const cleanLocationId = locationId.replace('locations/', '');
      
      // Use the v4 API for updating review replies
      const endpoint = `/v4/accounts/${accountId}/locations/${cleanLocationId}/reviews/${reviewId}/reply`;
      
      const response = await this.makeRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify({
          comment: updatedReplyText
        }),
      }, 0, GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL);

      return response;

    } catch (error) {
      console.error('❌ Failed to update review reply:', error);
      throw error;
    }
  }

  /**
   * Fetches unresponded reviews from the last 30 days
   * Used for review reminder system
   */
  async getUnrespondedReviews(locationFilter?: string | string[]): Promise<{
    locationId: string;
    locationName: string;
    accountId: string;
    accountName: string;
    reviews: Array<{
      id: string;
      reviewer: {
        displayName: string;
        profilePhotoUri?: string;
      };
      starRating: string;
      comment: string;
      createTime: string;
      updateTime: string;
      reviewReply?: {
        comment: string;
        updateTime: string;
      };
    }>;
  }[]> {
    
    const buildIdVariants = (value: string) => {
      const variants = new Set<string>();
      const trimmed = (value || '').trim();

      if (!trimmed) {
        return variants;
      }

      variants.add(trimmed);

      if (trimmed.startsWith('locations/')) {
        variants.add(trimmed.replace('locations/', ''));
      }

      const segments = trimmed.split('/');
      const lastSegment = segments[segments.length - 1];

      if (lastSegment) {
        variants.add(lastSegment);
        variants.add(`locations/${lastSegment}`);
      }

      return variants;
    };

    const filterSet = locationFilter
      ? (() => {
          const set = new Set<string>();
          const values = Array.isArray(locationFilter) ? locationFilter : [locationFilter];
          values.forEach(id => {
            buildIdVariants(id).forEach(variant => set.add(variant));
          });
          return set;
        })()
      : null;

    try {
      // Get all accounts
      const accounts = await this.listAccounts();
      if (accounts.length === 0) {
        throw new Error('No Google Business Profile accounts found');
      }

      const results = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Process each account
      for (const account of accounts) {
        const accountId = account.name.replace('accounts/', '');
        const accountName = account.accountName || 'Unknown Account';

        // Get locations for this account
        const locations = await this.listLocations(accountId);
        
        for (const location of locations) {
          const rawLocationName = location.name || '';
          const locationSegments = rawLocationName.split('/');
          const shortLocationId = locationSegments[locationSegments.length - 1] || rawLocationName;
          const canonicalLocationId = shortLocationId.startsWith('locations/') ? shortLocationId : `locations/${shortLocationId}`;
          const locationName = location.title || 'Unknown Location';

          if (filterSet) {
            const locationVariants = buildIdVariants(canonicalLocationId);
            let matchesFilter = false;

            for (const variant of locationVariants) {
              if (filterSet.has(variant)) {
                matchesFilter = true;
                break;
              }
            }

            if (!matchesFilter) {
              continue;
            }
          }

          try {
            // Fetch reviews for this location
            const reviews = await this.getReviews(canonicalLocationId);
            
            // Filter for unresponded reviews from last 30 days
            const unrespondedReviews = reviews.filter(review => {
              const reviewDate = new Date(review.createTime);
              const hasResponse = review.reviewReply && review.reviewReply.comment;
              
              return reviewDate >= thirtyDaysAgo && !hasResponse;
            });

            if (unrespondedReviews.length > 0) {
              results.push({
                locationId: canonicalLocationId,
                locationName,
                accountId,
                accountName,
                reviews: unrespondedReviews
              });
            }

          } catch (locationError) {
            console.warn(`⚠️ Failed to fetch reviews for location ${locationId}:`, locationError);
            // Continue with other locations
          }
        }
      }

      return results;

    } catch (error) {
      console.error('❌ Failed to fetch unresponded reviews:', error);
      throw error;
    }
  }

  /**
   * Lists all available Google Business Categories
   * Uses Business Information API v1
   */
  async listCategories(): Promise<Array<{ categoryId: string; displayName: string }>> {
    try {
      
      // Add required parameters for Google Business Information API v1
      const queryParams = new URLSearchParams({
        'language_code': 'en-US',
        'region_code': 'US', 
        'view': 'FULL'
      });
      
      const baseEndpoint = '/v1/categories';
      const fullEndpoint = `${baseEndpoint}?${queryParams.toString()}`;
      
      
      // CRITICAL: Pass the full endpoint with query parameters
      const response = await this.makeRequest(
        fullEndpoint,
        { method: 'GET' }
      ) as { categories?: any[] };

      if (response.categories) {
        return response.categories.map((cat: any) => ({
          categoryId: cat.name, // Use Google's 'name' field as our categoryId (e.g., "categories/gcid:marketing_consultant")
          displayName: cat.displayName
        }));
      }

      return [];
    } catch (error: any) {
      console.error('❌ Failed to list categories:', error);
      throw error;
    }
  }

  /**
   * Get overview data for a specific location
   * Aggregates data from multiple APIs for the overview dashboard
   */
  async getOverviewData(locationId: string): Promise<{
    profileData: any;
    engagementData: any;
    performanceData: any;
    reviewTrends: any;
    optimizationOpportunities: any[];
  }> {
    try {

      // Fetch data from multiple sources in parallel
      // Only fetch reviews via API, get other data from database like working tabs do
      const [
        reviews
      ] = await Promise.allSettled([
        this.getReviews(locationId)
      ]);
      
      // Use empty arrays for other data that would come from different APIs
      // The helper functions will handle empty data gracefully
      const locationInfo = { status: 'fulfilled', value: null };
      const insights = { status: 'fulfilled', value: [] };
      const photos = { status: 'fulfilled', value: [] };
      const localPosts = { status: 'fulfilled', value: [] };

      // Process the results, handling any rejections gracefully
      const location = locationInfo.status === 'fulfilled' ? locationInfo.value : null;
      const reviewsData = reviews.status === 'fulfilled' ? reviews.value : [];
      const insightsData = insights.status === 'fulfilled' ? insights.value : [];
      const photosData = photos.status === 'fulfilled' ? photos.value : [];
      const postsData = localPosts.status === 'fulfilled' ? localPosts.value : [];

      // Debug logging for failed API calls

      // Use helper functions to process the data
      const { 
        calculateProfileCompleteness, 
        processReviewTrends, 
        identifyOptimizationOpportunities,
        formatPerformanceData 
      } = await import('@/utils/googleBusinessProfile/overviewDataHelpers');

      const profileData = location ? 
        calculateProfileCompleteness(location, [], photosData) : 
        { categoriesUsed: 0, maxCategories: 10, servicesCount: 0, servicesWithDescriptions: 0, businessDescriptionLength: 0, businessDescriptionMaxLength: 750, seoScore: 0, photosByCategory: {} };

      const reviewTrends = processReviewTrends(reviewsData);

      const engagementData = {
        unrespondedReviews: reviewsData.filter((review: any) => !review.reviewReply).length,
        totalQuestions: 0, // Would need Q&A API
        unansweredQuestions: 0, // Would need Q&A API  
        recentPosts: postsData.filter((post: any) => {
          const postDate = new Date(post.createTime);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return postDate >= thirtyDaysAgo;
        }).length,
        lastPostDate: postsData.length > 0 ? postsData[0].createTime : undefined
      };

      const performanceData = formatPerformanceData(insightsData, []);

      const optimizationOpportunities = location ? 
        identifyOptimizationOpportunities(location, profileData, engagementData, photosData) : 
        [];


      return {
        profileData,
        engagementData,
        performanceData,
        reviewTrends,
        optimizationOpportunities
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch overview data:', error);
      throw error;
    }
  }

  /**
   * Get location information for overview
   */
  async getLocationInfo(locationId: string): Promise<any> {
    try {
      
      const endpoint = `/v1/${locationId}`;
      const response = await this.makeRequest(endpoint, { method: 'GET' });
      
      return response;
    } catch (error: any) {
      console.error('❌ Failed to fetch location info:', error);
      throw error;
    }
  }

  /**
   * Get location performance data using NEW Business Profile Performance API v1
   * Replaces deprecated v4 reportInsights API
   */
  async getLocationInsights(locationId: string, dateRange: string = 'THIRTY_DAYS'): Promise<any[]> {
    try {
      
      // Use NEW Business Profile Performance API v1
      const originalBaseUrl = this.config.baseUrl;
      this.config.baseUrl = GOOGLE_BUSINESS_PROFILE.PERFORMANCE_BASE_URL;
      
      // Format endpoint with location ID
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.PERFORMANCE_MULTI_DAILY_METRICS
        .replace('{locationId}', locationId);
      
      // Get date range for the request
      const dateRangeObj = this.getDateRange(dateRange);
      
      // Build query parameters for the new API using CORRECT Performance API v1 DailyMetric values
      // NOTE: Performance API requires special access approval from Google
      const queryParams = new URLSearchParams();
      
      // Add each metric as a separate parameter (API requires repeated params, not comma-separated)
      // Using correct DailyMetric enum values from Google Business Profile Performance API v1
      const metrics = [
        'WEBSITE_CLICKS',
        'CALL_CLICKS', 
        'BUSINESS_DIRECTION_REQUESTS',
        'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
        'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
        'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
        'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
        'BUSINESS_CONVERSATIONS',
        'BUSINESS_BOOKINGS',
        'BUSINESS_FOOD_ORDERS',
        'BUSINESS_FOOD_MENU_CLICKS'
      ];
      
      metrics.forEach(metric => {
        queryParams.append('dailyMetrics', metric);
      });
      
      // Add date range parameters
      queryParams.append('dailyRange.startDate.year', dateRangeObj.start.split('-')[0]);
      queryParams.append('dailyRange.startDate.month', dateRangeObj.start.split('-')[1]);
      queryParams.append('dailyRange.startDate.day', dateRangeObj.start.split('-')[2]);
      queryParams.append('dailyRange.endDate.year', dateRangeObj.end.split('-')[0]);
      queryParams.append('dailyRange.endDate.month', dateRangeObj.end.split('-')[1]);
      queryParams.append('dailyRange.endDate.day', dateRangeObj.end.split('-')[2]);

      const fullEndpoint = `${endpoint}?${queryParams.toString()}`;
      

      const response = await this.makeRequest(fullEndpoint, {
        method: 'GET'
      });

      // Restore original base URL
      this.config.baseUrl = originalBaseUrl;
      
      
      // New API returns multiDailyMetricsTimeSeries array
      return response.multiDailyMetricsTimeSeries || [];
    } catch (error: any) {
      console.error('❌ [NEW API] Failed to fetch performance data:', error);
      console.error('❌ [NEW API] Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        response: error.response
      });
      
      // Specific error detection for Performance API access issues
      const isAccessDenied = error.status === 403 || error.message?.includes('Permission denied') || error.message?.includes('quota');
      const isNotFound = error.status === 404;
      const isQuotaZero = error.message?.includes('quota') && error.message?.includes('0');
      
      if (isQuotaZero || (isAccessDenied && error.message?.includes('Performance'))) {
      }
      
      
      
      
      // FALLBACK: Try the old API as a temporary measure
      try {
        return await this.getLocationInsightsLegacy(locationId, dateRange);
      } catch (fallbackError) {
        console.error('❌ [FALLBACK] Legacy API also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * FALLBACK: Legacy v4 reportInsights API (deprecated but might still work)
   * Used as temporary backup if new Performance API isn't enabled
   */
  private async getLocationInsightsLegacy(locationId: string, dateRange: string = 'THIRTY_DAYS'): Promise<any[]> {
    
    // Extract account ID and location ID from the full location name
    const locationParts = locationId.split('/');
    if (locationParts.length < 4) {
      throw new Error('Invalid location ID format');
    }
    
    const accountId = `accounts/${locationParts[1]}`;
    const shortLocationId = `locations/${locationParts[3]}`;
    
    // Switch to legacy API
    const originalBaseUrl = this.config.baseUrl;
    this.config.baseUrl = GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL;
    
    const endpoint = `/v4/${accountId}/${shortLocationId}/reportInsights`;
    const requestBody = {
      locationNames: [locationId],
      basicRequest: {
        metricRequests: [
          { metric: 'QUERIES_DIRECT' },
          { metric: 'QUERIES_INDIRECT' },
          { metric: 'VIEWS_MAPS' },
          { metric: 'VIEWS_SEARCH' },
          { metric: 'ACTIONS_WEBSITE' },
          { metric: 'ACTIONS_PHONE' },
          { metric: 'ACTIONS_DRIVING_DIRECTIONS' }
        ],
        timeRange: {
          startTime: this.getDateRange(dateRange).start,
          endTime: this.getDateRange(dateRange).end
        }
      }
    };

    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    // Restore original base URL
    this.config.baseUrl = originalBaseUrl;
    
    
    return response.locationMetrics || [];
  }

  /**
   * Get location photos for completeness analysis
   */
  async getLocationPhotos(locationId: string): Promise<any[]> {
    try {
      
      // Extract account ID and location ID from the full location name
      const locationParts = locationId.split('/');
      if (locationParts.length < 4) {
        throw new Error('Invalid location ID format');
      }
      
      const accountId = `accounts/${locationParts[1]}`;
      const shortLocationId = `locations/${locationParts[3]}`;
      
      // Switch to Google My Business API v4 for media
      const originalBaseUrl = this.config.baseUrl;
      this.config.baseUrl = GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL;
      
      const endpoint = `/v4/${accountId}/${shortLocationId}/media`;
      const response = await this.makeRequest(endpoint, { method: 'GET' });

      // Restore original base URL
      this.config.baseUrl = originalBaseUrl;
      
      return response.mediaItems || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch location photos:', error);
      // Don't throw error, return empty array to allow other data to load
      return [];
    }
  }

  /**
   * Alias for getLocationDetails - for backward compatibility
   */
  async getLocation(accountId: string, locationId: string): Promise<any> {
    return this.getLocationDetails(locationId);
  }

  /**
   * Get unresponded reviews for a location
   */
  async getUnrespondedReviewsForLocation(locationId: string): Promise<any[]> {
    try {
      const reviews = await this.getReviews(locationId);
      return reviews.filter((review: any) => !review.reviewReply);
    } catch (error) {
      console.error('Failed to get unresponded reviews:', error);
      return [];
    }
  }

  /**
   * Get local posts for engagement analysis
   */
  async getLocalPosts(locationId: string): Promise<any[]> {
    try {
      
      // Extract account ID and location ID from the full location name
      const locationParts = locationId.split('/');
      if (locationParts.length < 4) {
        throw new Error('Invalid location ID format');
      }
      
      const accountId = `accounts/${locationParts[1]}`;
      const shortLocationId = `locations/${locationParts[3]}`;
      
      // Switch to Google My Business API v4 for posts
      const originalBaseUrl = this.config.baseUrl;
      this.config.baseUrl = GOOGLE_BUSINESS_PROFILE.LEGACY_BASE_URL;
      
      const endpoint = `/v4/${accountId}/${shortLocationId}/localPosts`;
      const response = await this.makeRequest(endpoint, { method: 'GET' });

      // Restore original base URL
      this.config.baseUrl = originalBaseUrl;
      
      return response.localPosts || [];
    } catch (error: any) {
      console.error('❌ Failed to fetch local posts:', error);
      // Don't throw error, return empty array to allow other data to load
      return [];
    }
  }

  /**
   * Helper function to get date range for insights API
   */
  private getDateRange(range: string): { start: string; end: string } {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case 'SEVEN_DAYS':
        start.setDate(end.getDate() - 7);
        break;
      case 'THIRTY_DAYS':
        start.setDate(end.getDate() - 30);
        break;
      case 'THREE_MONTHS':
        start.setMonth(end.getMonth() - 3);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return {
      start: start.toISOString().split('T')[0],  // Return YYYY-MM-DD format
      end: end.toISOString().split('T')[0]      // Return YYYY-MM-DD format
    };
  }
} 
