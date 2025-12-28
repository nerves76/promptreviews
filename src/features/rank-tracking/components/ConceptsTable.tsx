'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/Icon';
import { type KeywordData } from '@/features/keywords/keywordUtils';
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
}: ConceptsTableProps) {
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
      // Extract conceptId from expandedRowKey (format: "conceptId-keyword")
      const conceptId = expandedRowKey.split('-')[0];
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

  // Helper to normalize term for volume lookup
  const normalizeTermForLookup = (term: string) => term.toLowerCase().trim();

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
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 w-32">
              <button
                onClick={() => handleSort('concept')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Concept
                <SortIcon field="concept" />
              </button>
            </th>
            <th className="text-left py-3 px-4">
              <button
                onClick={() => handleSort('keyword')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Keyword
                <SortIcon field="keyword" />
              </button>
            </th>
            <th className="text-center py-3 px-4 w-28">
              <button
                onClick={() => handleSort('volume')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 mx-auto"
              >
                Volume
                <SortIcon field="volume" />
              </button>
            </th>
            <th className="text-center py-3 px-4 w-36">
              <button
                onClick={() => handleSort('rank')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 mx-auto"
              >
                Rank
                <SortIcon field="rank" />
              </button>
            </th>
            <th className="text-center py-3 px-4 w-24">
              <span className="text-sm font-semibold text-gray-700">Grid</span>
            </th>
            <th className="text-center py-3 px-4 w-24">
              <button
                onClick={() => handleSort('change')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 mx-auto"
              >
                Change
                <SortIcon field="change" />
              </button>
            </th>
            <th className="text-center py-3 px-4 w-28">
              <span className="text-sm font-semibold text-gray-700">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <React.Fragment key={`${row.concept.id}-${row.keyword}-${index}`}>
            <tr
              onClick={() => onConceptClick?.(row.concept)}
              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="py-3 px-4 w-32">
                <span className="text-sm text-gray-500" title={row.concept.name}>
                  {row.concept.name || '—'}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm font-medium text-gray-900">{row.keyword}</span>
              </td>
              <td className="py-3 px-4 text-center">
                {row.volume !== null ? (
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-blue-600">
                      {formatVolume(row.volume)}
                    </span>
                    {row.volumeLocation && (
                      <span className="text-[10px] text-gray-400 truncate max-w-[80px]" title={row.volumeLocation}>
                        {row.volumeLocation}
                      </span>
                    )}
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
                    <div className="flex items-center gap-2">
                      {/* Desktop rank */}
                      {row.desktopChecked && (
                        <span className="flex items-center gap-0.5" title="Desktop">
                          <svg className="w-3 h-3 text-gray-400" viewBox="0 0 16 14" fill="currentColor">
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
                        <span className="flex items-center gap-0.5" title="Mobile">
                          <svg className="w-2.5 h-3.5 text-gray-400" viewBox="0 0 10 16" fill="currentColor">
                            <rect x="0" y="0" width="10" height="16" rx="1.5" />
                            <rect x="3.5" y="13" width="3" height="1" rx="0.5" fill="white" />
                          </svg>
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
              <td className="py-3 px-4 text-center">
                {getChangeDisplay(row.change)}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => handleCheckVolume(row.keyword, row.concept.id, e)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    title="Check search volume"
                  >
                    <Icon name="FaChartLine" className="w-3 h-3" />
                    Volume
                  </button>
                  <button
                    onClick={(e) => handleCheckRank(row.keyword, row.concept.id, e)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-slate-blue rounded hover:bg-slate-blue/90 transition-colors"
                    title="Check desktop & mobile ranks (2 credits)"
                  >
                    <Icon name="FaSearch" className="w-3 h-3" />
                    Rank
                  </button>
                  {(row.desktopChecked || row.mobileChecked) && (
                    <button
                      onClick={(e) => handleToggleHistory(`${row.concept.id}-${row.keyword}`, row.concept.id, e)}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                        expandedRowKey === `${row.concept.id}-${row.keyword}`
                          ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                      }`}
                      title={expandedRowKey === `${row.concept.id}-${row.keyword}` ? 'Hide rank history' : 'View rank history'}
                    >
                      <Icon name={expandedRowKey === `${row.concept.id}-${row.keyword}` ? 'FaChevronUp' : 'FaClock'} className="w-3 h-3" />
                      History
                    </button>
                  )}
                </div>
              </td>
            </tr>
            {/* Expanded history row */}
            {expandedRowKey === `${row.concept.id}-${row.keyword}` && (
              <tr className="bg-gray-50">
                <td colSpan={7} className="py-4 px-6">
                  <div className="max-w-4xl">
                    {/* Header with time range selector */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {/* Summary stats */}
                        {historySummary && (
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 14" fill="currentColor">
                                <rect x="0" y="0" width="16" height="10" rx="1" />
                                <rect x="5" y="11" width="6" height="1" />
                                <rect x="4" y="12" width="8" height="1" />
                              </svg>
                              <span className="text-gray-600">Desktop:</span>
                              <span className={`font-semibold ${
                                historySummary.currentDesktopPosition !== null
                                  ? historySummary.currentDesktopPosition <= 3 ? 'text-green-600'
                                    : historySummary.currentDesktopPosition <= 10 ? 'text-blue-600'
                                    : 'text-gray-700'
                                  : 'text-gray-400'
                              }`}>
                                {historySummary.currentDesktopPosition !== null ? `#${historySummary.currentDesktopPosition}` : '—'}
                              </span>
                              {historySummary.desktopChange !== null && historySummary.desktopChange !== 0 && (
                                <span className={`text-xs ${historySummary.desktopChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {historySummary.desktopChange > 0 ? '↑' : '↓'}{Math.abs(historySummary.desktopChange)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-3 h-4 text-gray-400" viewBox="0 0 10 16" fill="currentColor">
                                <rect x="0" y="0" width="10" height="16" rx="1.5" />
                                <rect x="3.5" y="13" width="3" height="1" rx="0.5" fill="white" />
                              </svg>
                              <span className="text-gray-600">Mobile:</span>
                              <span className={`font-semibold ${
                                historySummary.currentMobilePosition !== null
                                  ? historySummary.currentMobilePosition <= 3 ? 'text-green-600'
                                    : historySummary.currentMobilePosition <= 10 ? 'text-blue-600'
                                    : 'text-gray-700'
                                  : 'text-gray-400'
                              }`}>
                                {historySummary.currentMobilePosition !== null ? `#${historySummary.currentMobilePosition}` : '—'}
                              </span>
                              {historySummary.mobileChange !== null && historySummary.mobileChange !== 0 && (
                                <span className={`text-xs ${historySummary.mobileChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {historySummary.mobileChange > 0 ? '↑' : '↓'}{Math.abs(historySummary.mobileChange)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={historyDays}
                          onChange={(e) => setHistoryDays(parseInt(e.target.value, 10))}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={30}>30 days</option>
                          <option value={90}>90 days</option>
                          <option value={180}>6 months</option>
                          <option value={365}>1 year</option>
                        </select>
                        <button
                          onClick={(e) => handleToggleHistory(`${row.concept.id}-${row.keyword}`, row.concept.id, e)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Close"
                        >
                          <Icon name="FaTimes" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* Chart */}
                    <RankHistoryChart
                      history={historyData}
                      isLoading={historyLoading}
                      keywordName={row.keyword}
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
    </div>
  );
}
