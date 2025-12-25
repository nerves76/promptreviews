'use client';

import { useState, useMemo } from 'react';
import Icon from '@/components/Icon';
import { type KeywordData } from '@/features/keywords/keywordUtils';

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

interface ConceptsTableProps {
  concepts: KeywordData[];
  volumeData?: Map<string, VolumeData>;
  rankData?: Map<string, RankData>;
  onConceptClick?: (concept: KeywordData) => void;
  onCheckRank?: (keyword: string, conceptId: string) => void;
  onCheckVolume?: (keyword: string) => void;
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
  mobileRank: number | null;
  rankLocation: string | null;
  change: number | null;
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
  onConceptClick,
  onCheckRank,
  onCheckVolume,
  isLoading = false,
}: ConceptsTableProps) {
  const [sortField, setSortField] = useState<SortField>('keyword');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleCheckRank = (keyword: string, conceptId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row click
    if (!onCheckRank) return;
    onCheckRank(keyword, conceptId);
  };

  const handleCheckVolume = (keyword: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row click
    if (!onCheckVolume) return;
    onCheckVolume(keyword);
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
            mobileRank: termRank?.mobile?.position ?? null,
            rankLocation: termRank?.locationName ?? null,
            change: null,
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
          mobileRank: termRank?.mobile?.position ?? null,
          rankLocation: termRank?.locationName ?? null,
          change: null,
        });
      }
    });

    return allRows;
  }, [concepts, volumeData, rankData, normalizeTermForLookup]);

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
            <th className="text-left py-3 px-4">
              <button
                onClick={() => handleSort('keyword')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Keyword
                <SortIcon field="keyword" />
              </button>
            </th>
            <th className="text-left py-3 px-4 w-48">
              <button
                onClick={() => handleSort('concept')}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Concept
                <SortIcon field="concept" />
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
            <tr
              key={`${row.concept.id}-${row.keyword}-${index}`}
              onClick={() => onConceptClick?.(row.concept)}
              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="py-3 px-4">
                <span className="text-sm font-medium text-gray-900">{row.keyword}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-600 truncate block max-w-[180px]">
                  {row.conceptName !== row.keyword ? row.conceptName : '—'}
                </span>
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
                    onClick={(e) => handleCheckVolume(row.keyword, e)}
                    className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                    title="Check search volume"
                  >
                    Check
                  </button>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {row.desktopRank !== null || row.mobileRank !== null ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      {/* Desktop rank */}
                      <span className="flex items-center gap-0.5" title="Desktop">
                        <span className="text-xs">🖥️</span>
                        <span className={`font-semibold ${getPositionColor(row.desktopRank)}`}>
                          {row.desktopRank !== null ? `#${row.desktopRank}` : '—'}
                        </span>
                      </span>
                      {/* Mobile rank */}
                      <span className="flex items-center gap-0.5" title="Mobile">
                        <span className="text-xs">📱</span>
                        <span className={`font-semibold ${getPositionColor(row.mobileRank)}`}>
                          {row.mobileRank !== null ? `#${row.mobileRank}` : '—'}
                        </span>
                      </span>
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
              <td className="py-3 px-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => handleCheckVolume(row.keyword, e)}
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
