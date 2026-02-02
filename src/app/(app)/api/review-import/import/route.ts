/**
 * POST /api/review-import/import
 *
 * Import reviews from a platform via DataForSEO.
 * Handles auth, account isolation, credit checking, and import orchestration.
 *
 * Two modes:
 * 1. Pre-fetched: Body has `reviews` array (from search/preview) → confirmImport()
 * 2. Legacy: Body has `searchInput` but no `reviews` → full importReviews() flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { ReviewImportService } from '@/features/review-import/services/review-import-service';
import { getAdapter } from '@/features/review-import/adapters';
import { getBalance, debit } from '@/lib/credits/service';
import { InsufficientCreditsError } from '@/lib/credits/types';
import type { DataForSEOPlatformId, PlatformSearchInput, NormalizedReview } from '@/features/review-import/types';
import { sendNotificationToAccount } from '@/utils/notifications';

// Credit cost per unit of reviews fetched (DataForSEO platforms only)
const CREDIT_COSTS: Record<DataForSEOPlatformId, { perReviews: number; creditCost: number }> = {
  trustpilot: { perReviews: 20, creditCost: 1 },
  tripadvisor: { perReviews: 10, creditCost: 1 },
  google_play: { perReviews: 150, creditCost: 1 },
  app_store: { perReviews: 50, creditCost: 1 },
};

const VALID_PLATFORMS: DataForSEOPlatformId[] = ['trustpilot', 'tripadvisor', 'google_play', 'app_store'];

const VALID_SENTIMENTS = ['positive', 'neutral', 'negative'];

/**
 * Validate a single review object from the client.
 * Returns an error string or null if valid.
 */
function validateReviewObject(review: Record<string, unknown>, platformId: string): string | null {
  if (!review.externalReviewId || typeof review.externalReviewId !== 'string') {
    return 'externalReviewId is required and must be a string';
  }
  if (review.externalPlatform !== platformId) {
    return `externalPlatform must match platformId "${platformId}"`;
  }
  if (!review.reviewerName || typeof review.reviewerName !== 'string') {
    return 'reviewerName is required';
  }
  if (typeof review.starRating !== 'number' || review.starRating < 1 || review.starRating > 5) {
    return 'starRating must be a number between 1 and 5';
  }
  if (typeof review.reviewContent !== 'string') {
    return 'reviewContent must be a string';
  }
  if (!review.sentiment || !VALID_SENTIMENTS.includes(review.sentiment as string)) {
    return 'sentiment must be "positive", "neutral", or "negative"';
  }
  if (!review.reviewDate || typeof review.reviewDate !== 'string') {
    return 'reviewDate is required';
  }
  if (!review.platformDisplayName || typeof review.platformDisplayName !== 'string') {
    return 'platformDisplayName is required';
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Account isolation
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { platformId, searchInput, depth, reviews } = body as {
      platformId: DataForSEOPlatformId;
      searchInput?: PlatformSearchInput;
      depth?: number;
      reviews?: NormalizedReview[];
    };

    // Validate platform
    if (!platformId || !VALID_PLATFORMS.includes(platformId)) {
      return NextResponse.json(
        { error: `Invalid platform. Supported: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      );
    }

    const adapter = getAdapter(platformId);
    const pricing = CREDIT_COSTS[platformId];

    // Get business for account
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'No business found for this account. Please set up your business profile first.' },
        { status: 400 }
      );
    }

    const importService = new ReviewImportService(supabase, {
      accountId,
      businessId: business.id,
    });

    // --- Mode 1: Pre-fetched reviews from search/preview ---
    if (Array.isArray(reviews)) {
      if (reviews.length === 0) {
        return NextResponse.json({
          success: true,
          importedCount: 0,
          skippedCount: 0,
          totalFetched: 0,
          cost: 0,
          errors: [],
        });
      }

      // Validate each review object
      for (let i = 0; i < reviews.length; i++) {
        const validationError = validateReviewObject(reviews[i] as unknown as Record<string, unknown>, platformId);
        if (validationError) {
          return NextResponse.json(
            { error: `Invalid review at index ${i}: ${validationError}` },
            { status: 400 }
          );
        }
      }

      // Calculate cost based on number of reviews being imported
      const importCost = Math.max(1, Math.ceil(reviews.length / pricing.perReviews) * pricing.creditCost);

      // Check balance
      const balance = await getBalance(supabase, accountId);
      if (balance.totalCredits < importCost) {
        return NextResponse.json(
          {
            error: `Insufficient credits. Required: ${importCost}, available: ${balance.totalCredits}`,
            required: importCost,
            available: balance.totalCredits,
          },
          { status: 402 }
        );
      }

      const result = await importService.confirmImport({
        platformId,
        reviews,
      });

      // Debit credits based on actual imported count
      if (result.importedCount > 0) {
        const actualCost = Math.max(1, Math.ceil(result.importedCount / pricing.perReviews) * pricing.creditCost);
        const idempotencyKey = `review_import_${accountId}_${platformId}_${Date.now()}`;

        try {
          await debit(supabase, accountId, actualCost, {
            featureType: 'review_import',
            featureMetadata: {
              platform: platformId,
              totalFetched: result.totalFetched,
              importedCount: result.importedCount,
              skippedCount: result.skippedCount,
              mode: 'confirm',
            },
            idempotencyKey,
            description: `${adapter.platformDisplayName} review import (${result.importedCount} new)`,
            createdBy: user.id,
          });
          result.cost = actualCost;
        } catch (debitError) {
          if (debitError instanceof InsufficientCreditsError) {
            console.error('[review-import] Post-import credit debit failed (insufficient):', debitError);
          } else {
            console.error('[review-import] Post-import credit debit failed:', debitError);
          }
        }
      }

      // Fire-and-forget notification
      if (result.importedCount > 0) {
        sendNotificationToAccount(accountId, 'review_import_completed', {
          platform: platformId,
          platformDisplayName: adapter.platformDisplayName,
          importedCount: result.importedCount,
          skippedCount: result.skippedCount,
          totalFetched: result.totalFetched,
        }).catch((err) => console.error('[review-import] Notification error:', err));
      }

      return NextResponse.json(result);
    }

    // --- Mode 2: Legacy full import flow ---
    if (!searchInput || typeof searchInput !== 'object') {
      return NextResponse.json(
        { error: 'Either searchInput or reviews array is required' },
        { status: 400 }
      );
    }

    const validationError = adapter.validateInput(searchInput);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Set depth
    const effectiveDepth = depth || searchInput.depth || 10;
    searchInput.depth = effectiveDepth;

    // Calculate estimated credit cost
    const estimatedCost = Math.max(1, Math.ceil(effectiveDepth / pricing.perReviews) * pricing.creditCost);

    // Check balance
    const balance = await getBalance(supabase, accountId);
    if (balance.totalCredits < estimatedCost) {
      return NextResponse.json(
        {
          error: `Insufficient credits. Required: ${estimatedCost}, available: ${balance.totalCredits}`,
          required: estimatedCost,
          available: balance.totalCredits,
        },
        { status: 402 }
      );
    }

    const result = await importService.importReviews({
      platformId,
      searchInput,
    });

    // Debit credits based on actual fetched count
    if (result.totalFetched > 0) {
      const actualCost = Math.max(1, Math.ceil(result.totalFetched / pricing.perReviews) * pricing.creditCost);
      const idempotencyKey = `review_import_${accountId}_${platformId}_${Date.now()}`;

      try {
        await debit(supabase, accountId, actualCost, {
          featureType: 'review_import',
          featureMetadata: {
            platform: platformId,
            totalFetched: result.totalFetched,
            importedCount: result.importedCount,
            skippedCount: result.skippedCount,
            depth: effectiveDepth,
          },
          idempotencyKey,
          description: `${adapter.platformDisplayName} review import (${result.totalFetched} fetched, ${result.importedCount} new)`,
          createdBy: user.id,
        });
        result.cost = actualCost;
      } catch (debitError) {
        if (debitError instanceof InsufficientCreditsError) {
          console.error('[review-import] Post-import credit debit failed (insufficient):', debitError);
        } else {
          console.error('[review-import] Post-import credit debit failed:', debitError);
        }
      }
    }

    // Fire-and-forget notification
    if (result.importedCount > 0) {
      sendNotificationToAccount(accountId, 'review_import_completed', {
        platform: platformId,
        platformDisplayName: adapter.platformDisplayName,
        importedCount: result.importedCount,
        skippedCount: result.skippedCount,
        totalFetched: result.totalFetched,
      }).catch((err) => console.error('[review-import] Notification error:', err));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[review-import/import] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import reviews' },
      { status: 500 }
    );
  }
}
