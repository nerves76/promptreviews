/**
 * POST /api/review-import/search
 *
 * Search and preview reviews from a platform via DataForSEO.
 * Returns reviews tagged as new/duplicate without importing or charging credits.
 *
 * Body: { platformId, searchInput, depth? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { ReviewImportService } from '@/features/review-import/services/review-import-service';
import { getAdapter } from '@/features/review-import/adapters';
import { getBalance } from '@/lib/credits/service';
import type { DataForSEOPlatformId, PlatformSearchInput } from '@/features/review-import/types';

export const maxDuration = 60;

const CREDIT_COSTS: Record<DataForSEOPlatformId, { perReviews: number; creditCost: number }> = {
  trustpilot: { perReviews: 20, creditCost: 1 },
  tripadvisor: { perReviews: 10, creditCost: 1 },
  google_play: { perReviews: 150, creditCost: 1 },
  app_store: { perReviews: 50, creditCost: 1 },
};

const VALID_PLATFORMS: DataForSEOPlatformId[] = ['trustpilot', 'tripadvisor', 'google_play', 'app_store'];

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
    const { platformId, searchInput, depth } = body as {
      platformId: DataForSEOPlatformId;
      searchInput: PlatformSearchInput;
      depth?: number;
    };

    // Validate platform
    if (!platformId || !VALID_PLATFORMS.includes(platformId)) {
      return NextResponse.json(
        { error: `Invalid platform. Supported: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate search input exists
    if (!searchInput || typeof searchInput !== 'object') {
      return NextResponse.json(
        { error: 'searchInput is required' },
        { status: 400 }
      );
    }

    // Validate via adapter
    const adapter = getAdapter(platformId);
    const validationError = adapter.validateInput(searchInput);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Set depth
    const effectiveDepth = depth || searchInput.depth || 10;
    searchInput.depth = effectiveDepth;

    // Calculate estimated credit cost
    const pricing = CREDIT_COSTS[platformId];
    const estimatedCost = Math.max(1, Math.ceil(effectiveDepth / pricing.perReviews) * pricing.creditCost);

    // Check balance (don't debit — just ensure user has credits)
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

    // Run search/preview
    const importService = new ReviewImportService(supabase, {
      accountId,
      businessId: business.id,
    });

    const result = await importService.searchAndPreview({
      platformId,
      searchInput,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[review-import/search] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search reviews' },
      { status: 500 }
    );
  }
}
