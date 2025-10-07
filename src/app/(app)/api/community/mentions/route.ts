/**
 * Community Mentions API
 *
 * GET /api/community/mentions - List user's mentions
 * PATCH /api/community/mentions/read - Mark mentions as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../utils/auth';
import { createServiceClient } from '../utils/supabase';
import { validatePagination } from '../utils/validation';

/**
 * GET /api/community/mentions
 * Returns list of mentions for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const { limit, offset } = validatePagination({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    });

    // Build query
    const supabase = createServiceClient();
    let query = supabase
      .from('mentions')
      .select('*', { count: 'exact' })
      .eq('mentioned_user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by unread if requested
    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data: mentions, error, count } = await query;

    if (error) {
      console.error('Error fetching mentions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mentions', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: mentions || [],
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    });

  } catch (error) {
    console.error('Mentions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/community/mentions/read
 * Marks mentions as read
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Parse request body
    const body = await request.json();
    const { mention_ids } = body;

    if (!mention_ids || !Array.isArray(mention_ids)) {
      return NextResponse.json(
        { error: 'mention_ids array is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (mention_ids.length === 0) {
      return NextResponse.json({ data: { updated: 0 } });
    }

    // Mark mentions as read (only if they belong to the user)
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('mentions')
      .update({ read_at: new Date().toISOString() })
      .in('id', mention_ids)
      .eq('mentioned_user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Error marking mentions as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark mentions as read', code: 'SERVER_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { updated: mention_ids.length } });

  } catch (error) {
    console.error('Mentions mark read API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
