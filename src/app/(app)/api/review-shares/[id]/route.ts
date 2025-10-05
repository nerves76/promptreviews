/**
 * Individual Review Share Event API Routes
 * Handles operations on specific share events (delete, update)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Initialize Supabase client with service key for privileged operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * DELETE /api/review-shares/[id]
 * Deletes a specific share event
 * Useful for cleaning up false positives or accidental shares
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // CSRF Protection
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(request);
  if (csrfError) return csrfError;

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Share event ID is required' },
        { status: 400 }
      );
    }

    // Get user from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get account ID respecting client selection if provided
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Fetch the share event to verify ownership
    const { data: shareEvent, error: fetchError } = await supabase
      .from('review_share_events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !shareEvent) {
      return NextResponse.json(
        { error: 'Share event not found' },
        { status: 404 }
      );
    }

    // Verify the share event belongs to the user's account
    if (shareEvent.account_id !== accountId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this share event' },
        { status: 403 }
      );
    }

    // Delete the share event
    const { error: deleteError } = await supabase
      .from('review_share_events')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId); // Double-check account isolation

    if (deleteError) {
      console.error('Error deleting share event:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete share event', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Share event deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/review-shares/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/review-shares/[id]
 * Gets a specific share event by ID
 * Useful for viewing details or verification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Share event ID is required' },
        { status: 400 }
      );
    }

    // Get user from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get account ID respecting client selection if provided
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Fetch the share event
    const { data: shareEvent, error: fetchError } = await supabase
      .from('review_share_events')
      .select('*')
      .eq('id', id)
      .eq('account_id', accountId) // Ensure account isolation
      .single();

    if (fetchError || !shareEvent) {
      return NextResponse.json(
        { error: 'Share event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shareEvent
    });

  } catch (error) {
    console.error('Error in GET /api/review-shares/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
