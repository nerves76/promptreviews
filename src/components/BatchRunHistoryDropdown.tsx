'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

export type BatchRunFeature = 'llm_visibility' | 'rank_tracking';

export interface BatchRunSummary {
  runId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'scheduled';
  totalItems: number;
  processedItems: number;
  successfulChecks: number;
  failedChecks: number;
  creditsUsed: number;
  creditsRefunded: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

interface BatchRunHistoryDropdownProps {
  feature: BatchRunFeature;
  onRetry?: (runId: string) => Promise<void>;
  className?: string;
}

const FEATURE_CONFIG: Record<BatchRunFeature, { label: string; apiPath: string }> = {
  llm_visibility: {
    label: 'LLM visibility',
    apiPath: '/llm-visibility/batch-history',
  },
  rank_tracking: {
    label: 'Rank tracking',
    apiPath: '/rank-tracking/batch-history',
  },
};

export default function BatchRunHistoryDropdown({
  feature,
  onRetry,
  className = '',
}: BatchRunHistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [runs, setRuns] = useState<BatchRunSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const config = FEATURE_CONFIG[feature];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fetch history when dropdown opens
  useEffect(() => {
    if (isOpen && runs.length === 0) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<{ runs: BatchRunSummary[] }>(config.apiPath);
      setRuns(data.runs || []);
    } catch (err) {
      console.error(`[BatchRunHistory] Failed to fetch ${feature} history:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (runId: string) => {
    if (!onRetry || retryingRunId) return;
    setRetryingRunId(runId);
    try {
      await onRetry(runId);
      setIsOpen(false);
    } catch (err) {
      console.error(`[BatchRunHistory] Retry failed:`, err);
    } finally {
      setRetryingRunId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Icon name="FaCheckCircle" className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <Icon name="FaExclamationTriangle" className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Icon name="FaSpinner" className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'scheduled':
        return <Icon name="FaClock" className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="View run history"
        title="View recent runs"
      >
        <Icon name="FaClock" className="w-4 h-4" />
        <span className="hidden sm:inline">History</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Recent {config.label} runs</h3>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="FaSpinner" className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : runs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No recent runs
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {runs.map((run) => {
                  const hasFailures = run.failedChecks > 0;
                  const isActive = ['pending', 'processing'].includes(run.status);

                  return (
                    <div key={run.runId} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(run.status)}
                          <span className="text-sm font-medium text-gray-900">
                            {run.totalItems} items
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(run.createdAt)}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-gray-600">
                        {isActive ? (
                          <span>
                            {run.processedItems} of {run.totalItems} processed
                          </span>
                        ) : (
                          <span>
                            {run.successfulChecks} successful
                            {hasFailures && (
                              <span className="text-amber-600">
                                , {run.failedChecks} failed
                              </span>
                            )}
                          </span>
                        )}
                        {run.creditsRefunded > 0 && (
                          <span className="ml-2 text-blue-600">
                            ({run.creditsRefunded} cr refunded)
                          </span>
                        )}
                      </div>

                      {run.errorMessage && (
                        <div className="mt-1 text-xs text-red-600 truncate" title={run.errorMessage}>
                          {run.errorMessage}
                        </div>
                      )}

                      {hasFailures && !isActive && onRetry && (
                        <button
                          onClick={() => handleRetry(run.runId)}
                          disabled={retryingRunId === run.runId}
                          className="mt-2 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition-colors disabled:opacity-50"
                        >
                          {retryingRunId === run.runId ? (
                            <>
                              <Icon name="FaSpinner" className="w-3 h-3 inline mr-1 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <Icon name="FaRedo" className="w-3 h-3 inline mr-1" />
                              Retry {run.failedChecks} failed
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <Icon name="FaRedo" className="w-3 h-3 inline mr-1" />
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
