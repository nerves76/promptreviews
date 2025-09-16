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

    // Calculate date ranges
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all data using service role (bypasses RLS)
    const [
      { data: accounts, error: accountsError },
      { data: businesses, error: businessesError },
      { data: reviews, error: reviewsError },
      { data: promptPages, error: promptPagesError }
    ] = await Promise.all([
      supabaseAdmin.from('accounts').select('id, created_at').not('email', 'is', null),
      supabaseAdmin.from('businesses').select('id, created_at'),
      supabaseAdmin.from('review_submissions').select('id, created_at, platform, verified'),
      supabaseAdmin.from('prompt_pages').select('id, created_at')
    ]);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
    }

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
      return NextResponse.json({ error: 'Error fetching business data' }, { status: 500 });
    }

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return NextResponse.json({ error: 'Error fetching review data' }, { status: 500 });
    }

    if (promptPagesError) {
      console.error('Error fetching prompt pages:', promptPagesError);
      return NextResponse.json({ error: 'Error fetching prompt page data' }, { status: 500 });
    }

    // Process analytics data
    const analyticsData = {
      totalUsers: accounts?.length || 0,
      totalAccounts: accounts?.length || 0,  // Count of accounts (not businesses)
      totalBusinesses: businesses?.length || 0,
      totalReviews: reviews?.length || 0,
      totalPromptPages: promptPages?.length || 0,
      reviewsThisMonth: reviews?.filter(r => new Date(r.created_at) >= monthAgo).length || 0,
      reviewsThisWeek: reviews?.filter(r => new Date(r.created_at) >= weekAgo).length || 0,
      newUsersThisMonth: accounts?.filter(u => new Date(u.created_at) >= monthAgo).length || 0,
      newAccountsThisMonth: accounts?.filter(a => new Date(a.created_at) >= monthAgo).length || 0,
      newBusinessesThisMonth: businesses?.filter(b => new Date(b.created_at) >= monthAgo).length || 0,
      topPlatforms: [] as { platform: string; count: number }[],
      recentActivity: [] as { date: string; reviews: number; users: number }[],
      businessGrowth: [] as { date: string; count: number }[],
      reviewTrends: [] as { date: string; count: number }[]
    };

    // Calculate platform distribution
    const platformCounts: Record<string, number> = {};
    reviews?.forEach(review => {
      platformCounts[review.platform] = (platformCounts[review.platform] || 0) + 1;
    });
    analyticsData.topPlatforms = Object.entries(platformCounts)
      .map(([platform, count]) => ({ platform, count }))
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