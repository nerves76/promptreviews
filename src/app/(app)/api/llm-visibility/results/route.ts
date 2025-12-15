import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { LLMProvider, LLM_PROVIDERS } from '@/features/llm-visibility/utils/types';
import { getLatestResults } from '@/features/llm-visibility/services/llm-checker';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/llm-visibility/results
 * Get LLM visibility check results for a keyword.
 *
 * Query params:
 * - keywordId: string (required)
 * - provider?: LLMProvider (filter by provider)
 * - limit?: number (default: 50)
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
    const provider = searchParams.get('provider') as LLMProvider | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!keywordId) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      );
    }

    // Validate provider if provided
    if (provider && !LLM_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${LLM_PROVIDERS.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify keyword belongs to account
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Get results
    const results = await getLatestResults(
      keywordId,
      accountId,
      serviceSupabase,
      { provider: provider || undefined, limit }
    );

    // Count total results (for pagination info)
    let totalQuery = serviceSupabase
      .from('llm_visibility_checks')
      .select('id', { count: 'exact', head: true })
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId);

    if (provider) {
      totalQuery = totalQuery.eq('llm_provider', provider);
    }

    const { count: total } = await totalQuery;

    return NextResponse.json({
      results,
      total: total || results.length,
      hasMore: (total || 0) > results.length,
    });
  } catch (error) {
    console.error('❌ [LLMVisibility] Error fetching results:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
