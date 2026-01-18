import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * GET /api/llm-visibility/domain-analyses
 *
 * Returns all cached domain analyses.
 * Used to populate the difficulty column on page load.
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

    // Get all cached domain analyses
    // Note: domain_analysis_cache is not account-scoped (domains are global)
    const { data: cached, error } = await supabase
      .from('domain_analysis_cache')
      .select('domain, difficulty, site_type, strategy');

    if (error) {
      console.error('[domain-analyses] Error fetching cached analyses:', error);
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }

    // Convert to a map keyed by domain
    const analyses: Record<string, { difficulty: string; siteType: string; strategy: string }> = {};
    for (const item of cached || []) {
      analyses[item.domain] = {
        difficulty: item.difficulty,
        siteType: item.site_type,
        strategy: item.strategy,
      };
    }

    return NextResponse.json({ analyses });

  } catch (error) {
    console.error('[domain-analyses] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}
