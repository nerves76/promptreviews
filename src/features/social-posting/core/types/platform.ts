/**
 * Universal Platform Types
 * 
 * Platform-agnostic types for social media posting functionality
 */

export interface SocialPlatform {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  isConnected: boolean;
  maxCharacters: number;
  supportsMedia: boolean;
  supportsScheduling: boolean;
  mediaTypes: MediaType[];
  postTypes: PlatformPostType[];
}

export interface MediaType {
  type: 'image' | 'video' | 'audio';
  maxSize: number; // in bytes
  allowedFormats: string[];
  maxDimensions?: {
    width: number;
    height: number;
  };
}

export interface PlatformPostType {
  id: string;
  name: string;
  description: string;
  requirements?: string[];
}

export interface UniversalPost {
  id?: string;
  content: string;
  platforms: string[]; // Platform IDs to post to
  mediaUrls?: string[];
  callToAction?: {
    actionType: string;
    url: string;
  };
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt?: Date;
  publishedAt?: Date;
  metadata?: Record<string, any>;
}

export interface PlatformAdapter {
  platform: SocialPlatform;
  
  // Authentication
  authenticate(): Promise<boolean>;
  isAuthenticated(): boolean;
  refreshAuth(): Promise<boolean>;
  
  // Posting
  createPost(post: UniversalPost): Promise<PlatformPostResult>;
  updatePost(postId: string, post: UniversalPost): Promise<PlatformPostResult>;
  deletePost(postId: string): Promise<boolean>;
  
  // Content optimization
  optimizeContent(content: string): string;
  validatePost(post: UniversalPost): ValidationResult;
  
  // Analytics (optional)
  getPostAnalytics?(postId: string): Promise<PostAnalytics>;
}

export interface PlatformPostResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
  warnings?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

export interface PostAnalytics {
  postId: string;
  platform: string;
  views: number;
  engagement: number;
  clicks: number;
  shares: number;
  comments: number;
  likes: number;
  period: {
    start: Date;
    end: Date;
  };
}

export type PlatformId =
  | 'google-business-profile'
  | 'bluesky'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter';

export interface PostSchedule {
  id: string;
  postId: string;
  platforms: PlatformId[];
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  results?: Record<string, PlatformPostResult>;
} 