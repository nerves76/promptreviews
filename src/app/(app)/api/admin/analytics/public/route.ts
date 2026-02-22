/**
 * Public Admin Analytics API Endpoint
 *
 * This endpoint provides publicly accessible analytics for embedding.
 * No authentication required - shows platform-wide statistics.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Try to get data from analytics tables first (fast path)
    let analyticsData: any = {};
    let usedFastPath = false;

    try {
      // Get platform metrics for lifetime totals
      const { data: metrics } = await supabaseAdmin
        .from('platform_metrics')
        .select('metric_name, metric_value');

      // Get last 30 days from daily_stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: dailyStats } = await supabaseAdmin
        .from('daily_stats')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Get latest daily snapshot
      const latest = dailyStats?.[0];

      if (metrics && latest) {
        const getMetric = (name: string) => {
          const metric = metrics.find(m => m.metric_name === name);
          return metric ? Number(metric.metric_value) : 0;
        };

        // Calculate monthly totals from daily_stats
        const last30Days = dailyStats?.slice(0, 30) || [];
        const reviewsThisMonth = last30Days.reduce((sum, day) => sum + (day.reviews_captured_today || 0), 0);
        const accountsThisMonth = last30Days.reduce((sum, day) => sum + (day.accounts_created_today || 0), 0);
        const reviewsThisWeek = last30Days.slice(0, 7).reduce((sum, day) => sum + (day.reviews_captured_today || 0), 0);

        analyticsData = {
          totalUsers: getMetric('total_accounts_created'),
          totalAccounts: getMetric('total_accounts_created'),
          totalBusinesses: latest.accounts_total || 0,
          totalReviews: getMetric('total_reviews_captured'),
          totalPromptPages: getMetric('total_prompt_pages_created'),
          totalWidgets: getMetric('total_widgets_created'),
          totalGbpLocations: getMetric('total_gbp_locations_connected'),
          totalGbpPosts: getMetric('total_gbp_posts_published'),
          reviewsThisMonth,
          reviewsThisWeek,
          newUsersThisMonth: accountsThisMonth,
          newAccountsThisMonth: accountsThisMonth,
          newBusinessesThisMonth: 0,
          accountsActive: latest.accounts_active || 0,
          accountsTrial: latest.accounts_trial || 0,
          accountsPaid: latest.accounts_paid || 0,
          reviewsByPlatform: latest.reviews_by_platform || {},
        };

        usedFastPath = true;
      }
    } catch (error) {
      console.log('Analytics tables not available, using slow path');
    }

    // Fallback to slow path if analytics tables aren't available
    // Uses count queries instead of fetching all rows
    if (!usedFastPath) {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Use count queries for totals instead of fetching all rows
      const [
        { count: accountsCount },
        { count: businessesCount },
        { count: reviewsCount },
        { count: promptPagesCount },
        { count: widgetsCount },
        { count: gbpLocationsCount },
        { count: gbpPostsCount },
        { count: reviewsThisMonthCount },
        { count: reviewsThisWeekCount },
        { count: newAccountsThisMonthCount },
        { count: newBusinessesThisMonthCount },
      ] = await Promise.all([
        supabaseAdmin.from('accounts').select('id', { count: 'exact', head: true }).not('email', 'is', null),
        supabaseAdmin.from('businesses').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('review_submissions').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('prompt_pages').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('widgets').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('google_business_locations').select('location_id', { count: 'exact', head: true }).not('location_id', 'is', null),
        supabaseAdmin.from('google_business_scheduled_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabaseAdmin.from('review_submissions').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
        supabaseAdmin.from('review_submissions').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabaseAdmin.from('accounts').select('id', { count: 'exact', head: true }).not('email', 'is', null).gte('created_at', monthAgo.toISOString()),
        supabaseAdmin.from('businesses').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
      ]);

      // Fetch only account status fields for breakdown (minimal columns)
      const { data: accounts } = await supabaseAdmin
        .from('accounts')
        .select('status')
        .not('email', 'is', null);

      const accountsActive = accounts?.filter(a => a.status === 'active').length || 0;
      const accountsTrial = accounts?.filter(a => a.status === 'trial').length || 0;
      const accountsPaid = accounts?.filter(a => a.status === 'paid').length || 0;

      // Fetch only recent reviews for platform distribution (last 90 days, limited)
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const { data: recentReviews } = await supabaseAdmin
        .from('review_submissions')
        .select('platform')
        .gte('created_at', ninetyDaysAgo.toISOString())
        .limit(1000);

      const platformCounts: Record<string, number> = {};
      recentReviews?.forEach((review: { platform: string }) => {
        const platform = review.platform || 'unknown';
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });

      analyticsData = {
        totalUsers: accountsCount || 0,
        totalAccounts: accountsCount || 0,
        totalBusinesses: businessesCount || 0,
        totalReviews: reviewsCount || 0,
        totalPromptPages: promptPagesCount || 0,
        totalWidgets: widgetsCount || 0,
        totalGbpLocations: gbpLocationsCount || 0,
        totalGbpPosts: gbpPostsCount || 0,
        reviewsThisMonth: reviewsThisMonthCount || 0,
        reviewsThisWeek: reviewsThisWeekCount || 0,
        newUsersThisMonth: newAccountsThisMonthCount || 0,
        newAccountsThisMonth: newAccountsThisMonthCount || 0,
        newBusinessesThisMonth: newBusinessesThisMonthCount || 0,
        accountsActive,
        accountsTrial,
        accountsPaid,
        reviewsByPlatform: platformCounts,
      };
    }

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Public admin analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
