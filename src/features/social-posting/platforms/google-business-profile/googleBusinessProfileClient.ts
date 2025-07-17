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
  GoogleBusinessProfileConfig,
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
  private config: GoogleBusinessProfileConfig;

  constructor(credentials: GoogleBusinessProfileCredentials, config?: Partial<GoogleBusinessProfileConfig>) {
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
  }

  /**
   * Makes an authenticated API request with rate limiting and retry logic
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<GoogleBusinessProfileApiResponse> {
    try {
      // Check if token is expired
      if (Date.now() >= this.expiresAt) {
        await this.refreshAccessToken();
      }

      const url = `${this.config.baseUrl}${endpoint}`;
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
        signal: AbortSignal.timeout(this.config.timeout)
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

      // Handle rate limiting
      if (response.status === GOOGLE_BUSINESS_PROFILE.ERROR_CODES.RATE_LIMIT_EXCEEDED) {
        if (retryCount < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, retryCount);
          console.log(`⏳ Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${this.config.retryAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(endpoint, options, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded after all retry attempts');
        }
      }

      // Handle other errors
      if (!response.ok) {
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
      
      console.log('✅ Access token refreshed successfully');

    } catch (error) {
      console.error('❌ Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Lists all business accounts for the authenticated user
   */
  async listAccounts(): Promise<BusinessAccount[]> {
    try {
      console.log('📋 Fetching Google Business Profile accounts...');
      
      const response = await this.makeRequest(GOOGLE_BUSINESS_PROFILE.ENDPOINTS.ACCOUNTS);
      
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
   * Lists all locations for a specific business account
   */
  async listLocations(accountId: string): Promise<BusinessLocation[]> {
    try {
      console.log(`📍 Fetching locations for account: ${accountId}`);
      
      const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCATIONS.replace('{accountId}', accountId);
      const response = await this.makeRequest(endpoint);
      
      if (!response.data.locations) {
        console.log('⚠️ No locations found in response');
        return [];
      }

      console.log(`✅ Found ${response.data.locations.length} locations`);
      return response.data.locations;

    } catch (error) {
      console.error('❌ Failed to list locations:', error);
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
      
      const response = await this.makeRequest(endpoint);
      
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
      });

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
} 