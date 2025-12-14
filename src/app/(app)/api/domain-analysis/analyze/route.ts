import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  debit,
  refundFeature,
  ensureBalanceExists,
  getBalance,
  InsufficientCreditsError,
} from '@/lib/credits';
import {
  analyzeDomain,
  normalizeDomain,
  isValidDomain,
} from '@/features/domain-analysis/api/dataforseo-domain-client';
import { DOMAIN_ANALYSIS_CREDIT_COST } from '@/features/domain-analysis/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/domain-analysis/analyze
 * Run domain analysis using DataForSEO APIs
 *
 * Body:
 * - domain: string - Domain to analyze (e.g., "example.com")
 *
 * Cost: 3 credits per analysis
 *
 * Returns technology stack, whois data, and SEO metrics
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Account isolation
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Parse request body
    let domain: string;
    try {
      const body = await request.json();
      domain = body.domain;
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate domain
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const normalizedDomain = normalizeDomain(domain);
    if (!isValidDomain(normalizedDomain)) {
      return NextResponse.json(
        { error: 'Invalid domain format. Please enter a valid domain (e.g., example.com)' },
        { status: 400 }
      );
    }

    // Ensure balance record exists
    await ensureBalanceExists(serviceSupabase, accountId);

    // Check credits
    const balance = await getBalance(serviceSupabase, accountId);
    const creditCost = DOMAIN_ANALYSIS_CREDIT_COST;

    if (balance.totalCredits < creditCost) {
      console.log(`[DomainAnalysis] Insufficient credits for account ${accountId}: need ${creditCost}, have ${balance.totalCredits}`);
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          message: `Domain analysis requires ${creditCost} credits. You have ${balance.totalCredits} credits available.`,
          required: creditCost,
          available: balance.totalCredits,
          balance: {
            included: balance.includedCredits,
            purchased: balance.purchasedCredits,
            total: balance.totalCredits,
          },
        },
        { status: 402 }
      );
    }

    // Generate idempotency key
    const analysisId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const idempotencyKey = `domain_analysis:${accountId}:${analysisId}`;

    // Debit credits before running analysis
    console.log(`[DomainAnalysis] Debiting ${creditCost} credits for account ${accountId} (domain: ${normalizedDomain})`);
    try {
      await debit(serviceSupabase, accountId, creditCost, {
        featureType: 'domain_analysis',
        featureMetadata: {
          domain: normalizedDomain,
          analysisId,
        },
        idempotencyKey,
        description: `Domain analysis: ${normalizedDomain}`,
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            message: `Domain analysis requires ${error.required} credits. You have ${error.available} credits available.`,
            required: error.required,
            available: error.available,
          },
          { status: 402 }
        );
      }
      throw error;
    }

    // Run domain analysis
    let result;
    try {
      result = await analyzeDomain(normalizedDomain);
    } catch (error) {
      // Refund credits on failure
      console.error(`[DomainAnalysis] Analysis failed, refunding ${creditCost} credits`);
      await refundFeature(serviceSupabase, accountId, creditCost, idempotencyKey, {
        featureType: 'domain_analysis',
        featureMetadata: { domain: normalizedDomain, reason: 'api_failure', error: String(error) },
        description: 'Refund: Domain analysis failed',
      });
      throw error;
    }

    if (!result.success) {
      // Refund credits on API failure
      console.error(`[DomainAnalysis] Analysis failed: ${result.error}, refunding ${creditCost} credits`);
      await refundFeature(serviceSupabase, accountId, creditCost, idempotencyKey, {
        featureType: 'domain_analysis',
        featureMetadata: { domain: normalizedDomain, reason: 'api_error', error: result.error },
        description: 'Refund: Domain analysis failed',
      });

      return NextResponse.json(
        { error: result.error || 'Domain analysis failed' },
        { status: 500 }
      );
    }

    // Track API cost in ai_usage table
    if (result.result?.totalCost && result.result.totalCost > 0) {
      await serviceSupabase.from('ai_usage').insert({
        account_id: accountId,
        feature_type: 'domain_analysis',
        cost_usd: result.result.totalCost,
        created_at: new Date().toISOString(),
      });
    }

    // Get updated balance
    const updatedBalance = await getBalance(serviceSupabase, accountId);

    return NextResponse.json({
      success: true,
      result: result.result,
      creditsUsed: creditCost,
      creditsRemaining: updatedBalance.totalCredits,
    });
  } catch (error) {
    console.error('[DomainAnalysis] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
