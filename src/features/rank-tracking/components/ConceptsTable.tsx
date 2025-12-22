'use client';

import { useState, useMemo } from 'react';
import Icon from '@/components/Icon';
import { type KeywordData } from '@/features/keywords/keywordUtils';

// ============================================
// Types
// ============================================

type SortField = 'keyword' | 'concept' | 'rank' | 'change';
type SortDirection = 'asc' | 'desc';

interface ConceptsTableProps {
  concepts: KeywordData[];
  onConceptClick?: (concept: KeywordData) => void;
  onCheckRank?: (keyword: string, conceptId: string) => void;
  isLoading?: boolean;
}

/** Each row represents a single keyword (search term) */
interface KeywordRow {
  keyword: string;
  isCanonical: boolean;
  concept: KeywordData;
  conceptName: string;
  rank: number | null;
  change: number | null;
}

// ============================================
// Helper Functions
// ============================================

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
  onConceptClick,
  onCheckRank,
  isLoading = false,
}: ConceptsTableProps) {
  const [sortField, setSortField] = useState<SortField>('keyword');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleCheckRank = (keyword: string, conceptId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row click
    if (!onCheckRank) return;
    onCheckRank(keyword, conceptId);
  };

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
          allRows.push({
            keyword: term.term,
            isCanonical: term.isCanonical,
            concept,
            conceptName,
            rank: null, // TODO: Get from rankings data
            change: null,
          });
        });
      } else {
        // Concept with no search terms - show as single row
        allRows.push({
          keyword: conceptName,
          isCanonical: true,
          concept,
          conceptName,
          rank: null,
          change: null,
        });
      }
    });

    return allRows;
  }, [concepts]);

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
        case 'rank':
          // Null ranks go to the end
          if (a.rank === null && b.rank === null) comparison = 0;
          else if (a.rank === null) comparison = 1;
          else if (b.rank === null) comparison = -1;
          else comparison = a.rank - b.rank;
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
            <th className="text-center py-3 px-4 w-24">
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
                <div className="flex items-center gap-2">
                  {row.isCanonical && (
                    <span title="Primary keyword">
                      <Icon name="FaStar" className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    </span>
                  )}
                  <span className="font-medium text-gray-900">{row.keyword}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-600 truncate block max-w-[180px]">
                  {row.conceptName !== row.keyword ? row.conceptName : '—'}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {row.rank !== null ? (
                  <span className={`font-semibold ${getPositionColor(row.rank)}`}>
                    #{row.rank}
                  </span>
                ) : (
                  <span className="text-gray-500 font-medium" title="Not found in top 100 results">100+</span>
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {getChangeDisplay(row.change)}
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={(e) => handleCheckRank(row.keyword, row.concept.id, e)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors"
                  title="Uses 1 credit"
                >
                  <Icon name="FaSearch" className="w-3 h-3" />
                  Check rank
                  <span className="text-[10px] opacity-75">(1 credit)</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
