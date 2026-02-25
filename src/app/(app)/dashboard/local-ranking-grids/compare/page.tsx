/**
 * Local Ranking Grids - Compare Page
 *
 * Shows a competitor comparison table aggregating data from the latest grid check.
 * Includes the user's own business alongside all competitors found in results.
 */

'use client';

import { useState, useMemo } from 'react';
import PageCard from '@/app/(app)/components/PageCard';
import StandardLoader from '@/app/(app)/components/StandardLoader';
import Icon from '@/components/Icon';
import { SubNav } from '@/app/(app)/components/SubNav';
import {
  useGeoGridConfig,
  useGeoGridResults,
  useTrackedKeywords,
  GGCheckResult,
  GGCompetitor,
} from '@/features/geo-grid';

// ============================================
// Types
// ============================================

interface AggregatedBusiness {
  name: string;
  placeId: string | null;
  category: string | null;
  isOwnBusiness: boolean;
  /** Average ranking position across all grid points (null if never found) */
  avgPosition: number | null;
  /** Best (lowest) ranking position seen */
  bestPosition: number | null;
  /** Worst (highest) ranking position seen */
  worstPosition: number | null;
  /** Average Google rating */
  avgRating: number | null;
  /** Average review count (latest seen) */
  avgReviewCount: number | null;
  /** Number of grid points where this business appeared */
  gridPointsVisible: number;
  /** Total grid points checked */
  totalGridPoints: number;
  /** Per-keyword breakdown: keyword phrase -> positions at each grid point */
  keywordPositions: Map<string, (number | null)[]>;
}

type SortField = 'avgPosition' | 'avgRating' | 'avgReviewCount' | 'gridPointsVisible' | 'name';
type SortDirection = 'asc' | 'desc';

// ============================================
// Helper Functions
// ============================================

function aggregateCompetitors(
  results: GGCheckResult[],
  selectedKeywordId: string | null
): AggregatedBusiness[] {
  const filteredResults = selectedKeywordId
    ? results.filter((r) => r.keywordId === selectedKeywordId)
    : results;

  if (filteredResults.length === 0) return [];

  // Count unique grid points
  const uniquePoints = new Set(filteredResults.map((r) => r.checkPoint));
  const totalGridPoints = uniquePoints.size;

  // Track all businesses: placeId -> aggregation data
  const businessMap = new Map<string, {
    name: string;
    placeId: string | null;
    category: string | null;
    isOwnBusiness: boolean;
    positions: number[];
    ratings: number[];
    reviewCounts: number[];
    pointsSeen: Set<string>;
    keywordPositions: Map<string, (number | null)[]>;
  }>();

  // Process each check result
  for (const result of filteredResults) {
    const keywordPhrase = result.keywordPhrase || result.keywordId;

    // Add own business if found
    if (result.businessFound && result.position !== null) {
      const ownKey = result.ourPlaceId || '__own_business__';
      if (!businessMap.has(ownKey)) {
        businessMap.set(ownKey, {
          name: 'Your business',
          placeId: result.ourPlaceId,
          category: null,
          isOwnBusiness: true,
          positions: [],
          ratings: [],
          reviewCounts: [],
          pointsSeen: new Set(),
          keywordPositions: new Map(),
        });
      }
      const own = businessMap.get(ownKey)!;
      own.positions.push(result.position);
      if (result.ourRating !== null) own.ratings.push(result.ourRating);
      if (result.ourReviewCount !== null) own.reviewCounts.push(result.ourReviewCount);
      own.pointsSeen.add(result.checkPoint);
      if (!own.keywordPositions.has(keywordPhrase)) {
        own.keywordPositions.set(keywordPhrase, []);
      }
      own.keywordPositions.get(keywordPhrase)!.push(result.position);
    }

    // Add competitors
    for (const comp of result.topCompetitors) {
      const key = comp.placeId || comp.name;
      if (!businessMap.has(key)) {
        businessMap.set(key, {
          name: comp.name,
          placeId: comp.placeId,
          category: comp.category,
          isOwnBusiness: false,
          positions: [],
          ratings: [],
          reviewCounts: [],
          pointsSeen: new Set(),
          keywordPositions: new Map(),
        });
      }
      const biz = businessMap.get(key)!;
      biz.positions.push(comp.position);
      if (comp.rating !== null) biz.ratings.push(comp.rating);
      if (comp.reviewCount !== null) biz.reviewCounts.push(comp.reviewCount);
      biz.pointsSeen.add(result.checkPoint);
      if (!biz.keywordPositions.has(keywordPhrase)) {
        biz.keywordPositions.set(keywordPhrase, []);
      }
      biz.keywordPositions.get(keywordPhrase)!.push(comp.position);
    }
  }

  // Convert to array
  return Array.from(businessMap.values()).map((biz) => ({
    name: biz.name,
    placeId: biz.placeId,
    category: biz.category,
    isOwnBusiness: biz.isOwnBusiness,
    avgPosition: biz.positions.length > 0
      ? biz.positions.reduce((a, b) => a + b, 0) / biz.positions.length
      : null,
    bestPosition: biz.positions.length > 0 ? Math.min(...biz.positions) : null,
    worstPosition: biz.positions.length > 0 ? Math.max(...biz.positions) : null,
    avgRating: biz.ratings.length > 0
      ? biz.ratings.reduce((a, b) => a + b, 0) / biz.ratings.length
      : null,
    avgReviewCount: biz.reviewCounts.length > 0
      ? Math.round(biz.reviewCounts.reduce((a, b) => a + b, 0) / biz.reviewCounts.length)
      : null,
    gridPointsVisible: biz.pointsSeen.size,
    totalGridPoints,
    keywordPositions: biz.keywordPositions,
  }));
}

function getPositionColor(position: number | null): string {
  if (position === null) return 'text-gray-400';
  if (position <= 3) return 'text-green-600 font-semibold';
  if (position <= 10) return 'text-slate-blue font-medium';
  if (position <= 20) return 'text-orange-500';
  return 'text-red-500';
}

function getVisibilityPercent(visible: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((visible / total) * 100);
}

// ============================================
// Component
// ============================================

export default function ComparePageClient() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('avgPosition');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Data hooks
  const { config, isLoading: configLoading } = useGeoGridConfig();
  const { results, isLoading: resultsLoading } = useGeoGridResults({
    configId: config?.id,
    mode: 'current',
    autoFetch: true,
  });
  const { keywords: trackedKeywords } = useTrackedKeywords({
    configId: config?.id,
    autoFetch: true,
  });

  // Aggregate competitor data
  const businesses = useMemo(
    () => aggregateCompetitors(results, selectedKeywordId),
    [results, selectedKeywordId]
  );

  // Sort businesses
  const sortedBusinesses = useMemo(() => {
    const sorted = [...businesses].sort((a, b) => {
      // Own business always first
      if (a.isOwnBusiness && !b.isOwnBusiness) return -1;
      if (!a.isOwnBusiness && b.isOwnBusiness) return 1;

      let aVal: number | string | null;
      let bVal: number | string | null;

      switch (sortField) {
        case 'name':
          return sortDirection === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'avgPosition':
          aVal = a.avgPosition;
          bVal = b.avgPosition;
          // null positions go to the end
          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return 1;
          if (bVal === null) return -1;
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        case 'avgRating':
          aVal = a.avgRating;
          bVal = b.avgRating;
          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return 1;
          if (bVal === null) return -1;
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        case 'avgReviewCount':
          aVal = a.avgReviewCount;
          bVal = b.avgReviewCount;
          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return 1;
          if (bVal === null) return -1;
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        case 'gridPointsVisible':
          return sortDirection === 'asc'
            ? a.gridPointsVisible - b.gridPointsVisible
            : b.gridPointsVisible - a.gridPointsVisible;
        default:
          return 0;
      }
    });
    return sorted;
  }, [businesses, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default: best first for positions (asc), highest first for ratings/reviews (desc)
      setSortDirection(field === 'avgPosition' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon name="FaChevronDown" size={10} className="text-gray-300 ml-1" />;
    }
    return (
      <Icon
        name={sortDirection === 'asc' ? 'FaChevronUp' : 'FaChevronDown'}
        size={10}
        className="text-slate-blue ml-1"
      />
    );
  };

  const isLoading = configLoading || resultsLoading;

  return (
    <>
      {/* Sub Navigation */}
      <SubNav
        items={[
          { label: 'Grid', icon: 'FaMapMarker', href: '/dashboard/local-ranking-grids', matchType: 'exact' },
          { label: 'Compare', icon: 'FaUsers', href: '/dashboard/local-ranking-grids/compare', matchType: 'exact' },
        ]}
        className="mb-4"
      />

      <PageCard
        icon={<Icon name="FaUsers" className="w-8 h-8 text-slate-blue" size={32} />}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 w-full gap-2">
          <div className="flex flex-col mt-0 md:mt-[3px]">
            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
              Compare competitors
            </h1>
            <p className="text-gray-600 text-base max-w-lg mt-0 mb-4">
              See how your business stacks up against competitors found in your grid checks.
            </p>
          </div>
        </div>

        {isLoading ? (
          <StandardLoader isLoading={true} mode="inline" />
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="FaUsers" className="w-12 h-12 text-gray-300 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
            <p className="text-gray-600">
              Run a grid check first to see competitor data here.
            </p>
          </div>
        ) : (
          <>
            {/* Keyword Filter */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <label htmlFor="keyword-filter" className="text-sm font-medium text-gray-700">
                Keyword
              </label>
              <select
                id="keyword-filter"
                value={selectedKeywordId || ''}
                onChange={(e) => setSelectedKeywordId(e.target.value || null)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
              >
                <option value="">All keywords</option>
                {trackedKeywords.map((tk) => (
                  <option key={tk.keywordId} value={tk.keywordId}>
                    {tk.phrase || tk.keywordId}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                {sortedBusinesses.length} {sortedBusinesses.length === 1 ? 'business' : 'businesses'} found
              </span>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
              <div className="inline-block min-w-full align-middle px-4 sm:px-6">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-0.5 hover:text-gray-700"
                        >
                          Business <SortIcon field="name" />
                        </button>
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('avgPosition')}
                          className="flex items-center justify-center gap-0.5 hover:text-gray-700 mx-auto"
                        >
                          Avg rank <SortIcon field="avgPosition" />
                        </button>
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Range
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('gridPointsVisible')}
                          className="flex items-center justify-center gap-0.5 hover:text-gray-700 mx-auto"
                        >
                          Visibility <SortIcon field="gridPointsVisible" />
                        </button>
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('avgRating')}
                          className="flex items-center justify-center gap-0.5 hover:text-gray-700 mx-auto"
                        >
                          Rating <SortIcon field="avgRating" />
                        </button>
                      </th>
                      <th className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('avgReviewCount')}
                          className="flex items-center justify-center gap-0.5 hover:text-gray-700 mx-auto"
                        >
                          Reviews <SortIcon field="avgReviewCount" />
                        </button>
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedBusinesses.map((biz, idx) => {
                      const visPercent = getVisibilityPercent(biz.gridPointsVisible, biz.totalGridPoints);

                      return (
                        <tr
                          key={biz.placeId || biz.name + idx}
                          className={`
                            ${biz.isOwnBusiness ? 'bg-blue-50/50' : 'hover:bg-gray-50'}
                            transition-colors
                          `}
                        >
                          {/* Business Name */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {biz.isOwnBusiness && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-blue text-white whitespace-nowrap">
                                  You
                                </span>
                              )}
                              <span className={`text-sm ${biz.isOwnBusiness ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                                {biz.name}
                              </span>
                            </div>
                          </td>

                          {/* Avg Position */}
                          <td className="py-3 px-3 text-center">
                            <span className={`text-sm ${getPositionColor(biz.avgPosition)}`}>
                              {biz.avgPosition !== null ? `#${biz.avgPosition.toFixed(1)}` : '–'}
                            </span>
                          </td>

                          {/* Position Range */}
                          <td className="py-3 px-3 text-center hidden sm:table-cell">
                            {biz.bestPosition !== null && biz.worstPosition !== null ? (
                              <span className="text-xs text-gray-500">
                                #{biz.bestPosition}–{biz.worstPosition}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">–</span>
                            )}
                          </td>

                          {/* Visibility */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${biz.isOwnBusiness ? 'bg-slate-blue' : 'bg-gray-500'}`}
                                  style={{ width: `${visPercent}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                {biz.gridPointsVisible}/{biz.totalGridPoints}
                              </span>
                            </div>
                          </td>

                          {/* Rating */}
                          <td className="py-3 px-3 text-center">
                            {biz.avgRating !== null ? (
                              <div className="flex items-center justify-center gap-1">
                                <Icon name="FaStar" size={12} className="text-yellow-400" />
                                <span className="text-sm text-gray-700">{biz.avgRating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">–</span>
                            )}
                          </td>

                          {/* Review Count */}
                          <td className="py-3 px-3 text-center">
                            {biz.avgReviewCount !== null ? (
                              <span className="text-sm text-gray-700">{biz.avgReviewCount.toLocaleString()}</span>
                            ) : (
                              <span className="text-sm text-gray-400">–</span>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3 hidden lg:table-cell">
                            {biz.category ? (
                              <span className="text-xs text-gray-500">{biz.category}</span>
                            ) : (
                              <span className="text-xs text-gray-400">–</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Top 3
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-slate-blue" /> Top 10
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500" /> Top 20
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Below 20
              </span>
              <span className="ml-auto text-gray-500">
                Data from latest grid check
              </span>
            </div>
          </>
        )}
      </PageCard>
    </>
  );
}
