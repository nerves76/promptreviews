/**
 * @fileoverview
 * Google Business Profile API Client
 * Handles authentication, API requests, and error handling for Google Business Profile integration
 */

import { GOOGLE_BUSINESS_PROFILE } from './api';
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
  private config: GoogleBusinessProfileConfig;
  private auth?: GoogleBusinessProfileAuth;

  constructor(config: GoogleBusinessProfileConfig) {
    this.config = config;
    this.auth = config.auth;
  }

  /**
   * Initialize OAuth 2.0 authorization URL
   * @param state Optional state parameter for security
   * @returns Authorization URL for user consent
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.credentials.clientId,
      redirect_uri: this.config.credentials.redirectUri,
      scope: GOOGLE_BUSINESS_PROFILE.SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state })
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   * @param code Authorization code from OAuth callback
   * @returns Authentication tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleBusinessProfileAuth> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.credentials.clientId,
        client_secret: this.config.credentials.clientSecret,
        redirect_uri: this.config.credentials.redirectUri,
        grant_type: 'authorization_code',
        code
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
    }

    const data = await response.json();
    
    const auth: GoogleBusinessProfileAuth = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope?.split(' ') || GOOGLE_BUSINESS_PROFILE.SCOPES
    };

    this.auth = auth;
    return auth;
  }

  /**
   * Refresh access token using refresh token
   * @returns Updated authentication tokens
   */
  async refreshAccessToken(): Promise<GoogleBusinessProfileAuth> {
    if (!this.auth?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.credentials.clientId,
        client_secret: this.config.credentials.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.auth.refreshToken
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh access token: ${response.statusText}`);
    }

    const data = await response.json();
    
    this.auth = {
      ...this.auth,
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      // Keep existing refresh token if new one not provided
      refreshToken: data.refresh_token || this.auth.refreshToken
    };

    return this.auth;
  }

  /**
   * Check if access token is expired and refresh if needed
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.auth) {
      throw new Error('No authentication credentials available');
    }

    // Check if token expires in the next 5 minutes
    const expiresIn5Minutes = Date.now() + (5 * 60 * 1000);
    if (this.auth.expiresAt <= expiresIn5Minutes) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<GoogleBusinessProfileApiResponse<T>> {
    await this.ensureValidToken();

    const url = `${GOOGLE_BUSINESS_PROFILE.BASE_URL}${endpoint}`;
    
    console.log('Making API request to:', url);
    console.log('Using access token:', this.auth!.accessToken.substring(0, 20) + '...');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.auth!.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response text (first 500 chars):', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Full response text:', responseText);
      throw new Error(`Invalid JSON response from API: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      const error: GoogleBusinessProfileError = new Error(
        data.error?.message || `API request failed: ${response.statusText}`
      ) as GoogleBusinessProfileError;
      error.code = data.error?.code || response.status;
      error.status = data.error?.status || response.statusText;
      error.details = data.error?.details;
      throw error;
    }

    return { data };
  }

  /**
   * List all accounts accessible to the authenticated user
   */
  async listAccounts(): Promise<BusinessAccount[]> {
    const response = await this.makeRequest<ListAccountsResponse>(
      GOOGLE_BUSINESS_PROFILE.ENDPOINTS.ACCOUNTS
    );
    return response.data?.accounts || [];
  }

  /**
   * Get specific account by name
   */
  async getAccount(accountName: string): Promise<BusinessAccount> {
    const response = await this.makeRequest<BusinessAccount>(
      `/v4/${accountName}`
    );
    
    if (!response.data) {
      throw new Error('Account not found');
    }
    
    return response.data;
  }

  /**
   * List all locations for a specific account
   */
  async listLocations(accountId: string): Promise<BusinessLocation[]> {
    const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCATIONS
      .replace('{accountId}', accountId);
    
    const response = await this.makeRequest<ListLocationsResponse>(endpoint);
    return response.data?.locations || [];
  }

  /**
   * Get specific location by name
   */
  async getLocation(locationName: string): Promise<BusinessLocation> {
    const response = await this.makeRequest<BusinessLocation>(
      `/v4/${locationName}`
    );
    
    if (!response.data) {
      throw new Error('Location not found');
    }
    
    return response.data;
  }

  /**
   * Create a new local post for a location
   */
  async createLocalPost(
    accountId: string,
    locationId: string,
    postData: CreateLocalPostRequest
  ): Promise<LocalPost> {
    const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCAL_POSTS
      .replace('{accountId}', accountId)
      .replace('{locationId}', locationId);

    const response = await this.makeRequest<LocalPost>(endpoint, {
      method: 'POST',
      body: JSON.stringify(postData)
    });

    if (!response.data) {
      throw new Error('Failed to create local post');
    }

    return response.data;
  }

  /**
   * List all local posts for a location
   */
  async listLocalPosts(
    accountId: string,
    locationId: string,
    pageSize: number = 20
  ): Promise<LocalPost[]> {
    const endpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.LOCAL_POSTS
      .replace('{accountId}', accountId)
      .replace('{locationId}', locationId);

    const url = `${endpoint}?pageSize=${pageSize}`;
    const response = await this.makeRequest<ListLocalPostsResponse>(url);
    return response.data?.localPosts || [];
  }

  /**
   * Get specific local post
   */
  async getLocalPost(postName: string): Promise<LocalPost> {
    const response = await this.makeRequest<LocalPost>(`/v4/${postName}`);
    
    if (!response.data) {
      throw new Error('Local post not found');
    }
    
    return response.data;
  }

  /**
   * Update an existing local post
   */
  async updateLocalPost(
    postName: string,
    postData: Partial<CreateLocalPostRequest>
  ): Promise<LocalPost> {
    const response = await this.makeRequest<LocalPost>(`/v4/${postName}`, {
      method: 'PATCH',
      body: JSON.stringify(postData)
    });

    if (!response.data) {
      throw new Error('Failed to update local post');
    }

    return response.data;
  }

  /**
   * Delete a local post
   */
  async deleteLocalPost(postName: string): Promise<void> {
    await this.makeRequest(`/v4/${postName}`, {
      method: 'DELETE'
    });
  }

  /**
   * Upload media for use in posts
   */
  async uploadMedia(
    accountId: string,
    locationId: string,
    mediaFile: File
  ): Promise<{ name: string; googleUrl: string }> {
    // First, start the upload session
    const startUploadEndpoint = GOOGLE_BUSINESS_PROFILE.ENDPOINTS.MEDIA
      .replace('{accountId}', accountId)
      .replace('{locationId}', locationId) + ':startUpload';

    const startResponse = await this.makeRequest<{ name: string }>(
      startUploadEndpoint,
      { method: 'POST' }
    );

    if (!startResponse.data?.name) {
      throw new Error('Failed to start media upload');
    }

    // Upload the actual file using the upload name
    const uploadResponse = await fetch(
      `https://mybusiness.googleapis.com/upload/v1/media/${startResponse.data.name}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.auth!.accessToken}`,
          'Content-Type': mediaFile.type
        },
        body: mediaFile
      }
    );

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload media file');
    }

    const uploadData = await uploadResponse.json();
    
    return {
      name: startResponse.data.name,
      googleUrl: uploadData.googleUrl || uploadData.name
    };
  }

  /**
   * Batch create posts across multiple locations
   */
  async batchCreatePosts(
    accountId: string,
    locationIds: string[],
    postData: CreateLocalPostRequest
  ): Promise<{ success: LocalPost[]; errors: Array<{ locationId: string; error: string }> }> {
    const results = await Promise.allSettled(
      locationIds.map(locationId => 
        this.createLocalPost(accountId, locationId, postData)
      )
    );

    const success: LocalPost[] = [];
    const errors: Array<{ locationId: string; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(result.value);
      } else {
        errors.push({
          locationId: locationIds[index],
          error: result.reason.message || 'Unknown error'
        });
      }
    });

    return { success, errors };
  }

  /**
   * Set authentication credentials
   */
  setAuth(auth: GoogleBusinessProfileAuth): void {
    this.auth = auth;
  }

  /**
   * Get current authentication status
   */
  getAuth(): GoogleBusinessProfileAuth | undefined {
    return this.auth;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.auth?.accessToken && this.auth.expiresAt > Date.now();
  }
}

export default GoogleBusinessProfileClient; 