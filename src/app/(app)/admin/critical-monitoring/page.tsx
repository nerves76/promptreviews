/**
 * Critical Function Monitoring Dashboard
 * Admin page to monitor the health of business-critical functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { performCriticalHealthCheck } from '@/utils/criticalFunctionMonitoring';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  checks: Record<string, { status: 'pass' | 'fail'; message?: string; duration?: number }>;
}

interface CriticalError {
  id: string;
  function_name: string;
  error_message: string;
  timestamp: string;
  user_id?: string;
  platform?: string;
  url?: string;
}

interface FunctionHealth {
  function_name: string;
  hour: string;
  total_calls: number;
  error_count: number;
  success_count: number;
  error_rate_percent: number;
  avg_duration_ms: number;
}

export default function CriticalMonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [recentErrors, setRecentErrors] = useState<CriticalError[]>([]);
  const [functionHealth, setFunctionHealth] = useState<FunctionHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    try {
      // Get health check status
      const health = await performCriticalHealthCheck();
      setHealthStatus(health);

      // Get recent errors
      const supabase = createClient();
      const { data: errors } = await supabase
        .from('critical_function_errors')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (errors) setRecentErrors(errors);

      // Get function health metrics
      const { data: healthData } = await supabase
        .from('critical_function_health')
        .select('*')
        .order('hour', { ascending: false })
        .limit(50);

      if (healthData) setFunctionHealth(healthData);

    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'pass': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'critical': case 'fail': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading monitoring dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Critical Function Monitoring</h1>
              <p className="text-gray-600 mt-1">Monitor your business-critical "Generate with AI" and "Copy & Submit" functionality</p>
            </div>
            <button
              onClick={loadData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Overall Health Status */}
        {healthStatus && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            <div className="flex items-center gap-4 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
                {healthStatus.status.toUpperCase()}
              </span>
              <span className="text-gray-600">Last checked: {formatTimestamp(new Date().toISOString())}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(healthStatus.checks).map(([check, result]) => (
                <div key={check} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{check.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                  {result.message && (
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  )}
                  {result.duration && (
                    <p className="text-sm text-gray-500 mt-1">{result.duration}ms</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Function Health Metrics */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Function Health (Last 24 Hours)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Function</th>
                  <th className="text-left py-2">Hour</th>
                  <th className="text-left py-2">Total Calls</th>
                  <th className="text-left py-2">Errors</th>
                  <th className="text-left py-2">Success Rate</th>
                  <th className="text-left py-2">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {functionHealth.map((metric, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 font-medium">{metric.function_name}</td>
                    <td className="py-2 text-gray-600">{formatTimestamp(metric.hour)}</td>
                    <td className="py-2">{metric.total_calls}</td>
                    <td className="py-2">
                      <span className={metric.error_count > 0 ? 'text-red-600' : 'text-green-600'}>
                        {metric.error_count}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={metric.error_rate_percent > 10 ? 'text-red-600' : metric.error_rate_percent > 5 ? 'text-yellow-600' : 'text-green-600'}>
                        {(100 - metric.error_rate_percent).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">
                      {metric.avg_duration_ms ? `${metric.avg_duration_ms.toFixed(0)}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
          {recentErrors.length === 0 ? (
            <p className="text-gray-600">No recent errors - system is healthy! 🎉</p>
          ) : (
            <div className="space-y-4">
              {recentErrors.map((error) => (
                <div key={error.id} className="border-l-4 border-red-400 bg-red-50 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-red-800">{error.function_name}</h3>
                      <p className="text-red-700 mt-1">{error.error_message}</p>
                      <div className="flex gap-4 mt-2 text-sm text-red-600">
                        <span>Time: {formatTimestamp(error.timestamp)}</span>
                        {error.platform && <span>Platform: {error.platform}</span>}
                        {error.user_id && <span>User: {error.user_id.slice(0, 8)}...</span>}
                      </div>
                      {error.url && (
                        <p className="text-sm text-red-600 mt-1">URL: {error.url}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Configuration */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Alert Configuration</h3>
          <p className="text-blue-800 mb-4">
            Alerts are automatically sent when critical functions fail or error rates exceed 10% over a 5-minute window.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-900">Immediate Alerts:</h4>
              <ul className="list-disc list-inside text-blue-800 mt-1">
                <li>AI Generate Review</li>
                <li>AI Generate Photo Testimonial</li>
                <li>Copy & Submit</li>
                <li>Widget AI Generate</li>
                <li>Widget Submit</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Alert Channels:</h4>
              <ul className="list-disc list-inside text-blue-800 mt-1">
                <li>Email alerts</li>
                <li>Slack notifications (if configured)</li>
                <li>Sentry error tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 