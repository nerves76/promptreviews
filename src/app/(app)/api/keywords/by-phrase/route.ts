import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  normalizePhrase,
  transformKeywordToResponse,
  transformKeywordQuestionRows,
  type KeywordQuestionRow,
} from '@/features/keywords/keywordUtils';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/keywords/by-phrase
 * Look up a keyword by its phrase.
 *
 * Query params:
 * - phrase: The keyword phrase to look up (required)
 *
 * Returns:
 * - { keyword: KeywordData } if found
 * - { keyword: null } if not found
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
    const phrase = searchParams.get('phrase');

    if (!phrase) {
      return NextResponse.json({ error: 'Phrase parameter is required' }, { status: 400 });
    }

    const normalizedPhrase = normalizePhrase(phrase);

    // Look up keyword by normalized phrase
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select(`
        id,
        phrase,
        normalized_phrase,
        word_count,
        status,
        review_usage_count,
        last_used_in_review_at,
        group_id,
        created_at,
        updated_at,
        review_phrase,
        search_query,
        search_terms,
        aliases,
        location_scope,
        ai_generated,
        ai_suggestions,
        related_questions,
        search_volume,
        cpc,
        competition_level,
        search_volume_trend,
        search_volume_location_code,
        search_volume_location_name,
        metrics_updated_at,
        keyword_groups (
          id,
          name
        ),
        keyword_questions (
          id,
          question,
          funnel_stage,
          added_at,
          created_at,
          updated_at
        )
      `)
      .eq('account_id', accountId)
      .eq('normalized_phrase', normalizedPhrase)
      .single();

    if (keywordError && keywordError.code !== 'PGRST116') {
      console.error('[API] Error fetching keyword by phrase:', keywordError);
      return NextResponse.json({ error: 'Failed to fetch keyword' }, { status: 500 });
    }

    if (!keyword) {
      return NextResponse.json({ keyword: null });
    }

    // Get prompt pages this keyword is used on
    const { data: usageData } = await serviceSupabase
      .from('keyword_prompt_page_usage')
      .select(`
        prompt_page_id,
        prompt_pages (
          id,
          slug,
          page_type
        )
      `)
      .eq('keyword_id', keyword.id)
      .eq('account_id', accountId);

    const promptPages = (usageData || [])
      .filter((u: any) => u.prompt_pages)
      .map((u: any) => ({
        id: u.prompt_pages.id,
        slug: u.prompt_pages.slug,
        name: u.prompt_pages.page_type || u.prompt_pages.slug,
      }));

    // Transform to response format
    const transformedKeyword = transformKeywordToResponse(keyword);

    // Add related questions from normalized table if available
    if (keyword.keyword_questions && keyword.keyword_questions.length > 0) {
      transformedKeyword.relatedQuestions = transformKeywordQuestionRows(
        keyword.keyword_questions as KeywordQuestionRow[]
      );
    }

    return NextResponse.json({
      keyword: transformedKeyword,
      promptPages,
    });
  } catch (error) {
    console.error('[API] Error in keywords/by-phrase:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
