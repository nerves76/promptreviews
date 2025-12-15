import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getSummary, getAccountSummaries } from '@/features/llm-visibility/services/llm-checker';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/llm-visibility/summary
 * Get LLM visibility summary for a keyword or all keywords.
 *
 * Query params:
 * - keywordId?: string (if provided, get single keyword summary)
 * - limit?: number (default: 100, for account-wide summaries)
 * - minScore?: number (filter by minimum visibility score)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keywordId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const minScore = searchParams.get('minScore')
      ? parseFloat(searchParams.get('minScore')!)
      : undefined;

    // Single keyword summary
    if (keywordId) {
      // Verify keyword belongs to account
      const { data: keyword, error: keywordError } = await serviceSupabase
        .from('keywords')
        .select('id, phrase, related_questions')
        .eq('id', keywordId)
        .eq('account_id', accountId)
        .single();

      if (keywordError || !keyword) {
        return NextResponse.json(
          { error: 'Keyword not found' },
          { status: 404 }
        );
      }

      const summary = await getSummary(keywordId, accountId, serviceSupabase);

      return NextResponse.json({
        keyword: {
          id: keyword.id,
          phrase: keyword.phrase,
          questionCount: keyword.related_questions?.length || 0,
        },
        summary,
      });
    }

    // Account-wide summaries
    const summaries = await getAccountSummaries(accountId, serviceSupabase, {
      limit,
      minScore,
    });

    // Get keyword details for each summary
    const keywordIds = summaries.map(s => s.keywordId);

    const { data: keywords } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, related_questions')
      .in('id', keywordIds);

    const keywordMap = new Map(keywords?.map(k => [k.id, k]) || []);

    const enrichedSummaries = summaries.map(summary => ({
      ...summary,
      keyword: keywordMap.get(summary.keywordId) || null,
    }));

    return NextResponse.json({
      summaries: enrichedSummaries,
      total: summaries.length,
    });
  } catch (error) {
    console.error('❌ [LLMVisibility] Error fetching summary:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
