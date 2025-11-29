import type { SupabaseClient } from '@supabase/supabase-js';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { KeywordMatchService } from '@/features/keywords/keywordMatchService';
import { findBestMatch } from '@/utils/reviewVerification';

type SupabaseServiceClient = SupabaseClient<any, 'public', any>;

export type ReviewImportType = 'all' | 'new';

export interface SyncedReviewRecord {
  reviewSubmissionId: string;
  googleReviewId: string;
  reviewerName: string;
  reviewText: string;
  starRating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  submittedAt: string;
  locationId: string;
  locationName?: string;
  googleBusinessLocationId?: string | null;
  accountId: string;
}

export interface LocationSyncResult {
  locationId: string;
  locationName?: string;
  googleReviews: any[];
  importedCount: number;
  skippedCount: number;
  verifiedCount: number;
  errors: string[];
  normalizedReviews: SyncedReviewRecord[];
}

interface ReviewSyncContext {
  accountId: string;
  businessId: string;
  defaultPromptPageId?: string | null;
}

interface SyncLocationOptions {
  locationId: string;
  locationName?: string;
  googleBusinessLocationId?: string | null;
  importType?: ReviewImportType;
  afterInsert?: (records: SyncedReviewRecord[]) => Promise<void> | void;
}

export class GoogleReviewSyncService {
  private existingGoogleReviewIds: Set<string> | null = null;

  constructor(
    private readonly supabase: SupabaseServiceClient,
    private readonly client: GoogleBusinessProfileClient,
    private readonly context: ReviewSyncContext,
    private readonly keywordMatcher?: KeywordMatchService
  ) {}

  /**
   * Ensures we only fetch the google_review_id list once per service instance
   */
  private async getExistingReviewIds(): Promise<Set<string>> {
    if (this.existingGoogleReviewIds) {
      console.log(`📋 Using cached existing review IDs (${this.existingGoogleReviewIds.size} IDs) for account ${this.context.accountId}`);
      return this.existingGoogleReviewIds;
    }

    console.log(`🔍 Checking existing reviews for account ${this.context.accountId}`);
    console.log(`🔍 Query params: account_id=${this.context.accountId}, platform='Google Business Profile', imported_from_google=true`);

    // Debug: Check total Google reviews across ALL accounts (should be more than per-account)
    const { data: allData, error: allError } = await this.supabase
      .from('review_submissions')
      .select('google_review_id, account_id')
      .eq('platform', 'Google Business Profile')
      .eq('imported_from_google', true)
      .not('google_review_id', 'is', null)
      .limit(100);

    if (!allError && allData) {
      const accountCounts = allData.reduce((acc: Record<string, number>, row: any) => {
        acc[row.account_id] = (acc[row.account_id] || 0) + 1;
        return acc;
      }, {});
      console.log(`🔍 DEBUG: Total Google reviews across accounts:`, accountCounts);
    }

    const { data, error } = await this.supabase
      .from('review_submissions')
      .select('google_review_id')
      .eq('account_id', this.context.accountId)
      .eq('platform', 'Google Business Profile')
      .eq('imported_from_google', true)
      .not('google_review_id', 'is', null);

    if (error) {
      console.error('❌ Failed to load existing Google review IDs:', error);
      this.existingGoogleReviewIds = new Set();
      return this.existingGoogleReviewIds;
    }

    console.log(`📊 Raw query result: ${data?.length || 0} rows returned`);

    const ids = new Set(
      (data || [])
        .map((row: { google_review_id: string | null }) => row.google_review_id || '')
        .filter(Boolean),
    );

    console.log(`📊 Found ${ids.size} existing Google review IDs for account ${this.context.accountId}`);
    if (ids.size > 0 && ids.size <= 5) {
      console.log(`📊 Existing IDs: ${Array.from(ids).join(', ')}`);
    } else if (ids.size > 5) {
      console.log(`📊 First 5 existing IDs: ${Array.from(ids).slice(0, 5).join(', ')}...`);
    }

    this.existingGoogleReviewIds = ids;
    return ids;
  }

  private mapStarRating(rawRating: string | number | undefined): number {
    if (typeof rawRating === 'number') {
      return rawRating;
    }

    if (typeof rawRating === 'string') {
      const map: Record<string, number> = {
        FIVE: 5,
        FOUR: 4,
        THREE: 3,
        TWO: 2,
        ONE: 1,
      };
      return map[rawRating] || 0;
    }

    return 0;
  }

  private mapSentiment(starRating: number): 'positive' | 'neutral' | 'negative' {
    if (starRating <= 2) return 'negative';
    if (starRating === 3) return 'neutral';
    return 'positive';
  }

  /**
   * Syncs a single GBP location by fetching reviews, inserting missing ones, and
   * returning both normalized records and the raw Google reviews for downstream use.
   */
  async syncLocation(options: SyncLocationOptions): Promise<LocationSyncResult> {
    const { locationId, locationName, googleBusinessLocationId, importType = 'new', afterInsert } = options;
    console.log(`🔄 Syncing Google reviews for location ${locationId} (type=${importType})`);

    const googleReviews = await this.client.getReviews(locationId);
    if (!googleReviews || googleReviews.length === 0) {
      console.log(`ℹ️ No Google reviews returned for location ${locationId}`);
      return {
        locationId,
        locationName,
        googleReviews: [],
        importedCount: 0,
        skippedCount: 0,
        verifiedCount: 0,
        errors: [],
        normalizedReviews: [],
      };
    }

    const existingIds = await this.getExistingReviewIds();
    const normalized: SyncedReviewRecord[] = [];
    const errors: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;
    let verifiedCount = 0;

    // Log the Google review IDs we're about to process
    const incomingIds = googleReviews.map((r: any) => r.reviewId).filter(Boolean);
    console.log(`📥 Processing ${googleReviews.length} reviews from Google`);
    if (incomingIds.length <= 5) {
      console.log(`📥 Incoming review IDs: ${incomingIds.join(', ')}`);
    } else {
      console.log(`📥 First 5 incoming review IDs: ${incomingIds.slice(0, 5).join(', ')}...`);
    }

    for (const review of googleReviews) {
      try {
        const googleReviewId = review.reviewId as string | undefined;
        if (!googleReviewId) {
          errors.push('Review missing google review ID, skipping.');
          continue;
        }

        if (existingIds.has(googleReviewId)) {
          skippedCount++;
          continue;
        }

        const reviewerName = review.reviewer?.displayName || 'Google User';
        const reviewText = review.comment || '';
        const starRating = this.mapStarRating(review.starRating);
        const sentiment = this.mapSentiment(starRating);
        const createTime = review.createTime || new Date().toISOString();

        const { data: contact, error: contactError } = await this.supabase
          .from('contacts')
          .insert({
            account_id: this.context.accountId,
            first_name: 'Google User',
            last_name: '',
            google_reviewer_name: reviewerName,
            email: '',
            phone: '',
            notes: `Contact created from Google review import${locationName ? ` (${locationName})` : ''}`,
            created_at: new Date().toISOString(),
            imported_from_google: true,
          })
          .select('id')
          .single();

        if (contactError || !contact) {
          console.error('❌ Failed to create contact for Google review:', contactError);
          errors.push(`Failed to create contact for ${reviewerName}: ${contactError?.message || 'Unknown error'}`);
          skippedCount++;
          continue;
        }

        const { data: insertedReview, error: reviewError } = await this.supabase
          .from('review_submissions')
          .insert({
            account_id: this.context.accountId,
            prompt_page_id: this.context.defaultPromptPageId ?? null,
            business_id: this.context.businessId,
            contact_id: contact.id,
            first_name: reviewerName,
            last_name: '',
            reviewer_name: reviewerName,
            review_content: reviewText,
            review_text_copy: reviewText,
            platform: 'Google Business Profile',
            star_rating: starRating,
            emoji_sentiment_selection: sentiment,
            review_type: 'review',
            created_at: createTime,
            submitted_at: createTime,
            google_review_id: googleReviewId,
            imported_from_google: true,
            verified: true,
            verified_at: createTime,
            status: 'submitted',
            google_location_id: locationId,
            google_location_name: locationName ?? null,
            google_business_location_id: googleBusinessLocationId ?? null,
            location_name: locationName ?? null
          })
          .select('id, created_at, google_review_id, review_content')
          .single();

        if (reviewError || !insertedReview) {
          if (reviewError?.code === '23505') {
            console.log(`⏭️ Review ${googleReviewId} already exists (duplicate key), skipping`);
            skippedCount++;
            existingIds.add(googleReviewId);
            continue;
          }
          console.error('❌ Failed to insert review submission:', {
            error: reviewError,
            code: reviewError?.code,
            message: reviewError?.message,
            details: reviewError?.details,
            googleReviewId,
            accountId: this.context.accountId
          });
          errors.push(`Failed to insert review ${googleReviewId}: ${reviewError?.message || 'Unknown error'}`);
          skippedCount++;
          continue;
        }

        importedCount++;
        existingIds.add(googleReviewId);
        normalized.push({
          reviewSubmissionId: insertedReview.id,
          googleReviewId,
          reviewerName,
          reviewText,
          starRating,
          sentiment,
          submittedAt: insertedReview.created_at || createTime,
          locationId,
          locationName,
          googleBusinessLocationId: googleBusinessLocationId ?? null,
          accountId: this.context.accountId
        });
      } catch (error: any) {
        console.error(`❌ Unexpected error syncing review for location ${locationId}:`, error);
        errors.push(error?.message || 'Unexpected error during sync');
        skippedCount++;
      }
    }

    if (normalized.length > 0) {
      if (afterInsert) {
        try {
          await afterInsert(normalized);
        } catch (hookError) {
          console.error('⚠️ Post-insert hook failed for Google review sync:', hookError);
        }
      }

      if (this.keywordMatcher) {
        try {
          await this.keywordMatcher.process(normalized);
        } catch (keywordError) {
          console.error('⚠️ Keyword matcher failed after review sync:', keywordError);
        }
      }

      // Auto-verify pending Prompt Page submissions against newly imported reviews
      try {
        verifiedCount = await this.verifyPendingSubmissions(googleReviews);
      } catch (verifyError) {
        console.error('⚠️ Auto-verification failed after review sync:', verifyError);
      }
    }

    console.log(
      `✅ Sync complete for ${locationId}: ${importedCount} imported, ${skippedCount} skipped, ${verifiedCount} verified, ${errors.length} errors`,
    );

    return {
      locationId,
      locationName,
      googleReviews,
      importedCount,
      skippedCount,
      verifiedCount,
      errors,
      normalizedReviews: normalized,
    };
  }

  /**
   * Verifies pending Prompt Page submissions against imported Google reviews.
   * Called automatically after importing Google reviews.
   * This is the best practice approach - verify at import time, not via cron.
   * Returns the number of submissions that were verified.
   */
  private async verifyPendingSubmissions(googleReviews: any[]): Promise<number> {
    if (!googleReviews || googleReviews.length === 0) {
      return 0;
    }

    // Find pending submissions for this account that need verification
    const { data: pendingSubmissions, error: fetchError } = await this.supabase
      .from('review_submissions')
      .select('id, first_name, last_name, review_text_copy, submitted_at, verification_attempts')
      .eq('account_id', this.context.accountId)
      .eq('platform', 'Google Business Profile')
      .eq('auto_verification_status', 'pending')
      .eq('imported_from_google', false) // Only Prompt Page submissions
      .not('review_text_copy', 'is', null)
      .lt('verification_attempts', 5);

    if (fetchError || !pendingSubmissions || pendingSubmissions.length === 0) {
      return 0;
    }

    console.log(`🔍 Checking ${pendingSubmissions.length} pending submissions against ${googleReviews.length} Google reviews`);

    let verifiedCount = 0;

    for (const submission of pendingSubmissions) {
      const reviewerName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim();

      if (!reviewerName || !submission.review_text_copy) {
        continue;
      }

      const matchResult = findBestMatch(
        {
          reviewerName,
          reviewText: submission.review_text_copy,
          submittedDate: new Date(submission.submitted_at),
        },
        googleReviews
      );

      if (matchResult && matchResult.isMatch) {
        const { error: updateError } = await this.supabase
          .from('review_submissions')
          .update({
            auto_verification_status: 'verified',
            auto_verified_at: new Date().toISOString(),
            verified: true,
            verified_at: new Date().toISOString(),
            google_review_id: matchResult.googleReviewId,
            verification_match_score: matchResult.score,
            star_rating: matchResult.starRating,
            last_verification_attempt_at: new Date().toISOString(),
          })
          .eq('id', submission.id);

        if (!updateError) {
          verifiedCount++;
          console.log(`✅ Auto-verified submission ${submission.id} (score: ${matchResult.score})`);
        }
      }
    }

    if (verifiedCount > 0) {
      console.log(`🎉 Auto-verified ${verifiedCount} Prompt Page submissions`);
    }

    return verifiedCount;
  }
}

export async function ensureBusinessForAccount(
  supabase: SupabaseServiceClient,
  accountId: string,
): Promise<{ id: string; name: string }> {
  const { data: existingBusiness, error: fetchError } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('account_id', accountId)
    .limit(1)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch business for account ${accountId}: ${fetchError.message}`);
  }

  if (existingBusiness) {
    return existingBusiness;
  }

  const { data: newBusiness, error: insertError } = await supabase
    .from('businesses')
    .insert({
      account_id: accountId,
      name: 'My Business',
      created_at: new Date().toISOString(),
    })
    .select('id, name')
    .single();

  if (insertError || !newBusiness) {
    throw new Error(`Failed to create business record for account ${accountId}: ${insertError?.message || 'Unknown error'}`);
  }

  return newBusiness;
}
