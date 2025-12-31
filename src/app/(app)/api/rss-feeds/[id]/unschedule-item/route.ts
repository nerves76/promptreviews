/**
 * RSS Feed Unschedule Item API
 * POST /api/rss-feeds/[id]/unschedule-item - Unschedule a scheduled item
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UnscheduleRequest {
  itemId: string; // The rss_feed_items ID
}

/**
 * POST /api/rss-feeds/[id]/unschedule-item
 * Unschedule a scheduled RSS item (deletes the scheduled post)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UnscheduleRequest = await request.json();

    if (!body.itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Verify feed ownership
    const { data: feed, error: feedError } = await supabase
      .from('rss_feed_sources')
      .select('id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (feedError || !feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    // Get the item and its scheduled post ID
    const { data: item, error: itemError } = await supabase
      .from('rss_feed_items')
      .select('id, scheduled_post_id, status')
      .eq('id', body.itemId)
      .eq('feed_source_id', id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Item is not scheduled' },
        { status: 400 }
      );
    }

    // Delete the scheduled post if it exists
    if (item.scheduled_post_id) {
      // First check if the post exists and is still pending
      const { data: post } = await supabase
        .from('google_business_scheduled_posts')
        .select('id, status')
        .eq('id', item.scheduled_post_id)
        .single();

      if (post && post.status === 'pending') {
        // Delete associated results first
        await supabase
          .from('google_business_scheduled_post_results')
          .delete()
          .eq('scheduled_post_id', item.scheduled_post_id);

        // Delete the scheduled post
        await supabase
          .from('google_business_scheduled_posts')
          .delete()
          .eq('id', item.scheduled_post_id);
      }
    }

    // Update the RSS item status back to initial_sync so user can reschedule
    const { error: updateError } = await supabase
      .from('rss_feed_items')
      .update({
        status: 'initial_sync',
        scheduled_post_id: null,
        skip_reason: 'unscheduled',
        processed_at: new Date().toISOString(),
      })
      .eq('id', body.itemId);

    if (updateError) {
      console.error('[RSS Unschedule] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Item unscheduled successfully',
    });
  } catch (error) {
    console.error('[RSS Unschedule] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
