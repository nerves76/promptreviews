/**
 * Multi-platform review import via DataForSEO
 */

export type {
  ReviewPlatformId,
  DataForSEOPlatformId,
  NormalizedReview,
  PlatformSearchInput,
  SearchFieldConfig,
  ReviewPlatformAdapter,
  ImportResult,
  PreviewReview,
  SearchPreviewResult,
} from './types';

export { getAdapter, getSupportedPlatforms } from './adapters';
export { fetchReviews } from './api/dataforseo-reviews-client';
export { ReviewImportService } from './services/review-import-service';
