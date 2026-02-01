import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_AI_SEARCH_GROUP_NAME } from '@/lib/groupConstants';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AISearchQueryGroupData {
  id: string;
  name: string;
  displayOrder: number;
  queryCount: number;
  createdAt: string;
  updatedAt: string;
}

function transformGroupToResponse(
  group: any,
  queryCount: number
): AISearchQueryGroupData {
  return {
    id: group.id,
    name: group.name,
    displayOrder: group.display_order ?? 0,
    queryCount,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
  };
}

/**
 * GET /api/ai-search-query-groups
 * List all AI search query groups for the account with query counts.
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

    // Fetch groups
    const { data: groups, error: groupsError } = await serviceSupabase
      .from('ai_search_query_groups')
      .select('*')
      .eq('account_id', accountId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (groupsError) {
      // If table doesn't exist, return empty list instead of error
      if (groupsError.code === '42P01' || groupsError.message?.includes('does not exist')) {
        console.warn('⚠️ ai_search_query_groups table does not exist, returning empty list');
        return NextResponse.json({ groups: [] });
      }
      console.error('❌ Failed to fetch AI search query groups:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    // Auto-create General group if it doesn't exist
    let groupsList = groups || [];
    if (!groupsList.some((g: any) => g.name === DEFAULT_AI_SEARCH_GROUP_NAME)) {
      const { data: newGeneral } = await serviceSupabase
        .from('ai_search_query_groups')
        .insert({
          account_id: accountId,
          name: DEFAULT_AI_SEARCH_GROUP_NAME,
          display_order: 0,
        })
        .select('*')
        .single();

      if (newGeneral) {
        groupsList = [newGeneral, ...groupsList];
      }
    }

    // Get query counts per group from keyword_questions
    const { data: queryCounts, error: queryCountsError } = await serviceSupabase
      .from('keyword_questions')
      .select('group_id, keyword_id!inner(account_id)')
      .eq('keyword_id.account_id', accountId);

    const countByGroup: Record<string, number> = {};

    // If keyword_questions table doesn't exist, just use empty counts
    if (!queryCountsError && queryCounts) {
      for (const q of queryCounts) {
        if (q.group_id) {
          countByGroup[q.group_id] = (countByGroup[q.group_id] || 0) + 1;
        }
      }
    }

    // Transform groups with counts
    const transformedGroups = groupsList.map((g: any) =>
      transformGroupToResponse(g, countByGroup[g.id] || 0)
    );

    return NextResponse.json({
      groups: transformedGroups,
    });
  } catch (error: any) {
    console.error('❌ AI search query groups GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-search-query-groups
 * Create a new AI search query group.
 *
 * Body:
 * - name: string (required)
 * - displayOrder?: number (optional, defaults to 0)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, displayOrder = 0 } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 30) {
      return NextResponse.json(
        { error: 'Group name must be 30 characters or less' },
        { status: 400 }
      );
    }

    // Check if group already exists
    const { data: existingGroup } = await serviceSupabase
      .from('ai_search_query_groups')
      .select('id')
      .eq('account_id', accountId)
      .eq('name', trimmedName)
      .maybeSingle();

    if (existingGroup) {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 409 }
      );
    }

    // Create the group
    const { data: newGroup, error: insertError } = await serviceSupabase
      .from('ai_search_query_groups')
      .insert({
        account_id: accountId,
        name: trimmedName,
        display_order: displayOrder,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Failed to create AI search query group:', insertError);
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { group: transformGroupToResponse(newGroup, 0) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ AI search query groups POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
