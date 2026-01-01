/**
 * API endpoint to process a scheduled post immediately
 * Used for "Post now" functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    // Verify the post belongs to this account and is pending
    const supabaseAdmin = createServiceRoleClient();
    const { data: post, error: postError } = await supabaseAdmin
      .from('google_business_scheduled_posts')
      .select('id, account_id, status')
      .eq('id', postId)
      .eq('account_id', accountId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Post is already ${post.status}` },
        { status: 400 }
      );
    }

    // Call the cron endpoint internally to process this specific post
    // We'll trigger the cron with an internal flag
    const cronUrl = new URL('/api/cron/process-google-business-scheduled', request.url);
    const cronSecret = process.env.CRON_SECRET_TOKEN || process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    // First, ensure the post's scheduled_date is today or earlier so the cron picks it up
    await supabaseAdmin
      .from('google_business_scheduled_posts')
      .update({
        scheduled_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', postId);

    // Trigger the cron
    const cronResponse = await fetch(cronUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    if (!cronResponse.ok) {
      const errorText = await cronResponse.text();
      console.error('[ProcessNow] Cron trigger failed:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to trigger immediate processing' },
        { status: 500 }
      );
    }

    const cronResult = await cronResponse.json();

    // Check if our post was processed
    const { data: updatedPost } = await supabaseAdmin
      .from('google_business_scheduled_posts')
      .select('status, error_log, published_at')
      .eq('id', postId)
      .single();

    return NextResponse.json({
      success: true,
      postStatus: updatedPost?.status,
      publishedAt: updatedPost?.published_at,
      errorLog: updatedPost?.error_log,
      cronResult,
    });
  } catch (error) {
    console.error('[ProcessNow] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
