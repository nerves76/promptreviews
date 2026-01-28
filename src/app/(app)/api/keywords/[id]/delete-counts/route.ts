import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/keywords/[id]/delete-counts
 *
 * Returns counts of all related data that will be deleted if this keyword is deleted.
 * Used to show detailed warnings in the delete confirmation modal.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify keyword belongs to this account and get basic info
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, name, search_terms, aliases, related_questions')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Count search terms (from JSONB)
    const searchTerms = keyword.search_terms as Array<{ term: string }> | null;
    const searchTermsCount = searchTerms?.length || 0;

    // Count aliases (from JSONB)
    const aliases = keyword.aliases as string[] | null;
    const aliasesCount = aliases?.length || 0;

    // Count related questions from JSONB (legacy)
    const relatedQuestions = keyword.related_questions as Array<{ question: string }> | null;
    const legacyQuestionsCount = relatedQuestions?.length || 0;

    // Count AI visibility questions from normalized table
    const { count: questionsCount } = await serviceSupabase
      .from('keyword_questions')
      .select('*', { count: 'exact', head: true })
      .eq('keyword_id', id);

    // Count LLM visibility checks
    const { count: llmChecksCount } = await serviceSupabase
      .from('llm_visibility_checks')
      .select('*', { count: 'exact', head: true })
      .eq('keyword_id', id);

    // Count rank checks
    const { count: rankChecksCount } = await serviceSupabase
      .from('rank_checks')
      .select('*', { count: 'exact', head: true })
      .eq('keyword_id', id);

    // Count geo grid checks
    const { count: geoGridChecksCount } = await serviceSupabase
      .from('gg_checks')
      .select('*', { count: 'exact', head: true })
      .eq('keyword_id', id);

    // Check if geo grid tracking is enabled
    const { data: geoGridTracking } = await serviceSupabase
      .from('gg_tracked_keywords')
      .select('id')
      .eq('keyword_id', id)
      .eq('account_id', accountId)
      .limit(1);

    // Check if there's a schedule
    const { data: schedule } = await serviceSupabase
      .from('concept_schedules')
      .select('id, schedule_frequency, is_enabled')
      .eq('keyword_id', id)
      .eq('account_id', accountId)
      .maybeSingle();

    // Count prompt page assignments
    const { count: promptPageCount } = await serviceSupabase
      .from('keyword_prompt_page_usage')
      .select('*', { count: 'exact', head: true })
      .eq('keyword_id', id)
      .eq('account_id', accountId);

    // Count review matches
    const { count: reviewMatchesCount } = await serviceSupabase
      .from('keyword_review_matches_v2')
      .select('*', { count: 'exact', head: true })
      .eq('keyword_id', id)
      .eq('account_id', accountId);

    return NextResponse.json({
      keywordName: keyword.name || keyword.phrase,
      counts: {
        searchTerms: searchTermsCount,
        aliases: aliasesCount,
        aiQuestions: questionsCount || legacyQuestionsCount,
        llmChecks: llmChecksCount || 0,
        rankChecks: rankChecksCount || 0,
        geoGridChecks: geoGridChecksCount || 0,
        geoGridTracked: (geoGridTracking?.length || 0) > 0,
        hasSchedule: !!schedule,
        scheduleFrequency: schedule?.schedule_frequency || null,
        scheduleEnabled: schedule?.is_enabled || false,
        promptPages: promptPageCount || 0,
        reviewMatches: reviewMatchesCount || 0,
      },
    });
  } catch (error: any) {
    console.error('❌ Delete counts error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
