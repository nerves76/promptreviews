/**
 * Review Share Events Types
 * Defines types for the social sharing tracking system
 */

/**
 * Supported social platforms for sharing reviews
 */
export type SharePlatform =
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'bluesky'
  | 'reddit'
  | 'pinterest'
  | 'email'
  | 'sms';

/**
 * Review share event record from database
 */
export interface ReviewShareEvent {
  id: string;
  review_id: string;
  account_id: string;
  user_id: string;
  platform: SharePlatform;
  timestamp: string; // ISO 8601 timestamp
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Input data for creating a new share event
 */
export interface CreateShareEventInput {
  review_id: string;
  platform: SharePlatform;
  account_id?: string; // Optional - will be inferred from auth if not provided
}

/**
 * Response from share event creation
 */
export interface CreateShareEventResponse {
  success: boolean;
  data?: ReviewShareEvent;
  error?: string;
}

/**
 * Share history for a specific review
 */
export interface ReviewShareHistory {
  review_id: string;
  total_shares: number;
  shares_by_platform: {
    platform: SharePlatform;
    count: number;
    last_shared_at: string;
  }[];
  events: ReviewShareEvent[];
}

/**
 * Share analytics aggregated by platform
 */
export interface ShareAnalytics {
  total_shares: number;
  shares_by_platform: {
    platform: SharePlatform;
    count: number;
    percentage: number;
  }[];
  most_shared_reviews: {
    review_id: string;
    review_content?: string;
    reviewer_name?: string;
    share_count: number;
    platforms: SharePlatform[];
  }[];
  time_period?: {
    start_date: string;
    end_date: string;
  };
}

/**
 * Query parameters for analytics endpoint
 */
export interface ShareAnalyticsQuery {
  start_date?: string; // ISO 8601 date
  end_date?: string; // ISO 8601 date
  platform?: SharePlatform;
  limit?: number; // For most_shared_reviews
}

/**
 * Platform display information
 */
export interface SharePlatformInfo {
  platform: SharePlatform;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

/**
 * Share button configuration
 */
export interface ShareButtonConfig {
  platform: SharePlatform;
  enabled: boolean;
  cta_url?: string; // Override default business website
  custom_message?: string; // Custom sharing message
}

/**
 * Validation result for share operations
 */
export interface ShareValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}
