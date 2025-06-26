/**
 * Admin Analytics Page
 * 
 * This page provides admin-level analytics across all users and businesses.
 * Shows site-wide statistics, user growth, business metrics, and review analytics.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { isAdmin } from '../../../utils/admin';
import { FaUsers, FaBuilding, FaStar, FaChartLine, FaCalendarAlt, FaGlobe } from 'react-icons/fa';

// Use the same Supabase client as the admin page
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface AdminAnalytics {
  totalUsers: number;
  totalBusinesses: number;
  totalReviews: number;
  totalPromptPages: number;
  reviewsThisMonth: number;
  reviewsThisWeek: number;
  newUsersThisMonth: number;
  newBusinessesThisMonth: number;
  topPlatforms: { platform: string; count: number }[];
  recentActivity: { date: string; reviews: number; users: number }[];
  businessGrowth: { month: string; count: number }[];
  reviewTrends: { date: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdminUser) {
      loadAnalytics();
    }
  }, [isAdminUser, timeRange]);

  const checkAdminStatus = async () => {
    console.log('Analytics page: Starting admin status check');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Analytics page: User check result:', { user: user?.id, email: user?.email, error: userError });
      
      if (userError) {
        console.log('Analytics page: User error:', userError);
        router.push('/dashboard');
        return;
      }
      
      if (!user) {
        console.log('Analytics page: No user found, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }
      
      console.log('Analytics page: Checking admin status for user:', user.id);
      const adminStatus = await isAdmin(user.id, supabase);
      console.log('Analytics page: Admin status result:', adminStatus);
      
      if (!adminStatus) {
        console.log('Analytics page: User is not admin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }
      
      console.log('Analytics page: User is admin, setting state');
      setIsAdminUser(true);
      setLoading(false);
    } catch (error) {
      console.log('Analytics page: Error in checkAdminStatus:', error);
      router.push('/dashboard');
    }
  };

  const loadAnalytics = async () => {
    try {
      // Calculate date ranges
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch all data
      const [
        { data: users },
        { data: businesses },
        { data: reviews },
        { data: promptPages },
        { data: analyticsEvents }
      ] = await Promise.all([
        supabase.from('auth.users').select('id, created_at'),
        supabase.from('businesses').select('id, created_at'),
        supabase.from('review_submissions').select('id, created_at, platform, verified'),
        supabase.from('prompt_pages').select('id, created_at'),
        supabase.from('analytics_events').select('*')
      ]);

      // Process analytics data
      const analyticsData: AdminAnalytics = {
        totalUsers: users?.length || 0,
        totalBusinesses: businesses?.length || 0,
        totalReviews: reviews?.length || 0,
        totalPromptPages: promptPages?.length || 0,
        reviewsThisMonth: reviews?.filter(r => new Date(r.created_at) >= monthAgo).length || 0,
        reviewsThisWeek: reviews?.filter(r => new Date(r.created_at) >= weekAgo).length || 0,
        newUsersThisMonth: users?.filter(u => new Date(u.created_at) >= monthAgo).length || 0,
        newBusinessesThisMonth: businesses?.filter(b => new Date(b.created_at) >= monthAgo).length || 0,
        topPlatforms: [],
        recentActivity: [],
        businessGrowth: [],
        reviewTrends: []
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

      users?.forEach(user => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
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
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

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

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading admin analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slateblue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin analytics...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Analytics</h1>
          <p className="mt-2 text-gray-600">Site-wide statistics and performance metrics</p>
        </div>

        {/* Admin Subnav */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/admin"
              className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Content Management
            </Link>
            <Link
              href="/admin/analytics"
              className="border-b-2 border-slateblue py-2 px-1 text-sm font-medium text-slateblue"
            >
              Analytics
            </Link>
          </nav>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-slateblue focus:ring-slateblue"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaUsers className="h-8 w-8 text-slateblue" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">
                    +{analytics.newUsersThisMonth} this month
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaBuilding className="h-8 w-8 text-slateblue" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Businesses</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.totalBusinesses}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">
                    +{analytics.newBusinessesThisMonth} this month
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaStar className="h-8 w-8 text-slateblue" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Reviews</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.totalReviews}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">
                    +{analytics.reviewsThisMonth} this month
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaGlobe className="h-8 w-8 text-slateblue" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Prompt Pages</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.totalPromptPages}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Distribution */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Review Platforms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.topPlatforms.map((platform) => (
                  <div key={platform.platform} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{platform.platform}</span>
                      <span className="text-lg font-semibold text-slateblue">{platform.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity (Last 7 Days)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Reviews
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        New Users
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.recentActivity.map((activity) => (
                      <tr key={activity.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(activity.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.reviews}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.users}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Business Growth Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Growth (Last 6 Months)</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.businessGrowth.map((month) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-slateblue rounded-t"
                      style={{ 
                        height: `${Math.max(10, (month.count / Math.max(...analytics.businessGrowth.map(m => m.count))) * 200)}px` 
                      }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                    <span className="text-sm font-medium text-gray-900">{month.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Trends (Last 30 Days)</h3>
              <div className="h-64 flex items-end justify-between gap-1">
                {analytics.reviewTrends.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 rounded-t"
                      style={{ 
                        height: `${Math.max(2, (day.count / Math.max(...analytics.reviewTrends.map(d => d.count))) * 200)}px` 
                      }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">{new Date(day.date).getDate()}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slateblue hover:text-slateblue/80 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 