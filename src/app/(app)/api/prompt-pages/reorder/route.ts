import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/prompt-pages/reorder
 * Update sort order for prompt pages within a status column
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error in prompt-pages/reorder:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { updates } = body;

    // Validate required fields
    // updates should be an array of { id: string, sort_order: number }
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'updates array is required' },
        { status: 400 }
      );
    }

    // Validate each update object
    for (const update of updates) {
      if (!update.id || typeof update.sort_order !== 'number') {
        return NextResponse.json(
          { error: 'Each update must have id and sort_order' },
          { status: 400 }
        );
      }
    }

    // Get user's account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'No account found for user' },
        { status: 404 }
      );
    }

    // Verify all prompt pages belong to this account
    const pageIds = updates.map(u => u.id);
    const { data: existingPages, error: fetchError } = await supabase
      .from('prompt_pages')
      .select('id, account_id')
      .in('id', pageIds)
      .eq('account_id', accountId);

    if (fetchError || !existingPages || existingPages.length !== pageIds.length) {
      return NextResponse.json(
        { error: 'One or more prompt pages not found or access denied' },
        { status: 404 }
      );
    }

    // Update sort order for each page
    const updatePromises = updates.map(update =>
      supabase
        .from('prompt_pages')
        .update({
          sort_order: update.sort_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
        .eq('account_id', accountId)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Error updating prompt page sort order:', errors);
      return NextResponse.json(
        { error: 'Failed to update some prompt page sort orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: updates.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error reordering prompt pages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder prompt pages' },
      { status: 500 }
    );
  }
}
