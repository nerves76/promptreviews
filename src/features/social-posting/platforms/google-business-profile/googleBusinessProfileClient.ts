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
      // Check if token is expired
      if (Date.now() >= this.expiresAt) {
        await this.refreshAccessToken();
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
   * Refreshes the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      console.log('🔄 Refreshing access token...');
      
      const response = await fetch(GOOGLE_BUSINESS_PROFILE.OAUTH.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
      }

      this.accessToken = data.access_token;
      this.expiresAt = Date.now() + (data.expires_in * 1000);
      
      // 🔧 Save refreshed tokens back to database for persistence
      await this.saveTokensToDatabase();
      
      console.log('✅ Access token refreshed and saved to database');

    } catch (error) {
      console.error('❌ Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Saves current tokens to the database
   */
  private async saveTokensToDatabase(): Promise<void> {
    try {
      // Use fetch to call our API endpoint that updates tokens
      const response = await fetch('/api/auth/google/update-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          expires_at: new Date(this.expiresAt).toISOString()
        }),
      });

      if (!response.ok) {
        console.warn('⚠️ Failed to save tokens to database:', response.statusText);
      } else {
        console.log('💾 Tokens saved to database successfully');
      }
    } catch (error) {
      console.warn('⚠️ Error saving tokens to database:', error);
      // Don't throw - this is not critical for the API call to succeed
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
      const readMask = 'name,title,storefrontAddress,phoneNumbers,categories,websiteUri,latlng,metadata';
      const endpointWithParams = `${endpoint}?readMask=${encodeURIComponent(readMask)}`;
      console.log(`📍 Final URL to call: ${this.config.baseUrl}${endpointWithParams}`);
      
      // Use Business Information API for listing locations
      const response = await this.makeRequest(endpointWithParams);
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
} 