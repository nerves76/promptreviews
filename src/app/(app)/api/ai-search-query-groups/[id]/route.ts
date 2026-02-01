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

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
 * GET /api/ai-search-query-groups/[id]
 * Get a single AI search query group with its queries.
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

    // Fetch group
    const { data: group, error: groupError } = await serviceSupabase
      .from('ai_search_query_groups')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Fetch queries in this group
    const { data: queries } = await serviceSupabase
      .from('keyword_questions')
      .select(`
        id,
        question,
        funnel_stage,
        added_at,
        created_at,
        keyword_id,
        keywords!inner(id, account_id, name, phrase)
      `)
      .eq('group_id', id)
      .eq('keywords.account_id', accountId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      group: transformGroupToResponse(group, queries?.length || 0),
      queries: queries || [],
    });
  } catch (error: any) {
    console.error('❌ AI search query group GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ai-search-query-groups/[id]
 * Update an AI search query group.
 *
 * Body:
 * - name?: string
 * - displayOrder?: number
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

    // Verify group belongs to this account
    const { data: existingGroup } = await serviceSupabase
      .from('ai_search_query_groups')
      .select('id, name, account_id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, displayOrder } = body;

    // Build update object
    const updates: Record<string, any> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Invalid group name' },
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

      // Can't rename the "General" group
      if (existingGroup.name === DEFAULT_AI_SEARCH_GROUP_NAME && trimmedName !== DEFAULT_AI_SEARCH_GROUP_NAME) {
        return NextResponse.json(
          { error: 'Cannot rename the General group' },
          { status: 400 }
        );
      }

      // Check for name conflict
      const { data: conflicting } = await serviceSupabase
        .from('ai_search_query_groups')
        .select('id')
        .eq('account_id', accountId)
        .eq('name', trimmedName)
        .neq('id', id)
        .maybeSingle();

      if (conflicting) {
        return NextResponse.json(
          { error: 'Another group with this name already exists' },
          { status: 409 }
        );
      }

      updates.name = trimmedName;
    }

    if (displayOrder !== undefined) {
      if (typeof displayOrder !== 'number') {
        return NextResponse.json(
          { error: 'Invalid display order' },
          { status: 400 }
        );
      }
      updates.display_order = displayOrder;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Perform update
    const { data: updatedGroup, error: updateError } = await serviceSupabase
      .from('ai_search_query_groups')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Failed to update AI search query group:', updateError);
      return NextResponse.json(
        { error: 'Failed to update group' },
        { status: 500 }
      );
    }

    // Get query count
    const { count } = await serviceSupabase
      .from('keyword_questions')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', id);

    return NextResponse.json({
      group: transformGroupToResponse(updatedGroup, count || 0),
    });
  } catch (error: any) {
    console.error('❌ AI search query group PUT error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai-search-query-groups/[id]
 * Delete an AI search query group.
 *
 * Queries in the group will have their group_id set to NULL (moved to ungrouped).
 * Cannot delete the "General" group.
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

    // Verify group belongs to this account
    const { data: existingGroup } = await serviceSupabase
      .from('ai_search_query_groups')
      .select('id, name, account_id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Can't delete the "General" group
    if (existingGroup.name === DEFAULT_AI_SEARCH_GROUP_NAME) {
      return NextResponse.json(
        { error: 'Cannot delete the General group' },
        { status: 400 }
      );
    }

    // Get or create "General" group to move queries to
    let generalGroupId: string | null = null;
    const { data: generalGroup } = await serviceSupabase
      .from('ai_search_query_groups')
      .select('id')
      .eq('account_id', accountId)
      .eq('name', DEFAULT_AI_SEARCH_GROUP_NAME)
      .maybeSingle();

    if (generalGroup) {
      generalGroupId = generalGroup.id;
    } else {
      // Create General group
      const { data: newGeneral } = await serviceSupabase
        .from('ai_search_query_groups')
        .insert({
          account_id: accountId,
          name: DEFAULT_AI_SEARCH_GROUP_NAME,
          display_order: 0,
        })
        .select('id')
        .single();

      generalGroupId = newGeneral?.id || null;
    }

    // Move queries to General group (or set to NULL if General doesn't exist)
    const { error: moveError } = await serviceSupabase
      .from('keyword_questions')
      .update({ group_id: generalGroupId })
      .eq('group_id', id);

    if (moveError) {
      console.error('❌ Failed to move queries:', moveError);
      return NextResponse.json(
        { error: 'Failed to move queries to General group' },
        { status: 500 }
      );
    }

    // Delete the group
    const { error: deleteError } = await serviceSupabase
      .from('ai_search_query_groups')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Failed to delete AI search query group:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedGroup: existingGroup.name,
      queriesMovedTo: DEFAULT_AI_SEARCH_GROUP_NAME,
    });
  } catch (error: any) {
    console.error('❌ AI search query group DELETE error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
