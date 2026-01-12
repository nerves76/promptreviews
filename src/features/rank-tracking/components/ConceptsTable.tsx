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

/** SERP features data */
interface SerpFeatures {
  paaQuestionCount: number | null;
  paaOursCount: number | null;
  aiOverviewPresent: boolean | null;
  aiOverviewOursCited: boolean | null;
  featuredSnippetPresent: boolean | null;
  featuredSnippetOurs: boolean | null;
}

/** Rank data for a search term - stores both desktop and mobile with previous positions */
interface RankData {
  desktop: { position: number | null; checkedAt: string; foundUrl: string | null } | null;
  mobile: { position: number | null; checkedAt: string; foundUrl: string | null } | null;
  previousDesktop: { position: number | null; checkedAt: string } | null;
  previousMobile: { position: number | null; checkedAt: string } | null;
  locationName: string;
  serpFeatures: SerpFeatures | null;
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

/** Schedule status data for a concept */
interface ScheduleStatusData {
  isScheduled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | null;
  isEnabled: boolean;
  nextScheduledAt: string | null;
}

/** History data point for chart */
interface RankHistoryDataPoint {
  date: string;
  desktop: { position: number | null; checkedAt: string } | null;
  mobile: { position: number | null; checkedAt: string } | null;
  locationName: string | null;
}

/** Competitor data from SERP */
interface CompetitorData {
  position: number;
  url: string;
  title?: string;
  domain?: string;
}

/** Summary stats for history */
interface RankHistorySummary {
  currentDesktopPosition: number | null;
  currentMobilePosition: number | null;
  desktopChange: number | null;
  mobileChange: number | null;
  totalChecks: number;
  latestFoundUrl: string | null;
  topCompetitors: CompetitorData[] | null;
}

interface ConceptsTableProps {
  concepts: KeywordData[];
  volumeData?: Map<string, VolumeData>;
  rankData?: Map<string, RankData>;
  gridData?: Map<string, GeoGridData>;
  scheduleData?: Map<string, ScheduleStatusData>;
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
  // URL and timing data
  foundUrl: string | null;
  lastChecked: string | null;
  // SERP features
  serpFeatures: SerpFeatures | null;
  // Grid tracking data (at concept level)
  gridTracked: boolean;
  gridPointsInTop10: number | null;
  gridTotalPoints: number | null;
  gridLocation: string | null;
  // Schedule data (at concept level)
  isScheduled: boolean;
  scheduleFrequency: string | null;
  scheduleEnabled: boolean;
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
  if (position === null) return 'text-gray-500';
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
    return <span className="text-gray-500">—</span>;
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

/**
 * Calculate position change from previous to current.
 * Positive = improvement (moved up in rankings, lower position number)
 * Negative = decline (moved down in rankings, higher position number)
 */
function calculatePositionChange(
  currentPosition: number | null,
  previousPosition: number | null
): number | null {
  if (currentPosition === null || previousPosition === null) {
    return null;
  }
  // Previous - Current: positive means improvement (e.g., was #10, now #5 = +5)
  return previousPosition - currentPosition;
}

/**
 * Truncate a URL to show only the path portion (without domain)
 * e.g., "https://example.com/services/plumbing" -> "/services/plumbing"
 */
function truncateUrl(url: string | null, maxLength: number = 30): string {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;
    // Remove trailing slash if present (unless it's just "/")
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    // Truncate if too long
    if (path.length > maxLength) {
      return path.slice(0, maxLength - 3) + '...';
    }
    return path || '/';
  } catch {
    // If URL parsing fails, just truncate the raw string
    if (url.length > maxLength) {
      return url.slice(0, maxLength - 3) + '...';
    }
    return url;
  }
}

/**
 * Format a date string relative to now (e.g., "2 days ago", "Today")
 */
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

// ============================================
// Component
// ============================================

export default function ConceptsTable({
  concepts,
  volumeData,
  rankData,
  gridData,
  scheduleData,
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
      // Get schedule data for this concept
      const conceptSchedule = scheduleData?.get(concept.id);

      if (concept.searchTerms && concept.searchTerms.length > 0) {
        // Add a row for each search term
        concept.searchTerms.forEach((term) => {
          const normalizedTerm = normalizeTermForLookup(term.term);
          const termVolume = volumeData?.get(normalizedTerm);
          const termRank = rankData?.get(normalizedTerm);
          // Calculate change: use desktop change if available, otherwise mobile change
          const desktopChange = calculatePositionChange(
            termRank?.desktop?.position ?? null,
            termRank?.previousDesktop?.position ?? null
          );
          const mobileChange = calculatePositionChange(
            termRank?.mobile?.position ?? null,
            termRank?.previousMobile?.position ?? null
          );
          // Prefer desktop change, fallback to mobile
          const change = desktopChange ?? mobileChange;
          // Use desktop URL if available, fallback to mobile
          const foundUrl = termRank?.desktop?.foundUrl ?? termRank?.mobile?.foundUrl ?? null;
          // Use most recent check date
          const lastChecked = termRank?.desktop?.checkedAt ?? termRank?.mobile?.checkedAt ?? null;
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
            change,
            foundUrl,
            lastChecked,
            serpFeatures: termRank?.serpFeatures ?? null,
            gridTracked: conceptGrid?.isTracked ?? false,
            gridPointsInTop10: conceptGrid?.summary?.pointsInTop10 ?? null,
            gridTotalPoints: conceptGrid?.summary?.totalPoints ?? null,
            gridLocation: conceptGrid?.locationName ?? null,
            isScheduled: conceptSchedule?.isScheduled ?? false,
            scheduleFrequency: conceptSchedule?.frequency ?? null,
            scheduleEnabled: conceptSchedule?.isEnabled ?? false,
          });
        });
      } else {
        // Concept with no search terms - show as single row
        const normalizedTerm = normalizeTermForLookup(conceptName);
        const termVolume = volumeData?.get(normalizedTerm);
        const termRank = rankData?.get(normalizedTerm);
        // Calculate change: use desktop change if available, otherwise mobile change
        const desktopChange = calculatePositionChange(
          termRank?.desktop?.position ?? null,
          termRank?.previousDesktop?.position ?? null
        );
        const mobileChange = calculatePositionChange(
          termRank?.mobile?.position ?? null,
          termRank?.previousMobile?.position ?? null
        );
        // Prefer desktop change, fallback to mobile
        const change = desktopChange ?? mobileChange;
        // Use desktop URL if available, fallback to mobile
        const foundUrl = termRank?.desktop?.foundUrl ?? termRank?.mobile?.foundUrl ?? null;
        // Use most recent check date
        const lastChecked = termRank?.desktop?.checkedAt ?? termRank?.mobile?.checkedAt ?? null;
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
          change,
          foundUrl,
          lastChecked,
          serpFeatures: termRank?.serpFeatures ?? null,
          gridTracked: conceptGrid?.isTracked ?? false,
          gridPointsInTop10: conceptGrid?.summary?.pointsInTop10 ?? null,
          gridTotalPoints: conceptGrid?.summary?.totalPoints ?? null,
          gridLocation: conceptGrid?.locationName ?? null,
          isScheduled: conceptSchedule?.isScheduled ?? false,
          scheduleFrequency: conceptSchedule?.frequency ?? null,
          scheduleEnabled: conceptSchedule?.isEnabled ?? false,
        });
      }
    });

    return allRows;
  }, [concepts, volumeData, rankData, gridData, scheduleData, normalizeTermForLookup]);

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
    <div className="overflow-x-auto border border-gray-200 rounded-xl">
      <table className="w-full min-w-[1300px]">
        {/* Column widths: Keyword, Concept, Volume, Rank, Change, URL, Checked, SERP, Grid, Actions */}
        <colgroup>
          <col style={{ width: '20%', minWidth: '180px' }} />
          <col style={{ width: '12%', minWidth: '110px' }} />
          <col style={{ width: '7%', minWidth: '65px' }} />
          <col style={{ width: '10%', minWidth: '95px' }} />
          <col style={{ width: '5%', minWidth: '55px' }} />
          <col style={{ width: '11%', minWidth: '100px' }} />
          <col style={{ width: '6%', minWidth: '60px' }} />
          <col style={{ width: '8%', minWidth: '85px' }} />
          <col style={{ width: '6%', minWidth: '55px' }} />
          <col style={{ width: '15%', minWidth: '200px' }} />
        </colgroup>
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-3 pl-4 pr-4">
              <button
                onClick={() => handleSort('keyword')}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 ml-5"
              >
                Keyword
                <SortIcon field="keyword" />
              </button>
            </th>
            <th className="text-left py-3 px-4">
              <button
                onClick={() => handleSort('concept')}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
              >
                Concept
                <SortIcon field="concept" />
              </button>
            </th>
            <th className="text-center py-3 px-4">
              <button
                onClick={() => handleSort('volume')}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 mx-auto"
              >
                Volume
                <SortIcon field="volume" />
              </button>
            </th>
            <th className="text-center py-3 px-4">
              <button
                onClick={() => handleSort('rank')}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 mx-auto"
              >
                Rank
                <SortIcon field="rank" />
              </button>
            </th>
            <th className="text-center py-3 px-4">
              <button
                onClick={() => handleSort('change')}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900 mx-auto"
              >
                Change
                <SortIcon field="change" />
              </button>
            </th>
            <th className="text-center py-3 px-4">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">URL</span>
            </th>
            <th className="text-center py-3 px-4">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Checked</span>
            </th>
            <th className="text-center py-3 px-4">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">SERP</span>
            </th>
            <th className="text-center py-3 px-4">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Grid</span>
            </th>
            <th className="text-center py-3 pl-4 pr-6">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, index) => (
            <React.Fragment key={`${row.concept.id}-${row.keyword}-${index}`}>
            <tr
              className={`group/row border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                expandedRowKey === `${row.concept.id}::${row.keyword}` ? 'bg-blue-50' : ''
              }`}
            >
              <td className="py-3 pl-4 pr-4">
                <div className="flex items-center gap-2">
                  {(row.desktopChecked || row.mobileChecked) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleHistory(`${row.concept.id}::${row.keyword}`, row.concept.id, e);
                      }}
                      className="text-gray-500 hover:text-gray-600 transition-colors flex-shrink-0"
                      title="Show rank history"
                    >
                      <Icon
                        name={expandedRowKey === `${row.concept.id}::${row.keyword}` ? 'FaChevronDown' : 'FaChevronRight'}
                        className="w-3 h-3"
                      />
                    </button>
                  ) : (
                    <span className="w-3 flex-shrink-0" />
                  )}
                  <button
                    className="text-sm font-medium text-gray-900 cursor-pointer hover:text-slate-blue text-left inline-flex items-start gap-1.5 group"
                    onClick={() => onConceptClick?.(row.concept)}
                  >
                    <span>{row.keyword}</span>
                    {row.isScheduled && row.scheduleFrequency && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-medium rounded flex items-center gap-0.5 flex-shrink-0 ${
                          row.scheduleEnabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        title={row.scheduleEnabled ? `Scheduled ${row.scheduleFrequency}` : 'Schedule paused'}
                      >
                        <Icon name="FaCalendarAlt" className="w-2.5 h-2.5" />
                        {row.scheduleFrequency.charAt(0).toUpperCase() + row.scheduleFrequency.slice(1)}
                      </span>
                    )}
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center invisible group-hover/row:visible flex-shrink-0 mt-0.5">
                      <Icon
                        name="FaChevronRight"
                        className="w-2.5 h-2.5 text-gray-500"
                      />
                    </span>
                  </button>
                </div>
              </td>
              <td className="py-3 px-4">
                <span
                  className="text-xs text-gray-500 block truncate max-w-[160px]"
                  title={row.concept.name || undefined}
                >
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
                        <div className="text-[10px] text-gray-500 text-center" title={row.volumeLocation}>
                          <div>{cityState}</div>
                          {country && <div>{country}</div>}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleCheckVolume(row.keyword, row.concept.id, e)}
                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
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
                          <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 16 14" fill="currentColor">
                            <rect x="0" y="0" width="16" height="10" rx="1" />
                            <rect x="5" y="11" width="6" height="1" />
                            <rect x="4" y="12" width="8" height="1" />
                          </svg>
                          <span className={`font-semibold ${row.desktopRank !== null ? getPositionColor(row.desktopRank) : 'text-gray-500'}`}>
                            {row.desktopRank !== null ? row.desktopRank : '>100'}
                          </span>
                        </span>
                      )}
                      {/* Mobile rank */}
                      {row.mobileChecked && (
                        <span className="flex items-center gap-1" title="Mobile">
                          <Icon name="FaMobile" className="w-3.5 h-3.5 text-gray-500" />
                          <span className={`font-semibold ${row.mobileRank !== null ? getPositionColor(row.mobileRank) : 'text-gray-500'}`}>
                            {row.mobileRank !== null ? row.mobileRank : '>100'}
                          </span>
                        </span>
                      )}
                    </div>
                    {row.rankLocation && (() => {
                      const parts = row.rankLocation.split(', ');
                      const country = parts.pop();
                      const cityState = abbreviateState(parts.join(', '));
                      return (
                        <div className="text-[10px] text-gray-500 text-center" title={row.rankLocation}>
                          <div>{cityState}</div>
                          {country && <div>{country}</div>}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {getChangeDisplay(row.change)}
              </td>
              <td className="py-3 px-4 text-center">
                {row.foundUrl ? (
                  <a
                    href={row.foundUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-[110px]"
                    title={row.foundUrl}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {truncateUrl(row.foundUrl, 25)}
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                <span className="text-xs text-gray-500" title={row.lastChecked || undefined}>
                  {formatRelativeDate(row.lastChecked)}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {row.serpFeatures ? (
                  <div className="flex items-center justify-center gap-1.5">
                    {/* AI Overview */}
                    {row.serpFeatures.aiOverviewPresent && (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold ${
                          row.serpFeatures.aiOverviewOursCited
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        title={row.serpFeatures.aiOverviewOursCited ? 'AI Overview (cited)' : 'AI Overview present'}
                      >
                        AI
                      </span>
                    )}
                    {/* Featured Snippet */}
                    {row.serpFeatures.featuredSnippetPresent && (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold ${
                          row.serpFeatures.featuredSnippetOurs
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        title={row.serpFeatures.featuredSnippetOurs ? 'Featured Snippet (ours)' : 'Featured Snippet present'}
                      >
                        FS
                      </span>
                    )}
                    {/* People Also Ask */}
                    {row.serpFeatures.paaQuestionCount !== null && row.serpFeatures.paaQuestionCount > 0 && (
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold ${
                          row.serpFeatures.paaOursCount !== null && row.serpFeatures.paaOursCount > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        title={`PAA: ${row.serpFeatures.paaOursCount ?? 0}/${row.serpFeatures.paaQuestionCount} ours`}
                      >
                        ?
                      </span>
                    )}
                    {/* No features detected */}
                    {!row.serpFeatures.aiOverviewPresent &&
                     !row.serpFeatures.featuredSnippetPresent &&
                     (row.serpFeatures.paaQuestionCount === null || row.serpFeatures.paaQuestionCount === 0) && (
                      <span className="text-gray-400">—</span>
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
                    <span className="text-[10px] text-gray-500">
                      {Math.round(((row.gridPointsInTop10 ?? 0) / row.gridTotalPoints) * 100)}% top 10
                    </span>
                  </div>
                ) : row.gridTracked ? (
                  <span className="text-xs text-gray-500" title="No grid checks yet">—</span>
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
                <td colSpan={10} className="py-2 px-6">
                  <div className="max-w-[900px]">
                    {/* Chart */}
                    <RankHistoryChart
                      history={historyData}
                      isLoading={historyLoading}
                      keywordName={row.keyword}
                      days={historyDays}
                      onDaysChange={setHistoryDays}
                    />

                    {/* Details Panel */}
                    {historySummary && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Ranking URL */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Ranking URL</h4>
                            {historySummary.latestFoundUrl ? (
                              <a
                                href={historySummary.latestFoundUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                              >
                                {historySummary.latestFoundUrl}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-400">No ranking found</span>
                            )}
                          </div>

                          {/* Top Competitors */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Top Competitors</h4>
                            {historySummary.topCompetitors && historySummary.topCompetitors.length > 0 ? (
                              <ul className="space-y-1.5">
                                {historySummary.topCompetitors.slice(0, 5).map((competitor, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <span className="text-gray-400 font-medium w-5 flex-shrink-0">
                                      #{competitor.position}
                                    </span>
                                    <a
                                      href={competitor.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-600 hover:text-blue-600 truncate"
                                      title={competitor.url}
                                    >
                                      {competitor.domain || (() => {
                                        try {
                                          return new URL(competitor.url).hostname;
                                        } catch {
                                          return competitor.url;
                                        }
                                      })()}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-sm text-gray-400">No competitor data</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 text-center">
                          {historySummary.totalChecks} rank checks
                        </div>
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
