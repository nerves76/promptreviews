import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * GET /api/llm-visibility/competitors/cached-names
 *
 * Returns a list of competitor names that have cached analysis for this account.
 * Used by the UI to determine how many competitors still need analysis.
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
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Get all cached competitor names for this account
    const { data: cached, error } = await supabase
      .from('competitor_analysis_cache')
      .select('competitor_name')
      .eq('account_id', accountId);

    if (error) {
      console.error('[cached-names] Error fetching cached names:', error);
      return NextResponse.json({ error: 'Failed to fetch cached names' }, { status: 500 });
    }

    const cachedNames = cached?.map(c => c.competitor_name) || [];

    return NextResponse.json({ cachedNames });

  } catch (error) {
    console.error('[cached-names] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cached names' },
      { status: 500 }
    );
  }
}
