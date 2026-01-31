/**
 * Admin Analytics API Endpoint
 * 
 * This endpoint provides admin-level analytics across all users and businesses.
 * Uses service role key to bypass RLS and get accurate site-wide statistics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/auth/utils/admin';

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
      const [{ data: metrics }, { count: reviewsCapturedFast }, { count: accountsCountFast }] = await Promise.all([
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
          .is('deleted_at', null)
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

        analyticsData = {
          totalUsers: getMetric('total_accounts_created'),
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
        { data: gbpLocations },
        { count: reviewsCapturedCount },
        { data: accountUsers }
      ] = await Promise.all([
        supabaseAdmin.from('accounts').select('id, created_at, subscription_status, plan, is_free_account, trial_end').not('email', 'is', null).is('deleted_at', null),
        supabaseAdmin.from('businesses').select('id, created_at'),
        supabaseAdmin.from('review_submissions').select('id, created_at, platform, verified'),
        supabaseAdmin.from('prompt_pages').select('id, created_at'),
        supabaseAdmin.from('widgets').select('id, created_at'),
        supabaseAdmin.from('google_business_locations').select('location_id').not('location_id', 'is', null),
        supabaseAdmin.from('review_submissions').select('id', { count: 'exact', head: true }).not('prompt_page_id', 'is', null),
        supabaseAdmin.from('account_users').select('user_id')
      ]);

      // Count GBP posts
      const { count: gbpPostsCount } = await supabaseAdmin
        .from('google_business_scheduled_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');

      // Calculate account status breakdown
      // subscription_status values: 'active', 'trialing', 'canceled', 'incomplete', 'past_due', null
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

      // Calculate platform distribution
      const platformCounts: Record<string, number> = {};
      reviews?.forEach(review => {
        const platform = review.platform || 'unknown';
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });

      // Calculate recent activity (last 7 days)
      const activityMap: Record<string, { reviews: number; users: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        activityMap[dateStr] = { reviews: 0, users: 0 };
      }

      reviews?.forEach((review: { created_at: string }) => {
        const date = new Date(review.created_at).toISOString().split('T')[0];
        if (activityMap[date]) {
          activityMap[date].reviews++;
        }
      });

      accounts?.forEach((account: { created_at: string }) => {
        const date = new Date(account.created_at).toISOString().split('T')[0];
        if (activityMap[date]) {
          activityMap[date].users++;
        }
      });

      const recentActivity = Object.entries(activityMap)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate business growth (last 6 months)
      const growthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().slice(0, 7);
        growthMap[monthStr] = 0;
      }

      businesses?.forEach((business: { created_at: string }) => {
        const month = new Date(business.created_at).toISOString().slice(0, 7);
        if (growthMap[month] !== undefined) {
          growthMap[month]++;
        }
      });

      const businessGrowth = Object.entries(growthMap)
        .map(([month, count]) => ({ date: month, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate review trends (last 30 days)
      const trendMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        trendMap[dateStr] = 0;
      }

      reviews?.forEach((review: { created_at: string }) => {
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
        totalAccounts: accounts?.length || 0,
        totalBusinesses: businesses?.length || 0,
        totalReviews: reviews?.length || 0,
        reviewsCaptured: reviewsCapturedCount || 0,
        totalPromptPages: promptPages?.length || 0,
        totalWidgets: widgets?.length || 0,
        totalGbpLocations: new Set(gbpLocations?.map(l => l.location_id)).size || 0,
        totalGbpPosts: gbpPostsCount || 0,
        reviewsThisMonth: reviews?.filter((r: { created_at: string }) => new Date(r.created_at) >= monthAgo).length || 0,
        reviewsThisWeek: reviews?.filter((r: { created_at: string }) => new Date(r.created_at) >= weekAgo).length || 0,
        newUsersThisMonth: accounts?.filter((u: { created_at: string }) => new Date(u.created_at) >= monthAgo).length || 0,
        newAccountsThisMonth: accounts?.filter((a: { created_at: string }) => new Date(a.created_at) >= monthAgo).length || 0,
        newBusinessesThisMonth: businesses?.filter((b: { created_at: string }) => new Date(b.created_at) >= monthAgo).length || 0,
        accountsActive,
        accountsTrial,
        accountsPaid,
        reviewsByPlatform: platformCounts,
        topPlatforms: [],
        recentActivity,
        businessGrowth,
        reviewTrends
      };

      console.log('⚠️  Using slow analytics path');
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