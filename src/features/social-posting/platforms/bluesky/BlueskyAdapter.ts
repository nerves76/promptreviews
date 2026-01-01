/**
 * Bluesky Platform Adapter
 *
 * Implements the universal PlatformAdapter interface for Bluesky
 * Uses the AT Protocol (@atproto/api) for posting
 */

import { BskyAgent, RichText } from '@atproto/api';
import type {
  PlatformAdapter,
  SocialPlatform,
  UniversalPost,
  PlatformPostResult,
  ValidationResult
} from '../../core/types/platform';

export interface BlueskyCredentials {
  identifier: string; // Username or email
  appPassword: string; // App password (not account password)
  did?: string; // Decentralized Identifier (obtained after auth)
}

export interface BlueskySessionData {
  did: string;
  handle: string;
  email?: string;
  accessJwt: string;
  refreshJwt: string;
}

export class BlueskyAdapter implements PlatformAdapter {
  private agent: BskyAgent;
  private credentials?: BlueskyCredentials;
  private session?: BlueskySessionData;
  private isAuth: boolean = false;

  platform: SocialPlatform = {
    id: 'bluesky',
    name: 'Bluesky',
    displayName: 'Bluesky',
    icon: '/icons/bluesky.svg',
    color: '#1285FE',
    isConnected: false,
    maxCharacters: 300, // Bluesky's character limit
    supportsMedia: true,
    supportsScheduling: false, // Bluesky doesn't support native scheduling
    mediaTypes: [
      {
        type: 'image',
        maxSize: 1 * 1024 * 1024, // 1MB per image
        allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxDimensions: { width: 2000, height: 2000 }
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

  constructor(credentials?: BlueskyCredentials) {
    this.agent = new BskyAgent({
      service: 'https://bsky.social'
    });
    this.credentials = credentials;
  }

  /**
   * Authenticate with Bluesky using app password
   */
  async authenticate(): Promise<boolean> {
    if (!this.credentials) {
      console.error('Bluesky: No credentials provided');
      return false;
    }

    try {
      const response = await this.agent.login({
        identifier: this.credentials.identifier,
        password: this.credentials.appPassword
      });

      if (response.success) {
        this.session = {
          did: response.data.did,
          handle: response.data.handle,
          email: response.data.email,
          accessJwt: response.data.accessJwt,
          refreshJwt: response.data.refreshJwt
        };

        // Store DID in credentials for future reference
        if (this.credentials) {
          this.credentials.did = response.data.did;
        }

        this.isAuth = true;
        this.platform.isConnected = true;

        console.log(`✅ Bluesky authenticated as @${response.data.handle}`);
        return true;
      }

      console.error('Bluesky: Authentication failed - no success response');
      return false;
    } catch (error) {
      console.error('Bluesky authentication failed:', error);
      this.isAuth = false;
      this.platform.isConnected = false;
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.isAuth && !!this.session;
  }

  /**
   * Refresh authentication session
   */
  async refreshAuth(): Promise<boolean> {
    try {
      // Try to resume existing session
      if (this.session) {
        await this.agent.resumeSession({
          did: this.session.did,
          handle: this.session.handle,
          email: this.session.email,
          accessJwt: this.session.accessJwt,
          refreshJwt: this.session.refreshJwt,
          active: true
        });

        // Update session tokens after refresh
        const newSession = this.agent.session;
        if (newSession) {
          this.session = {
            did: newSession.did,
            handle: newSession.handle,
            email: newSession.email,
            accessJwt: newSession.accessJwt,
            refreshJwt: newSession.refreshJwt
          };
          this.isAuth = true;
          return true;
        }
      }

      // If session resume fails, try full re-authentication
      return await this.authenticate();
    } catch (error) {
      console.error('❌ Failed to refresh Bluesky auth:', error);
      this.isAuth = false;
      this.platform.isConnected = false;

      // Try full re-authentication as fallback
      if (this.credentials) {
        return await this.authenticate();
      }

      return false;
    }
  }

  /**
   * Create a post on Bluesky
   */
  async createPost(post: UniversalPost): Promise<PlatformPostResult> {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated with Bluesky'
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

      // Create RichText for proper character counting and facet extraction
      const richText = new RichText({ text: post.content });
      await richText.detectFacets(this.agent);

      // Prepare post record
      const record: any = {
        $type: 'app.bsky.feed.post',
        text: richText.text,
        facets: richText.facets,
        createdAt: new Date().toISOString()
      };

      // Handle media uploads if present
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        const embedImages = [];

        // Bluesky supports max 4 images per post
        const imageUrls = post.mediaUrls.slice(0, 4);

        for (const url of imageUrls) {
          try {
            // Download image
            const response = await fetch(url);
            if (!response.ok) {
              console.warn(`Failed to fetch image from ${url}`);
              continue;
            }

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Upload to Bluesky
            const uploadResponse = await this.agent.uploadBlob(uint8Array, {
              encoding: blob.type
            });

            if (uploadResponse.success) {
              embedImages.push({
                alt: post.metadata?.imageAlt || '',
                image: uploadResponse.data.blob
              });
            }
          } catch (uploadError) {
            console.error('Failed to upload image to Bluesky:', uploadError);
            // Continue with other images
          }
        }

        // Add embed if we have images
        if (embedImages.length > 0) {
          record.embed = {
            $type: 'app.bsky.embed.images',
            images: embedImages
          };
        }
      }

      // Handle links/call to action
      if (post.callToAction?.url) {
        // If we don't have media embed, we can embed the link as a card
        if (!record.embed) {
          record.embed = {
            $type: 'app.bsky.embed.external',
            external: {
              uri: post.callToAction.url,
              title: post.metadata?.linkTitle || 'Link',
              description: post.metadata?.linkDescription || ''
            }
          };
        }
      }

      // Create the post
      const result = await this.agent.post(record);

      return {
        success: true,
        platformPostId: result.uri,
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Bluesky posting error:', error);

      // Check for rate limiting
      if (error instanceof Error && error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Bluesky rate limit exceeded. Please try again later.'
        };
      }

      return {
        success: false,
        error: `Failed to post to Bluesky: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update post (not supported by Bluesky)
   */
  async updatePost(postId: string, post: UniversalPost): Promise<PlatformPostResult> {
    return {
      success: false,
      error: 'Bluesky does not support post editing'
    };
  }

  /**
   * Delete a post from Bluesky
   */
  async deletePost(postId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      await this.agent.deletePost(postId);
      return true;
    } catch (error) {
      console.error('Failed to delete Bluesky post:', error);
      return false;
    }
  }

  /**
   * Optimize content for Bluesky
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
   * Validate post for Bluesky
   */
  validatePost(post: UniversalPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Content validation
    if (!post.content || post.content.trim().length === 0) {
      errors.push('Post content is required');
    }

    if (post.content && post.content.length > this.platform.maxCharacters) {
      errors.push(`Content exceeds Bluesky's maximum length of ${this.platform.maxCharacters} characters`);
    }

    // Media validation
    if (post.mediaUrls && post.mediaUrls.length > 4) {
      warnings.push('Bluesky supports maximum 4 images per post. Only the first 4 will be included.');
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

    // Scheduling validation
    if (post.scheduledFor) {
      warnings.push('Bluesky does not support scheduled posts. Post will be published immediately.');
    }

    // Content suggestions
    if (post.content && post.content.length < 20) {
      suggestions.push('Consider adding more detail to your post for better engagement');
    }

    if (post.content && !post.content.includes('#') && !post.content.includes('@')) {
      suggestions.push('Consider adding hashtags or mentions to increase visibility');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Get current session data (for storage)
   */
  getSessionData(): BlueskySessionData | undefined {
    return this.session;
  }

  /**
   * Get handle/username
   */
  getHandle(): string | undefined {
    return this.session?.handle;
  }

  /**
   * Get DID (Decentralized Identifier)
   */
  getDID(): string | undefined {
    return this.session?.did;
  }
}
