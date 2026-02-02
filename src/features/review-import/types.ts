/**
 * Types for multi-platform review import via DataForSEO
 */

/** Platforms that use the DataForSEO API */
export type DataForSEOPlatformId = 'trustpilot' | 'tripadvisor' | 'google_play' | 'app_store';

/** All supported review import platforms */
export type ReviewPlatformId = DataForSEOPlatformId | 'google_business_profile';

export interface NormalizedReview {
  externalReviewId: string;
  externalPlatform: ReviewPlatformId | 'google';
  reviewerName: string;
  reviewerUrl?: string | null;
  reviewerImageUrl?: string | null;
  reviewContent: string;
  starRating: number; // 1-5
  sentiment: 'positive' | 'neutral' | 'negative';
  reviewDate: string; // ISO 8601
  platformDisplayName: string; // "Google Business Profile", "Trustpilot", "TripAdvisor"
  title?: string; // Trustpilot/TripAdvisor have review titles
  ownerResponse?: string | null;
}

export interface PlatformSearchInput {
  keyword?: string; // TripAdvisor: business name search
  domain?: string; // Trustpilot: domain on trustpilot.com
  urlPath?: string; // TripAdvisor: URL path
  appId?: string; // Google Play / App Store: app identifier
  locationId?: string; // Google Business Profile: location ID
  depth?: number; // Number of reviews to fetch
  sortBy?: string;
  languageCode?: string;
  locationCode?: number;
}

export interface SearchFieldConfig {
  key: keyof PlatformSearchInput;
  label: string;
  placeholder: string;
  required: boolean;
  helpText?: string;
}

export interface ReviewPlatformAdapter {
  platformId: DataForSEOPlatformId;
  platformDisplayName: string;
  normalize(rawReview: Record<string, any>): NormalizedReview;
  getSearchFields(): SearchFieldConfig[];
  validateInput(input: PlatformSearchInput): string | null; // null = valid
  buildTaskPayload(input: PlatformSearchInput): Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  totalFetched: number;
  cost: number;
  errors: string[];
  error?: string;
}

export interface PreviewReview extends NormalizedReview {
  isNew: boolean;
}

export interface SearchPreviewResult {
  success: boolean;
  reviews: PreviewReview[];
  totalFetched: number;
  newCount: number;
  duplicateCount: number;
  estimatedCost: number;
  error?: string;
  errors: string[];
}
