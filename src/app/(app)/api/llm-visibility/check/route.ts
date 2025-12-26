import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  getBalance,
  debit,
  refundFeature,
  ensureBalanceExists,
  InsufficientCreditsError,
} from '@/lib/credits';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLMCheckRequest,
} from '@/features/llm-visibility/utils/types';
import { calculateLLMCheckCost } from '@/features/llm-visibility/services/credits';
import { runLLMChecks, getSummary } from '@/features/llm-visibility/services/llm-checker';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/llm-visibility/check
 * Run LLM visibility check for a keyword's questions.
 *
 * Body:
 * - keywordId: string (required)
 * - providers?: LLMProvider[] (default: ['chatgpt'])
 * - questionIndices?: number[] (specific questions to check)
 *
 * Flow:
 * 1. Auth + account isolation
 * 2. Get keyword with related_questions
 * 3. Get target domain from business
 * 4. Calculate credit cost
 * 5. Check balance (402 if insufficient)
 * 6. Debit with idempotency key
 * 7. Call DataForSEO for each question/provider
 * 8. Store results
 * 9. Update summary
 * 10. Refund on complete failure
 * 11. Return results + updated balance
 */
export async function POST(request: NextRequest) {
  let idempotencyKey: string | null = null;
  let accountId: string | null = null;
  let creditCost = 0;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body: LLMCheckRequest & { questions?: string[] } = await request.json();
    const { keywordId, providers = ['chatgpt'], questionIndices, questions: specificQuestions } = body;

    if (!keywordId) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      );
    }

    // Validate providers
    const validProviders = providers.filter(p => LLM_PROVIDERS.includes(p));
    if (validProviders.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid provider is required' },
        { status: 400 }
      );
    }

    // Get keyword with related questions
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, search_query, related_questions')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      console.error('❌ [LLMVisibility] Failed to fetch keyword:', keywordError);
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Extract question strings from related_questions (which is now JSONB with { question, funnelStage, addedAt })
    const relatedQuestions = keyword.related_questions || [];
    const questions: string[] = relatedQuestions.map((q: { question: string } | string) =>
      typeof q === 'string' ? q : q.question
    ).filter(Boolean);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No related questions found. Add questions to the keyword first.' },
        { status: 400 }
      );
    }

    // Filter questions if specific questions or indices provided
    let questionsToCheck = questions;

    // Filter by specific question strings (preferred)
    if (specificQuestions && specificQuestions.length > 0) {
      questionsToCheck = specificQuestions.filter(q => questions.includes(q));
    }
    // Or filter by indices (legacy support)
    else if (questionIndices && questionIndices.length > 0) {
      questionsToCheck = questionIndices
        .filter(i => i >= 0 && i < questions.length)
        .map(i => questions[i]);
    }

    if (questionsToCheck.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions found to check' },
        { status: 400 }
      );
    }

    // Get target domain and business name from business profile
    const { data: business, error: businessError } = await serviceSupabase
      .from('businesses')
      .select('business_website, name')
      .eq('account_id', accountId)
      .single();

    if (businessError || !business?.business_website) {
      console.error('❌ [LLMVisibility] No business website found:', businessError);
      return NextResponse.json(
        { error: 'No target website found. Please set up your business profile first.' },
        { status: 400 }
      );
    }

    const businessName = business.name || null;

    // Extract domain from website URL
    const targetDomain = extractDomain(business.business_website);
    if (!targetDomain) {
      return NextResponse.json(
        { error: 'Invalid website URL in business profile' },
        { status: 400 }
      );
    }

    // Calculate credit cost
    creditCost = calculateLLMCheckCost(questionsToCheck.length, validProviders);

    // Ensure balance record exists
    await ensureBalanceExists(serviceSupabase, accountId);

    // Check if account has sufficient credits
    const balance = await getBalance(serviceSupabase, accountId);

    if (balance.totalCredits < creditCost) {
      console.log(
        `❌ [LLMVisibility] Insufficient credits for account ${accountId}: need ${creditCost}, have ${balance.totalCredits}`
      );
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditCost,
          available: balance.totalCredits,
          questionCount: questionsToCheck.length,
          providerCount: validProviders.length,
        },
        { status: 402 }
      );
    }

    // Generate unique check ID for idempotency
    const checkId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    idempotencyKey = `llm_visibility:${accountId}:${checkId}`;

    // Debit credits before running checks
    console.log(
      `💳 [LLMVisibility] Debiting ${creditCost} credits for account ${accountId} ` +
      `(${questionsToCheck.length} questions × ${validProviders.length} providers)`
    );

    try {
      await debit(serviceSupabase, accountId, creditCost, {
        featureType: 'llm_visibility',
        featureMetadata: {
          keywordId,
          questionCount: questionsToCheck.length,
          providers: validProviders,
          checkId,
        },
        idempotencyKey,
        description: `LLM visibility check: ${questionsToCheck.length} questions × ${validProviders.length} providers`,
      });
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: error.required,
            available: error.available,
          },
          { status: 402 }
        );
      }
      throw error;
    }

    // Run LLM checks
    console.log(`🤖 [LLMVisibility] Starting check for keyword: ${keyword.phrase || keywordId}`);
    console.log(`   Questions: ${questionsToCheck.length}, Providers: ${validProviders.join(', ')}`);
    console.log(`   Target domain: ${targetDomain}, Business: ${businessName || 'N/A'}`);

    const result = await runLLMChecks(
      keywordId,
      accountId,
      questionsToCheck,
      targetDomain,
      serviceSupabase,
      {
        providers: validProviders,
        businessName,
      }
    );

    // Check if all checks failed - refund in that case
    if (result.checksPerformed === 0 && result.errors.length > 0) {
      console.log(`❌ [LLMVisibility] All checks failed, refunding ${creditCost} credits`);
      await refundFeature(serviceSupabase, accountId, creditCost, idempotencyKey, {
        featureType: 'llm_visibility',
        featureMetadata: { keywordId, reason: 'all_checks_failed' },
        description: 'Refund: All LLM visibility checks failed',
      });
    }

    // Get updated balance and summary
    const updatedBalance = await getBalance(serviceSupabase, accountId);
    const summary = await getSummary(keywordId, accountId, serviceSupabase);

    console.log(
      `✅ [LLMVisibility] Check complete. ${result.checksPerformed} checks, ` +
      `API cost: $${result.totalCost.toFixed(4)}`
    );

    // Debug: Log the response being returned
    console.log(`📦 [LLMVisibility] Response results count: ${result.results?.length || 0}`);
    if (result.results?.length) {
      console.log(`📦 [LLMVisibility] First result:`, JSON.stringify(result.results[0], null, 2));
    }

    return NextResponse.json({
      success: result.success,
      checksPerformed: result.checksPerformed,
      results: result.results, // Include individual check results
      summary,
      balance: {
        includedCredits: updatedBalance.includedCredits,
        purchasedCredits: updatedBalance.purchasedCredits,
        totalCredits: updatedBalance.totalCredits,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('❌ [LLMVisibility] Fatal error:', error);

    // Attempt to refund on fatal error if we debited
    if (idempotencyKey && accountId && creditCost > 0) {
      try {
        console.log(`💳 [LLMVisibility] Attempting refund after fatal error`);
        await refundFeature(serviceSupabase, accountId, creditCost, idempotencyKey, {
          featureType: 'llm_visibility',
          featureMetadata: { reason: 'fatal_error', error: String(error) },
          description: 'Refund: LLM visibility check failed with error',
        });
      } catch (refundError) {
        console.error('❌ [LLMVisibility] Failed to refund:', refundError);
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    // Handle URLs without protocol
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
