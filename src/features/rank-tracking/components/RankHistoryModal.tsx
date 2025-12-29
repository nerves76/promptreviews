/**
 * RankHistoryModal Component
 *
 * Modal for viewing rank history for a specific keyword/search term.
 * Shows a chart of position over time with summary stats.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import RankHistoryChart from './RankHistoryChart';

interface RankHistorySummary {
  currentDesktopPosition: number | null;
  currentMobilePosition: number | null;
  desktopChange: number | null;
  mobileChange: number | null;
  totalChecks: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

interface RankHistoryDataPoint {
  date: string;
  desktop: { position: number | null; checkedAt: string } | null;
  mobile: { position: number | null; checkedAt: string } | null;
  locationName: string | null;
}

interface RankHistoryResponse {
  history: RankHistoryDataPoint[];
  searchQueries: string[];
  summary: RankHistorySummary;
  keywordId: string;
}

interface RankHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  keywordId: string;
  keywordName: string;
  searchQuery?: string;
}

function PositionBadge({ position, label }: { position: number | null; label: string }) {
  if (position === null) {
    return (
      <div className="text-center">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="text-lg font-medium text-gray-500">--</div>
      </div>
    );
  }

  const color = position <= 3
    ? 'text-green-600'
    : position <= 10
      ? 'text-blue-600'
      : position <= 20
        ? 'text-amber-600'
        : 'text-gray-600';

  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${color}`}>#{position}</div>
    </div>
  );
}

function ChangeBadge({ change, label }: { change: number | null; label: string }) {
  if (change === null) {
    return (
      <div className="text-center">
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="text-sm text-gray-500">--</div>
      </div>
    );
  }

  // Positive change means improvement (went from higher number to lower)
  const isImprovement = change > 0;
  const isDecline = change < 0;

  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-sm font-medium flex items-center justify-center gap-1 ${
        isImprovement ? 'text-green-600' : isDecline ? 'text-red-600' : 'text-gray-500'
      }`}>
        {isImprovement && <Icon name="FaCaretUp" className="w-3 h-3" />}
        {isDecline && <Icon name="FaCaretDown" className="w-3 h-3" />}
        {Math.abs(change)} {change !== 0 && 'positions'}
        {change === 0 && 'No change'}
      </div>
    </div>
  );
}

export default function RankHistoryModal({
  isOpen,
  onClose,
  keywordId,
  keywordName,
  searchQuery,
}: RankHistoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RankHistoryResponse | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<string | undefined>(searchQuery);
  const [days, setDays] = useState(90);

  const fetchHistory = useCallback(async () => {
    if (!keywordId) return;

    setIsLoading(true);
    setError(null);

    try {
      let url = `/rank-tracking/history?keywordId=${keywordId}&days=${days}`;
      if (selectedQuery) {
        url += `&searchQuery=${encodeURIComponent(selectedQuery)}`;
      }

      const response = await apiClient.get<RankHistoryResponse>(url);
      setData(response);
    } catch (err) {
      console.error('Failed to fetch rank history:', err);
      setError('Failed to load rank history');
    } finally {
      setIsLoading(false);
    }
  }, [keywordId, selectedQuery, days]);

  // Fetch on open
  useEffect(() => {
    if (isOpen && keywordId) {
      fetchHistory();
    }
  }, [isOpen, keywordId, fetchHistory]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError(null);
      setSelectedQuery(searchQuery);
    }
  }, [isOpen, searchQuery]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Rank history
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md" title={keywordName}>
                      {keywordName}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Icon name="FaTimes" className="w-5 h-5" />
                  </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
                  {/* Search Query Filter */}
                  {data?.searchQueries && data.searchQueries.length > 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Search term:</label>
                      <select
                        value={selectedQuery || ''}
                        onChange={(e) => setSelectedQuery(e.target.value || undefined)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All terms</option>
                        {data.searchQueries.map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Time Range Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Time range:</label>
                    <select
                      value={days}
                      onChange={(e) => setDays(parseInt(e.target.value, 10))}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={30}>Last 30 days</option>
                      <option value={90}>Last 90 days</option>
                      <option value={180}>Last 6 months</option>
                      <option value={365}>Last year</option>
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {error ? (
                    <div className="text-center py-8">
                      <Icon name="FaExclamationTriangle" className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">{error}</p>
                      <button
                        onClick={fetchHistory}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Summary Stats */}
                      {data?.summary && (
                        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                          <PositionBadge
                            position={data.summary.currentDesktopPosition}
                            label="Desktop rank"
                          />
                          <PositionBadge
                            position={data.summary.currentMobilePosition}
                            label="Mobile rank"
                          />
                          <ChangeBadge
                            change={data.summary.desktopChange}
                            label="Desktop change"
                          />
                          <ChangeBadge
                            change={data.summary.mobileChange}
                            label="Mobile change"
                          />
                        </div>
                      )}

                      {/* Chart */}
                      <RankHistoryChart
                        history={data?.history || []}
                        isLoading={isLoading}
                        keywordName={keywordName}
                      />

                      {/* Footer info */}
                      {data?.summary && (
                        <div className="mt-4 text-center text-xs text-gray-500">
                          {data.summary.totalChecks} rank checks
                          {data.summary.dateRange.start && data.summary.dateRange.end && (
                            <> from {new Date(data.summary.dateRange.start).toLocaleDateString()} to {new Date(data.summary.dateRange.end).toLocaleDateString()}</>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
