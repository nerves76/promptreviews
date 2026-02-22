/**
 * Admin Analytics API Endpoint
 * 
 * This endpoint provides admin-level analytics across all users and businesses.
 * Uses service role key to bypass RLS and get accurate site-wide statistics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/utils/admin';

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get current user session for admin check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user and check admin status
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const adminStatus = await isAdmin(user.id, supabaseAdmin);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Try to get data from analytics tables first (much faster!)
    let analyticsData: any = {};
    let usedFastPath = false;

    try {
      // Get platform metrics for lifetime totals
      const [{ data: metrics }, { count: reviewsCapturedFast }, { count: accountsCountFast }, { data: activeAccountUsers }] = await Promise.all([
        supabaseAdmin
          .from('platform_metrics')
          .select('metric_name, metric_value'),
        supabaseAdmin
          .from('review_submissions')
          .select('id', { count: 'exact', head: true })
          .not('prompt_page_id', 'is', null),
        supabaseAdmin
          .from('accounts')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null),
        supabaseAdmin
          .from('account_users')
          .select('user_id, accounts!inner(id)')
          .is('accounts.deleted_at', null)
      ]);

      // Get last 30 days from daily_stats for monthly totals
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
        // Use fast path with analytics tables
        const getMetric = (name: string) => {
          const metric = metrics.find(m => m.metric_name === name);
          return metric ? Number(metric.metric_value) : 0;
        };

        // Calculate monthly totals from daily_stats
        const last30Days = dailyStats?.slice(0, 30) || [];
        const reviewsThisMonth = last30Days.reduce((sum, day) => sum + (day.reviews_captured_today || 0), 0);
        const accountsThisMonth = last30Days.reduce((sum, day) => sum + (day.accounts_created_today || 0), 0);
        const reviewsThisWeek = last30Days.slice(0, 7).reduce((sum, day) => sum + (day.reviews_captured_today || 0), 0);

        const uniqueUsersFast = new Set(activeAccountUsers?.map(u => u.user_id));

        analyticsData = {
          totalUsers: uniqueUsersFast.size || 0,
          totalAccounts: accountsCountFast || 0,
          totalBusinesses: latest.accounts_total || 0,
          totalReviews: getMetric('total_reviews_captured'),
          reviewsCaptured: reviewsCapturedFast || 0,
          totalPromptPages: getMetric('total_prompt_pages_created'),
          totalWidgets: getMetric('total_widgets_created'),
          totalGbpLocations: getMetric('total_gbp_locations_connected'),
          totalGbpPosts: getMetric('total_gbp_posts_published'),
          reviewsThisMonth,
          reviewsThisWeek,
          newUsersThisMonth: accountsThisMonth,
          newAccountsThisMonth: accountsThisMonth,
          newBusinessesThisMonth: 0, // Not tracked yet
          accountsActive: latest.accounts_active || 0,
          accountsTrial: latest.accounts_trial || 0,
          accountsPaid: latest.accounts_paid || 0,
          reviewsByPlatform: latest.reviews_by_platform || {},
          topPlatforms: [],
          recentActivity: [],
          businessGrowth: [],
          reviewTrends: []
        };

        usedFastPath = true;
        console.log('✅ Using fast analytics path');
      }
    } catch (error) {
      console.log('Analytics tables not available, using slow path');
    }

    // Fallback to slow path if analytics tables aren't available
    // Uses count queries and date-filtered queries instead of fetching all records
    if (!usedFastPath) {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      // Use count queries for totals instead of fetching all rows
      const [
        { count: accountsCount },
        { count: businessesCount },
        { count: reviewsCount },
        { count: promptPagesCount },
        { count: widgetsCount },
        { count: gbpLocationsCount },
        { count: reviewsCapturedCount },
        { data: accountUsers },
        { count: gbpPostsCount },
      ] = await Promise.all([
        supabaseAdmin.from('accounts').select('id', { count: 'exact', head: true }).not('email', 'is', null).is('deleted_at', null),
        supabaseAdmin.from('businesses').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('review_submissions').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('prompt_pages').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('widgets').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('google_business_locations').select('location_id', { count: 'exact', head: true }).not('location_id', 'is', null),
        supabaseAdmin.from('review_submissions').select('id', { count: 'exact', head: true }).not('prompt_page_id', 'is', null),
        supabaseAdmin.from('account_users').select('user_id, accounts!inner(id)').is('accounts.deleted_at', null),
        supabaseAdmin.from('google_business_scheduled_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      ]);

      // Use count queries for time-based metrics instead of fetching all rows and filtering
      const [
        { count: reviewsThisMonthCount },
        { count: reviewsThisWeekCount },
        { count: newAccountsThisMonthCount },
        { count: newBusinessesThisMonthCount },
      ] = await Promise.all([
        supabaseAdmin.from('review_submissions').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
        supabaseAdmin.from('review_submissions').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabaseAdmin.from('accounts').select('id', { count: 'exact', head: true }).not('email', 'is', null).is('deleted_at', null).gte('created_at', monthAgo.toISOString()),
        supabaseAdmin.from('businesses').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
      ]);

      // Fetch only accounts needed for status breakdown (with limited columns)
      const { data: accounts } = await supabaseAdmin
        .from('accounts')
        .select('subscription_status, is_free_account, trial_end')
        .not('email', 'is', null)
        .is('deleted_at', null);

      // Calculate account status breakdown
      const accountsActive = accounts?.filter(a =>
        a.subscription_status === 'active' ||
        a.subscription_status === 'trialing' ||
        (a.trial_end && new Date(a.trial_end) > now)
      ).length || 0;
      const accountsTrial = accounts?.filter(a =>
        a.subscription_status === 'trialing' ||
        (a.trial_end && new Date(a.trial_end) > now && !a.subscription_status)
      ).length || 0;
      const accountsPaid = accounts?.filter(a =>
        a.subscription_status === 'active' && !a.is_free_account
      ).length || 0;

      // Fetch only recent reviews for platform distribution (last 90 days max, limited to 1000)
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

      // Calculate recent activity (last 7 days) - fetch only last 7 days of data
      const activityMap: Record<string, { reviews: number; users: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        activityMap[dateStr] = { reviews: 0, users: 0 };
      }

      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const [{ data: weekReviews }, { data: weekAccounts }] = await Promise.all([
        supabaseAdmin.from('review_submissions').select('created_at').gte('created_at', sevenDaysAgo.toISOString()).limit(1000),
        supabaseAdmin.from('accounts').select('created_at').not('email', 'is', null).is('deleted_at', null).gte('created_at', sevenDaysAgo.toISOString()).limit(1000),
      ]);

      weekReviews?.forEach((review: { created_at: string }) => {
        const date = new Date(review.created_at).toISOString().split('T')[0];
        if (activityMap[date]) {
          activityMap[date].reviews++;
        }
      });

      weekAccounts?.forEach((account: { created_at: string }) => {
        const date = new Date(account.created_at).toISOString().split('T')[0];
        if (activityMap[date]) {
          activityMap[date].users++;
        }
      });

      const recentActivity = Object.entries(activityMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate business growth (last 6 months) - fetch only last 6 months
      const growthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().slice(0, 7);
        growthMap[monthStr] = 0;
      }

      const { data: recentBusinesses } = await supabaseAdmin
        .from('businesses')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .limit(1000);

      recentBusinesses?.forEach((business: { created_at: string }) => {
        const month = new Date(business.created_at).toISOString().slice(0, 7);
        if (growthMap[month] !== undefined) {
          growthMap[month]++;
        }
      });

      const businessGrowth = Object.entries(growthMap)
        .map(([month, count]) => ({ date: month, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate review trends (last 30 days) - fetch only last 30 days
      const trendMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        trendMap[dateStr] = 0;
      }

      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const { data: monthReviews } = await supabaseAdmin
        .from('review_submissions')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(1000);

      monthReviews?.forEach((review: { created_at: string }) => {
        const date = new Date(review.created_at).toISOString().split('T')[0];
        if (trendMap[date] !== undefined) {
          trendMap[date]++;
        }
      });

      const reviewTrends = Object.entries(trendMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const uniqueUserIds = new Set(accountUsers?.map(u => u.user_id));

      analyticsData = {
        totalUsers: uniqueUserIds.size || 0,
        totalAccounts: accountsCount || 0,
        totalBusinesses: businessesCount || 0,
        totalReviews: reviewsCount || 0,
        reviewsCaptured: reviewsCapturedCount || 0,
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
        topPlatforms: [],
        recentActivity,
        businessGrowth,
        reviewTrends
      };

      console.log('⚠️  Using slow analytics path (optimized with count queries)');
    }

    // Calculate platform distribution
    const platformCountsFinal = analyticsData.reviewsByPlatform || {};
    analyticsData.topPlatforms = Object.entries(platformCountsFinal)
      .map(([platform, count]) => ({ platform, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Admin analytics error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Admin analytics error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
} 