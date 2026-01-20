/**
 * Admin Login History Dashboard
 *
 * Shows recent user login events for admin monitoring.
 */

"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/auth/providers/supabase";
import Icon from '@/components/Icon';

interface LoginRecord {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
  is_new_user: boolean;
  login_type: 'email' | 'google' | 'magic_link' | 'password';
}

interface LoginData {
  logins: LoginRecord[];
  total: number;
  limit: number;
  offset: number;
}

const LOGIN_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'email': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'google': { bg: 'bg-red-100', text: 'text-red-700' },
  'magic_link': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'password': { bg: 'bg-gray-100', text: 'text-gray-700' },
};

const LOGIN_TYPE_LABELS: Record<string, string> = {
  'email': 'Email',
  'google': 'Google',
  'magic_link': 'Magic link',
  'password': 'Password',
};

export default function LoginHistoryPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LoginData | null>(null);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchLoginHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(`/api/admin/user-logins?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch login history');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load login history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
  }, [offset]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Login history</h2>
          <p className="text-white/80 mt-1">
            Track user login events and activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <span className="text-sm text-white/80">
              {data.total} total logins
            </span>
          )}
          <button
            onClick={fetchLoginHistory}
            disabled={loading}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Refresh"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
          <p className="text-white/80 mt-4">Loading login history...</p>
        </div>
      )}

      {/* Data Display */}
      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Logins Today */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon name="FaUser" className="w-5 h-5 text-green-600" size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600">Total logins</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {data.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            {/* New Users */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icon name="FaUserPlus" className="w-5 h-5 text-blue-600" size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600">New users (shown)</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {data.logins.filter(l => l.is_new_user).length}
              </p>
              <p className="text-xs text-gray-500 mt-1">In current page</p>
            </div>

            {/* Google Logins */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Icon name="FaGoogle" className="w-5 h-5 text-red-600" size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600">Google logins (shown)</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {data.logins.filter(l => l.login_type === 'google').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">In current page</p>
            </div>
          </div>

          {/* Login Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.logins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No login records found
                      </td>
                    </tr>
                  ) : (
                    data.logins.map((login) => (
                      <tr key={login.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {login.first_name && login.last_name
                                ? `${login.first_name} ${login.last_name}`
                                : login.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500">{login.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900">{getRelativeTime(login.login_at)}</p>
                            <p className="text-xs text-gray-500">{formatDate(login.login_at)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              LOGIN_TYPE_COLORS[login.login_type]?.bg || 'bg-gray-100'
                            } ${LOGIN_TYPE_COLORS[login.login_type]?.text || 'text-gray-700'}`}
                          >
                            {login.login_type === 'google' && (
                              <Icon name="FaGoogle" className="w-3 h-3 mr-1" size={12} />
                            )}
                            {LOGIN_TYPE_LABELS[login.login_type] || login.login_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {login.is_new_user ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 whitespace-nowrap">
                              <Icon name="FaStar" className="w-3 h-3 mr-1" size={12} />
                              New user
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">Returning</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-500 font-mono">
                            {login.ip_address || 'Unknown'}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {offset + 1} to {Math.min(offset + limit, data.total)} of {data.total} logins
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0 || loading}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= data.total || loading}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
