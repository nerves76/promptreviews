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
      const { data: metrics } = await supabaseAdmin
        .from('platform_metrics')
        .select('metric_name, metric_value');

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
        { data: promptPages }
      ] = await Promise.all([
        supabaseAdmin.from('accounts').select('id, created_at').not('email', 'is', null),
        supabaseAdmin.from('businesses').select('id, created_at'),
        supabaseAdmin.from('review_submissions').select('id, created_at, platform, verified'),
        supabaseAdmin.from('prompt_pages').select('id, created_at')
      ]);

      analyticsData = {
        totalUsers: accounts?.length || 0,
        totalAccounts: accounts?.length || 0,
        totalBusinesses: businesses?.length || 0,
        totalReviews: reviews?.length || 0,
        totalPromptPages: promptPages?.length || 0,
        reviewsThisMonth: reviews?.filter(r => new Date(r.created_at) >= monthAgo).length || 0,
        reviewsThisWeek: reviews?.filter(r => new Date(r.created_at) >= weekAgo).length || 0,
        newUsersThisMonth: accounts?.filter(u => new Date(u.created_at) >= monthAgo).length || 0,
        newAccountsThisMonth: accounts?.filter(a => new Date(a.created_at) >= monthAgo).length || 0,
        newBusinessesThisMonth: businesses?.filter(b => new Date(b.created_at) >= monthAgo).length || 0,
        reviewsByPlatform: {},
        topPlatforms: [],
        recentActivity: [],
        businessGrowth: [],
        reviewTrends: []
      };

      console.log('⚠️  Using slow analytics path');
    }

    // Calculate platform distribution
    const platformCounts = analyticsData.reviewsByPlatform || {};
    analyticsData.topPlatforms = Object.entries(platformCounts)
      .map(([platform, count]) => ({ platform, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate recent activity (last 7 days)
    const activityMap: Record<string, { reviews: number; users: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      activityMap[dateStr] = { reviews: 0, users: 0 };
    }

    reviews?.forEach(review => {
      const date = new Date(review.created_at).toISOString().split('T')[0];
      if (activityMap[date]) {
        activityMap[date].reviews++;
      }
    });

    accounts?.forEach(account => {
      const date = new Date(account.created_at).toISOString().split('T')[0];
      if (activityMap[date]) {
        activityMap[date].users++;
      }
    });

    analyticsData.recentActivity = Object.entries(activityMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate business growth (last 6 months)
    const growthMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      growthMap[monthStr] = 0;
    }

    businesses?.forEach(business => {
      const month = new Date(business.created_at).toISOString().slice(0, 7);
      if (growthMap[month] !== undefined) {
        growthMap[month]++;
      }
    });

    analyticsData.businessGrowth = Object.entries(growthMap)
      .map(([month, count]) => ({ date: month, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate review trends (last 30 days)
    const trendMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      trendMap[dateStr] = 0;
    }

    reviews?.forEach(review => {
      const date = new Date(review.created_at).toISOString().split('T')[0];
      if (trendMap[date] !== undefined) {
        trendMap[date]++;
      }
    });

    analyticsData.reviewTrends = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 