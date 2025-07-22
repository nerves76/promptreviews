/**
 * Google Business Profile Platform Adapter
 * 
 * Implements the universal PlatformAdapter interface for Google Business Profile
 */

import { GoogleBusinessProfileClient } from './googleBusinessProfileClient';
import { GOOGLE_BUSINESS_PROFILE } from './api';
import type { PostType } from './googleBusinessProfile';
import type { 
  PlatformAdapter, 
  SocialPlatform, 
  UniversalPost, 
  PlatformPostResult, 
  ValidationResult,
  MediaType
} from '../../core/types/platform';

export class GoogleBusinessProfileAdapter implements PlatformAdapter {
  private client: GoogleBusinessProfileClient;
  private isAuth: boolean = false;
  private accountId?: string; // Store account ID to avoid API calls
  
  platform: SocialPlatform = {
    id: 'google-business-profile',
    name: 'Google Business Profile',
    displayName: 'Google Business Profile',
    icon: '/icons/google-business.svg',
    color: '#4285F4',
    isConnected: false,
    maxCharacters: 1500,
    supportsMedia: true,
    supportsScheduling: false, // Google Business Profile doesn't support scheduling
    mediaTypes: [
      {
        type: 'image',
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['image/jpeg', 'image/png', 'image/gif'],
        maxDimensions: { width: 2048, height: 2048 }
      },
      {
        type: 'video',
        maxSize: 100 * 1024 * 1024, // 100MB
        allowedFormats: ['video/mp4', 'video/mov', 'video/avi']
      }
    ],
    postTypes: [
          {
      id: 'STANDARD',
        name: 'What\'s New',
        description: 'General updates and announcements'
      },
      {
        id: 'EVENT',
        name: 'Event',
        description: 'Promote upcoming events'
      },
      {
        id: 'OFFER',
        name: 'Offer',
        description: 'Special deals and promotions'
      },
      {
        id: 'ALERT',
        name: 'Alert',
        description: 'Important announcements and notices'
      }
    ]
  };
  
  constructor(config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }) {
    // Note: The client will be created when we have actual credentials
    // This is just a placeholder for the adapter interface
    this.client = null as any;
  }
  
  async authenticate(): Promise<boolean> {
    try {
      // This would typically redirect to Google OAuth
      // For now, we'll assume authentication happens externally
      this.isAuth = true;
      this.platform.isConnected = true;
      return true;
    } catch (error) {
      console.error('Google Business Profile authentication failed:', error);
      return false;
    }
  }
  
  isAuthenticated(): boolean {
    return this.isAuth;
  }
  
  async refreshAuth(): Promise<boolean> {
    try {
      if (!this.client) {
        console.log('❌ No client available for token refresh');
        return false;
      }

      // Force token refresh by making a test API call
      // This will trigger the client's internal refresh logic if tokens are expired
      await this.client.listAccounts();
      
      console.log('✅ Google Business Profile auth refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to refresh Google Business Profile auth:', error);
      return false;
    }
  }
  
  async createPost(post: UniversalPost): Promise<PlatformPostResult> {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated with Google Business Profile'
      };
    }
    
    try {
      // Validate the post first
      const validation = this.validatePost(post);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }
      
      // Convert universal post to Google Business Profile format
      const gbpPost = this.convertToGBPPost(post);
      
      // Get the location ID from post metadata (should be set by frontend)
      const locationId = post.metadata?.locationId;
      if (!locationId) {
        return {
          success: false,
          error: 'Location ID is required for Google Business Profile posts. Please select a business location.'
        };
      }
      
      try {
        // Handle different location ID formats
        let actualLocationId: string;
        
        if (locationId.startsWith('accounts/')) {
          // Full format: accounts/{accountId}/locations/{locationId}
          const parts = locationId.split('/');
          this.accountId = parts[1];
          actualLocationId = parts[3];
        } else if (locationId.startsWith('locations/')) {
          // Short format: locations/{locationId} - need account ID
          actualLocationId = locationId.split('/')[1];
          
          // Use stored account ID if available, otherwise fetch it
          if (!this.accountId) {
            console.log('🔍 Account ID not stored, fetching from API...');
            try {
              const accounts = await this.client.listAccounts();
              if (accounts.length === 0) {
                throw new Error('No Google Business Profile accounts found');
              }
              // Use the first account (most users have only one)
              this.accountId = accounts[0].name.replace('accounts/', '');
              console.log(`📋 Fetched account ID from API: ${this.accountId}`);
            } catch (error) {
              console.error('Error getting account ID:', error);
              throw new Error('Unable to get Google Business Profile account ID');
            }
          } else {
            console.log(`📋 Using stored account ID: ${this.accountId}`);
          }
        } else {
          throw new Error('Invalid location ID format. Expected "locations/{id}" or "accounts/{accountId}/locations/{id}"');
        }
        
        if (!this.accountId || !actualLocationId) {
          throw new Error('Invalid location ID format');
        }
        
        console.log(`📍 Using account ID: ${this.accountId}, location ID: ${actualLocationId}`);
        
        // Create the actual post
        const result = await this.client.createLocalPost(this.accountId, actualLocationId, gbpPost);
        
        return {
          success: true,
          platformPostId: result.name || `gbp_${Date.now()}`
        };
      } catch (error) {
        console.error('Google Business Profile posting error:', error);
        
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('rate limit')) {
          return {
            success: false,
            error: 'Google Business Profile rate limit exceeded. Please try again in a few minutes.'
          };
        }
        
        return {
          success: false,
          error: `Failed to post to Google Business Profile: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  async updatePost(postId: string, post: UniversalPost): Promise<PlatformPostResult> {
    // Google Business Profile doesn't support post editing
    return {
      success: false,
      error: 'Google Business Profile does not support post editing'
    };
  }
  
  async deletePost(postId: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }
    
    try {
      // TODO: Implement actual deletion when we have the API integration
      // await this.client.deleteLocalPost(locationId, postId);
      return true;
    } catch (error) {
      console.error('Failed to delete Google Business Profile post:', error);
      return false;
    }
  }
  
  optimizeContent(content: string): string {
    // Google Business Profile specific optimizations
    let optimized = content;
    
    // Truncate if too long
    if (optimized.length > this.platform.maxCharacters) {
      optimized = optimized.substring(0, this.platform.maxCharacters - 3) + '...';
    }
    
    // Add location-specific hashtags (could be enhanced with business context)
    if (!optimized.includes('#')) {
      optimized += ' #LocalBusiness';
    }
    
    return optimized;
  }
  
  validatePost(post: UniversalPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // Content validation
    if (!post.content || post.content.trim().length === 0) {
      errors.push('Post content is required');
    }
    
    if (post.content && post.content.length > this.platform.maxCharacters) {
      errors.push(`Content exceeds maximum length of ${this.platform.maxCharacters} characters`);
    }
    
    // Media validation
    if (post.mediaUrls && post.mediaUrls.length > 10) {
      errors.push('Google Business Profile supports maximum 10 media items per post');
    }
    
    // Scheduling validation
    if (post.scheduledFor) {
      warnings.push('Google Business Profile does not support scheduled posts. Post will be published immediately.');
    }
    
    // Content suggestions
    if (post.content && !post.content.includes('#')) {
      suggestions.push('Consider adding relevant hashtags to increase visibility');
    }
    
    if (post.content && post.content.length < 50) {
      suggestions.push('Consider adding more detail to your post for better engagement');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
  
  private convertToGBPPost(post: UniversalPost) {
    // Filter out localhost URLs that Google API can't access
    const validMediaUrls = post.mediaUrls?.filter(url => {
      const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
      if (isLocalhost) {
        console.warn(`⚠️ Skipping localhost image URL for Google Business Profile: ${url}`);
        return false;
      }
      return true;
    }) || [];

    // Convert universal post format to Google Business Profile API format
    return {
      topicType: 'STANDARD' as PostType, // Use STANDARD for general business posts
      summary: post.content,
      media: validMediaUrls.map(url => ({
        mediaFormat: 'PHOTO' as const, // Determine from URL or metadata
        sourceUrl: url
      })),
      callToAction: post.callToAction ? {
        actionType: post.callToAction.actionType,
        url: post.callToAction.url
      } : undefined,
      languageCode: 'en-US' // Default language code
    };
  }
} 