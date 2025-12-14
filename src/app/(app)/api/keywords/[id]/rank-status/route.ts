import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/keywords/[id]/rank-status
 *
 * Get the latest rank tracking status for a keyword.
 * Returns the most recent check for each group the keyword is tracked in.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: keywordId } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify keyword belongs to this account
    const { data: keyword } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, search_query')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Find all groups this keyword is tracked in
    const { data: groupKeywords } = await serviceSupabase
      .from('rank_group_keywords')
      .select(`
        id,
        group_id,
        is_enabled,
        rank_keyword_groups (
          id,
          name,
          device,
          location_name,
          location_code
        )
      `)
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId);

    if (!groupKeywords || groupKeywords.length === 0) {
      return NextResponse.json({
        isTracked: false,
        keyword: {
          id: keyword.id,
          phrase: keyword.phrase,
          searchQuery: keyword.search_query,
        },
        rankings: [],
      });
    }

    // Get the most recent rank check for each group
    const rankings = [];

    for (const gk of groupKeywords) {
      const group = gk.rank_keyword_groups as unknown as {
        id: string;
        name: string;
        device: string;
        location_name: string;
        location_code: number;
      };

      if (!group) continue;

      const { data: latestCheck } = await serviceSupabase
        .from('rank_checks')
        .select(`
          id, position, found_url, checked_at, search_query_used,
          paa_question_count, paa_ours_count,
          ai_overview_present, ai_overview_ours_cited, ai_overview_citation_count,
          featured_snippet_present, featured_snippet_ours,
          serp_features
        `)
        .eq('keyword_id', keywordId)
        .eq('group_id', group.id)
        .eq('account_id', accountId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      // Also get the previous check to calculate change
      const { data: previousCheck } = await serviceSupabase
        .from('rank_checks')
        .select('position')
        .eq('keyword_id', keywordId)
        .eq('group_id', group.id)
        .eq('account_id', accountId)
        .order('checked_at', { ascending: false })
        .range(1, 1)
        .single();

      // Extract PAA questions from serp_features JSONB
      const serpFeatures = latestCheck?.serp_features as {
        peopleAlsoAsk?: {
          questions?: Array<{
            question: string;
            answerDomain: string | null;
            isOurs: boolean;
          }>;
        };
      } | null;

      const discoveredQuestions = serpFeatures?.peopleAlsoAsk?.questions?.map(q => ({
        question: q.question,
        answerDomain: q.answerDomain,
        isOurs: q.isOurs,
      })) || [];

      rankings.push({
        groupId: group.id,
        groupName: group.name,
        device: group.device,
        location: group.location_name,
        locationCode: group.location_code,
        isEnabled: gk.is_enabled,
        latestCheck: latestCheck ? {
          position: latestCheck.position,
          foundUrl: latestCheck.found_url,
          checkedAt: latestCheck.checked_at,
          searchQuery: latestCheck.search_query_used,
          positionChange: previousCheck?.position && latestCheck.position
            ? previousCheck.position - latestCheck.position
            : null,
          // SERP visibility
          serpVisibility: {
            paa: {
              questionCount: latestCheck.paa_question_count ?? 0,
              oursCount: latestCheck.paa_ours_count ?? 0,
            },
            aiOverview: {
              present: latestCheck.ai_overview_present ?? false,
              oursCited: latestCheck.ai_overview_ours_cited ?? false,
              citationCount: latestCheck.ai_overview_citation_count ?? 0,
            },
            featuredSnippet: {
              present: latestCheck.featured_snippet_present ?? false,
              ours: latestCheck.featured_snippet_ours ?? false,
            },
          },
          // Discovered questions from Google's "People Also Ask"
          discoveredQuestions,
        } : null,
      });
    }

    return NextResponse.json({
      isTracked: true,
      keyword: {
        id: keyword.id,
        phrase: keyword.phrase,
        searchQuery: keyword.search_query,
      },
      rankings,
    });
  } catch (error) {
    console.error('❌ [Keywords] Rank status GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
