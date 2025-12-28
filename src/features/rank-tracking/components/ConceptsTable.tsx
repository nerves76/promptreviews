'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import Pagination from '@/components/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { type KeywordData, normalizePhrase } from '@/features/keywords/keywordUtils';
import { apiClient } from '@/utils/apiClient';
import RankHistoryChart from './RankHistoryChart';

// ============================================
// Types
// ============================================

type SortField = 'keyword' | 'concept' | 'volume' | 'rank' | 'change';
type SortDirection = 'asc' | 'desc';

/** Volume data for a search term */
interface VolumeData {
  searchVolume: number | null;
  cpc: number | null;
  competitionLevel: string | null;
  locationName: string | null;
}

/** Rank data for a search term - stores both desktop and mobile */
interface RankData {
  desktop: { position: number | null; checkedAt: string } | null;
  mobile: { position: number | null; checkedAt: string } | null;
  locationName: string;
}

/** Geo grid summary stats */
interface GeoGridSummary {
  pointsInTop3: number;
  pointsInTop10: number;
  pointsInTop20: number;
  pointsNotFound: number;
  totalPoints: number;
  averagePosition: number | null;
}

/** Geo grid data for a concept */
interface GeoGridData {
  isTracked: boolean;
  locationName: string | null;
  summary: GeoGridSummary | null;
}

/** History data point for chart */
interface RankHistoryDataPoint {
  date: string;
  desktop: { position: number | null; checkedAt: string } | null;
  mobile: { position: number | null; checkedAt: string } | null;
  locationName: string | null;
}

/** Summary stats for history */
interface RankHistorySummary {
  currentDesktopPosition: number | null;
  currentMobilePosition: number | null;
  desktopChange: number | null;
  mobileChange: number | null;
  totalChecks: number;
}

interface ConceptsTableProps {
  concepts: KeywordData[];
  volumeData?: Map<string, VolumeData>;
  rankData?: Map<string, RankData>;
  gridData?: Map<string, GeoGridData>;
  onConceptClick?: (concept: KeywordData) => void;
  onCheckRank?: (keyword: string, conceptId: string) => void;
  onCheckVolume?: (keyword: string, conceptId: string) => void;
  isLoading?: boolean;
  /** Keyword currently being checked for rank (shows spinner on that row's Rank button) */
  checkingRankKeyword?: string | null;
  /** Keyword currently being checked for volume (shows spinner on that row's Volume button) */
  checkingVolumeKeyword?: string | null;
}

/** Each row represents a single keyword (search term) */
interface KeywordRow {
  keyword: string;
  isCanonical: boolean;
  concept: KeywordData;
  conceptName: string;
  volume: number | null;
  volumeLocation: string | null;
  desktopRank: number | null;
  desktopChecked: boolean; // Was a desktop rank check performed?
  mobileRank: number | null;
  mobileChecked: boolean; // Was a mobile rank check performed?
  rankLocation: string | null;
  change: number | null;
  // Grid tracking data (at concept level)
  gridTracked: boolean;
  gridPointsInTop10: number | null;
  gridTotalPoints: number | null;
  gridLocation: string | null;
}

// ============================================
// Helper Functions
// ============================================

function formatVolume(volume: number | null): string {
  if (volume === null) return '—';
  if (volume < 10) return '<10';
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toString();
}

function getPositionColor(position: number | null): string {
  if (position === null) return 'text-gray-400';
  if (position <= 3) return 'text-green-600';
  if (position <= 10) return 'text-blue-600';
  if (position <= 20) return 'text-amber-600';
  return 'text-gray-600';
}

const STATE_ABBREVIATIONS: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'District of Columbia': 'DC',
};

function abbreviateState(location: string): string {
  for (const [full, abbr] of Object.entries(STATE_ABBREVIATIONS)) {
    if (location.includes(full)) {
      return location.replace(full, abbr);
    }
  }
  return location;
}

function getChangeDisplay(change: number | null): React.ReactNode {
  if (change === null || change === 0) {
    return <span className="text-gray-400">—</span>;
  }
  if (change > 0) {
    return (
      <span className="text-green-600 font-medium flex items-center justify-center gap-0.5">
        <span className="text-xs">↑</span>{change}
      </span>
    );
  }
  return (
    <span className="text-red-600 font-medium flex items-center justify-center gap-0.5">
      <span className="text-xs">↓</span>{Math.abs(change)}
    </span>
  );
}

// ============================================
// Component
// ============================================

export default function ConceptsTable({
  concepts,
  volumeData,
  rankData,
  gridData,
  onConceptClick,
  onCheckRank,
  onCheckVolume,
  isLoading = false,
  checkingRankKeyword,
  checkingVolumeKeyword,
}: ConceptsTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('keyword');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  // Track which row is expanded to show history
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  // History data for expanded row
  const [historyData, setHistoryData] = useState<RankHistoryDataPoint[]>([]);
  const [historySummary, setHistorySummary] = useState<RankHistorySummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDays, setHistoryDays] = useState(90);

  // Fetch history when a row is expanded
  const fetchHistory = useCallback(async (keywordId: string) => {
    setHistoryLoading(true);
    try {
      const response = await apiClient.get<{
        history: RankHistoryDataPoint[];
        summary: RankHistorySummary;
      }>(`/rank-tracking/history?keywordId=${keywordId}&days=${historyDays}`);
      setHistoryData(response.history);
      setHistorySummary(response.summary);
    } catch (err) {
      console.error('Failed to fetch rank history:', err);
      setHistoryData([]);
      setHistorySummary(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyDays]);

  // Handle expanding/collapsing a row
  const handleToggleHistory = useCallback((rowKey: string, conceptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedRowKey === rowKey) {
      // Collapse
      setExpandedRowKey(null);
      setHistoryData([]);
      setHistorySummary(null);
    } else {
      // Expand and fetch
      setExpandedRowKey(rowKey);
      fetchHistory(conceptId);
    }
  }, [expandedRowKey, fetchHistory]);

  // Re-fetch when days change and row is expanded
  useEffect(() => {
    if (expandedRowKey) {
      // Extract conceptId from expandedRowKey (format: "conceptId::keyword")
      const conceptId = expandedRowKey.split('::')[0];
      if (conceptId) {
        fetchHistory(conceptId);
      }
    }
  }, [historyDays, expandedRowKey, fetchHistory]);

  const handleCheckRank = (keyword: string, conceptId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row click
    if (!onCheckRank) return;
    onCheckRank(keyword, conceptId);
  };

  const handleCheckVolume = (keyword: string, conceptId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row click
    if (!onCheckVolume) return;
    onCheckVolume(keyword, conceptId);
  };

  // Helper to normalize term for volume lookup - use shared normalizePhrase for consistency
  const normalizeTermForLookup = normalizePhrase;

  // Flatten concepts into individual keyword rows
  const rows: KeywordRow[] = useMemo(() => {
    const allRows: KeywordRow[] = [];

    concepts.forEach((concept) => {
      // Get the concept name (for grouping)
      const conceptName = concept.searchTerms?.find(t => t.isCanonical)?.term ||
                          concept.searchQuery ||
                          concept.phrase;

      // Get grid data for this concept (grid tracking is at concept level)
      const conceptGrid = gridData?.get(concept.id);

      if (concept.searchTerms && concept.searchTerms.length > 0) {
        // Add a row for each search term
        concept.searchTerms.forEach((term) => {
          const normalizedTerm = normalizeTermForLookup(term.term);
          const termVolume = volumeData?.get(normalizedTerm);
          const termRank = rankData?.get(normalizedTerm);
          allRows.push({
            keyword: term.term,
            isCanonical: term.isCanonical,
            concept,
            conceptName,
            volume: termVolume?.searchVolume ?? null,
            volumeLocation: termVolume?.locationName ?? null,
            desktopRank: termRank?.desktop?.position ?? null,
            desktopChecked: termRank?.desktop !== null && termRank?.desktop !== undefined,
            mobileRank: termRank?.mobile?.position ?? null,
            mobileChecked: termRank?.mobile !== null && termRank?.mobile !== undefined,
            rankLocation: termRank?.locationName ?? null,
            change: null,
            gridTracked: conceptGrid?.isTracked ?? false,
            gridPointsInTop10: conceptGrid?.summary?.pointsInTop10 ?? null,
            gridTotalPoints: conceptGrid?.summary?.totalPoints ?? null,
            gridLocation: conceptGrid?.locationName ?? null,
          });
        });
      } else {
        // Concept with no search terms - show as single row
        const normalizedTerm = normalizeTermForLookup(conceptName);
        const termVolume = volumeData?.get(normalizedTerm);
        const termRank = rankData?.get(normalizedTerm);
        allRows.push({
          keyword: conceptName,
          isCanonical: true,
          concept,
          conceptName,
          volume: termVolume?.searchVolume ?? null,
          volumeLocation: termVolume?.locationName ?? null,
          desktopRank: termRank?.desktop?.position ?? null,
          desktopChecked: termRank?.desktop !== null && termRank?.desktop !== undefined,
          mobileRank: termRank?.mobile?.position ?? null,
          mobileChecked: termRank?.mobile !== null && termRank?.mobile !== undefined,
          rankLocation: termRank?.locationName ?? null,
          change: null,
          gridTracked: conceptGrid?.isTracked ?? false,
          gridPointsInTop10: conceptGrid?.summary?.pointsInTop10 ?? null,
          gridTotalPoints: conceptGrid?.summary?.totalPoints ?? null,
          gridLocation: conceptGrid?.locationName ?? null,
        });
      }
    });

    return allRows;
  }, [concepts, volumeData, rankData, gridData, normalizeTermForLookup]);

  // Sort rows
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'keyword':
          comparison = a.keyword.localeCompare(b.keyword);
          break;
        case 'concept':
          comparison = a.conceptName.localeCompare(b.conceptName);
          break;
        case 'volume':
          // Null volumes go to the end
          if (a.volume === null && b.volume === null) comparison = 0;
          else if (a.volume === null) comparison = 1;
          else if (b.volume === null) comparison = -1;
          else comparison = b.volume - a.volume; // Higher volume first by default
          break;
        case 'rank':
          // Use best (lowest) rank between desktop and mobile for sorting
          const aBestRank = a.desktopRank !== null && a.mobileRank !== null
            ? Math.min(a.desktopRank, a.mobileRank)
            : a.desktopRank ?? a.mobileRank;
          const bBestRank = b.desktopRank !== null && b.mobileRank !== null
            ? Math.min(b.desktopRank, b.mobileRank)
            : b.desktopRank ?? b.mobileRank;
          // Null ranks go to the end
          if (aBestRank === null && bBestRank === null) comparison = 0;
          else if (aBestRank === null) comparison = 1;
          else if (bBestRank === null) comparison = -1;
          else comparison = aBestRank - bBestRank;
          break;
        case 'change':
          // Null changes go to the end
          if (a.change === null && b.change === null) comparison = 0;
          else if (a.change === null) comparison = 1;
          else if (b.change === null) comparison = -1;
          else comparison = b.change - a.change; // Higher change is better
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rows, sortField, sortDirection]);

  // Pagination - paginate the sorted rows
  const PAGE_SIZE = 25;
  const {
    currentPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    goToPage,
  } = usePagination({ totalItems: sortedRows.length, pageSize: PAGE_SIZE });

  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon name="FaChevronDown" className="w-3 h-3 text-gray-300" />;
    }
    return (
      <Icon
        name={sortDirection === 'asc' ? 'FaChevronUp' : 'FaChevronDown'}
        className="w-3 h-3 text-slate-blue"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No keywords to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full min-w-[970px]">
        {/* Column widths: Keyword, Concept, Volume, Rank, Change, Grid, Actions */}
        <colgroup><col style={{ minWidth: '280px' }} /><col style={{ minWidth: '120px' }} /><col style={{ minWidth: '90px' }} /><col style={{ minWidth: '110px' }} /><col style={{ minWidth: '70px' }} /><col style={{ minWidth: '80px' }} /><col style={{ minWidth: '220px' }} /></colgroup>
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 pl-4 pr-4">
              <button
                onClick={() => handleSort('keyword')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Keyword
                <SortIcon field="keyword" />
              </button>
            </th>
            <th className="text-left py-3 px-4">
              <button
                onClick={() => handleSort('concept')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Concept
                <SortIcon field="concept" />
              </button>
            </th>
            <th className="text-center py-3 px-4">
              <button
                onClick={() => handleSort('volume')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 mx-auto"
              >
                Volume
                <SortIcon field="volume" />
              </button>
            </th>
            <th className="text-center py-3 px-4">
              <button
                onClick={() => handleSort('rank')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 mx-auto"
              >
                Rank
                <SortIcon field="rank" />
              </button>
            </th>
            <th className="text-center py-3 px-4">
              <button
                onClick={() => handleSort('change')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 mx-auto"
              >
                Change
                <SortIcon field="change" />
              </button>
            </th>
            <th className="text-center py-3 px-4">
              <span className="text-sm font-semibold text-gray-700">Grid</span>
            </th>
            <th className="text-center py-3 pl-4 pr-6">
              <span className="text-sm font-semibold text-gray-700">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, index) => (
            <React.Fragment key={`${row.concept.id}-${row.keyword}-${index}`}>
            <tr
              className={`border-b border-gray-100 hover:bg-white transition-colors ${
                expandedRowKey === `${row.concept.id}::${row.keyword}` ? 'bg-blue-50' : ''
              }`}
            >
              <td className="py-3 pl-4 pr-4">
                <div className="flex items-center gap-3">
                  <span className="w-4 flex-shrink-0 flex items-center justify-center">
                    {(row.desktopChecked || row.mobileChecked) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleHistory(`${row.concept.id}::${row.keyword}`, row.concept.id, e);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Icon
                          name={expandedRowKey === `${row.concept.id}::${row.keyword}` ? 'FaChevronDown' : 'FaChevronRight'}
                          className="w-3 h-3"
                        />
                      </button>
                    )}
                  </span>
                  <span
                    className="text-sm font-medium text-gray-900 cursor-pointer hover:text-slate-blue"
                    onClick={() => onConceptClick?.(row.concept)}
                  >
                    {row.keyword}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-xs text-gray-500 leading-snug">
                  {row.concept.name || '—'}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {row.volume !== null ? (
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-blue-600">
                      {formatVolume(row.volume)}
                    </span>
                    {row.volumeLocation && (() => {
                      const parts = row.volumeLocation.split(', ');
                      const country = parts.pop();
                      const cityState = abbreviateState(parts.join(', '));
                      return (
                        <div className="text-[10px] text-gray-400 text-center" title={row.volumeLocation}>
                          <div>{cityState}</div>
                          {country && <div>{country}</div>}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleCheckVolume(row.keyword, row.concept.id, e)}
                    className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                    title="Check search volume"
                  >
                    Check
                  </button>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {row.desktopChecked || row.mobileChecked ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3">
                      {/* Desktop rank */}
                      {row.desktopChecked && (
                        <span className="flex items-center gap-1" title="Desktop">
                          <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 14" fill="currentColor">
                            <rect x="0" y="0" width="16" height="10" rx="1" />
                            <rect x="5" y="11" width="6" height="1" />
                            <rect x="4" y="12" width="8" height="1" />
                          </svg>
                          <span className={`font-semibold ${row.desktopRank !== null ? getPositionColor(row.desktopRank) : 'text-gray-400'}`}>
                            {row.desktopRank !== null ? (row.desktopRank > 100 ? '>100' : row.desktopRank) : '>100'}
                          </span>
                        </span>
                      )}
                      {/* Mobile rank */}
                      {row.mobileChecked && (
                        <span className="flex items-center gap-1" title="Mobile">
                          <Icon name="FaMobile" className="w-3.5 h-3.5 text-gray-400" />
                          <span className={`font-semibold ${row.mobileRank !== null ? getPositionColor(row.mobileRank) : 'text-gray-400'}`}>
                            {row.mobileRank !== null ? (row.mobileRank > 100 ? '>100' : row.mobileRank) : '>100'}
                          </span>
                        </span>
                      )}
                    </div>
                    {row.rankLocation && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[100px]" title={row.rankLocation}>
                        {row.rankLocation}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {getChangeDisplay(row.change)}
              </td>
              <td className="py-3 px-4 text-center">
                {row.gridTracked && row.gridTotalPoints !== null && row.gridTotalPoints > 0 ? (
                  <div className="flex flex-col items-center">
                    <span className={`text-sm font-medium ${
                      row.gridPointsInTop10 === row.gridTotalPoints
                        ? 'text-green-600'
                        : row.gridPointsInTop10 !== null && row.gridPointsInTop10 > 0
                          ? 'text-amber-600'
                          : 'text-gray-500'
                    }`}>
                      {row.gridPointsInTop10 ?? 0}/{row.gridTotalPoints}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {Math.round(((row.gridPointsInTop10 ?? 0) / row.gridTotalPoints) * 100)}% top 10
                    </span>
                  </div>
                ) : row.gridTracked ? (
                  <span className="text-xs text-gray-400" title="No grid checks yet">—</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="py-3 pl-4 pr-6">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => handleCheckVolume(row.keyword, row.concept.id, e)}
                    disabled={checkingVolumeKeyword === row.keyword}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    title="Check search volume"
                  >
                    {checkingVolumeKeyword === row.keyword ? (
                      <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                    ) : (
                      <Icon name="FaChartLine" className="w-3 h-3" />
                    )}
                    Volume
                  </button>
                  <button
                    onClick={(e) => handleCheckRank(row.keyword, row.concept.id, e)}
                    disabled={checkingRankKeyword === row.keyword}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-slate-blue rounded hover:bg-slate-blue/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    title="Check desktop & mobile ranks (2 credits)"
                  >
                    {checkingRankKeyword === row.keyword ? (
                      <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                    ) : (
                      <Icon name="FaSearch" className="w-3 h-3" />
                    )}
                    Rank
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/local-ranking-grids?keywordId=${row.concept.id}`);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                      row.gridTracked
                        ? 'text-white bg-emerald-600 hover:bg-emerald-700'
                        : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                    title={row.gridTracked ? 'View geo grid results' : 'Set up local ranking grid'}
                  >
                    <Icon name="FaMapMarker" className="w-3 h-3" />
                    Grid
                  </button>
                </div>
              </td>
            </tr>
            {/* Expanded history row */}
            {expandedRowKey === `${row.concept.id}::${row.keyword}` && (
              <tr className="bg-blue-50">
                <td colSpan={7} className="py-2 px-6">
                  <div className="max-w-[850px]">
                    {/* Chart */}
                    <RankHistoryChart
                      history={historyData}
                      isLoading={historyLoading}
                      keywordName={row.keyword}
                      days={historyDays}
                      onDaysChange={setHistoryDays}
                    />
                    {historySummary && (
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        {historySummary.totalChecks} rank checks
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {sortedRows.length > PAGE_SIZE && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedRows.length}
          pageSize={pageSize}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
}
