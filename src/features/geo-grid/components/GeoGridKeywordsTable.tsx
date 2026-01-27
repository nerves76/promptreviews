/**
 * GeoGridKeywordsTable Component
 *
 * Unified table for managing tracked keywords and displaying their rank results.
 * Combines functionality from GeoGridKeywordPicker and GeoGridResultsTable.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Icon from '@/components/Icon';
import { GGTrackedKeyword, GGCheckResult, GGConfig, CheckPoint, PositionBucket, ScheduleMode, ScheduleFrequency } from '../utils/types';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { KeywordDetailsSidebar } from '@/features/keywords/components';
import { type KeywordData, type SearchTerm } from '@/features/keywords/keywordUtils';
import { apiClient } from '@/utils/apiClient';
import { AddKeywordsToGridModal } from './AddKeywordsToGridModal';
import { KeywordScheduleModal } from './KeywordScheduleModal';

// ============================================
// Types
// ============================================

interface Keyword {
  id: string;
  phrase: string;
  searchTerms?: SearchTerm[];
}

/** Info about a keyword tracked in another config */
interface OtherConfigTracking {
  keywordId: string;
  locationName: string;
}

interface GeoGridKeywordsTableProps {
  /** Currently tracked keywords */
  trackedKeywords: GGTrackedKeyword[];
  /** Available keywords to add from */
  availableKeywords: Keyword[];
  /** Check results to display */
  results: GGCheckResult[];
  /** Config for schedule inheritance info */
  config?: GGConfig | null;
  /** Loading state for keywords */
  isLoadingKeywords?: boolean;
  /** Loading state for results */
  isLoadingResults?: boolean;
  /** Last check timestamp */
  lastCheckedAt?: string | null;
  /** Callback to add keywords */
  onAddKeywords: (keywordIds: string[]) => Promise<void>;
  /** Callback to remove a tracked keyword */
  onRemoveKeyword: (trackedKeywordId: string) => Promise<void>;
  /** Callback to update keyword schedule */
  onUpdateKeywordSchedule?: (trackedKeywordId: string, updates: {
    scheduleMode: ScheduleMode;
    scheduleFrequency: ScheduleFrequency;
    scheduleDayOfWeek: number | null;
    scheduleDayOfMonth: number | null;
    scheduleHour: number;
  }) => Promise<void>;
  /** Max keywords that can be tracked */
  maxKeywords?: number;
  /** Callback to refresh available keywords after creating new ones */
  onKeywordsCreated?: () => void;
  /** Callback when a result row is clicked */
  onResultClick?: (result: GGCheckResult) => void;
  /** Map of keyword ID to review usage count */
  keywordUsageCounts?: Record<string, number>;
  /** Keywords tracked in OTHER configs (for duplicate prevention) */
  keywordsInOtherConfigs?: OtherConfigTracking[];
}

interface KeywordGroup {
  // From tracked keywords
  trackedKeywordId: string;
  keywordId: string;
  phrase: string;
  searchTerm: string | null;
  hasSearchTerms: boolean;
  // Reference to the full tracked keyword for schedule info
  trackedKeyword: GGTrackedKeyword;
  // From results (may be null if not checked yet)
  results: GGCheckResult[];
  bestBucket: PositionBucket | null;
  avgPosition: number | null;
  pointsInTop3: number;
  pointsInTop10: number;
  lastCheckedAt: string | null;
  topCompetitors: Array<{
    name: string;
    avgPosition: number;
    rating: number | null;
    reviewCount: number | null;
    appearances: number;
    address: string | null;
    category: string | null;
  }>;
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
  top10: 'bg-blue-100 text-slate-blue',
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

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatScheduleDisplay(
  keyword: GGTrackedKeyword,
  config: GGConfig | null | undefined
): { label: string; subtitle: string; color: string } {
  const mode = keyword.scheduleMode || 'inherit';

  if (mode === 'off') {
    return {
      label: 'Manual only',
      subtitle: 'No auto-run',
      color: 'text-gray-500 bg-gray-100',
    };
  }

  if (mode === 'inherit') {
    // Show inherited config schedule
    if (!config?.scheduleFrequency) {
      return {
        label: 'Inherited',
        subtitle: 'No config schedule',
        color: 'text-gray-500 bg-gray-100',
      };
    }

    const freq = config.scheduleFrequency;
    let subtitle = '';
    if (freq === 'daily') {
      subtitle = `Daily`;
    } else if (freq === 'weekly') {
      const day = DAYS_OF_WEEK_SHORT[config.scheduleDayOfWeek ?? 1];
      subtitle = `Weekly (${day})`;
    } else if (freq === 'monthly') {
      subtitle = `Monthly (${config.scheduleDayOfMonth ?? 1}${getOrdinalSuffix(config.scheduleDayOfMonth ?? 1)})`;
    }

    return {
      label: 'Inherited',
      subtitle,
      color: 'text-blue-700 bg-blue-50',
    };
  }

  // Custom schedule
  const freq = keyword.scheduleFrequency;
  let label = '';
  if (freq === 'daily') {
    label = 'Daily';
  } else if (freq === 'weekly') {
    const day = DAYS_OF_WEEK_SHORT[keyword.scheduleDayOfWeek ?? 1];
    label = `Weekly (${day})`;
  } else if (freq === 'monthly') {
    label = `Monthly (${keyword.scheduleDayOfMonth ?? 1}${getOrdinalSuffix(keyword.scheduleDayOfMonth ?? 1)})`;
  } else {
    label = 'Custom';
  }

  const hour = keyword.scheduleHour ?? 9;
  const hourLabel = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour < 12 ? 'am' : 'pm'}`;

  return {
    label,
    subtitle: `at ${hourLabel} UTC`,
    color: 'text-emerald-700 bg-emerald-50',
  };
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ============================================
// Component
// ============================================

export function GeoGridKeywordsTable({
  trackedKeywords,
  availableKeywords,
  results,
  config,
  isLoadingKeywords,
  isLoadingResults,
  lastCheckedAt,
  onAddKeywords,
  onRemoveKeyword,
  onUpdateKeywordSchedule,
  maxKeywords = 20,
  onKeywordsCreated,
  onResultClick,
  keywordUsageCounts = {},
  keywordsInOtherConfigs = [],
}: GeoGridKeywordsTableProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('keyword');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterBucket, setFilterBucket] = useState<PositionBucket | 'all'>('all');

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarKeyword, setSidebarKeyword] = useState<KeywordData | null>(null);

  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleKeyword, setScheduleKeyword] = useState<GGTrackedKeyword | null>(null);

  // Use the keywords hook for keyword data
  const { refresh: refreshKeywords, keywords: allKeywords } = useKeywords();

  // Get IDs of already tracked keywords
  const trackedKeywordIds = useMemo(
    () => new Set(trackedKeywords.map((tk) => tk.keywordId)),
    [trackedKeywords]
  );

  // Build a map of keyword data from all keywords (for search terms)
  const keywordDataMap = useMemo(() => {
    const map = new Map<string, Keyword>();
    for (const kw of allKeywords) {
      map.set(kw.id, {
        id: kw.id,
        phrase: kw.phrase,
        searchTerms: kw.searchTerms,
      });
    }
    // Also include available keywords
    for (const kw of availableKeywords) {
      if (!map.has(kw.id)) {
        map.set(kw.id, kw);
      }
    }
    return map;
  }, [allKeywords, availableKeywords]);

  // Group results by keyword ID
  const resultsByKeyword = useMemo(() => {
    const map = new Map<string, GGCheckResult[]>();
    for (const result of results) {
      const existing = map.get(result.keywordId) || [];
      existing.push(result);
      map.set(result.keywordId, existing);
    }
    return map;
  }, [results]);

  // Build unified keyword groups
  const keywordGroups = useMemo(() => {
    const groups: KeywordGroup[] = trackedKeywords.map((tk) => {
      const keywordData = keywordDataMap.get(tk.keywordId);
      const searchTerms = keywordData?.searchTerms || [];
      const hasSearchTerms = searchTerms.length > 0;
      const primarySearchTerm = searchTerms.find((st) => st.isCanonical) || searchTerms[0];
      const keywordResults = resultsByKeyword.get(tk.keywordId) || [];

      // Calculate rank stats if we have results
      let bestBucket: PositionBucket | null = null;
      let avgPosition: number | null = null;
      let pointsInTop3 = 0;
      let pointsInTop10 = 0;
      let groupLastCheckedAt: string | null = null;
      const topCompetitors: KeywordGroup['topCompetitors'] = [];

      if (keywordResults.length > 0) {
        // Find best bucket
        bestBucket = 'none';
        for (const result of keywordResults) {
          if (BUCKET_ORDER[result.positionBucket] < BUCKET_ORDER[bestBucket]) {
            bestBucket = result.positionBucket;
          }
        }

        // Calculate average position
        const foundResults = keywordResults.filter((r) => r.position !== null);
        avgPosition =
          foundResults.length > 0
            ? foundResults.reduce((sum, r) => sum + (r.position || 0), 0) / foundResults.length
            : null;

        // Count points in buckets
        pointsInTop3 = keywordResults.filter((r) => r.positionBucket === 'top3').length;
        pointsInTop10 = keywordResults.filter(
          (r) => r.positionBucket === 'top3' || r.positionBucket === 'top10'
        ).length;

        // Get most recent check time
        groupLastCheckedAt = keywordResults.reduce((latest, r) => {
          if (!r.checkedAt) return latest;
          if (!latest) return r.checkedAt;
          return new Date(r.checkedAt) > new Date(latest) ? r.checkedAt : latest;
        }, null as string | null);

        // Aggregate competitors
        const competitorMap = new Map<
          string,
          {
            name: string;
            positions: number[];
            rating: number | null;
            reviewCount: number | null;
            address: string | null;
            category: string | null;
          }
        >();

        for (const result of keywordResults) {
          for (const competitor of result.topCompetitors) {
            const key = competitor.name.toLowerCase();
            const existing = competitorMap.get(key);
            if (existing) {
              existing.positions.push(competitor.position);
              if (competitor.rating !== null) existing.rating = competitor.rating;
              if (competitor.reviewCount !== null) existing.reviewCount = competitor.reviewCount;
              if (competitor.address) existing.address = competitor.address;
              if (competitor.category) existing.category = competitor.category;
            } else {
              competitorMap.set(key, {
                name: competitor.name,
                positions: [competitor.position],
                rating: competitor.rating,
                reviewCount: competitor.reviewCount,
                address: competitor.address ?? null,
                category: competitor.category ?? null,
              });
            }
          }
        }

        // Get top 5 competitors by weighted score (considers both position and frequency)
        // A competitor appearing once at #1 shouldn't rank above one appearing 24/25 times at #2
        const totalGridPoints = keywordResults.length;
        const sortedCompetitors = Array.from(competitorMap.values())
          .map((c) => {
            const avgPos = c.positions.reduce((a, b) => a + b, 0) / c.positions.length;
            const coverageRatio = c.positions.length / totalGridPoints;
            // Weighted score: lower is better
            // Penalize low coverage heavily - a competitor appearing once should rank below
            // a competitor appearing consistently even if their single appearance was better
            const weightedScore = avgPos / Math.pow(coverageRatio, 0.5);
            return {
              name: c.name,
              avgPosition: avgPos,
              rating: c.rating,
              reviewCount: c.reviewCount,
              appearances: c.positions.length,
              address: c.address,
              category: c.category,
              weightedScore,
            };
          })
          .sort((a, b) => a.weightedScore - b.weightedScore)
          .slice(0, 5);

        topCompetitors.push(...sortedCompetitors);
      }

      return {
        trackedKeywordId: tk.id,
        keywordId: tk.keywordId,
        phrase: tk.phrase || keywordData?.phrase || tk.keywordId,
        searchTerm: primarySearchTerm?.term || null,
        hasSearchTerms,
        trackedKeyword: tk,
        results: keywordResults,
        bestBucket,
        avgPosition,
        pointsInTop3,
        pointsInTop10,
        lastCheckedAt: groupLastCheckedAt,
        topCompetitors,
      };
    });

    // Apply filter
    let filtered = groups;
    if (filterBucket !== 'all') {
      filtered = groups.filter((g) => g.bestBucket === filterBucket);
    }

    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'keyword':
          comparison = a.phrase.localeCompare(b.phrase);
          break;
        case 'bestBucket':
          // Put unchecked at the end
          if (a.bestBucket === null && b.bestBucket === null) comparison = 0;
          else if (a.bestBucket === null) comparison = 1;
          else if (b.bestBucket === null) comparison = -1;
          else comparison = BUCKET_ORDER[a.bestBucket] - BUCKET_ORDER[b.bestBucket];
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

    return filtered;
  }, [trackedKeywords, keywordDataMap, resultsByKeyword, filterBucket, sortField, sortDirection]);

  const canAddMore = trackedKeywords.length < maxKeywords;

  // Handle clicking a keyword to open sidebar
  const handleKeywordClick = useCallback(async (keywordId: string) => {
    try {
      const data = await apiClient.get<{ keyword: KeywordData | null }>(`/keywords/${keywordId}`);
      if (data.keyword) {
        setSidebarKeyword(data.keyword);
        setSidebarOpen(true);
      }
    } catch (err) {
      console.error('Failed to load keyword:', err);
    }
  }, []);

  // Handle keyword update from sidebar
  const handleKeywordUpdate = useCallback(
    async (id: string, updates: Partial<KeywordData>) => {
      try {
        const data = await apiClient.put<{ keyword: KeywordData }>(`/keywords/${id}`, updates);
        if (data.keyword) {
          setSidebarKeyword(data.keyword);
          await refreshKeywords();
          onKeywordsCreated?.();
          return data.keyword;
        }
        return null;
      } catch (err) {
        console.error('Failed to update keyword:', err);
        return null;
      }
    },
    [refreshKeywords, onKeywordsCreated]
  );

  // Handle removing a tracked keyword
  const handleRemove = useCallback(
    async (e: React.MouseEvent, trackedKeywordId: string) => {
      e.stopPropagation();
      if (removingId) return;

      setRemovingId(trackedKeywordId);
      try {
        await onRemoveKeyword(trackedKeywordId);
      } finally {
        setRemovingId(null);
      }
    },
    [removingId, onRemoveKeyword]
  );

  // Handle adding keywords from modal
  const handleAddFromModal = useCallback(
    async (keywordIds: string[]) => {
      await onAddKeywords(keywordIds);
      await refreshKeywords();
      onKeywordsCreated?.();
    },
    [onAddKeywords, refreshKeywords, onKeywordsCreated]
  );

  // Handle schedule button click
  const handleScheduleClick = useCallback(
    (e: React.MouseEvent, trackedKeyword: GGTrackedKeyword) => {
      e.stopPropagation();
      setScheduleKeyword(trackedKeyword);
      setScheduleModalOpen(true);
    },
    []
  );

  // Handle saving schedule from modal
  const handleSaveSchedule = useCallback(
    async (updates: {
      scheduleMode: ScheduleMode;
      scheduleFrequency: ScheduleFrequency;
      scheduleDayOfWeek: number | null;
      scheduleDayOfMonth: number | null;
      scheduleHour: number;
    }) => {
      if (!scheduleKeyword || !onUpdateKeywordSchedule) return;
      await onUpdateKeywordSchedule(scheduleKeyword.id, updates);
    },
    [scheduleKeyword, onUpdateKeywordSchedule]
  );

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

  const isLoading = isLoadingKeywords || isLoadingResults;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">Loading keywords...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tracked keywords</h3>
              <p className="text-sm text-gray-500">
                {trackedKeywords.length} of {maxKeywords} keywords tracked
                {lastCheckedAt && (
                  <span className="ml-2">
                    • Last checked: {new Date(lastCheckedAt).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter */}
              {results.length > 0 && (
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterBucket}
                    onChange={(e) => setFilterBucket(e.target.value as PositionBucket | 'all')}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All results</option>
                    <option value="top3">Top 3 only</option>
                    <option value="top10">Top 10 only</option>
                    <option value="top20">Top 20 only</option>
                    <option value="none">Not found only</option>
                  </select>
                </div>
              )}
              {canAddMore && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add keywords
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {trackedKeywords.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Icon name="FaKey" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No keywords being tracked yet</p>
            <p className="text-sm text-gray-500 mb-4">Add keywords to track their local ranking</p>
            {canAddMore && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <PlusIcon className="w-4 h-4" />
                Add your first keyword
              </button>
            )}
          </div>
        ) : (
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Search term
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('bestBucket')}
                  >
                    <div className="flex items-center gap-1">
                      Best rank
                      <ArrowsUpDownIcon className="w-4 h-4" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('avgPosition')}
                  >
                    <div className="flex items-center gap-1">
                      Avg position
                      <ArrowsUpDownIcon className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visibility
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Checked
                  </th>
                  <th className="w-16 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {keywordGroups.map((group) => {
                  const hasResults = group.results.length > 0;
                  const totalPoints = group.results.length;
                  const visibilityPct =
                    totalPoints > 0 ? Math.round((group.pointsInTop10 / totalPoints) * 100) : 0;

                  return (
                    <React.Fragment key={group.trackedKeywordId}>
                      {/* Keyword Row */}
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => hasResults && toggleExpanded(group.keywordId)}
                      >
                        <td className="px-2 py-3">
                          {hasResults ? (
                            expandedKeywords.has(group.keywordId) ? (
                              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                            )
                          ) : (
                            <div className="w-5 h-5" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKeywordClick(group.keywordId);
                              }}
                              className="font-medium text-gray-900 hover:text-slate-blue hover:underline text-left"
                            >
                              {group.phrase}
                            </button>
                            {keywordUsageCounts[group.keywordId] > 0 && (
                              <span
                                className="inline-flex items-center justify-center w-5 h-5 bg-slate-200 text-slate-600 rounded-full text-xs font-bold"
                                title={`Used in ${keywordUsageCounts[group.keywordId]} review${keywordUsageCounts[group.keywordId] === 1 ? '' : 's'}`}
                              >
                                {keywordUsageCounts[group.keywordId] > 99
                                  ? '99+'
                                  : keywordUsageCounts[group.keywordId]}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 truncate max-w-[150px] block" title={group.trackedKeyword.locationName || 'Default location'}>
                            {group.trackedKeyword.locationName || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {group.hasSearchTerms ? (
                            <span className="text-gray-600">{group.searchTerm}</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKeywordClick(group.keywordId);
                              }}
                              className="text-amber-600 text-sm flex items-center gap-1 hover:text-amber-700"
                            >
                              <ExclamationTriangleIcon className="w-4 h-4" />
                              Click to add
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {group.bestBucket !== null ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${BUCKET_COLORS[group.bestBucket]}`}
                            >
                              {BUCKET_LABELS[group.bestBucket]}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {group.avgPosition !== null ? `#${group.avgPosition.toFixed(1)}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {hasResults ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    visibilityPct >= 80
                                      ? 'bg-green-500'
                                      : visibilityPct >= 40
                                        ? 'bg-slate-blue'
                                        : visibilityPct > 0
                                          ? 'bg-orange-500'
                                          : 'bg-red-400'
                                  }`}
                                  style={{ width: `${visibilityPct}%` }}
                                />
                              </div>
                              <span
                                className={`text-sm font-medium ${
                                  visibilityPct >= 80
                                    ? 'text-green-600'
                                    : visibilityPct >= 40
                                      ? 'text-slate-blue'
                                      : visibilityPct > 0
                                        ? 'text-orange-600'
                                        : 'text-red-500'
                                }`}
                              >
                                {visibilityPct}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const scheduleInfo = formatScheduleDisplay(group.trackedKeyword, config);
                            return (
                              <button
                                onClick={(e) => handleScheduleClick(e, group.trackedKeyword)}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium cursor-pointer hover:ring-2 hover:ring-blue-300 hover:shadow-sm transition-all ${scheduleInfo.color}`}
                                title="Click to edit schedule"
                                aria-label={`Edit schedule for ${group.phrase}`}
                              >
                                <div className="flex flex-col items-start">
                                  <span className="whitespace-nowrap">{scheduleInfo.label}</span>
                                  <span className="text-[10px] opacity-75 whitespace-nowrap">{scheduleInfo.subtitle}</span>
                                </div>
                                <Icon name="FaEdit" className="w-3 h-3 opacity-50" size={12} />
                              </button>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-sm text-gray-500"
                            title={group.lastCheckedAt || undefined}
                          >
                            {formatRelativeDate(group.lastCheckedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => handleRemove(e, group.trackedKeywordId)}
                            disabled={removingId === group.trackedKeywordId}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Remove from grid"
                            aria-label="Remove keyword from grid"
                          >
                            {removingId === group.trackedKeywordId ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Point Details */}
                      {hasResults && expandedKeywords.has(group.keywordId) && (
                        <tr>
                          <td colSpan={10} className="bg-gray-50 px-8 py-4">
                            {/* Your Average Ranking & Top Competitors */}
                            <div className="flex gap-6 mb-4">
                              {/* Your Business Average */}
                              <div className="bg-white rounded-lg p-4 border border-gray-200 flex-shrink-0">
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                  Your avg ranking
                                </div>
                                <div
                                  className={`text-2xl font-bold ${
                                    group.avgPosition !== null && group.avgPosition <= 3
                                      ? 'text-green-600'
                                      : group.avgPosition !== null && group.avgPosition <= 10
                                        ? 'text-slate-blue'
                                        : group.avgPosition !== null && group.avgPosition <= 20
                                          ? 'text-orange-600'
                                          : 'text-red-500'
                                  }`}
                                >
                                  {group.avgPosition !== null
                                    ? `#${group.avgPosition.toFixed(1)}`
                                    : 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  across {group.results.length} points
                                </div>
                              </div>

                              {/* Top 5 Competitors */}
                              {group.topCompetitors.length > 0 && (
                                <div className="bg-white rounded-lg p-4 border border-gray-200 flex-1">
                                  <div className="text-xs font-medium text-gray-500 mb-3">
                                    Top competitors (by visibility)
                                  </div>
                                  <div className="space-y-3">
                                    {group.topCompetitors.map((competitor, idx) => (
                                      <div
                                        key={idx}
                                        className="border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-start gap-2">
                                            <span
                                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                                idx === 0
                                                  ? 'bg-yellow-100 text-yellow-700'
                                                  : idx === 1
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : 'bg-orange-100 text-orange-700'
                                              }`}
                                            >
                                              {idx + 1}
                                            </span>
                                            <div className="min-w-0">
                                              <div className="font-medium text-gray-900 text-sm">
                                                {competitor.name}
                                              </div>
                                              {competitor.category && (
                                                <div className="text-xs text-blue-600 mt-0.5">
                                                  {competitor.category}
                                                </div>
                                              )}
                                              {competitor.address && (
                                                <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[250px]">
                                                  {competitor.address}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 text-gray-500 flex-shrink-0 ml-2">
                                            <span className="font-medium text-gray-700 text-sm">
                                              #{competitor.avgPosition.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-blue-600" title={`Appears on ${competitor.appearances} of ${group.results.length} grid points`}>
                                              {competitor.appearances}/{group.results.length} pts
                                            </span>
                                            {competitor.rating !== null && (
                                              <span className="text-xs">
                                                ★ {competitor.rating.toFixed(1)}
                                              </span>
                                            )}
                                            {competitor.reviewCount !== null && (
                                              <span className="text-xs">
                                                ({competitor.reviewCount})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Grid Points */}
                            <div className="text-xs font-medium text-gray-500 mb-2">
                              Ranking by location
                            </div>
                            <div className="grid grid-cols-5 gap-4">
                              {(['center', 'n', 's', 'e', 'w'] as CheckPoint[]).map((point) => {
                                const result = group.results.find((r) => r.checkPoint === point);
                                if (!result) return null;

                                return (
                                  <div
                                    key={point}
                                    className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer hover:border-gray-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onResultClick?.(result);
                                    }}
                                  >
                                    <div className="text-xs font-medium text-gray-500 mb-1">
                                      {POINT_LABELS[point]}
                                    </div>
                                    <div
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${BUCKET_COLORS[result.positionBucket]}`}
                                    >
                                      {result.position !== null
                                        ? `#${result.position}`
                                        : 'Not Found'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {trackedKeywords.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            {keywordGroups.length} keyword{keywordGroups.length !== 1 ? 's' : ''}{' '}
            {filterBucket !== 'all' ? 'matching filter' : 'tracked'}
            {keywordGroups.length > 0 && results.length > 0 && (
              <span className="ml-2">
                • {keywordGroups.filter((g) => g.pointsInTop10 > 0).length} ranking in top 10
              </span>
            )}
          </div>
        )}

        {/* Max reached message */}
        {!canAddMore && (
          <div className="px-6 py-4 border-t border-gray-200 bg-amber-50">
            <p className="text-sm text-amber-800">
              Maximum of {maxKeywords} keywords reached. Remove some to add more.
            </p>
          </div>
        )}
      </div>

      {/* Add Keywords Modal */}
      <AddKeywordsToGridModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        trackedKeywordIds={trackedKeywordIds}
        keywordsInOtherConfigs={keywordsInOtherConfigs}
        onAdd={handleAddFromModal}
        maxKeywords={maxKeywords}
        currentCount={trackedKeywords.length}
      />

      {/* Keyword Details Sidebar */}
      <KeywordDetailsSidebar
        isOpen={sidebarOpen}
        keyword={sidebarKeyword}
        onClose={() => {
          setSidebarOpen(false);
          setSidebarKeyword(null);
        }}
        onUpdate={handleKeywordUpdate}
      />

      {/* Keyword Schedule Modal */}
      <KeywordScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setScheduleKeyword(null);
        }}
        keyword={scheduleKeyword}
        config={config || null}
        onSave={handleSaveSchedule}
      />
    </>
  );
}

export default GeoGridKeywordsTable;
