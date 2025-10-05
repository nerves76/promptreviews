/**
 * Review Share Events API Routes
 * Handles tracking of social sharing events for reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import type { SharePlatform } from '@/types/review-shares';

// Initialize Supabase client with service key for privileged operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Valid platforms enum
const VALID_PLATFORMS: SharePlatform[] = [
  'facebook',
  'linkedin',
  'twitter',
  'bluesky',
  'reddit',
  'pinterest',
  'email',
  'sms'
];

/**
 * POST /api/review-shares
 * Creates a new share event for tracking
 */
export async function POST(request: NextRequest) {
  // CSRF Protection
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const { review_id, platform } = body;

    // Validate required fields
    if (!review_id || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: review_id and platform are required' },
        { status: 400 }
      );
    }

    // Validate platform
    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user from request headers (set by middleware)
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
        { error: 'Account not found. Please ensure you have completed the signup process.' },
        { status: 404 }
      );
    }

    // Verify the review exists and belongs to the user's account
    // Check both review_submissions and widget_reviews tables
    const { data: reviewSubmission } = await supabase
      .from('review_submissions')
      .select('id, business_id')
      .eq('id', review_id)
      .single();

    const { data: widgetReview } = await supabase
      .from('widget_reviews')
      .select('id, business_id')
      .eq('id', review_id)
      .single();

    const review = reviewSubmission || widgetReview;

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Verify the review's business belongs to the user's account
    if (review.business_id) {
      const { data: business } = await supabase
        .from('businesses')
        .select('account_id')
        .eq('id', review.business_id)
        .single();

      if (!business || business.account_id !== accountId) {
        return NextResponse.json(
          { error: 'You do not have permission to track shares for this review' },
          { status: 403 }
        );
      }
    }

    // Create the share event
    const shareEventData = {
      review_id,
      account_id: accountId,
      user_id: user.id,
      platform,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: shareEvent, error: createError } = await supabase
      .from('review_share_events')
      .insert(shareEventData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating share event:', createError);
      return NextResponse.json(
        { error: 'Failed to create share event', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shareEvent
    });

  } catch (error) {
    console.error('Error in POST /api/review-shares:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/review-shares?reviewId={id}
 * Get share history for a specific review
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Missing required parameter: reviewId' },
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

    // Verify the review exists and belongs to the user's account
    const { data: reviewSubmission } = await supabase
      .from('review_submissions')
      .select('id, business_id')
      .eq('id', reviewId)
      .single();

    const { data: widgetReview } = await supabase
      .from('widget_reviews')
      .select('id, business_id')
      .eq('id', reviewId)
      .single();

    const review = reviewSubmission || widgetReview;

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Verify the review's business belongs to the user's account
    if (review.business_id) {
      const { data: business } = await supabase
        .from('businesses')
        .select('account_id')
        .eq('id', review.business_id)
        .single();

      if (!business || business.account_id !== accountId) {
        return NextResponse.json(
          { error: 'You do not have permission to view shares for this review' },
          { status: 403 }
        );
      }
    }

    // Get all share events for this review - only select needed columns
    const { data: events, error: fetchError } = await supabase
      .from('review_share_events')
      .select('id, platform, timestamp, user_id')
      .eq('review_id', reviewId)
      .eq('account_id', accountId)
      .order('timestamp', { ascending: false });

    if (fetchError) {
      console.error('Error fetching share events:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch share events' },
        { status: 500 }
      );
    }

    // Group by platform for easy display
    const sharesByPlatform = events?.reduce((acc: any, event: any) => {
      const platform = event.platform;
      if (!acc[platform]) {
        acc[platform] = {
          platform,
          count: 0,
          last_shared_at: event.timestamp
        };
      }
      acc[platform].count++;
      // Keep the most recent timestamp
      if (new Date(event.timestamp) > new Date(acc[platform].last_shared_at)) {
        acc[platform].last_shared_at = event.timestamp;
      }
      return acc;
    }, {});

    return NextResponse.json({
      review_id: reviewId,
      total_shares: events?.length || 0,
      shares_by_platform: Object.values(sharesByPlatform || {}),
      events: events || []
    });

  } catch (error) {
    console.error('Error in GET /api/review-shares:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
