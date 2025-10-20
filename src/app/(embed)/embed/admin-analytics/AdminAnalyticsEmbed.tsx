'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';

interface AdminAnalytics {
  totalUsers: number;
  totalAccounts: number;
  totalBusinesses: number;
  totalReviews: number;
  totalPromptPages: number;
  totalWidgets?: number;
  totalGbpLocations?: number;
  totalGbpPosts?: number;
  reviewsThisMonth: number;
  reviewsThisWeek: number;
  newUsersThisMonth: number;
  newAccountsThisMonth: number;
  newBusinessesThisMonth: number;
  accountsActive?: number;
  accountsTrial?: number;
  accountsPaid?: number;
  reviewsByPlatform?: Record<string, number>;
}

export default function AdminAnalyticsEmbed() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics/public');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Send height to parent for iframe resizing
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage(
        { type: 'admin-analytics-resize', height },
        '*'
      );
    };

    setTimeout(sendHeight, 100);
    setTimeout(sendHeight, 500);
    setTimeout(sendHeight, 1000);

    window.addEventListener('resize', sendHeight);
    return () => window.removeEventListener('resize', sendHeight);
  }, [analytics, isLoading]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="FaUsers" className="w-5 h-5 text-slate-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Users</h3>
          </div>
          <p className="text-3xl font-bold text-slate-blue">
            {analytics.totalUsers.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total registered users</p>
          {analytics.newUsersThisMonth > 0 && (
            <p className="text-sm text-green-600 mt-1">
              +{analytics.newUsersThisMonth} this month
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="FaBuilding" className="w-5 h-5 text-slate-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Accounts</h3>
          </div>
          <p className="text-3xl font-bold text-slate-blue">
            {analytics.totalAccounts.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total accounts</p>
          {analytics.newAccountsThisMonth > 0 && (
            <p className="text-sm text-green-600 mt-1">
              +{analytics.newAccountsThisMonth} this month
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="FaSentimentAnalyzer" className="w-5 h-5 text-slate-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
          </div>
          <p className="text-3xl font-bold text-slate-blue">
            {analytics.totalReviews.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total reviews submitted</p>
          {analytics.reviewsThisMonth > 0 && (
            <p className="text-sm text-green-600 mt-1">
              +{analytics.reviewsThisMonth} this month
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Prompt Pages</h3>
          </div>
          <p className="text-3xl font-bold text-slate-blue">
            {analytics.totalPromptPages.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total prompt pages created</p>
        </div>
      </div>

      {/* Platform Analytics */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaChartLine" className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-medium text-gray-700">Widgets Created</h4>
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              {analytics.totalWidgets?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaGoogle" className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-medium text-gray-700">GBP Locations</h4>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {analytics.totalGbpLocations?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">Google Business connected</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaGoogle" className="w-5 h-5 text-green-600" />
              <h4 className="text-sm font-medium text-gray-700">GBP Posts</h4>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {analytics.totalGbpPosts?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">Published to Google</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="FaUsers" className="w-5 h-5 text-purple-600" />
              <h4 className="text-sm font-medium text-gray-700">Active Accounts</h4>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {analytics.accountsActive?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Trial: {analytics.accountsTrial || 0} • Paid: {analytics.accountsPaid || 0}
            </p>
          </div>
        </div>

        {/* Platform Distribution */}
        {analytics.reviewsByPlatform && Object.keys(analytics.reviewsByPlatform).length > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Reviews by Platform</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(analytics.reviewsByPlatform)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => (
                  <div key={platform} className="text-center">
                    <p className="text-lg font-bold text-gray-900">{count.toLocaleString()}</p>
                    <p className="text-xs text-gray-600 capitalize">{platform}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
