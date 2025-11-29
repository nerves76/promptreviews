import type { SupabaseClient } from '@supabase/supabase-js';
import type { SyncedReviewRecord } from '@/features/google-reviews/reviewSyncService';

type SupabaseServiceClient = SupabaseClient<any, 'public', any>;

type LoadedKeywordTerm = {
  id: string;
  phrase: string;
  normalized: string;
  keywordSetId: string;
  scopeType: string;
  locationIds: Set<string>;
};

export class KeywordMatchService {
  private terms: LoadedKeywordTerm[] | null = null;

  constructor(
    private readonly supabase: SupabaseServiceClient,
    private readonly accountId: string
  ) {}

  private normalizePhrase(phrase: string): string {
    return phrase
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  private async loadTerms(): Promise<LoadedKeywordTerm[]> {
    if (this.terms) {
      return this.terms;
    }

    const { data, error } = await this.supabase
      .from('keyword_sets')
      .select(`
        id,
        scope_type,
        is_active,
        keyword_set_terms (
          id,
          phrase,
          normalized_phrase
        ),
        keyword_set_locations (
          google_business_location_id
        )
      `)
      .eq('account_id', this.accountId)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Failed to load keyword sets:', error);
      this.terms = [];
      return this.terms;
    }

    const flattened: LoadedKeywordTerm[] = [];
    for (const set of data || []) {
      const scopeType = set.scope_type || 'account';
      const locationIds = new Set<string>(
        (set.keyword_set_locations || [])
          .map((loc: { google_business_location_id: string | null }) => loc?.google_business_location_id)
          .filter(Boolean)
      );

      for (const term of set.keyword_set_terms || []) {
        const normalized = term.normalized_phrase
          ? term.normalized_phrase
          : this.normalizePhrase(term.phrase || '');
        if (!term.phrase || !normalized) continue;

        flattened.push({
          id: term.id,
          phrase: term.phrase,
          normalized,
          keywordSetId: set.id,
          scopeType,
          locationIds
        });
      }
    }

    this.terms = flattened;
    return this.terms;
  }

  private appliesToLocation(term: LoadedKeywordTerm, googleBusinessLocationId?: string | null): boolean {
    if (!googleBusinessLocationId) {
      return term.scopeType === 'account';
    }

    if (term.scopeType === 'selected') {
      return term.locationIds.has(googleBusinessLocationId);
    }

    return true;
  }

  async process(records: SyncedReviewRecord[]): Promise<void> {
    if (!records.length) return;

    const terms = await this.loadTerms();
    if (!terms.length) return;

    const inserts: any[] = [];

    const escapeRegex = (text: string) =>
      text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const record of records) {
      const body = (record.reviewText || '').toLowerCase();
      if (!body) continue;

      for (const term of terms) {
        if (!this.appliesToLocation(term, record.googleBusinessLocationId)) continue;
        const regex = new RegExp(`\\b${escapeRegex(term.normalized)}\\b`, 'i');
        if (!regex.test(body)) continue;

        inserts.push({
          review_id: record.reviewSubmissionId,
          keyword_term_id: term.id,
          keyword_set_id: term.keywordSetId,
          account_id: record.accountId,
          google_business_location_id: record.googleBusinessLocationId || null,
          google_location_id: record.locationId || null,
          google_location_name: record.locationName || null,
          matched_phrase: term.phrase,
          matched_at: new Date().toISOString()
        });
      }
    }

    if (!inserts.length) return;

    const { error } = await this.supabase
      .from('review_keyword_matches')
      .upsert(inserts, { onConflict: 'review_id,keyword_term_id' });

    if (error) {
      console.error('❌ Failed to upsert review keyword matches:', error);
    }
  }
}
