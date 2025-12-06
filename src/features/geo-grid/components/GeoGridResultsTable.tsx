/**
 * GeoGridResultsTable Component
 *
 * Displays rank check results in a filterable, sortable table.
 * Groups results by keyword with expandable rows for point details.
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { GGCheckResult, CheckPoint, PositionBucket } from '../utils/types';

// ============================================
// Types
// ============================================

interface GeoGridResultsTableProps {
  /** Check results to display */
  results: GGCheckResult[];
  /** Loading state */
  isLoading?: boolean;
  /** Last check timestamp */
  lastCheckedAt?: string | null;
  /** Callback when a result row is clicked */
  onResultClick?: (result: GGCheckResult) => void;
}

interface KeywordGroup {
  keywordId: string;
  keyword: string;
  results: GGCheckResult[];
  bestBucket: PositionBucket;
  avgPosition: number | null;
  pointsInTop3: number;
  pointsInTop10: number;
}

type SortField = 'keyword' | 'bestBucket' | 'avgPosition';
type SortDirection = 'asc' | 'desc';

// ============================================
// Constants
// ============================================

const BUCKET_ORDER: Record<PositionBucket, number> = {
  top3: 1,
  top10: 2,
  top20: 3,
  none: 4,
};

const BUCKET_COLORS: Record<PositionBucket, string> = {
  top3: 'bg-green-100 text-green-800',
  top10: 'bg-yellow-100 text-yellow-800',
  top20: 'bg-orange-100 text-orange-800',
  none: 'bg-red-100 text-red-800',
};

const BUCKET_LABELS: Record<PositionBucket, string> = {
  top3: 'Top 3',
  top10: 'Top 10',
  top20: 'Top 20',
  none: 'Not Found',
};

const POINT_LABELS: Record<CheckPoint, string> = {
  center: 'Center',
  n: 'North',
  s: 'South',
  e: 'East',
  w: 'West',
  ne: 'Northeast',
  nw: 'Northwest',
  se: 'Southeast',
  sw: 'Southwest',
};

// ============================================
// Helper Functions
// ============================================

function groupByKeyword(results: GGCheckResult[]): KeywordGroup[] {
  const grouped = new Map<string, GGCheckResult[]>();

  for (const result of results) {
    const existing = grouped.get(result.keywordId) || [];
    existing.push(result);
    grouped.set(result.keywordId, existing);
  }

  return Array.from(grouped.entries()).map(([keywordId, keywordResults]) => {
    // Find best bucket
    let bestBucket: PositionBucket = 'none';
    for (const result of keywordResults) {
      if (BUCKET_ORDER[result.positionBucket] < BUCKET_ORDER[bestBucket]) {
        bestBucket = result.positionBucket;
      }
    }

    // Calculate average position
    const foundResults = keywordResults.filter((r) => r.position !== null);
    const avgPosition =
      foundResults.length > 0
        ? foundResults.reduce((sum, r) => sum + (r.position || 0), 0) / foundResults.length
        : null;

    // Count points in buckets
    const pointsInTop3 = keywordResults.filter((r) => r.positionBucket === 'top3').length;
    const pointsInTop10 = keywordResults.filter(
      (r) => r.positionBucket === 'top3' || r.positionBucket === 'top10'
    ).length;

    return {
      keywordId,
      keyword: keywordResults[0]?.keywordPhrase || 'Unknown',
      results: keywordResults,
      bestBucket,
      avgPosition,
      pointsInTop3,
      pointsInTop10,
    };
  });
}

// ============================================
// Component
// ============================================

export function GeoGridResultsTable({
  results,
  isLoading,
  lastCheckedAt,
  onResultClick,
}: GeoGridResultsTableProps) {
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('keyword');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterBucket, setFilterBucket] = useState<PositionBucket | 'all'>('all');

  // Group and sort results
  const keywordGroups = useMemo(() => {
    let groups = groupByKeyword(results);

    // Apply filter
    if (filterBucket !== 'all') {
      groups = groups.filter((g) => g.bestBucket === filterBucket);
    }

    // Apply sort
    groups.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'keyword':
          comparison = a.keyword.localeCompare(b.keyword);
          break;
        case 'bestBucket':
          comparison = BUCKET_ORDER[a.bestBucket] - BUCKET_ORDER[b.bestBucket];
          break;
        case 'avgPosition':
          if (a.avgPosition === null && b.avgPosition === null) comparison = 0;
          else if (a.avgPosition === null) comparison = 1;
          else if (b.avgPosition === null) comparison = -1;
          else comparison = a.avgPosition - b.avgPosition;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return groups;
  }, [results, sortField, sortDirection, filterBucket]);

  const toggleExpanded = (keywordId: string) => {
    setExpandedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keywordId)) {
        next.delete(keywordId);
      } else {
        next.add(keywordId);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">Loading results...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="text-center">
          <p className="text-gray-600">No rank check results yet.</p>
          <p className="text-sm text-gray-500 mt-1">
            Run a rank check to see your visibility across the grid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rank Results</h3>
          {lastCheckedAt && (
            <p className="text-sm text-gray-500">
              Last checked: {new Date(lastCheckedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          <select
            value={filterBucket}
            onChange={(e) => setFilterBucket(e.target.value as PositionBucket | 'all')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Results</option>
            <option value="top3">Top 3 Only</option>
            <option value="top10">Top 10 Only</option>
            <option value="top20">Top 20 Only</option>
            <option value="none">Not Found Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8" />
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('keyword')}
              >
                <div className="flex items-center gap-1">
                  Keyword
                  <ArrowsUpDownIcon className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('bestBucket')}
              >
                <div className="flex items-center gap-1">
                  Best Rank
                  <ArrowsUpDownIcon className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('avgPosition')}
              >
                <div className="flex items-center gap-1">
                  Avg Position
                  <ArrowsUpDownIcon className="w-4 h-4" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visibility
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {keywordGroups.map((group) => (
              <React.Fragment key={group.keywordId}>
                {/* Keyword Row */}
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpanded(group.keywordId)}
                >
                  <td className="px-2 py-3">
                    {expandedKeywords.has(group.keywordId) ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{group.keyword}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BUCKET_COLORS[group.bestBucket]}`}
                    >
                      {BUCKET_LABELS[group.bestBucket]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {group.avgPosition !== null ? `#${group.avgPosition.toFixed(1)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      // Calculate visibility score: % of grid points where business ranks
                      const totalPoints = group.results.length;
                      const visibilityPct = totalPoints > 0
                        ? Math.round((group.pointsInTop10 / totalPoints) * 100)
                        : 0;

                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                visibilityPct >= 80 ? 'bg-green-500' :
                                visibilityPct >= 40 ? 'bg-yellow-500' :
                                visibilityPct > 0 ? 'bg-orange-500' :
                                'bg-red-400'
                              }`}
                              style={{ width: `${visibilityPct}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${
                            visibilityPct >= 80 ? 'text-green-600' :
                            visibilityPct >= 40 ? 'text-yellow-600' :
                            visibilityPct > 0 ? 'text-orange-600' :
                            'text-red-500'
                          }`}>
                            {visibilityPct}%
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                </tr>

                {/* Expanded Point Details */}
                {expandedKeywords.has(group.keywordId) && (
                  <tr>
                    <td colSpan={5} className="bg-gray-50 px-8 py-3">
                      <div className="grid grid-cols-5 gap-4">
                        {(['center', 'n', 's', 'e', 'w'] as CheckPoint[]).map((point) => {
                          const result = group.results.find((r) => r.checkPoint === point);
                          if (!result) return null;

                          return (
                            <div
                              key={point}
                              className="bg-white rounded-lg p-3 border border-gray-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                onResultClick?.(result);
                              }}
                            >
                              <div className="text-xs font-medium text-gray-500 mb-1">
                                {POINT_LABELS[point]}
                              </div>
                              <div
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${BUCKET_COLORS[result.positionBucket]}`}
                              >
                                {result.position !== null ? `#${result.position}` : 'Not Found'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
        {keywordGroups.length} keyword{keywordGroups.length !== 1 ? 's' : ''} tracked
        {keywordGroups.length > 0 && (
          <span className="ml-2">
            • {keywordGroups.filter(g => g.pointsInTop10 > 0).length} ranking in top 10
          </span>
        )}
      </div>
    </div>
  );
}

export default GeoGridResultsTable;
