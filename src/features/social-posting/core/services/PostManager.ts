/**
 * Universal Post Manager
 * 
 * Coordinates posting across multiple social media platforms
 */

import type { 
  UniversalPost, 
  PlatformAdapter, 
  PlatformPostResult, 
  PlatformId,
  ValidationResult 
} from '../types/platform';

export class PostManager {
  private adapters: Map<PlatformId, PlatformAdapter> = new Map();
  
  /**
   * Register a platform adapter
   */
  registerAdapter(platformId: PlatformId, adapter: PlatformAdapter): void {
    this.adapters.set(platformId, adapter);
  }
  
  /**
   * Get all registered platform adapters
   */
  getAdapters(): Map<PlatformId, PlatformAdapter> {
    return this.adapters;
  }
  
  /**
   * Get a specific platform adapter
   */
  getAdapter(platformId: PlatformId): PlatformAdapter | undefined {
    return this.adapters.get(platformId);
  }
  
  /**
   * Validate a post across all target platforms
   */
  async validatePost(post: UniversalPost): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};
    
    for (const platformId of post.platforms) {
      const adapter = this.adapters.get(platformId as PlatformId);
      if (adapter) {
        results[platformId] = adapter.validatePost(post);
      } else {
        results[platformId] = {
          isValid: false,
          errors: [`Platform ${platformId} is not configured`],
          warnings: []
        };
      }
    }
    
    return results;
  }
  
  /**
   * Optimize post content for each platform
   */
  optimizePostForPlatforms(post: UniversalPost): Record<string, string> {
    const optimizedContent: Record<string, string> = {};
    
    for (const platformId of post.platforms) {
      const adapter = this.adapters.get(platformId as PlatformId);
      if (adapter) {
        optimizedContent[platformId] = adapter.optimizeContent(post.content);
      } else {
        optimizedContent[platformId] = post.content;
      }
    }
    
    return optimizedContent;
  }
  
  /**
   * Publish a post to all specified platforms
   */
  async publishPost(post: UniversalPost): Promise<Record<string, PlatformPostResult>> {
    const results: Record<string, PlatformPostResult> = {};
    
    // Validate first
    const validationResults = await this.validatePost(post);
    
    // Only publish to platforms that pass validation
    const publishPromises = post.platforms.map(async (platformId) => {
      const validation = validationResults[platformId];
      if (!validation.isValid) {
        results[platformId] = {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
        return;
      }
      
      const adapter = this.adapters.get(platformId as PlatformId);
      if (!adapter) {
        results[platformId] = {
          success: false,
          error: `Platform ${platformId} is not configured`
        };
        return;
      }
      
      if (!adapter.isAuthenticated()) {
        results[platformId] = {
          success: false,
          error: `Platform ${platformId} is not authenticated`
        };
        return;
      }
      
      try {
        // Optimize content for this specific platform
        const optimizedPost = {
          ...post,
          content: adapter.optimizeContent(post.content)
        };
        
        const result = await adapter.createPost(optimizedPost);
        results[platformId] = result;
      } catch (error) {
        results[platformId] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    });
    
    await Promise.all(publishPromises);
    return results;
  }
  
  /**
   * Get connected platforms
   */
  getConnectedPlatforms(): PlatformId[] {
    const connected: PlatformId[] = [];
    
    for (const [platformId, adapter] of this.adapters) {
      if (adapter.isAuthenticated()) {
        connected.push(platformId);
      }
    }
    
    return connected;
  }
  
  /**
   * Get available platforms (registered adapters)
   */
  getAvailablePlatforms(): PlatformId[] {
    return Array.from(this.adapters.keys());
  }
}

// Singleton instance
export const postManager = new PostManager(); 