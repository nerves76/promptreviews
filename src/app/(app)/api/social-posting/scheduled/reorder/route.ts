import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface ReorderRequestBody {
  orderedIds: string[]; // Draft post IDs in desired order
}

export async function PATCH(request: NextRequest) {
  try {
    const body: ReorderRequestBody = await request.json();
    const { orderedIds } = body;

    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderedIds array is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Unable to resolve account.' },
        { status: 400 }
      );
    }

    // Verify all IDs belong to this account and are drafts
    const { data: drafts, error: draftsError } = await supabase
      .from('google_business_scheduled_posts')
      .select('id')
      .eq('account_id', accountId)
      .eq('status', 'draft')
      .in('id', orderedIds);

    if (draftsError) {
      console.error('[Reorder] Failed to verify drafts:', draftsError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify draft posts.' },
        { status: 500 }
      );
    }

    if (!drafts || drafts.length !== orderedIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some posts are not valid drafts or do not belong to this account.' },
        { status: 400 }
      );
    }

    // Update queue_order for each draft
    const updatePromises = orderedIds.map((id, index) =>
      supabase
        .from('google_business_scheduled_posts')
        .update({
          queue_order: index + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('account_id', accountId)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error('[Reorder] Some updates failed:', errors);
      return NextResponse.json({
        success: false,
        error: `Failed to update ${errors.length} posts.`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        reorderedCount: orderedIds.length,
      },
    });
  } catch (error) {
    console.error('[Reorder] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error while reordering queue.' },
      { status: 500 }
    );
  }
}
