import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_RANK_TRACKING_GROUP_NAME } from '@/lib/groupConstants';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface RankTrackingTermGroupData {
  id: string;
  name: string;
  displayOrder: number;
  termCount: number;
  createdAt: string;
  updatedAt: string;
}

function transformGroupToResponse(
  group: any,
  termCount: number
): RankTrackingTermGroupData {
  return {
    id: group.id,
    name: group.name,
    displayOrder: group.display_order ?? 0,
    termCount,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
  };
}

/**
 * GET /api/rank-tracking-term-groups/[id]
 * Get a single rank tracking term group with its terms.
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
      .from('rank_tracking_term_groups')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Fetch terms in this group
    const { data: terms } = await serviceSupabase
      .from('rank_tracking_terms')
      .select(`
        id,
        term,
        is_canonical,
        added_at,
        created_at,
        keyword_id,
        keywords(id, name, phrase)
      `)
      .eq('group_id', id)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      group: transformGroupToResponse(group, terms?.length || 0),
      terms: terms || [],
    });
  } catch (error: any) {
    console.error('❌ Rank tracking term group GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rank-tracking-term-groups/[id]
 * Update a rank tracking term group.
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
      .from('rank_tracking_term_groups')
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
      if (existingGroup.name === DEFAULT_RANK_TRACKING_GROUP_NAME && trimmedName !== DEFAULT_RANK_TRACKING_GROUP_NAME) {
        return NextResponse.json(
          { error: 'Cannot rename the General group' },
          { status: 400 }
        );
      }

      // Check for name conflict
      const { data: conflicting } = await serviceSupabase
        .from('rank_tracking_term_groups')
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
      .from('rank_tracking_term_groups')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Failed to update rank tracking term group:', updateError);
      return NextResponse.json(
        { error: 'Failed to update group' },
        { status: 500 }
      );
    }

    // Get term count
    const { count } = await serviceSupabase
      .from('rank_tracking_terms')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', id)
      .eq('account_id', accountId);

    return NextResponse.json({
      group: transformGroupToResponse(updatedGroup, count || 0),
    });
  } catch (error: any) {
    console.error('❌ Rank tracking term group PUT error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rank-tracking-term-groups/[id]
 * Delete a rank tracking term group.
 *
 * Terms in the group will have their group_id set to NULL (moved to ungrouped).
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
      .from('rank_tracking_term_groups')
      .select('id, name, account_id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Can't delete the "General" group
    if (existingGroup.name === DEFAULT_RANK_TRACKING_GROUP_NAME) {
      return NextResponse.json(
        { error: 'Cannot delete the General group' },
        { status: 400 }
      );
    }

    // Get or create "General" group to move terms to
    let generalGroupId: string | null = null;
    const { data: generalGroup } = await serviceSupabase
      .from('rank_tracking_term_groups')
      .select('id')
      .eq('account_id', accountId)
      .eq('name', DEFAULT_RANK_TRACKING_GROUP_NAME)
      .maybeSingle();

    if (generalGroup) {
      generalGroupId = generalGroup.id;
    } else {
      // Create General group
      const { data: newGeneral } = await serviceSupabase
        .from('rank_tracking_term_groups')
        .insert({
          account_id: accountId,
          name: DEFAULT_RANK_TRACKING_GROUP_NAME,
          display_order: 0,
        })
        .select('id')
        .single();

      generalGroupId = newGeneral?.id || null;
    }

    // Move terms to General group (or set to NULL if General doesn't exist)
    const { error: moveError } = await serviceSupabase
      .from('rank_tracking_terms')
      .update({ group_id: generalGroupId })
      .eq('group_id', id)
      .eq('account_id', accountId);

    if (moveError) {
      console.error('❌ Failed to move terms:', moveError);
      return NextResponse.json(
        { error: 'Failed to move terms to General group' },
        { status: 500 }
      );
    }

    // Delete the group
    const { error: deleteError } = await serviceSupabase
      .from('rank_tracking_term_groups')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Failed to delete rank tracking term group:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedGroup: existingGroup.name,
      termsMovedTo: DEFAULT_RANK_TRACKING_GROUP_NAME,
    });
  } catch (error: any) {
    console.error('❌ Rank tracking term group DELETE error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
