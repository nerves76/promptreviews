import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  normalizePhrase,
  calculateWordCount,
  transformKeywordToResponse,
  searchTermsToDb,
  relatedQuestionsToDb,
  transformKeywordQuestionRows,
  prepareQuestionForInsert,
  type SearchTerm,
  type RelatedQuestion,
  type KeywordQuestionRow,
} from '@/features/keywords/keywordUtils';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/keywords/[id]
 * Get a single keyword with its details and prompt page assignments.
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

    // Fetch keyword with group info and questions from normalized table
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
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Fetch prompt page assignments
    const { data: pageUsage } = await serviceSupabase
      .from('keyword_prompt_page_usage')
      .select(`
        prompt_page_id,
        is_in_active_pool,
        display_order,
        prompt_pages (
          id,
          slug,
          name,
          type,
          campaign_type
        )
      `)
      .eq('keyword_id', id)
      .eq('account_id', accountId);

    // Fetch recent reviews containing this keyword
    const { data: recentMatches } = await serviceSupabase
      .from('keyword_review_matches_v2')
      .select(`
        id,
        matched_at,
        review_submission_id,
        google_review_id,
        review_submissions (
          id,
          reviewer_name,
          review_content,
          created_at
        )
      `)
      .eq('keyword_id', id)
      .eq('account_id', accountId)
      .order('matched_at', { ascending: false })
      .limit(10);

    // Transform keyword and use normalized questions table if available
    const transformedKeyword = transformKeywordToResponse(keyword, (keyword as any).keyword_groups?.name);

    // Use keyword_questions table data (normalized) instead of JSONB if available
    const keywordQuestions = (keyword as any).keyword_questions;
    console.log(`[Keyword ${id}] keyword_questions from DB:`, keywordQuestions?.length || 0, 'questions');
    console.log(`[Keyword ${id}] related_questions JSONB:`, (keyword as any).related_questions?.length || 0, 'questions');

    if (keywordQuestions && Array.isArray(keywordQuestions) && keywordQuestions.length > 0) {
      transformedKeyword.relatedQuestions = transformKeywordQuestionRows(keywordQuestions as KeywordQuestionRow[]);
      console.log(`[Keyword ${id}] Using normalized questions:`, transformedKeyword.relatedQuestions.length);
    } else {
      console.log(`[Keyword ${id}] Using JSONB questions:`, transformedKeyword.relatedQuestions?.length || 0);
    }

    return NextResponse.json({
      keyword: transformedKeyword,
      promptPages: (pageUsage || []).map((pu: any) => ({
        id: pu.prompt_page_id,
        slug: pu.prompt_pages?.slug,
        name: pu.prompt_pages?.name,
        type: pu.prompt_pages?.type,
        campaignType: pu.prompt_pages?.campaign_type,
        isInActivePool: pu.is_in_active_pool,
        displayOrder: pu.display_order,
      })),
      recentReviews: (recentMatches || []).map((rm: any) => ({
        id: rm.review_submission_id || rm.google_review_id,
        reviewerName: rm.review_submissions?.reviewer_name || 'Google Review',
        content: rm.review_submissions?.review_content || null,
        matchedAt: rm.matched_at,
        source: rm.review_submission_id ? 'submission' : 'google',
      })),
    });
  } catch (error: any) {
    console.error('❌ Keyword GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/keywords/[id]
 * Update a keyword.
 *
 * Body:
 * - phrase?: string
 * - groupId?: string
 * - status?: 'active' | 'paused'
 * - reviewPhrase?: string
 * - searchQuery?: string
 * - aliases?: string[]
 * - locationScope?: 'local' | 'city' | 'region' | 'state' | 'national' | null
 * - relatedQuestions?: RelatedQuestion[] (max 20, each with question, funnelStage, addedAt)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Verify keyword belongs to this account and get current location for comparison
    const { data: existingKeyword } = await serviceSupabase
      .from('keywords')
      .select('id, account_id, search_volume_location_code, search_terms')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!existingKeyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    const body = await request.json();
    const { phrase, groupId, status, reviewPhrase, searchQuery, searchTerms, aliases, locationScope, relatedQuestions, searchVolumeLocationCode, searchVolumeLocationName, _locationChanged } = body;

    // Build update object
    const updates: Record<string, any> = {};

    if (phrase !== undefined) {
      if (typeof phrase !== 'string' || phrase.trim().length === 0) {
        return NextResponse.json(
          { error: 'Invalid phrase' },
          { status: 400 }
        );
      }

      const normalizedPhrase = normalizePhrase(phrase);

      // Check if new phrase conflicts with another keyword
      const { data: conflicting } = await serviceSupabase
        .from('keywords')
        .select('id')
        .eq('account_id', accountId)
        .eq('normalized_phrase', normalizedPhrase)
        .neq('id', id)
        .maybeSingle();

      if (conflicting) {
        return NextResponse.json(
          { error: 'Another keyword with this phrase already exists' },
          { status: 409 }
        );
      }

      updates.phrase = phrase.trim();
      updates.normalized_phrase = normalizedPhrase;
      updates.word_count = calculateWordCount(phrase);
    }

    if (groupId !== undefined) {
      // Verify group belongs to account
      if (groupId) {
        const { data: group } = await serviceSupabase
          .from('keyword_groups')
          .select('id')
          .eq('id', groupId)
          .eq('account_id', accountId)
          .single();

        if (!group) {
          return NextResponse.json(
            { error: 'Keyword group not found' },
            { status: 404 }
          );
        }
      }
      updates.group_id = groupId || null;
    }

    if (status !== undefined) {
      if (!['active', 'paused'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be "active" or "paused"' },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    // Handle concept fields
    if (reviewPhrase !== undefined) {
      updates.review_phrase = reviewPhrase?.trim() || null;
    }

    if (searchQuery !== undefined) {
      updates.search_query = searchQuery?.trim() || null;
    }

    // Handle search_terms array (new format for multiple tracked terms)
    if (searchTerms !== undefined) {
      if (!Array.isArray(searchTerms)) {
        return NextResponse.json(
          { error: 'searchTerms must be an array' },
          { status: 400 }
        );
      }
      // Validate each term has required fields
      for (const term of searchTerms as SearchTerm[]) {
        if (!term.term || typeof term.term !== 'string') {
          return NextResponse.json(
            { error: 'Each search term must have a "term" string' },
            { status: 400 }
          );
        }
      }
      // Convert to database format
      updates.search_terms = searchTermsToDb(searchTerms);
      // Also update legacy search_query to the canonical term for backward compatibility
      const canonical = (searchTerms as SearchTerm[]).find(t => t.isCanonical);
      if (canonical) {
        updates.search_query = canonical.term;
      } else if (searchTerms.length > 0) {
        updates.search_query = (searchTerms as SearchTerm[])[0].term;
      }
    }

    if (aliases !== undefined) {
      if (!Array.isArray(aliases)) {
        return NextResponse.json(
          { error: 'Aliases must be an array of strings' },
          { status: 400 }
        );
      }
      updates.aliases = aliases.map((a: string) => a.trim()).filter(Boolean);
    }

    if (locationScope !== undefined) {
      const validScopes = ['local', 'city', 'region', 'state', 'national', null];
      if (!validScopes.includes(locationScope)) {
        return NextResponse.json(
          { error: 'Invalid location scope' },
          { status: 400 }
        );
      }
      updates.location_scope = locationScope;
    }

    // Handle location for rank tracking
    if (searchVolumeLocationCode !== undefined) {
      updates.search_volume_location_code = searchVolumeLocationCode;
    }
    if (searchVolumeLocationName !== undefined) {
      updates.search_volume_location_name = searchVolumeLocationName;
    }

    // Check if location actually changed - if so, we'll clear history after update
    const locationChanged = _locationChanged ||
      (searchVolumeLocationCode !== undefined &&
       searchVolumeLocationCode !== existingKeyword.search_volume_location_code);

    if (relatedQuestions !== undefined) {
      if (!Array.isArray(relatedQuestions)) {
        return NextResponse.json(
          { error: 'Related questions must be an array' },
          { status: 400 }
        );
      }
      if (relatedQuestions.length > 20) {
        return NextResponse.json(
          { error: 'Maximum of 20 related questions allowed' },
          { status: 400 }
        );
      }
      // Validate each question has required fields
      for (const q of relatedQuestions as RelatedQuestion[]) {
        if (!q.question || typeof q.question !== 'string') {
          return NextResponse.json(
            { error: 'Each related question must have a "question" string' },
            { status: 400 }
          );
        }
        if (!q.funnelStage || !['top', 'middle', 'bottom'].includes(q.funnelStage)) {
          return NextResponse.json(
            { error: 'Each related question must have a valid funnelStage: "top", "middle", or "bottom"' },
            { status: 400 }
          );
        }
      }
      updates.related_questions = relatedQuestionsToDb(relatedQuestions);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Perform update
    const { data: updatedKeyword, error: updateError } = await serviceSupabase
      .from('keywords')
      .update(updates)
      .eq('id', id)
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
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ Failed to update keyword:', updateError);
      return NextResponse.json(
        { error: 'Failed to update keyword' },
        { status: 500 }
      );
    }

    // If questions were updated, sync to the keyword_questions table
    if (relatedQuestions !== undefined) {
      // Delete existing questions for this keyword
      await serviceSupabase
        .from('keyword_questions')
        .delete()
        .eq('keyword_id', id);

      // Insert the new questions
      if (relatedQuestions.length > 0) {
        const questionsToInsert = (relatedQuestions as RelatedQuestion[]).map(q =>
          prepareQuestionForInsert(id, q)
        );

        const { error: questionsError } = await serviceSupabase
          .from('keyword_questions')
          .insert(questionsToInsert);

        if (questionsError) {
          console.error('⚠️ Failed to sync questions to normalized table:', questionsError);
          // Don't fail the request - JSONB fallback is still available
        }
      }
    }

    // If location changed, clear rank and volume history for this concept
    if (locationChanged) {
      console.log(`📍 Location changed for keyword ${id}, clearing history...`);

      // Get all search terms for this keyword to delete their history
      const searchTermsList = existingKeyword.search_terms as Array<{ term: string }> || [];
      const searchTermStrings = searchTermsList.map((t: { term: string }) => t.term.toLowerCase());

      if (searchTermStrings.length > 0) {
        // Delete rank checks for these search terms
        // Note: rank_checks are linked by search_query, not keyword_id directly
        const { error: rankDeleteError } = await serviceSupabase
          .from('rank_checks')
          .delete()
          .eq('account_id', accountId)
          .in('search_query', searchTermStrings);

        if (rankDeleteError) {
          console.error('⚠️ Failed to delete rank checks:', rankDeleteError);
        } else {
          console.log(`✓ Deleted rank checks for terms: ${searchTermStrings.join(', ')}`);
        }

        // Delete keyword research results for these terms
        const { error: researchDeleteError } = await serviceSupabase
          .from('keyword_research_results')
          .delete()
          .eq('account_id', accountId)
          .in('normalized_term', searchTermStrings);

        if (researchDeleteError) {
          console.error('⚠️ Failed to delete research results:', researchDeleteError);
        } else {
          console.log(`✓ Deleted research results for terms: ${searchTermStrings.join(', ')}`);
        }
      }
    }

    // Build response with questions
    const transformedKeyword = transformKeywordToResponse(updatedKeyword, (updatedKeyword as any).keyword_groups?.name);
    if (relatedQuestions !== undefined) {
      transformedKeyword.relatedQuestions = relatedQuestions as RelatedQuestion[];
    }

    return NextResponse.json({
      keyword: transformedKeyword,
    });
  } catch (error: any) {
    console.error('❌ Keyword PUT error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keywords/[id]
 * Delete a keyword entirely, including all prompt page assignments and matches.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verify keyword belongs to this account
    const { data: existingKeyword } = await serviceSupabase
      .from('keywords')
      .select('id, phrase, account_id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!existingKeyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Delete keyword (cascades to keyword_prompt_page_usage and keyword_review_matches_v2)
    const { error: deleteError } = await serviceSupabase
      .from('keywords')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Failed to delete keyword:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete keyword' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedKeyword: existingKeyword.phrase,
    });
  } catch (error: any) {
    console.error('❌ Keyword DELETE error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
