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
 * GET /api/rank-tracking-term-groups
 * List all rank tracking term groups for the account with term counts.
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
      .from('rank_tracking_term_groups')
      .select('*')
      .eq('account_id', accountId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (groupsError) {
      // If table doesn't exist, return empty list instead of error
      if (groupsError.code === '42P01' || groupsError.message?.includes('does not exist')) {
        console.warn('⚠️ rank_tracking_term_groups table does not exist, returning empty list');
        return NextResponse.json({ groups: [] });
      }
      console.error('❌ Failed to fetch rank tracking term groups:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    // Auto-create General group if it doesn't exist
    let groupsList = groups || [];
    if (!groupsList.some((g: any) => g.name === DEFAULT_RANK_TRACKING_GROUP_NAME)) {
      const { data: newGeneral } = await serviceSupabase
        .from('rank_tracking_term_groups')
        .insert({
          account_id: accountId,
          name: DEFAULT_RANK_TRACKING_GROUP_NAME,
          display_order: 0,
        })
        .select('*')
        .single();

      if (newGeneral) {
        groupsList = [newGeneral, ...groupsList];
      }
    }

    // Get term counts per group from rank_tracking_terms
    const { data: termCounts, error: termCountsError } = await serviceSupabase
      .from('rank_tracking_terms')
      .select('group_id')
      .eq('account_id', accountId);

    const countByGroup: Record<string, number> = {};

    // If rank_tracking_terms table doesn't exist, just use empty counts
    if (!termCountsError && termCounts) {
      for (const t of termCounts) {
        if (t.group_id) {
          countByGroup[t.group_id] = (countByGroup[t.group_id] || 0) + 1;
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
    console.error('❌ Rank tracking term groups GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rank-tracking-term-groups
 * Create a new rank tracking term group.
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
      .from('rank_tracking_term_groups')
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
      .from('rank_tracking_term_groups')
      .insert({
        account_id: accountId,
        name: trimmedName,
        display_order: displayOrder,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Failed to create rank tracking term group:', insertError);
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
    console.error('❌ Rank tracking term groups POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
