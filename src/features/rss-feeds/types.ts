/**
 * RSS Feed Types
 * Types for the RSS-to-GBP/Bluesky auto-posting feature
 */

// ============================================================================
// Database Types (matching Prisma schema)
// ============================================================================

export interface RssFeedSource {
  id: string;
  accountId: string;
  feedUrl: string;
  feedName: string;
  pollingIntervalMinutes: number;
  lastPolledAt: string | null;
  lastSuccessfulPollAt: string | null;
  postTemplate: string;
  includeLink: boolean;
  maxContentLength: number;
  targetLocations: TargetLocation[];
  additionalPlatforms: AdditionalPlatforms;
  isActive: boolean;
  errorCount: number;
  lastError: string | null;
  postsToday: number;
  postsTodayResetAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RssFeedItem {
  id: string;
  feedSourceId: string;
  itemGuid: string;
  itemUrl: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  status: RssFeedItemStatus;
  scheduledPostId: string | null;
  skipReason: string | null;
  errorMessage: string | null;
  discoveredAt: string;
  processedAt: string | null;
}

export type RssFeedItemStatus = 'pending' | 'scheduled' | 'skipped' | 'failed';

// ============================================================================
// Nested Types
// ============================================================================

export interface TargetLocation {
  id: string;
  name?: string;
}

export interface AdditionalPlatforms {
  bluesky?: {
    enabled: boolean;
    connectionId: string;
  };
}

// ============================================================================
// Parsed Feed Types (from rss-parser)
// ============================================================================

export interface ParsedFeed {
  title: string | undefined;
  description: string | undefined;
  link: string | undefined;
  items: ParsedFeedItem[];
}

export interface ParsedFeedItem {
  guid: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date | null;
  imageUrl: string | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateFeedRequest {
  feedUrl: string;
  feedName: string;
  pollingIntervalMinutes?: number;
  postTemplate?: string;
  includeLink?: boolean;
  maxContentLength?: number;
  targetLocations: TargetLocation[];
  additionalPlatforms?: AdditionalPlatforms;
  isActive?: boolean;
}

export interface UpdateFeedRequest {
  feedName?: string;
  pollingIntervalMinutes?: number;
  postTemplate?: string;
  includeLink?: boolean;
  maxContentLength?: number;
  targetLocations?: TargetLocation[];
  additionalPlatforms?: AdditionalPlatforms;
  isActive?: boolean;
}

export interface TestFeedRequest {
  feedUrl: string;
}

export interface TestFeedResponse {
  success: boolean;
  feed: {
    title: string | undefined;
    description: string | undefined;
    itemCount: number;
  };
  items: ParsedFeedItem[];
  error?: string;
}

export interface FeedListResponse {
  success: boolean;
  feeds: RssFeedSource[];
}

export interface FeedDetailResponse {
  success: boolean;
  feed: RssFeedSource;
  recentItems: RssFeedItem[];
}

// ============================================================================
// Processing Types
// ============================================================================

export interface ProcessFeedResult {
  feedId: string;
  feedName: string;
  itemsDiscovered: number;
  itemsScheduled: number;
  itemsSkipped: number;
  itemsFailed: number;
  errors: string[];
}

export interface ProcessAllFeedsResult {
  processed: number;
  skipped: number;
  errors: number;
  results: ProcessFeedResult[];
}

// ============================================================================
// Constants
// ============================================================================

export const RSS_LIMITS = {
  MAX_FEEDS_PER_ACCOUNT: 3,
  MAX_POSTS_PER_DAY: 10,
  MIN_POLLING_INTERVAL_MINUTES: 15,
  MAX_CONTENT_LENGTH_GBP: 1500,
  MAX_CONTENT_LENGTH_BLUESKY: 300,
  MAX_IMAGES_BLUESKY: 4,
} as const;

export const RSS_CREDITS = {
  COST_PER_POST: 1,
  FEATURE_NAME: 'rss_auto_post',
} as const;
