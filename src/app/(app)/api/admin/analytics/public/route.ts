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
    if (!usedFastPath) {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        { data: accounts },
        { data: businesses },
        { data: reviews },
        { data: promptPages },
        { data: widgets },
        { data: gbpLocations }
      ] = await Promise.all([
        supabaseAdmin.from('accounts').select('id, created_at, status').not('email', 'is', null),
        supabaseAdmin.from('businesses').select('id, created_at'),
        supabaseAdmin.from('review_submissions').select('id, created_at, platform, verified'),
        supabaseAdmin.from('prompt_pages').select('id, created_at'),
        supabaseAdmin.from('widgets').select('id, created_at'),
        supabaseAdmin.from('google_business_locations').select('location_id').not('location_id', 'is', null)
      ]);

      // Count GBP posts
      const { count: gbpPostsCount } = await supabaseAdmin
        .from('google_business_scheduled_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');

      // Calculate account status breakdown
      const accountsActive = accounts?.filter(a => a.status === 'active').length || 0;
      const accountsTrial = accounts?.filter(a => a.status === 'trial').length || 0;
      const accountsPaid = accounts?.filter(a => a.status === 'paid').length || 0;

      // Calculate platform distribution
      const platformCounts: Record<string, number> = {};
      reviews?.forEach(review => {
        const platform = review.platform || 'unknown';
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });

      analyticsData = {
        totalUsers: accounts?.length || 0,
        totalAccounts: accounts?.length || 0,
        totalBusinesses: businesses?.length || 0,
        totalReviews: reviews?.length || 0,
        totalPromptPages: promptPages?.length || 0,
        totalWidgets: widgets?.length || 0,
        totalGbpLocations: new Set(gbpLocations?.map(l => l.location_id)).size || 0,
        totalGbpPosts: gbpPostsCount || 0,
        reviewsThisMonth: reviews?.filter(r => new Date(r.created_at) >= monthAgo).length || 0,
        reviewsThisWeek: reviews?.filter(r => new Date(r.created_at) >= weekAgo).length || 0,
        newUsersThisMonth: accounts?.filter(u => new Date(u.created_at) >= monthAgo).length || 0,
        newAccountsThisMonth: accounts?.filter(a => new Date(a.created_at) >= monthAgo).length || 0,
        newBusinessesThisMonth: businesses?.filter(b => new Date(b.created_at) >= monthAgo).length || 0,
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
