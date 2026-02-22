/**
 * Admin Analytics Page
 * 
 * This page provides admin-level analytics across all users and businesses.
 * Shows site-wide statistics, user growth, business metrics, and review analytics.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/auth/providers/supabase';
import { isAdmin } from '@/utils/admin';
import Icon from '@/components/Icon';
import StandardLoader from '@/app/(app)/components/StandardLoader';
import { apiClient } from '@/utils/apiClient';

// Using singleton Supabase client from supabaseClient.ts

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
  const supabase = createClient();

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
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        router.push('/dashboard');
        return;
      }
      
      if (!user) {
        router.push('/dashboard');
        return;
      }
      
      const adminStatus = await isAdmin(user.id, supabase);
      
      if (!adminStatus) {
        router.push('/dashboard');
        return;
      }
      
      setIsAdminUser(true);
      setLoading(false);
    } catch (error) {
      router.push('/dashboard');
    }
  };

  const loadAnalytics = async () => {
    try {
      // Use the admin analytics API endpoint instead of direct client-side queries.
      // The API uses optimized count queries and date-filtered fetches.
      const data = await apiClient.get<any>('/admin/analytics');

      const analyticsData: AdminAnalytics = {
        totalUsers: data.totalUsers || 0,
        totalBusinesses: data.totalBusinesses || 0,
        totalReviews: data.totalReviews || 0,
        totalPromptPages: data.totalPromptPages || 0,
        reviewsThisMonth: data.reviewsThisMonth || 0,
        reviewsThisWeek: data.reviewsThisWeek || 0,
        newUsersThisMonth: data.newUsersThisMonth || 0,
        newBusinessesThisMonth: data.newBusinessesThisMonth || 0,
        topPlatforms: data.topPlatforms || [],
        recentActivity: data.recentActivity || [],
        businessGrowth: (data.businessGrowth || []).map((item: { date: string; count: number }) => ({
          month: item.date,
          count: item.count,
        })),
        reviewTrends: data.reviewTrends || [],
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading admin analytics:', error);
    }
  };

  if (loading) {
    return <StandardLoader isLoading={true} mode="fullPage" />;
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">

        {/* Time Range Selector */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-slate-blue focus:ring-slate-blue"
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
                    <Icon name="FaUsers" className="h-8 w-8 text-slate-blue" />
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
                    <Icon name="FaBuilding" className="h-8 w-8 text-slate-blue" />
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
                    <Icon name="FaStar" className="h-8 w-8 text-slate-blue" />
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
                    <Icon name="FaGlobe" className="h-8 w-8 text-slate-blue" />
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

                          {/* Prompt Page Visits */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Review Platforms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.topPlatforms.map((platform) => (
                  <div key={platform.platform} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{platform.platform}</span>
                      <span className="text-lg font-semibold text-slate-blue">{platform.count}</span>
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
                      className="w-full bg-slate-blue rounded-t"
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
            className="text-slate-blue hover:text-slate-blue/80 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
  );
} 