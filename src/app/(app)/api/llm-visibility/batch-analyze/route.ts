import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  getBalance,
  debit,
  ensureBalanceExists,
  InsufficientCreditsError,
} from '@/lib/credits';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Credit cost per analysis
const ANALYSIS_CREDIT_COST = 1;

interface BatchItem {
  key: string;
  displayName: string;
  metadata?: Record<string, any>;
}

/**
 * GET /api/llm-visibility/batch-analyze
 * Get preview of batch analysis cost and check for existing runs.
 *
 * Query params:
 * - type: 'domain' | 'competitor'
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const batchType = searchParams.get('type') as 'domain' | 'competitor';

    if (!batchType || !['domain', 'competitor'].includes(batchType)) {
      return NextResponse.json({ error: 'Invalid batch type' }, { status: 400 });
    }

    // Check for existing active batch
    const { data: existingRun } = await serviceSupabase
      .from('analysis_batch_runs')
      .select('*')
      .eq('account_id', accountId)
      .eq('batch_type', batchType)
      .in('status', ['pending', 'processing'])
      .single();

    if (existingRun) {
      return NextResponse.json({
        hasActiveRun: true,
        runId: existingRun.id,
        status: existingRun.status,
        totalItems: existingRun.total_items,
        processedItems: existingRun.processed_items,
        progress: existingRun.total_items > 0
          ? Math.round((existingRun.processed_items / existingRun.total_items) * 100)
          : 0,
      });
    }

    // Get items that need analysis
    const items = await getItemsToAnalyze(accountId, batchType, supabase);

    // Calculate cost
    const totalCredits = items.length * ANALYSIS_CREDIT_COST;

    // Get current balance
    await ensureBalanceExists(serviceSupabase, accountId);
    const balance = await getBalance(serviceSupabase, accountId);

    return NextResponse.json({
      hasActiveRun: false,
      totalItems: items.length,
      estimatedCredits: totalCredits,
      creditBalance: balance.totalCredits,
      hasEnoughCredits: balance.totalCredits >= totalCredits,
    });
  } catch (error) {
    console.error('[batch-analyze] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get batch preview' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llm-visibility/batch-analyze
 * Start a batch analysis job.
 *
 * Body:
 * - type: 'domain' | 'competitor'
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    const batchType = body.type as 'domain' | 'competitor';

    if (!batchType || !['domain', 'competitor'].includes(batchType)) {
      return NextResponse.json({ error: 'Invalid batch type' }, { status: 400 });
    }

    // Check for existing active batch
    const { data: existingRun } = await serviceSupabase
      .from('analysis_batch_runs')
      .select('id')
      .eq('account_id', accountId)
      .eq('batch_type', batchType)
      .in('status', ['pending', 'processing'])
      .single();

    if (existingRun) {
      return NextResponse.json(
        { error: 'A batch analysis is already in progress', runId: existingRun.id },
        { status: 409 }
      );
    }

    // Get items that need analysis
    const items = await getItemsToAnalyze(accountId, batchType, supabase);

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No items to analyze. All items have already been analyzed.' },
        { status: 400 }
      );
    }

    // Calculate cost
    const totalCredits = items.length * ANALYSIS_CREDIT_COST;

    // Check balance
    await ensureBalanceExists(serviceSupabase, accountId);
    const balance = await getBalance(serviceSupabase, accountId);

    if (balance.totalCredits < totalCredits) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: totalCredits,
          available: balance.totalCredits,
          itemCount: items.length,
        },
        { status: 402 }
      );
    }

    // Create batch run
    const { data: batchRun, error: createError } = await serviceSupabase
      .from('analysis_batch_runs')
      .insert({
        account_id: accountId,
        batch_type: batchType,
        status: 'pending',
        total_items: items.length,
        processed_items: 0,
        successful_items: 0,
        failed_items: 0,
        estimated_credits: totalCredits,
        total_credits_used: totalCredits,
        triggered_by: user.id,
      })
      .select()
      .single();

    if (createError || !batchRun) {
      console.error('[batch-analyze] Failed to create batch run:', createError);
      return NextResponse.json(
        { error: 'Failed to create batch run' },
        { status: 500 }
      );
    }

    // Create batch items
    const batchItems = items.map(item => ({
      batch_run_id: batchRun.id,
      item_type: batchType,
      item_key: item.key,
      item_display_name: item.displayName,
      item_metadata: item.metadata || null,
      status: 'pending',
    }));

    const { error: itemsError } = await serviceSupabase
      .from('analysis_batch_run_items')
      .insert(batchItems);

    if (itemsError) {
      console.error('[batch-analyze] Failed to create batch items:', itemsError);
      // Clean up the batch run
      await serviceSupabase.from('analysis_batch_runs').delete().eq('id', batchRun.id);
      return NextResponse.json(
        { error: 'Failed to create batch items' },
        { status: 500 }
      );
    }

    // Debit credits
    const idempotencyKey = `analysis_batch:${accountId}:${batchRun.id}`;
    try {
      await debit(serviceSupabase, accountId, totalCredits, {
        featureType: `${batchType}_analysis`,
        featureMetadata: {
          batchRunId: batchRun.id,
          itemCount: items.length,
          batchType,
        },
        idempotencyKey,
        description: `Batch ${batchType} analysis: ${items.length} items`,
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        // Clean up
        await serviceSupabase.from('analysis_batch_run_items').delete().eq('batch_run_id', batchRun.id);
        await serviceSupabase.from('analysis_batch_runs').delete().eq('id', batchRun.id);
        return NextResponse.json(
          { error: 'Insufficient credits', required: error.required, available: error.available },
          { status: 402 }
        );
      }
      throw error;
    }

    console.log(`[batch-analyze] Created ${batchType} batch run ${batchRun.id} with ${items.length} items`);

    return NextResponse.json({
      success: true,
      runId: batchRun.id,
      totalItems: items.length,
      estimatedCredits: totalCredits,
      message: 'Batch analysis queued successfully',
    });
  } catch (error) {
    console.error('[batch-analyze] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to start batch analysis' },
      { status: 500 }
    );
  }
}

/**
 * Get items that need analysis (not yet cached)
 */
async function getItemsToAnalyze(
  accountId: string,
  batchType: 'domain' | 'competitor',
  supabase: any
): Promise<BatchItem[]> {
  if (batchType === 'domain') {
    // Get domains from research sources that aren't cached
    const { data: checks } = await supabase
      .from('llm_visibility_checks')
      .select('search_results')
      .eq('account_id', accountId)
      .not('search_results', 'is', null);

    // Extract unique domains
    const domainSet = new Set<string>();
    for (const check of checks || []) {
      const searchResults = check.search_results as Array<{ domain: string }> | null;
      if (searchResults && Array.isArray(searchResults)) {
        for (const result of searchResults) {
          if (result.domain) {
            domainSet.add(result.domain.toLowerCase());
          }
        }
      }
    }

    // Check which domains are already cached
    const { data: cached } = await supabase
      .from('domain_analysis_cache')
      .select('domain');

    const cachedDomains = new Set((cached || []).map((c: { domain: string }) => c.domain.toLowerCase()));

    // Return uncached domains
    const uncachedDomains = Array.from(domainSet).filter(d => !cachedDomains.has(d));
    return uncachedDomains.map(domain => ({
      key: domain,
      displayName: domain,
    }));
  } else {
    // Get competitors from mentioned_brands that aren't cached for this account
    const { data: checks } = await supabase
      .from('llm_visibility_checks')
      .select('mentioned_brands, keywords!inner(phrase)')
      .eq('account_id', accountId)
      .not('mentioned_brands', 'is', null);

    // Extract unique competitors with metadata
    const competitorMap = new Map<string, BatchItem>();
    for (const check of checks || []) {
      const mentionedBrands = check.mentioned_brands as Array<{
        title: string;
        category?: string;
        urls?: Array<{ domain: string }>;
      }> | null;

      if (mentionedBrands && Array.isArray(mentionedBrands)) {
        for (const brand of mentionedBrands) {
          if (brand.title) {
            const key = brand.title.toLowerCase();
            if (!competitorMap.has(key)) {
              competitorMap.set(key, {
                key,
                displayName: brand.title,
                metadata: {
                  categories: brand.category ? [brand.category] : [],
                  domains: brand.urls?.map(u => u.domain) || [],
                  concepts: [(check.keywords as any)?.phrase].filter(Boolean),
                },
              });
            } else {
              // Merge metadata
              const existing = competitorMap.get(key)!;
              if (brand.category && !existing.metadata?.categories?.includes(brand.category)) {
                existing.metadata?.categories?.push(brand.category);
              }
              if (brand.urls) {
                for (const u of brand.urls) {
                  if (u.domain && !existing.metadata?.domains?.includes(u.domain)) {
                    existing.metadata?.domains?.push(u.domain);
                  }
                }
              }
              const concept = (check.keywords as any)?.phrase;
              if (concept && !existing.metadata?.concepts?.includes(concept)) {
                existing.metadata?.concepts?.push(concept);
              }
            }
          }
        }
      }
    }

    // Check which competitors are already cached for this account
    const { data: cached } = await supabase
      .from('competitor_analysis_cache')
      .select('competitor_name')
      .eq('account_id', accountId);

    const cachedCompetitors = new Set((cached || []).map((c: { competitor_name: string }) => c.competitor_name.toLowerCase()));

    // Return uncached competitors
    return Array.from(competitorMap.values()).filter(c => !cachedCompetitors.has(c.key));
  }
}
