import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  transformGroupToResponse,
  DEFAULT_GROUP_NAME,
} from '@/features/keywords/keywordUtils';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/keyword-groups
 * List all keyword groups for the account with keyword counts.
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
      .from('keyword_groups')
      .select('*')
      .eq('account_id', accountId)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (groupsError) {
      console.error('❌ Failed to fetch keyword groups:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch keyword groups' },
        { status: 500 }
      );
    }

    // Get keyword counts per group
    const { data: keywordCounts } = await serviceSupabase
      .from('keywords')
      .select('group_id')
      .eq('account_id', accountId);

    const countByGroup: Record<string, number> = {};
    let ungroupedCount = 0;

    for (const kw of keywordCounts || []) {
      if (kw.group_id) {
        countByGroup[kw.group_id] = (countByGroup[kw.group_id] || 0) + 1;
      } else {
        ungroupedCount++;
      }
    }

    // Transform groups with counts
    const transformedGroups = (groups || []).map((g: any) =>
      transformGroupToResponse(g, countByGroup[g.id] || 0)
    );

    return NextResponse.json({
      groups: transformedGroups,
      ungroupedCount,
    });
  } catch (error: any) {
    console.error('❌ Keyword groups GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keyword-groups
 * Create a new keyword group.
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

    // Check if group already exists
    const { data: existingGroup } = await serviceSupabase
      .from('keyword_groups')
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
      .from('keyword_groups')
      .insert({
        account_id: accountId,
        name: trimmedName,
        display_order: displayOrder,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Failed to create keyword group:', insertError);
      return NextResponse.json(
        { error: 'Failed to create keyword group' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { group: transformGroupToResponse(newGroup, 0) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Keyword groups POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper endpoint to ensure "General" group exists for account.
 * Called internally when needed.
 */
export async function ensureGeneralGroup(accountId: string): Promise<string> {
  const { data: existingGroup } = await serviceSupabase
    .from('keyword_groups')
    .select('id')
    .eq('account_id', accountId)
    .eq('name', DEFAULT_GROUP_NAME)
    .maybeSingle();

  if (existingGroup) {
    return existingGroup.id;
  }

  const { data: newGroup, error } = await serviceSupabase
    .from('keyword_groups')
    .insert({
      account_id: accountId,
      name: DEFAULT_GROUP_NAME,
      display_order: 0,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error('Failed to create General group');
  }

  return newGroup.id;
}
