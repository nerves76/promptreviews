/**
 * Cron Jobs Monitoring Dashboard
 * Admin page to monitor cron job execution history
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/auth/providers/supabase';

interface CronLog {
  id: string;
  job_name: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'error';
  duration_ms: number | null;
  summary: Record<string, unknown> | null;
  error_message: string | null;
}

interface Stats {
  last_24h: {
    total: number;
    success: number;
    error: number;
    running: number;
  };
}

export default function CronJobsDashboard() {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [jobNames, setJobNames] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No session found');
      }

      const params = new URLSearchParams();
      if (selectedJob) params.set('job_name', selectedJob);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      params.set('limit', '100');

      const response = await fetch(`/api/admin/cron-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cron logs');
      }

      const data = await response.json();

      if (data.logs) setLogs(data.logs);
      if (data.job_names) setJobNames(data.job_names);
      if (data.stats) setStats(data.stats);
      if (data.total !== undefined) setTotal(data.total);

    } catch (error) {
      console.error('Failed to load cron logs:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [selectedJob, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatJobName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cron job logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cron jobs</h1>
              <p className="text-gray-600 mt-1">Monitor scheduled job executions</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Auto-refresh (30s)
              </label>
              <button
                onClick={loadData}
                disabled={refreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.last_24h.total}</div>
              <div className="text-sm text-gray-600">Total runs (24h)</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-green-600">{stats.last_24h.success}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-red-600">{stats.last_24h.error}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.last_24h.running}</div>
              <div className="text-sm text-gray-600">Running</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm min-w-[200px]"
              >
                <option value="">All jobs</option>
                {jobNames.map(name => (
                  <option key={name} value={name}>{formatJobName(name)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="running">Running</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <span className="text-sm text-gray-600">
              Showing {logs.length} of {total} executions
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Job name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Started</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No cron job executions found. Jobs will appear here once they run.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {formatJobName(log.job_name)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {formatTimestamp(log.started_at)}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {formatDuration(log.duration_ms)}
                        </td>
                        <td className="py-3 px-4">
                          {(log.summary || log.error_message) && (
                            <button className="text-blue-600 text-sm hover:underline">
                              {expandedLog === log.id ? 'Hide' : 'Show'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedLog === log.id && (log.summary || log.error_message) && (
                        <tr key={`${log.id}-details`} className="bg-gray-50">
                          <td colSpan={5} className="py-4 px-4">
                            {log.error_message && (
                              <div className="mb-3">
                                <div className="text-sm font-medium text-red-700 mb-1">Error:</div>
                                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800 font-mono">
                                  {log.error_message}
                                </div>
                              </div>
                            )}
                            {log.summary && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-1">Summary:</div>
                                <pre className="bg-gray-100 border rounded p-3 text-sm text-gray-800 overflow-x-auto">
                                  {JSON.stringify(log.summary, null, 2)}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">About cron jobs</h3>
          <p className="text-sm text-blue-800">
            Cron jobs are scheduled tasks that run automatically. They handle things like sending
            trial reminders, processing scheduled posts, refreshing credits, and running rank checks.
            All times are in UTC.
          </p>
        </div>
      </div>
    </div>
  );
}
