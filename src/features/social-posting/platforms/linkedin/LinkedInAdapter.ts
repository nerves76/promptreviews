/**
 * LinkedIn Platform Adapter
 *
 * Implements the universal PlatformAdapter interface for LinkedIn
 * Uses OAuth 2.0 with authorization code flow
 */

import type {
  PlatformAdapter,
  SocialPlatform,
  UniversalPost,
  PlatformPostResult,
  ValidationResult
} from '../../core/types/platform';

export interface LinkedInCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO date string
  linkedinId: string; // urn:li:person:xxx
}

export interface LinkedInTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  scope: string;
}

export interface LinkedInProfile {
  sub: string; // LinkedIn ID (urn:li:person:xxx format in API responses)
  name: string;
  email?: string;
  picture?: string;
}

// LinkedIn API configuration
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com';
const LINKEDIN_API_VERSION = '202411';
const LINKEDIN_SCOPES = ['openid', 'profile', 'w_member_social'];

export class LinkedInAdapter implements PlatformAdapter {
  private credentials?: LinkedInCredentials;
  private isAuth: boolean = false;

  platform: SocialPlatform = {
    id: 'linkedin',
    name: 'LinkedIn',
    displayName: 'LinkedIn',
    icon: '/icons/linkedin.svg',
    color: '#0A66C2',
    isConnected: false,
    maxCharacters: 3000,
    supportsMedia: true,
    supportsScheduling: false, // We handle scheduling ourselves
    mediaTypes: [
      {
        type: 'image',
        maxSize: 8 * 1024 * 1024, // 8MB per image
        allowedFormats: ['image/jpeg', 'image/png', 'image/gif'],
        maxDimensions: { width: 7680, height: 4320 }
      }
    ],
    postTypes: [
      {
        id: 'POST',
        name: 'Post',
        description: 'Standard text post with optional media'
      }
    ]
  };

  constructor(credentials?: LinkedInCredentials) {
    this.credentials = credentials;
    if (credentials) {
      this.isAuth = this.isTokenValid();
      this.platform.isConnected = this.isAuth;
    }
  }

  /**
   * Check if the current access token is still valid
   */
  private isTokenValid(): boolean {
    if (!this.credentials?.accessToken || !this.credentials?.expiresAt) {
      return false;
    }
    const expiresAt = new Date(this.credentials.expiresAt);
    // Consider token invalid if it expires within 5 minutes
    return expiresAt.getTime() > Date.now() + 5 * 60 * 1000;
  }

  /**
   * Get common headers for LinkedIn API requests
   */
  private getApiHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials?.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': LINKEDIN_API_VERSION
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(state: string, redirectUri: string): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      throw new Error('LINKEDIN_CLIENT_ID environment variable is not set');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
      scope: LINKEDIN_SCOPES.join(' ')
    });

    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<LinkedInTokens> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn OAuth credentials are not configured');
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    });

    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LinkedIn token exchange failed:', errorData);
      throw new Error(`Failed to exchange code for tokens: ${response.status}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope
    };
  }

  /**
   * Refresh an expired access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<LinkedInTokens> {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn OAuth credentials are not configured');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    });

    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LinkedIn token refresh failed:', errorData);
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      scope: data.scope
    };
  }

  /**
   * Get user profile information
   */
  static async getProfile(accessToken: string): Promise<LinkedInProfile> {
    const response = await fetch(`${LINKEDIN_API_BASE}/v2/userinfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LinkedIn profile fetch failed:', errorData);
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data = await response.json();

    return {
      sub: data.sub,
      name: data.name,
      email: data.email,
      picture: data.picture
    };
  }

  /**
   * Upload an image to LinkedIn and get the image URN
   */
  async uploadImage(imageUrl: string): Promise<string> {
    if (!this.credentials?.accessToken || !this.credentials?.linkedinId) {
      throw new Error('Not authenticated with LinkedIn');
    }

    // Step 1: Initialize the upload
    const initResponse = await fetch(`${LINKEDIN_API_BASE}/rest/images?action=initializeUpload`, {
      method: 'POST',
      headers: this.getApiHeaders(),
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: this.credentials.linkedinId
        }
      })
    });

    if (!initResponse.ok) {
      const errorData = await initResponse.text();
      console.error('LinkedIn image upload init failed:', errorData);
      throw new Error(`Failed to initialize image upload: ${initResponse.status}`);
    }

    const initData = await initResponse.json();
    const uploadUrl = initData.value.uploadUrl;
    const imageUrn = initData.value.image;

    // Step 2: Download the image from the provided URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from ${imageUrl}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Step 3: Upload the image binary to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      console.error('LinkedIn image binary upload failed:', errorData);
      throw new Error(`Failed to upload image binary: ${uploadResponse.status}`);
    }

    return imageUrn;
  }

  /**
   * Authenticate - validates existing credentials
   */
  async authenticate(): Promise<boolean> {
    if (!this.credentials) {
      console.error('LinkedIn: No credentials provided');
      return false;
    }

    try {
      // Check if token is valid
      if (!this.isTokenValid()) {
        // Try to refresh the token
        const refreshed = await this.refreshAuth();
        if (!refreshed) {
          return false;
        }
      }

      this.isAuth = true;
      this.platform.isConnected = true;
      console.log('LinkedIn authenticated successfully');
      return true;
    } catch (error) {
      console.error('LinkedIn authentication failed:', error);
      this.isAuth = false;
      this.platform.isConnected = false;
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.isAuth && this.isTokenValid();
  }

  /**
   * Refresh authentication using refresh token
   */
  async refreshAuth(): Promise<boolean> {
    if (!this.credentials?.refreshToken) {
      console.error('LinkedIn: No refresh token available');
      return false;
    }

    try {
      const tokens = await LinkedInAdapter.refreshAccessToken(this.credentials.refreshToken);

      // Update credentials
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000).toISOString();
      this.credentials = {
        ...this.credentials,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: expiresAt
      };

      this.isAuth = true;
      this.platform.isConnected = true;
      console.log('LinkedIn token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Failed to refresh LinkedIn token:', error);
      this.isAuth = false;
      this.platform.isConnected = false;
      return false;
    }
  }

  /**
   * Create a post on LinkedIn
   */
  async createPost(post: UniversalPost): Promise<PlatformPostResult> {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated with LinkedIn'
      };
    }

    try {
      // Validate the post first
      const validation = this.validatePost(post);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          warnings: validation.warnings
        };
      }

      // Build post content, appending CTA URL if present
      let postContent = post.content;
      if (post.callToAction?.url) {
        // Append the CTA URL to the content
        postContent = `${postContent}\n\n${post.callToAction.url}`;
      }

      // Build the post body
      const postBody: Record<string, unknown> = {
        author: this.credentials!.linkedinId,
        commentary: postContent,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: 'PUBLISHED'
      };

      // Handle media if present
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        // LinkedIn supports max 9 images per post
        const imageUrls = post.mediaUrls.slice(0, 9);
        const imageUrns: string[] = [];

        for (const url of imageUrls) {
          try {
            const imageUrn = await this.uploadImage(url);
            imageUrns.push(imageUrn);
          } catch (uploadError) {
            console.error('Failed to upload image to LinkedIn:', uploadError);
            // Continue with other images
          }
        }

        if (imageUrns.length > 0) {
          if (imageUrns.length === 1) {
            // Single image
            postBody.content = {
              media: {
                id: imageUrns[0]
              }
            };
          } else {
            // Multiple images (carousel)
            postBody.content = {
              multiImage: {
                images: imageUrns.map(urn => ({
                  id: urn
                }))
              }
            };
          }
        }
      }

      // Create the post
      const response = await fetch(`${LINKEDIN_API_BASE}/rest/posts`, {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify(postBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('LinkedIn post creation failed:', errorData);
        return {
          success: false,
          error: `Failed to create post: ${response.status} - ${errorData}`
        };
      }

      // LinkedIn returns the post URN in the x-restli-id header
      const postUrn = response.headers.get('x-restli-id');

      return {
        success: true,
        platformPostId: postUrn || undefined,
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('LinkedIn posting error:', error);

      // Check for rate limiting
      if (error instanceof Error && error.message.includes('429')) {
        return {
          success: false,
          error: 'LinkedIn rate limit exceeded. Please try again later.'
        };
      }

      return {
        success: false,
        error: `Failed to post to LinkedIn: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update post (not supported by LinkedIn API for regular posts)
   */
  async updatePost(_postId: string, _post: UniversalPost): Promise<PlatformPostResult> {
    return {
      success: false,
      error: 'LinkedIn does not support post editing for regular posts'
    };
  }

  /**
   * Delete a post from LinkedIn
   */
  async deletePost(postId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      const response = await fetch(`${LINKEDIN_API_BASE}/rest/posts/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
        headers: this.getApiHeaders()
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('LinkedIn post deletion failed:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete LinkedIn post:', error);
      return false;
    }
  }

  /**
   * Optimize content for LinkedIn
   */
  optimizeContent(content: string): string {
    let optimized = content;

    // Truncate if too long
    if (optimized.length > this.platform.maxCharacters) {
      optimized = optimized.substring(0, this.platform.maxCharacters - 3) + '...';
    }

    return optimized;
  }

  /**
   * Validate post for LinkedIn
   */
  validatePost(post: UniversalPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Content validation
    if (!post.content || post.content.trim().length === 0) {
      errors.push('Post content is required');
    }

    // Calculate total length including CTA URL if present
    let totalLength = post.content?.length || 0;
    if (post.callToAction?.url) {
      // Account for the "\n\n" + URL that will be appended
      totalLength += 2 + post.callToAction.url.length;
    }

    if (totalLength > this.platform.maxCharacters) {
      errors.push(`Content exceeds LinkedIn's maximum length of ${this.platform.maxCharacters} characters`);
    }

    // Media validation
    if (post.mediaUrls && post.mediaUrls.length > 9) {
      warnings.push('LinkedIn supports maximum 9 images per post. Only the first 9 will be included.');
    }

    // Check for localhost URLs
    if (post.mediaUrls) {
      const hasLocalhost = post.mediaUrls.some(url =>
        url.includes('localhost') || url.includes('127.0.0.1')
      );
      if (hasLocalhost) {
        errors.push('Media URLs must be publicly accessible. Localhost URLs are not supported.');
      }
    }

    // Content suggestions
    if (post.content && post.content.length < 50) {
      suggestions.push('LinkedIn posts perform better with more detailed content');
    }

    if (post.content && !post.content.includes('#')) {
      suggestions.push('Consider adding relevant hashtags to increase visibility');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Update credentials (e.g., after token refresh)
   */
  setCredentials(credentials: LinkedInCredentials): void {
    this.credentials = credentials;
    this.isAuth = this.isTokenValid();
    this.platform.isConnected = this.isAuth;
  }

  /**
   * Get current credentials
   */
  getCredentials(): LinkedInCredentials | undefined {
    return this.credentials;
  }

  /**
   * Get LinkedIn ID
   */
  getLinkedInId(): string | undefined {
    return this.credentials?.linkedinId;
  }
}
