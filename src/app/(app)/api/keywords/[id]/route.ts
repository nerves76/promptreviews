import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  normalizePhrase,
  calculateWordCount,
  transformKeywordToResponse,
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

    // Fetch keyword with group info
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
        aliases,
        location_scope,
        ai_generated,
        ai_suggestions,
        related_questions,
        search_volume,
        cpc,
        competition_level,
        search_volume_trend,
        metrics_updated_at,
        keyword_groups (
          id,
          name
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

    return NextResponse.json({
      keyword: transformKeywordToResponse(keyword, (keyword as any).keyword_groups?.name),
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
 * - relatedQuestions?: string[] (max 10)
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

    // Verify keyword belongs to this account
    const { data: existingKeyword } = await serviceSupabase
      .from('keywords')
      .select('id, account_id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!existingKeyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    const body = await request.json();
    const { phrase, groupId, status, reviewPhrase, searchQuery, aliases, locationScope, relatedQuestions } = body;

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

    if (relatedQuestions !== undefined) {
      if (!Array.isArray(relatedQuestions)) {
        return NextResponse.json(
          { error: 'Related questions must be an array of strings' },
          { status: 400 }
        );
      }
      if (relatedQuestions.length > 10) {
        return NextResponse.json(
          { error: 'Maximum of 10 related questions allowed' },
          { status: 400 }
        );
      }
      updates.related_questions = relatedQuestions.map((q: string) => q.trim()).filter(Boolean);
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
        aliases,
        location_scope,
        ai_generated,
        ai_suggestions,
        related_questions,
        search_volume,
        cpc,
        competition_level,
        search_volume_trend,
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

    return NextResponse.json({
      keyword: transformKeywordToResponse(updatedKeyword, (updatedKeyword as any).keyword_groups?.name),
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
