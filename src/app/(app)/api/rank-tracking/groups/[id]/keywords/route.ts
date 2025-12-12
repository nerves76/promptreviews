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
 * GET /api/rank-tracking/groups/[id]/keywords
 * List keywords in a group with latest positions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify group belongs to this account
    const { data: group } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('id')
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get keywords in this group with keyword details
    const { data: groupKeywords, error: keywordsError } = await serviceSupabase
      .from('rank_group_keywords')
      .select(`
        id,
        group_id,
        keyword_id,
        account_id,
        target_url,
        is_enabled,
        created_at,
        keywords (
          id,
          phrase,
          normalized_phrase,
          search_query,
          review_usage_count,
          status
        )
      `)
      .eq('group_id', groupId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (keywordsError) {
      console.error('❌ [RankTracking] Failed to fetch group keywords:', keywordsError);
      return NextResponse.json(
        { error: 'Failed to fetch keywords' },
        { status: 500 }
      );
    }

    // Get latest position for each keyword
    const keywordIds = (groupKeywords || []).map((gk) => gk.keyword_id);
    const { data: latestChecks } = await serviceSupabase
      .from('rank_checks')
      .select('keyword_id, position, checked_at, found_url, matched_target_url')
      .eq('group_id', groupId)
      .in('keyword_id', keywordIds)
      .order('checked_at', { ascending: false });

    // Map latest position by keyword_id
    const latestByKeyword = new Map<string, any>();
    if (latestChecks) {
      for (const check of latestChecks) {
        if (!latestByKeyword.has(check.keyword_id)) {
          latestByKeyword.set(check.keyword_id, {
            position: check.position,
            checkedAt: check.checked_at,
            foundUrl: check.found_url,
            matchedTargetUrl: check.matched_target_url,
          });
        }
      }
    }

    // Transform to response format
    const transformed = (groupKeywords || []).map((gk) => {
      const keyword = gk.keywords as any;
      const latest = latestByKeyword.get(gk.keyword_id);

      return {
        id: gk.id,
        groupId: gk.group_id,
        keywordId: gk.keyword_id,
        accountId: gk.account_id,
        targetUrl: gk.target_url,
        isEnabled: gk.is_enabled,
        createdAt: gk.created_at,
        keyword: keyword ? {
          id: keyword.id,
          phrase: keyword.phrase,
          normalizedPhrase: keyword.normalized_phrase,
          searchQuery: keyword.search_query,
          reviewUsageCount: keyword.review_usage_count,
          status: keyword.status,
        } : null,
        latestPosition: latest?.position ?? null,
        latestCheckedAt: latest?.checkedAt ?? null,
        latestFoundUrl: latest?.foundUrl ?? null,
        latestMatchedTargetUrl: latest?.matchedTargetUrl ?? null,
      };
    });

    return NextResponse.json({ keywords: transformed });
  } catch (error) {
    console.error('❌ [RankTracking] Group keywords GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rank-tracking/groups/[id]/keywords
 * Add keywords to a group.
 *
 * Body:
 * - keywordIds: string[] (required) - IDs of keywords to add
 * - targetUrls: Record<string, string> (optional) - Target URLs by keyword ID
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify group belongs to this account
    const { data: group } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('id')
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { keywordIds, targetUrls = {} } = body;

    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return NextResponse.json(
        { error: 'keywordIds array is required' },
        { status: 400 }
      );
    }

    // Verify keywords belong to this account
    const { data: validKeywords, error: verifyError } = await serviceSupabase
      .from('keywords')
      .select('id')
      .eq('account_id', accountId)
      .in('id', keywordIds);

    if (verifyError) {
      console.error('❌ [RankTracking] Failed to verify keywords:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify keywords' },
        { status: 500 }
      );
    }

    const validKeywordIds = new Set((validKeywords || []).map((k) => k.id));
    const invalidIds = keywordIds.filter((id: string) => !validKeywordIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid keyword IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert group keywords (upsert to handle duplicates)
    const toInsert = keywordIds.map((keywordId: string) => ({
      group_id: groupId,
      keyword_id: keywordId,
      account_id: accountId,
      target_url: targetUrls[keywordId] || null,
      is_enabled: true,
    }));

    const { data: inserted, error: insertError } = await serviceSupabase
      .from('rank_group_keywords')
      .upsert(toInsert, {
        onConflict: 'group_id,keyword_id',
        ignoreDuplicates: false,
      })
      .select(`
        id,
        group_id,
        keyword_id,
        account_id,
        target_url,
        is_enabled,
        created_at,
        keywords (
          id,
          phrase,
          normalized_phrase,
          search_query
        )
      `);

    if (insertError) {
      console.error('❌ [RankTracking] Failed to add keywords:', insertError);
      return NextResponse.json(
        { error: 'Failed to add keywords' },
        { status: 500 }
      );
    }

    console.log(`✅ [RankTracking] Added ${inserted?.length || 0} keywords to group ${groupId}`);

    const transformed = (inserted || []).map((gk) => {
      const keyword = gk.keywords as any;
      return {
        id: gk.id,
        groupId: gk.group_id,
        keywordId: gk.keyword_id,
        accountId: gk.account_id,
        targetUrl: gk.target_url,
        isEnabled: gk.is_enabled,
        createdAt: gk.created_at,
        keyword: keyword ? {
          id: keyword.id,
          phrase: keyword.phrase,
          normalizedPhrase: keyword.normalized_phrase,
          searchQuery: keyword.search_query,
        } : null,
      };
    });

    return NextResponse.json({
      keywords: transformed,
      added: transformed.length,
    });
  } catch (error) {
    console.error('❌ [RankTracking] Group keywords POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rank-tracking/groups/[id]/keywords
 * Remove keywords from a group.
 *
 * Body:
 * - keywordIds: string[] (required) - IDs of keywords to remove
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify group belongs to this account
    const { data: group } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('id')
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { keywordIds } = body;

    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return NextResponse.json(
        { error: 'keywordIds array is required' },
        { status: 400 }
      );
    }

    // Delete group keywords
    const { error: deleteError } = await serviceSupabase
      .from('rank_group_keywords')
      .delete()
      .eq('group_id', groupId)
      .eq('account_id', accountId)
      .in('keyword_id', keywordIds);

    if (deleteError) {
      console.error('❌ [RankTracking] Failed to remove keywords:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove keywords' },
        { status: 500 }
      );
    }

    console.log(`✅ [RankTracking] Removed ${keywordIds.length} keywords from group ${groupId}`);

    return NextResponse.json({
      removed: keywordIds.length,
      success: true,
    });
  } catch (error) {
    console.error('❌ [RankTracking] Group keywords DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
