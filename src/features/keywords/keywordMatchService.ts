import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncedReviewRecord } from '@/features/google-reviews/reviewSyncService';
import { normalizePhrase, escapeRegex } from './keywordUtils';

type SupabaseServiceClient = SupabaseClient<any, 'public', any>;

/**
 * Loaded keyword from the unified keywords table.
 * Unlike the old system, the new unified system has simpler scoping:
 * - Keywords are account-wide
 * - Association to specific prompt pages is via keyword_prompt_page_usage junction table
 * - No more keyword_set_locations scope; keywords match any review in the account
 */
type LoadedKeyword = {
  id: string;
  phrase: string;
  normalized: string;
  wordCount: number;
  status: 'active' | 'paused';
  aliases: string[];
};

/**
 * Match result indicating how a keyword was found in review text.
 * - 'exact': Matched the normalized_phrase directly (affects rotation)
 * - 'alias': Matched one of the aliases (SEO tracking only, no rotation impact)
 */
type MatchType = 'exact' | 'alias';

/**
 * KeywordMatchService - Unified Keyword Matching
 *
 * Matches keywords from the unified `keywords` table against review text.
 * Uses word-boundary regex matching for accuracy.
 *
 * This service is used during:
 * - Google review sync (real-time matching)
 * - Review reprocessing (batch matching)
 *
 * Usage count updates are handled separately via batch job to avoid
 * transaction overhead during sync operations.
 */
export class KeywordMatchService {
  private keywords: LoadedKeyword[] | null = null;

  constructor(
    private readonly supabase: SupabaseServiceClient,
    private readonly accountId: string
  ) {}

  /**
   * Load active keywords for this account.
   * Results are cached for the lifetime of this service instance.
   */
  private async loadKeywords(): Promise<LoadedKeyword[]> {
    if (this.keywords) {
      return this.keywords;
    }

    const { data, error } = await this.supabase
      .from('keywords')
      .select(`
        id,
        phrase,
        normalized_phrase,
        word_count,
        status,
        aliases
      `)
      .eq('account_id', this.accountId)
      .eq('status', 'active');

    if (error) {
      console.error('❌ Failed to load keywords:', error);
      this.keywords = [];
      return this.keywords;
    }

    this.keywords = (data || []).map((kw) => ({
      id: kw.id,
      phrase: kw.phrase,
      normalized: kw.normalized_phrase,
      wordCount: kw.word_count,
      status: kw.status as 'active' | 'paused',
      aliases: (kw.aliases || []).map((a: string) => normalizePhrase(a)),
    }));

    return this.keywords;
  }

  /**
   * Check if text matches a keyword (exact or alias).
   * Returns the match type if found, null otherwise.
   */
  private matchKeyword(keyword: LoadedKeyword, text: string): { type: MatchType; matchedPhrase: string } | null {
    // Check exact match first
    const exactRegex = new RegExp(`\\b${escapeRegex(keyword.normalized)}\\b`, 'i');
    if (exactRegex.test(text)) {
      return { type: 'exact', matchedPhrase: keyword.phrase };
    }

    // Check aliases
    for (const alias of keyword.aliases) {
      const aliasRegex = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
      if (aliasRegex.test(text)) {
        return { type: 'alias', matchedPhrase: alias };
      }
    }

    return null;
  }

  /**
   * Process a batch of synced reviews and find keyword matches.
   *
   * For each review:
   * 1. Normalizes the review text
   * 2. Tests each active keyword (exact phrase and aliases) using word-boundary regex
   * 3. Inserts matches into keyword_review_matches_v2 with match_type
   *
   * Note: This does NOT update usage counts. That is handled by
   * a separate batch job to keep sync operations fast.
   *
   * @param records - Array of synced review records to process
   */
  async process(records: SyncedReviewRecord[]): Promise<void> {
    if (!records.length) return;

    const keywords = await this.loadKeywords();
    if (!keywords.length) return;

    const inserts: {
      keyword_id: string;
      review_submission_id: string | null;
      google_review_id: string | null;
      account_id: string;
      google_business_location_id: string | null;
      matched_phrase: string;
      match_type: MatchType;
      matched_at: string;
    }[] = [];

    for (const record of records) {
      const body = (record.reviewText || '').toLowerCase();
      if (!body) continue;

      for (const keyword of keywords) {
        const match = this.matchKeyword(keyword, body);
        if (!match) continue;

        inserts.push({
          keyword_id: keyword.id,
          review_submission_id: record.reviewSubmissionId || null,
          google_review_id: record.googleReviewId || null,
          account_id: record.accountId,
          google_business_location_id: record.googleBusinessLocationId || null,
          matched_phrase: match.matchedPhrase,
          match_type: match.type,
          matched_at: new Date().toISOString(),
        });
      }
    }

    if (!inserts.length) return;

    // Split inserts by type - each has a different unique constraint
    const submissionInserts = inserts.filter(i => i.review_submission_id !== null);
    const googleInserts = inserts.filter(i => i.google_review_id !== null && i.review_submission_id === null);

    // Upsert submission-based matches
    if (submissionInserts.length > 0) {
      const { error } = await this.supabase
        .from('keyword_review_matches_v2')
        .upsert(submissionInserts, {
          onConflict: 'keyword_id,review_submission_id',
          ignoreDuplicates: true,
        });

      if (error) {
        console.error('❌ Failed to upsert submission keyword matches:', error);
      }
    }

    // Upsert Google review-based matches
    if (googleInserts.length > 0) {
      const { error } = await this.supabase
        .from('keyword_review_matches_v2')
        .upsert(googleInserts, {
          onConflict: 'keyword_id,google_review_id',
          ignoreDuplicates: true,
        });

      if (error) {
        console.error('❌ Failed to upsert Google review keyword matches:', error);
      }
    }
  }

  /**
   * Process a single review submission (not a Google review).
   * This is used when processing reviews submitted through prompt pages.
   *
   * @param reviewSubmissionId - The review_submissions.id
   * @param reviewContent - The text content of the review
   * @returns Array of matched keyword IDs (both exact and alias matches)
   */
  async processSubmission(
    reviewSubmissionId: string,
    reviewContent: string
  ): Promise<string[]> {
    const keywords = await this.loadKeywords();
    if (!keywords.length) return [];

    const body = (reviewContent || '').toLowerCase();
    if (!body) return [];

    const matchedKeywordIds: string[] = [];
    const inserts: {
      keyword_id: string;
      review_submission_id: string;
      google_review_id: null;
      account_id: string;
      google_business_location_id: null;
      matched_phrase: string;
      match_type: MatchType;
      matched_at: string;
    }[] = [];

    for (const keyword of keywords) {
      const match = this.matchKeyword(keyword, body);
      if (!match) continue;

      matchedKeywordIds.push(keyword.id);
      inserts.push({
        keyword_id: keyword.id,
        review_submission_id: reviewSubmissionId,
        google_review_id: null,
        account_id: this.accountId,
        google_business_location_id: null,
        matched_phrase: match.matchedPhrase,
        match_type: match.type,
        matched_at: new Date().toISOString(),
      });
    }

    if (inserts.length > 0) {
      const { error } = await this.supabase
        .from('keyword_review_matches_v2')
        .upsert(inserts, {
          onConflict: 'keyword_id,review_submission_id',
          ignoreDuplicates: true,
        });

      if (error) {
        console.error('❌ Failed to upsert keyword matches for submission:', error);
      }
    }

    return matchedKeywordIds;
  }

  /**
   * Get all keyword IDs that match the given text.
   * Does not persist matches - useful for preview/testing.
   *
   * @param text - The text to search for keywords
   * @returns Array of keyword objects that match (includes both exact and alias matches)
   */
  async findMatchesInText(text: string): Promise<LoadedKeyword[]> {
    const keywords = await this.loadKeywords();
    if (!keywords.length || !text) return [];

    const body = text.toLowerCase();
    const matches: LoadedKeyword[] = [];

    for (const keyword of keywords) {
      const match = this.matchKeyword(keyword, body);
      if (match) {
        matches.push(keyword);
      }
    }

    return matches;
  }

  /**
   * Get detailed match information for text.
   * Useful for debugging or displaying which phrase matched.
   *
   * @param text - The text to search for keywords
   * @returns Array of match details including match type
   */
  async findDetailedMatchesInText(text: string): Promise<Array<{
    keyword: LoadedKeyword;
    matchType: MatchType;
    matchedPhrase: string;
  }>> {
    const keywords = await this.loadKeywords();
    if (!keywords.length || !text) return [];

    const body = text.toLowerCase();
    const matches: Array<{
      keyword: LoadedKeyword;
      matchType: MatchType;
      matchedPhrase: string;
    }> = [];

    for (const keyword of keywords) {
      const match = this.matchKeyword(keyword, body);
      if (match) {
        matches.push({
          keyword,
          matchType: match.type,
          matchedPhrase: match.matchedPhrase,
        });
      }
    }

    return matches;
  }
}
