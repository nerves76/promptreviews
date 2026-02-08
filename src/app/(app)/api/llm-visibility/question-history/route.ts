import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { LLM_PROVIDERS } from '@/features/llm-visibility/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CheckRecord {
  id: string;
  llm_provider: string;
  domain_cited: boolean;
  brand_mentioned: boolean;
  checked_at: string;
}

/**
 * GET /api/llm-visibility/question-history
 * Get check history for a specific question (for citation timeline).
 *
 * Query params:
 * - question: string (required) - The question text
 * - keywordId: string (required) - The keyword/concept ID
 * - limit?: number (default: 20) - Max checks per provider
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
    const question = searchParams.get('question');
    const keywordId = searchParams.get('keywordId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!question || !keywordId) {
      return NextResponse.json(
        { error: 'Question and keywordId are required' },
        { status: 400 }
      );
    }

    // Fetch all checks for this question, ordered by date
    const { data: checks, error: checksError } = await serviceSupabase
      .from('llm_visibility_checks')
      .select('id, llm_provider, domain_cited, brand_mentioned, checked_at')
      .eq('account_id', accountId)
      .eq('keyword_id', keywordId)
      .eq('question', question)
      .order('checked_at', { ascending: true })
      .limit(limit * LLM_PROVIDERS.length); // Get enough for all providers

    if (checksError) {
      console.error('❌ Failed to fetch question history:', checksError);
      return NextResponse.json(
        { error: 'Failed to fetch check history' },
        { status: 500 }
      );
    }

    // Get all unique check dates (grouped by day)
    const dateSet = new Set<string>();
    (checks || []).forEach((check: CheckRecord) => {
      const date = new Date(check.checked_at).toISOString().split('T')[0];
      dateSet.add(date);
    });
    const allDates = Array.from(dateSet).sort().slice(-limit);

    // Build timeline data per provider
    const providers = ['chatgpt', 'claude', 'gemini', 'perplexity', 'ai_overview'] as const;
    const timeline: Record<string, {
      provider: string;
      citationRate: number;
      mentionRate: number;
      totalChecks: number;
      citedCount: number;
      mentionedCount: number;
      checks: Array<{ date: string; cited: boolean | null; mentioned: boolean | null }>;
    }> = {};

    providers.forEach(provider => {
      const providerChecks = (checks || []).filter(
        (c: CheckRecord) => c.llm_provider === provider
      );

      // Map checks to dates (store both cited and mentioned)
      const checksByDate = new Map<string, { cited: boolean; mentioned: boolean }>();
      providerChecks.forEach((check: CheckRecord) => {
        const date = new Date(check.checked_at).toISOString().split('T')[0];
        checksByDate.set(date, {
          cited: check.domain_cited,
          mentioned: check.brand_mentioned,
        });
      });

      // Build check array for all dates (null = not checked that day)
      const checksArray = allDates.map(date => {
        const checkData = checksByDate.get(date);
        return {
          date,
          cited: checkData ? checkData.cited : null,
          mentioned: checkData ? checkData.mentioned : null,
        };
      });

      const citedCount = providerChecks.filter((c: CheckRecord) => c.domain_cited).length;
      const mentionedCount = providerChecks.filter((c: CheckRecord) => c.brand_mentioned).length;
      const totalChecks = providerChecks.length;

      timeline[provider] = {
        provider,
        citationRate: totalChecks > 0 ? Math.round((citedCount / totalChecks) * 100) : 0,
        mentionRate: totalChecks > 0 ? Math.round((mentionedCount / totalChecks) * 100) : 0,
        totalChecks,
        citedCount,
        mentionedCount,
        checks: checksArray,
      };
    });

    return NextResponse.json({
      dates: allDates,
      timeline,
      totalChecks: checks?.length || 0,
    });
  } catch (error) {
    console.error('❌ [LLMVisibility] Error fetching question history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
