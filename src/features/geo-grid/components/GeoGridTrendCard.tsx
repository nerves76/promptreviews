/**
 * GeoGridTrendCard Component
 *
 * Displays summary statistics with trend indicators.
 * Shows visibility metrics and changes compared to previous period.
 */

'use client';

import React from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { GGDailySummary } from '../utils/types';
import { TrendData, getTrendDescription, getTrendColor } from '../hooks/useGeoGridSummary';

// ============================================
// Types
// ============================================

interface GeoGridTrendCardProps {
  /** Current summary data */
  summary: GGDailySummary | null;
  /** Trend compared to previous period */
  trend: TrendData | null;
  /** Loading state */
  isLoading?: boolean;
  /** Last check timestamp */
  lastCheckedAt?: string | null;
  /** Callback to run a new check */
  onRunCheck?: () => void;
  /** Whether a check is in progress */
  isCheckRunning?: boolean;
}

// ============================================
// Sub-components
// ============================================

function StatBox({
  label,
  value,
  color,
  subLabel,
  change,
}: {
  label: string;
  value: number;
  color: string;
  subLabel?: string;
  change?: number;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${color}`}>{value}</span>
        {subLabel && <span className="text-sm text-gray-400">{subLabel}</span>}
      </div>
      {change !== undefined && change !== 0 && (
        <div
          className={`mt-2 text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {change > 0 ? '+' : ''}
          {change} from previous
        </div>
      )}
    </div>
  );
}

function TrendIndicator({ trend }: { trend: TrendData | null }) {
  if (!trend) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <MinusIcon className="w-5 h-5" />
        <span className="text-sm">No previous data</span>
      </div>
    );
  }

  const Icon =
    trend.direction === 'improving'
      ? ArrowTrendingUpIcon
      : trend.direction === 'declining'
      ? ArrowTrendingDownIcon
      : MinusIcon;

  return (
    <div className={`flex items-center gap-2 ${getTrendColor(trend)}`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{getTrendDescription(trend)}</span>
    </div>
  );
}

// ============================================
// Component
// ============================================

export function GeoGridTrendCard({
  summary,
  trend,
  isLoading,
  lastCheckedAt,
  onRunCheck,
  isCheckRunning,
}: GeoGridTrendCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <ChartBarIcon className="w-6 h-6 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900">Visibility Summary</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No visibility data yet.</p>
          {onRunCheck && (
            <button
              onClick={onRunCheck}
              disabled={isCheckRunning}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {isCheckRunning && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isCheckRunning ? 'Running Check...' : 'Run First Check'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChartBarIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Visibility Summary</h2>
            {lastCheckedAt && (
              <p className="text-sm text-gray-500">
                {new Date(lastCheckedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <TrendIndicator trend={trend} />
          {onRunCheck && (
            <button
              onClick={onRunCheck}
              disabled={isCheckRunning}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isCheckRunning && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isCheckRunning ? 'Running Check...' : 'Run Check'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox
          label="Ranking in Top 3"
          value={summary.keywordsInTop3}
          color="text-green-600"
          subLabel="keywords"
          change={trend?.top3Change}
        />
        <StatBox
          label="Ranking in Top 10"
          value={summary.keywordsInTop10}
          color="text-yellow-600"
          subLabel="keywords"
          change={trend?.top10Change}
        />
        <StatBox
          label="Ranking in Top 20"
          value={summary.keywordsInTop20}
          color="text-orange-600"
          subLabel="keywords"
          change={trend?.top20Change}
        />
        <StatBox
          label="Not Ranking"
          value={summary.keywordsNotFound}
          color="text-red-600"
          subLabel="keywords"
        />
      </div>

      {/* API Cost (for admin visibility) */}
      {summary.totalApiCostUsd && summary.totalApiCostUsd > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            API cost: ${summary.totalApiCostUsd.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}

export default GeoGridTrendCard;
