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
 * DELETE /api/keyword-research/results/[id]
 *
 * Delete a saved keyword research result.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Verify the result belongs to this account before deleting
    const { data: existing } = await serviceSupabase
      .from('keyword_research_results')
      .select('id')
      .eq('id', id)
      .eq('account_id', accountId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Delete the result
    const { error: deleteError } = await serviceSupabase
      .from('keyword_research_results')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (deleteError) {
      console.error('[KeywordResearch] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete result' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[KeywordResearch] Delete error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
