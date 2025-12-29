/**
 * Admin AI Usage Dashboard
 *
 * Shows app-wide AI/DataForSEO usage statistics with top accounts by feature.
 */

"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/auth/providers/supabase";
import Icon from '@/components/Icon';

interface TopAccount {
  account_id: string;
  business_name: string | null;
  email: string | null;
  total_cost: number;
  total_requests: number;
}

interface FeatureUsage {
  feature_type: string;
  label: string;
  total_cost: number;
  total_requests: number;
  total_tokens: number;
  top_accounts: TopAccount[];
}

interface UsageData {
  days: number;
  grand_totals: {
    total_cost: number;
    total_requests: number;
    total_tokens: number;
    dataforseo_cost: number;
    openai_cost: number;
  };
  features: FeatureUsage[];
}

// Icons for different feature types
const FEATURE_ICONS: Record<string, string> = {
  'geo_grid_check': 'FaMapMarker',
  'rank_tracking': 'FaChartLine',
  'llm_visibility': 'FaRobot',
  'domain_analysis': 'FaGlobe',
  'fix_grammar': 'FaEdit',
  'generate_review': 'FaStar',
  'generate_reviews': 'FaStar',
  'generate_keywords': 'FaKey',
  'gbp_description_analysis': 'FaSearch',
  'gbp_service_description': 'FaFileAlt',
  'gbp_review_response': 'FaReply',
  'sentiment_analysis': 'FaSmile',
};

// Colors for service types
const isDataForSEO = (featureType: string) =>
  ['geo_grid_check', 'rank_tracking', 'llm_visibility', 'domain_analysis'].includes(featureType);

export default function UsageAdminPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageData | null>(null);
  const [days, setDays] = useState(30);

  const fetchUsageData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(`/api/admin/usage-stats?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [days]);

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI & API usage</h2>
          <p className="text-gray-600 mt-1">
            Track OpenAI and DataForSEO costs across all accounts
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Time range:</label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button
            onClick={fetchUsageData}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="FaRedo" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} size={16} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <Icon name="FaExclamationTriangle" className="inline w-4 h-4 mr-2" size={16} />
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue mx-auto" />
          <p className="text-gray-600 mt-4">Loading usage data...</p>
        </div>
      )}

      {/* Data Display */}
      {data && (
        <>
          {/* Grand Totals Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Cost */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon name="FaCoins" className="w-5 h-5 text-green-600" size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600">Total cost</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCost(data.grand_totals.total_cost)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last {data.days} days</p>
            </div>

            {/* DataForSEO Cost */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icon name="FaChartLine" className="w-5 h-5 text-blue-600" size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600">DataForSEO</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCost(data.grand_totals.dataforseo_cost)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ranking & visibility APIs</p>
            </div>

            {/* OpenAI Cost */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Icon name="FaRobot" className="w-5 h-5 text-purple-600" size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600">OpenAI</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCost(data.grand_totals.openai_cost)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatNumber(data.grand_totals.total_tokens)} tokens
              </p>
            </div>

            {/* Total Requests */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Icon name="FaRocket" className="w-5 h-5 text-orange-600" size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600">Total requests</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(data.grand_totals.total_requests)}
              </p>
              <p className="text-xs text-gray-500 mt-1">API calls made</p>
            </div>
          </div>

          {/* Feature Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Usage by feature</h3>

            {data.features.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                No usage data for this time period
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.features.map((feature) => (
                  <div
                    key={feature.feature_type}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                  >
                    {/* Feature Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isDataForSEO(feature.feature_type)
                              ? 'bg-blue-100'
                              : 'bg-purple-100'
                          }`}
                        >
                          <Icon
                            name={(FEATURE_ICONS[feature.feature_type] || 'FaCog') as any}
                            className={`w-5 h-5 ${
                              isDataForSEO(feature.feature_type)
                                ? 'text-blue-600'
                                : 'text-purple-600'
                            }`}
                            size={20}
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{feature.label}</h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isDataForSEO(feature.feature_type)
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {isDataForSEO(feature.feature_type) ? 'DataForSEO' : 'OpenAI'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCost(feature.total_cost)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(feature.total_requests)} requests
                        </p>
                      </div>
                    </div>

                    {/* Top Accounts */}
                    {feature.top_accounts.length > 0 && (
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">Top accounts</p>
                        <div className="space-y-2">
                          {feature.top_accounts.map((account, idx) => (
                            <div
                              key={account.account_id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-gray-500 w-4">{idx + 1}.</span>
                                <span className="truncate text-gray-700">
                                  {account.business_name || account.email || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-gray-500 text-xs">
                                  {formatNumber(account.total_requests)} req
                                </span>
                                <span className="font-medium text-gray-900">
                                  {formatCost(account.total_cost)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {feature.top_accounts.length === 0 && (
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-500 text-center">No account data</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
