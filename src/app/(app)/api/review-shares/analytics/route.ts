/**
 * Review Share Analytics API Route
 * Provides aggregated analytics and insights on social sharing
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

/**
 * GET /api/review-shares/analytics
 * Get share analytics for the user's account
 *
 * Query params:
 * - start_date: ISO 8601 date (optional)
 * - end_date: ISO 8601 date (optional)
 * - platform: specific platform filter (optional)
 * - limit: number of top reviews to return (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const platformFilter = searchParams.get('platform') as SharePlatform | null;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

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

    // Build the query with filters - only select needed columns
    let query = supabase
      .from('review_share_events')
      .select('id, review_id, platform, timestamp')
      .eq('account_id', accountId);

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }

    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    if (platformFilter) {
      query = query.eq('platform', platformFilter);
    }

    const { data: events, error: fetchError } = await query.order('timestamp', { ascending: false });

    if (fetchError) {
      console.error('Error fetching share events for analytics:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    const totalShares = events?.length || 0;

    // Calculate shares by platform
    const platformCounts: Record<string, number> = {};
    events?.forEach(event => {
      platformCounts[event.platform] = (platformCounts[event.platform] || 0) + 1;
    });

    const sharesByPlatform = Object.entries(platformCounts).map(([platform, count]) => ({
      platform: platform as SharePlatform,
      count,
      percentage: totalShares > 0 ? Math.round((count / totalShares) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Calculate most shared reviews
    const reviewShareCounts: Record<string, {
      review_id: string;
      count: number;
      platforms: Set<SharePlatform>;
    }> = {};

    events?.forEach(event => {
      if (!reviewShareCounts[event.review_id]) {
        reviewShareCounts[event.review_id] = {
          review_id: event.review_id,
          count: 0,
          platforms: new Set()
        };
      }
      reviewShareCounts[event.review_id].count++;
      reviewShareCounts[event.review_id].platforms.add(event.platform);
    });

    // Get top shared reviews
    const topReviewIds = Object.values(reviewShareCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(r => r.review_id);

    // Fetch review details for the top shared reviews
    let mostSharedReviews: any[] = [];
    if (topReviewIds.length > 0) {
      // Try review_submissions first
      const { data: submissions } = await supabase
        .from('review_submissions')
        .select('id, review_content, first_name, last_name, reviewer_name')
        .in('id', topReviewIds);

      // Try widget_reviews for any not found
      const foundIds = new Set(submissions?.map(s => s.id) || []);
      const missingIds = topReviewIds.filter(id => !foundIds.has(id));

      let widgetReviews: any[] = [];
      if (missingIds.length > 0) {
        const { data: widgets } = await supabase
          .from('widget_reviews')
          .select('id, review_content, first_name, last_name')
          .in('id', missingIds);
        widgetReviews = widgets || [];
      }

      const allReviews = [...(submissions || []), ...widgetReviews];

      mostSharedReviews = topReviewIds.map(reviewId => {
        const reviewData = allReviews.find(r => r.id === reviewId);
        const shareData = reviewShareCounts[reviewId];

        let reviewerName = 'Anonymous';
        if (reviewData) {
          if (reviewData.reviewer_name) {
            reviewerName = reviewData.reviewer_name;
          } else if (reviewData.first_name || reviewData.last_name) {
            reviewerName = [reviewData.first_name, reviewData.last_name]
              .filter(Boolean)
              .join(' ')
              .trim() || 'Anonymous';
          }
        }

        return {
          review_id: reviewId,
          review_content: reviewData?.review_content?.substring(0, 100) + (reviewData?.review_content?.length > 100 ? '...' : '') || null,
          reviewer_name: reviewerName,
          share_count: shareData.count,
          platforms: Array.from(shareData.platforms)
        };
      });
    }

    // Build time period info
    const timePeriod = (startDate || endDate) ? {
      start_date: startDate || undefined,
      end_date: endDate || undefined
    } : undefined;

    return NextResponse.json({
      total_shares: totalShares,
      shares_by_platform: sharesByPlatform,
      most_shared_reviews: mostSharedReviews,
      time_period: timePeriod
    });

  } catch (error) {
    console.error('Error in GET /api/review-shares/analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
