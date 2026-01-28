'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import Icon from '@/components/Icon';

interface BatchRun {
  id: string;
  type: 'rank' | 'llm' | 'concept' | 'analysis';
  accountId: string;
  accountName?: string;
  status: string;
  progress: number;
  total: number;
  startedAt: string | null;
  createdAt: string;
  errorMessage: string | null;
  estimatedCredits: number;
  creditsUsed: number;
  idempotencyKey: string | null;
  isStuck: boolean;
  minutesElapsed: number;
}

interface BatchMonitorData {
  runs: BatchRun[];
  summary: {
    total: number;
    active: number;
    stuck: number;
    failed: number;
  };
}

const TYPE_LABELS: Record<string, string> = {
  rank: 'Rank Tracking',
  llm: 'LLM Visibility',
  concept: 'Concept Check',
  analysis: 'Analysis',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function BatchMonitorPage() {
  const [data, setData] = useState<BatchMonitorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await apiClient.get<BatchMonitorData>(
        `/admin/batch-monitor?includeCompleted=${includeCompleted}`
      );
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load batch monitor data');
    } finally {
      setIsLoading(false);
    }
  }, [includeCompleted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 10 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleAction = async (runId: string, runType: string, action: string) => {
    if (!confirm(`Are you sure you want to ${action === 'force_fail' ? 'force fail' : 'retry'} this run?`)) {
      return;
    }

    setActionLoading(runId);
    try {
      await apiClient.post('/admin/batch-monitor', {
        action,
        runId,
        runType,
      });
      await fetchData();
    } catch (err: any) {
      alert(err?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon name="FaSpinner" className="w-8 h-8 text-slate-blue animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const activeRuns = data?.runs.filter(r => ['pending', 'processing'].includes(r.status)) || [];
  const stuckRuns = data?.runs.filter(r => r.isStuck) || [];
  const completedRuns = data?.runs.filter(r => ['completed', 'failed'].includes(r.status)) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Batch monitor</h1>
          <p className="text-white/80 mt-1">Monitor and manage background batch jobs</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-white/30"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchData}
            className="px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
          >
            <Icon name="FaRedo" className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-white border border-gray-200">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-blue-600">{data?.summary.active || 0}</p>
        </div>
        <div className="p-4 rounded-lg bg-white border border-gray-200">
          <p className="text-sm text-gray-500">Stuck</p>
          <p className="text-2xl font-bold text-amber-600">{data?.summary.stuck || 0}</p>
        </div>
        <div className="p-4 rounded-lg bg-white border border-gray-200">
          <p className="text-sm text-gray-500">Failed (recent)</p>
          <p className="text-2xl font-bold text-red-600">{data?.summary.failed || 0}</p>
        </div>
        <div className="p-4 rounded-lg bg-white border border-gray-200">
          <p className="text-sm text-gray-500">Total shown</p>
          <p className="text-2xl font-bold text-gray-900">{data?.summary.total || 0}</p>
        </div>
      </div>

      {/* Stuck runs alert */}
      {stuckRuns.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-800">
            <Icon name="FaExclamationTriangle" className="w-5 h-5" />
            <span className="font-medium">{stuckRuns.length} stuck run{stuckRuns.length !== 1 ? 's' : ''} detected</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            These runs have been processing for 15+ minutes with no progress. Consider force-failing them.
          </p>
        </div>
      )}

      {/* Active runs */}
      {activeRuns.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Active runs</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeRuns.map((run) => (
                  <tr key={run.id} className={run.isStuck ? 'bg-amber-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {TYPE_LABELS[run.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-600" title={run.accountId}>
                        {run.accountName || run.accountId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-slate-blue h-2 rounded-full"
                            style={{ width: `${run.total > 0 ? (run.progress / run.total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {run.progress}/{run.total}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[run.status]}`}>
                        {run.status}
                      </span>
                      {run.isStuck && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                          stuck
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(run.minutesElapsed)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {run.creditsUsed}/{run.estimatedCredits}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleAction(run.id, run.type, 'force_fail')}
                        disabled={actionLoading === run.id}
                        className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      >
                        {actionLoading === run.id ? 'Working...' : 'Force fail'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No active runs */}
      {activeRuns.length === 0 && (
        <div className="mb-6 p-8 rounded-lg bg-gray-50 border border-gray-200 text-center">
          <Icon name="FaCheckCircle" className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-gray-600">No active batch runs</p>
        </div>
      )}

      {/* Show completed toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={includeCompleted}
            onChange={(e) => setIncludeCompleted(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show completed/failed runs
        </label>
      </div>

      {/* Completed/failed runs */}
      {includeCompleted && completedRuns.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent completed/failed</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {TYPE_LABELS[run.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-600" title={run.accountId}>
                        {run.accountName || run.accountId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {run.progress}/{run.total}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[run.status]}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {run.creditsUsed}/{run.estimatedCredits}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-sm text-gray-600" title={run.errorMessage || ''}>
                      {run.errorMessage || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {run.status === 'failed' && (
                        <button
                          onClick={() => handleAction(run.id, run.type, 'retry')}
                          disabled={actionLoading === run.id}
                          className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                        >
                          {actionLoading === run.id ? 'Working...' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
