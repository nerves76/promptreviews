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
 * PATCH /api/keyword-groups/reorder
 * Update display order for multiple groups.
 *
 * Body:
 * - updates: Array<{ id: string, displayOrder: number }>
 */
export async function PATCH(request: NextRequest) {
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
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    // Validate all updates have required fields
    for (const update of updates) {
      if (!update.id || typeof update.displayOrder !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have id and displayOrder' },
          { status: 400 }
        );
      }
    }

    // Verify all groups belong to this account before updating
    const groupIds = updates.map(u => u.id);
    const { data: existingGroups, error: verifyError } = await serviceSupabase
      .from('keyword_groups')
      .select('id')
      .eq('account_id', accountId)
      .in('id', groupIds);

    if (verifyError) {
      console.error('❌ Failed to verify group ownership:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify group ownership' },
        { status: 500 }
      );
    }

    if (!existingGroups || existingGroups.length !== updates.length) {
      return NextResponse.json(
        { error: 'One or more groups not found or access denied' },
        { status: 404 }
      );
    }

    // Update each group's display order
    const updatePromises = updates.map(update =>
      serviceSupabase
        .from('keyword_groups')
        .update({ display_order: update.displayOrder })
        .eq('id', update.id)
        .eq('account_id', accountId)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('❌ Failed to update some groups:', errors);
      return NextResponse.json(
        { error: 'Failed to update group order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Keyword groups reorder error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
