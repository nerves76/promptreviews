/**
 * POST /api/review-import/gbp-search
 *
 * Fetches GBP reviews for a location and returns a preview (no DB writes, no credits).
 * Uses the user's own OAuth connection — no DataForSEO, no credit cost.
 *
 * Body: { locationId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import { normalizeGbpReview } from '@/features/review-import/utils/normalize-gbp-review';
import type { NormalizedReview, PreviewReview } from '@/features/review-import/types';
import { decryptGbpToken } from '@/lib/crypto/gbpTokenHelpers';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body = await request.json();
    const { locationId } = body as { locationId: string };

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    // Get GBP tokens for this account
    const { data: gbpProfile, error: gbpError } = await supabase
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at')
      .eq('account_id', accountId)
      .maybeSingle();

    if (gbpError || !gbpProfile) {
      return NextResponse.json(
        { error: 'Google Business Profile not connected. Please connect it in Integrations.' },
        { status: 400 }
      );
    }

    // Create GBP client and fetch reviews (decrypt tokens from DB)
    const client = new GoogleBusinessProfileClient({
      accessToken: decryptGbpToken(gbpProfile.access_token),
      refreshToken: decryptGbpToken(gbpProfile.refresh_token),
      expiresAt: new Date(gbpProfile.expires_at).getTime(),
      accountId,
    });

    let rawReviews: any[];
    try {
      rawReviews = await client.getReviews(locationId);
    } catch (fetchError: any) {
      const msg = fetchError.message || '';
      if (msg.includes('GOOGLE_REAUTH_REQUIRED') || msg.includes('401')) {
        return NextResponse.json(
          { error: 'Your Google connection has expired. Please reconnect in Integrations.' },
          { status: 401 }
        );
      }
      throw fetchError;
    }

    if (!rawReviews || rawReviews.length === 0) {
      return NextResponse.json({
        success: true,
        reviews: [],
        totalFetched: 0,
        newCount: 0,
        duplicateCount: 0,
        estimatedCost: 0,
        errors: [],
      });
    }

    // Normalize reviews
    const normalizedReviews: NormalizedReview[] = [];
    const normalizeErrors: string[] = [];

    for (const raw of rawReviews) {
      try {
        const normalized = normalizeGbpReview(raw);
        if (normalized.externalReviewId) {
          normalizedReviews.push(normalized);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to normalize review';
        normalizeErrors.push(msg);
        console.error('[gbp-search] Normalization error:', err);
      }
    }

    // Dedup against existing reviews (external_platform = 'google' matches backfill)
    const { data: existingRows } = await supabase
      .from('review_submissions')
      .select('external_review_id')
      .eq('account_id', accountId)
      .eq('external_platform', 'google')
      .not('external_review_id', 'is', null);

    const existingIds = new Set(
      (existingRows || [])
        .map((r: { external_review_id: string | null }) => r.external_review_id || '')
        .filter(Boolean)
    );

    // Tag each review as new/duplicate
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

    return NextResponse.json({
      success: true,
      reviews: previewReviews,
      totalFetched: normalizedReviews.length,
      newCount,
      duplicateCount: normalizedReviews.length - newCount,
      estimatedCost: 0,
      errors: normalizeErrors,
    });
  } catch (error) {
    console.error('[review-import/gbp-search] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch GBP reviews' },
      { status: 500 }
    );
  }
}
