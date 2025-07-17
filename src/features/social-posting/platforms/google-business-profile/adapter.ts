/**
 * Google Business Profile Platform Adapter
 * 
 * Implements the universal PlatformAdapter interface for Google Business Profile
 */

import { GoogleBusinessProfileClient } from './googleBusinessProfileClient';
import { GOOGLE_BUSINESS_PROFILE } from './api';
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
        id: 'WHATS_NEW',
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
        id: 'PRODUCT',
        name: 'Product',
        description: 'Showcase products or services'
      }
    ]
  };
  
  constructor(config: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  }) {
    this.client = new GoogleBusinessProfileClient(config);
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
      // Implement token refresh logic
      return true;
    } catch (error) {
      console.error('Failed to refresh Google Business Profile auth:', error);
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
      
      // TODO: Implement actual posting when we have the location ID
      // const result = await this.client.createLocalPost(locationId, gbpPost);
      
      // For now, simulate success
      return {
        success: true,
        platformPostId: `gbp_${Date.now()}`,
        warnings: ['This is a simulated post - actual Google Business Profile integration pending']
      };
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
    // Convert universal post format to Google Business Profile API format
    return {
      topicType: GOOGLE_BUSINESS_PROFILE.POST_TYPES.WHATS_NEW, // Default type
      summary: post.content,
      media: post.mediaUrls?.map(url => ({
        mediaFormat: 'PHOTO', // Determine from URL or metadata
        sourceUrl: url
      })) || []
    };
  }
} 