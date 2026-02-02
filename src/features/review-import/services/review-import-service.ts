/**
 * Review Import Service
 *
 * Orchestrates fetching reviews from DataForSEO, normalizing them,
 * deduplicating against existing imports, and inserting into the database.
 *
 * Follows the pattern of src/features/google-reviews/reviewSyncService.ts
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataForSEOPlatformId, PlatformSearchInput, NormalizedReview, ImportResult, PreviewReview, SearchPreviewResult } from '../types';
import { getAdapter } from '../adapters';
import { fetchReviews } from '../api/dataforseo-reviews-client';

interface ReviewImportContext {
  accountId: string;
  businessId: string;
}

export class ReviewImportService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly context: ReviewImportContext
  ) {}

  /**
   * Import reviews from a platform via DataForSEO
   */
  async importReviews(params: {
    platformId: DataForSEOPlatformId;
    searchInput: PlatformSearchInput;
  }): Promise<ImportResult> {
    const { platformId, searchInput } = params;
    const adapter = getAdapter(platformId);

    // Validate input
    const validationError = adapter.validateInput(searchInput);
    if (validationError) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        totalFetched: 0,
        cost: 0,
        errors: [validationError],
        error: validationError,
      };
    }

    // Build task payload and fetch from DataForSEO
    const taskPayload = adapter.buildTaskPayload(searchInput);
    console.log(`[ReviewImport] Fetching ${platformId} reviews with payload:`, JSON.stringify(taskPayload));

    const fetchResult = await fetchReviews(platformId, taskPayload);

    if (!fetchResult.success) {
      return {
        success: false,
        importedCount: 0,
        skippedCount: 0,
        totalFetched: 0,
        cost: fetchResult.cost,
        errors: [fetchResult.error || 'Failed to fetch reviews'],
        error: fetchResult.error,
      };
    }

    if (fetchResult.items.length === 0) {
      return {
        success: true,
        importedCount: 0,
        skippedCount: 0,
        totalFetched: 0,
        cost: fetchResult.cost,
        errors: [],
      };
    }

    // Normalize all reviews
    const normalizedReviews: NormalizedReview[] = [];
    const normalizeErrors: string[] = [];

    for (const rawReview of fetchResult.items) {
      try {
        const normalized = adapter.normalize(rawReview);
        if (normalized.externalReviewId) {
          normalizedReviews.push(normalized);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to normalize review';
        normalizeErrors.push(msg);
        console.error(`[ReviewImport] Normalization error:`, err);
      }
    }

    if (normalizedReviews.length === 0) {
      return {
        success: true,
        importedCount: 0,
        skippedCount: fetchResult.items.length,
        totalFetched: fetchResult.items.length,
        cost: fetchResult.cost,
        errors: normalizeErrors,
      };
    }

    // Load existing external_review_ids for dedup
    const existingIds = await this.getExistingExternalIds(platformId);

    // Filter to new reviews only
    const newReviews = normalizedReviews.filter(
      (r) => !existingIds.has(r.externalReviewId)
    );
    const skippedCount = normalizedReviews.length - newReviews.length;

    if (newReviews.length === 0) {
      return {
        success: true,
        importedCount: 0,
        skippedCount,
        totalFetched: normalizedReviews.length,
        cost: fetchResult.cost,
        errors: normalizeErrors,
      };
    }

    // Insert new reviews
    let importedCount = 0;
    const insertErrors: string[] = [];

    for (const review of newReviews) {
      try {
        await this.insertReview(review);
        importedCount++;
        existingIds.add(review.externalReviewId);
      } catch (err) {
        // Handle duplicate key (race condition)
        if (err instanceof Error && err.message.includes('23505')) {
          existingIds.add(review.externalReviewId);
          continue;
        }
        const msg = err instanceof Error ? err.message : 'Failed to insert review';
        insertErrors.push(msg);
        console.error(`[ReviewImport] Insert error for ${review.externalReviewId}:`, err);
      }
    }

    return {
      success: true,
      importedCount,
      skippedCount: skippedCount + (newReviews.length - importedCount - insertErrors.length),
      totalFetched: normalizedReviews.length,
      cost: fetchResult.cost,
      errors: [...normalizeErrors, ...insertErrors],
    };
  }

  /**
   * Search and preview reviews without importing or charging credits.
   * Fetches from DataForSEO, normalizes, and tags each review as new or duplicate.
   */
  async searchAndPreview(params: {
    platformId: DataForSEOPlatformId;
    searchInput: PlatformSearchInput;
  }): Promise<SearchPreviewResult> {
    const { platformId, searchInput } = params;
    const adapter = getAdapter(platformId);

    // Validate input
    const validationError = adapter.validateInput(searchInput);
    if (validationError) {
      return {
        success: false,
        reviews: [],
        totalFetched: 0,
        newCount: 0,
        duplicateCount: 0,
        estimatedCost: 0,
        error: validationError,
        errors: [validationError],
      };
    }

    // Build task payload and fetch from DataForSEO
    const taskPayload = adapter.buildTaskPayload(searchInput);
    console.log(`[ReviewImport] Search/preview ${platformId} with payload:`, JSON.stringify(taskPayload));

    const fetchResult = await fetchReviews(platformId, taskPayload);

    if (!fetchResult.success) {
      return {
        success: false,
        reviews: [],
        totalFetched: 0,
        newCount: 0,
        duplicateCount: 0,
        estimatedCost: fetchResult.cost,
        error: fetchResult.error,
        errors: [fetchResult.error || 'Failed to fetch reviews'],
      };
    }

    if (fetchResult.items.length === 0) {
      return {
        success: true,
        reviews: [],
        totalFetched: 0,
        newCount: 0,
        duplicateCount: 0,
        estimatedCost: fetchResult.cost,
        errors: [],
      };
    }

    // Normalize all reviews
    const normalizedReviews: NormalizedReview[] = [];
    const normalizeErrors: string[] = [];

    for (const rawReview of fetchResult.items) {
      try {
        const normalized = adapter.normalize(rawReview);
        if (normalized.externalReviewId) {
          normalizedReviews.push(normalized);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to normalize review';
        normalizeErrors.push(msg);
        console.error(`[ReviewImport] Normalization error:`, err);
      }
    }

    // Load existing IDs for dedup (read-only)
    const existingIds = await this.getExistingExternalIds(platformId);

    // Tag each review
    const previewReviews: PreviewReview[] = normalizedReviews.map((r) => ({
      ...r,
      isNew: !existingIds.has(r.externalReviewId),
    }));

    // Sort: new reviews first
    previewReviews.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return 0;
    });

    const newCount = previewReviews.filter((r) => r.isNew).length;

    return {
      success: true,
      reviews: previewReviews,
      totalFetched: normalizedReviews.length,
      newCount,
      duplicateCount: normalizedReviews.length - newCount,
      estimatedCost: fetchResult.cost,
      errors: normalizeErrors,
    };
  }

  /**
   * Confirm import of pre-fetched reviews.
   * Re-runs dedup against DB (fresh check for race conditions),
   * then inserts only new reviews.
   */
  async confirmImport(params: {
    platformId: DataForSEOPlatformId;
    reviews: NormalizedReview[];
  }): Promise<ImportResult> {
    const { platformId, reviews } = params;

    if (reviews.length === 0) {
      return {
        success: true,
        importedCount: 0,
        skippedCount: 0,
        totalFetched: 0,
        cost: 0,
        errors: [],
      };
    }

    // Fresh dedup check
    const existingIds = await this.getExistingExternalIds(platformId);
    const newReviews = reviews.filter((r) => !existingIds.has(r.externalReviewId));
    const skippedCount = reviews.length - newReviews.length;

    if (newReviews.length === 0) {
      return {
        success: true,
        importedCount: 0,
        skippedCount,
        totalFetched: reviews.length,
        cost: 0,
        errors: [],
      };
    }

    // Insert new reviews
    let importedCount = 0;
    const insertErrors: string[] = [];

    for (const review of newReviews) {
      try {
        await this.insertReview(review);
        importedCount++;
        existingIds.add(review.externalReviewId);
      } catch (err) {
        if (err instanceof Error && err.message.includes('23505')) {
          existingIds.add(review.externalReviewId);
          continue;
        }
        const msg = err instanceof Error ? err.message : 'Failed to insert review';
        insertErrors.push(msg);
        console.error(`[ReviewImport] Insert error for ${review.externalReviewId}:`, err);
      }
    }

    return {
      success: true,
      importedCount,
      skippedCount: skippedCount + (newReviews.length - importedCount - insertErrors.length),
      totalFetched: reviews.length,
      cost: 0,
      errors: insertErrors,
    };
  }

  /**
   * Load existing external_review_ids for this account and platform
   */
  private async getExistingExternalIds(platformId: DataForSEOPlatformId): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from('review_submissions')
      .select('external_review_id')
      .eq('account_id', this.context.accountId)
      .eq('external_platform', platformId)
      .not('external_review_id', 'is', null);

    if (error) {
      console.error('[ReviewImport] Failed to load existing review IDs:', error);
      return new Set();
    }

    return new Set(
      (data || [])
        .map((row: { external_review_id: string | null }) => row.external_review_id || '')
        .filter(Boolean)
    );
  }

  /**
   * Insert a single normalized review into review_submissions
   */
  private async insertReview(review: NormalizedReview): Promise<void> {
    // Create a contact for the reviewer
    const { data: contact, error: contactError } = await this.supabase
      .from('contacts')
      .insert({
        account_id: this.context.accountId,
        first_name: review.reviewerName,
        last_name: '',
        email: '',
        phone: '',
        notes: `Contact created from ${review.platformDisplayName} review import via DataForSEO`,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (contactError || !contact) {
      console.error(`[ReviewImport] Failed to create contact for ${review.reviewerName}:`, contactError);
      throw new Error(`Failed to create contact: ${contactError?.message || 'Unknown error'}`);
    }

    // Build the review title prefix for content
    const contentWithTitle = review.title
      ? `${review.title}\n\n${review.reviewContent}`
      : review.reviewContent;

    const { error: reviewError } = await this.supabase
      .from('review_submissions')
      .insert({
        account_id: this.context.accountId,
        business_id: this.context.businessId,
        contact_id: contact.id,
        first_name: review.reviewerName,
        last_name: '',
        reviewer_name: review.reviewerName,
        review_content: contentWithTitle,
        review_text_copy: contentWithTitle,
        platform: review.platformDisplayName,
        star_rating: review.starRating,
        emoji_sentiment_selection: review.sentiment,
        review_type: 'review',
        created_at: review.reviewDate,
        submitted_at: review.reviewDate,
        external_review_id: review.externalReviewId,
        external_platform: review.externalPlatform,
        imported_from_google: false,
        verified: true,
        verified_at: review.reviewDate,
        status: 'submitted',
        source_channel: 'dataforseo_import',
      });

    if (reviewError) {
      console.error(`[ReviewImport] Failed to insert review ${review.externalReviewId}:`, reviewError);
      throw new Error(`Failed to insert review: ${reviewError.message} (code: ${reviewError.code})`);
    }
  }
}
