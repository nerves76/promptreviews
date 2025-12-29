/**
 * RankKeywordsTable Component
 *
 * Displays keywords and their ranking positions with sorting and batch actions.
 */

'use client';

import { useState, useMemo } from 'react';
import { RankGroupKeyword, SerpFeatures } from '../utils/types';
import { ChevronUpIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface RankKeywordsTableProps {
  keywords: RankGroupKeyword[];
  isLoading: boolean;
  onRemove: (keywordIds: string[]) => Promise<{ success: boolean; error?: string }>;
  onKeywordClick?: (keywordId: string) => void;
}

type SortField = 'phrase' | 'position' | 'change' | 'difficulty' | 'volume';

export default function RankKeywordsTable({ keywords, isLoading, onRemove, onKeywordClick }: RankKeywordsTableProps) {
  const [sortField, setSortField] = useState<SortField>('phrase');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);

  // Sorting logic
  const sortedKeywords = useMemo(() => {
    const sorted = [...keywords].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'phrase':
          comparison = (a.phrase || '').localeCompare(b.phrase || '');
          break;
        case 'position':
          const posA = a.latestPosition ?? 999;
          const posB = b.latestPosition ?? 999;
          comparison = posA - posB;
          break;
        case 'change':
          const changeA = a.positionChange ?? 0;
          const changeB = b.positionChange ?? 0;
          comparison = changeB - changeA; // Higher change first
          break;
        case 'difficulty':
          const diffA = a.keywordDifficulty ?? 999;
          const diffB = b.keywordDifficulty ?? 999;
          comparison = diffA - diffB;
          break;
        case 'volume':
          const volA = a.searchVolume ?? 0;
          const volB = b.searchVolume ?? 0;
          comparison = volB - volA; // Higher volume first
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [keywords, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(keywords.map((k) => k.keywordId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectKeyword = (keywordId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, keywordId]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== keywordId));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      setIsRemoving(true);
      await onRemove(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to remove keywords:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRemoveSingle = async (keywordId: string) => {
    try {
      setIsRemoving(true);
      await onRemove([keywordId]);
    } catch (err) {
      console.error('Failed to remove keyword:', err);
    } finally {
      setIsRemoving(false);
    }
  };

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
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Batch Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
          <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
          <button
            onClick={handleRemoveSelected}
            disabled={isRemoving}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {isRemoving ? 'Removing...' : 'Remove Selected'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === keywords.length && keywords.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('phrase')}
              >
                Keyword {sortField === 'phrase' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('position')}
              >
                Position {sortField === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('change')}
              >
                Change {sortField === 'change' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('volume')}
                title="Average monthly searches on Google"
              >
                Volume {sortField === 'volume' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('difficulty')}
                title="Keyword Difficulty: How hard it is to rank (0-100). Lower is easier."
              >
                KD {sortField === 'difficulty' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900" title="Search intent: What the searcher is trying to do (Info=learn, Nav=find site, Comm=research purchase, Trans=buy now)">
                Intent
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedKeywords.map((keyword, idx) => (
              <tr key={keyword.keywordId} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(keyword.keywordId)}
                    onChange={(e) => handleSelectKeyword(keyword.keywordId, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onKeywordClick?.(keyword.keywordId)}
                    className="text-left hover:text-slate-blue transition-colors"
                  >
                    <div className="font-medium text-gray-900 hover:text-slate-blue">
                      {keyword.phrase || keyword.searchQuery || '(no phrase)'}
                    </div>
                    {keyword.searchQuery && keyword.searchQuery !== keyword.phrase && (
                      <div className="text-xs text-gray-500">{keyword.searchQuery}</div>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <PositionBadge position={keyword.latestPosition} />
                </td>
                <td className="px-4 py-3">
                  <PositionChange change={keyword.positionChange} />
                </td>
                <td className="px-4 py-3">
                  <VolumeDisplay volume={keyword.searchVolume} />
                </td>
                <td className="px-4 py-3">
                  <DifficultyBadge difficulty={keyword.keywordDifficulty} />
                </td>
                <td className="px-4 py-3">
                  <IntentBadge intent={keyword.searchIntent} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemoveSingle(keyword.keywordId)}
                    disabled={isRemoving}
                    className="text-gray-500 hover:text-red-500 disabled:opacity-50"
                    title="Remove from group"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {keywords.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          No keywords added yet. Click "Add Keywords" to get started.
        </div>
      )}
    </div>
  );
}

function PositionBadge({ position }: { position: number | null | undefined }) {
  if (position === null || position === undefined) {
    return <span className="text-gray-500">—</span>;
  }

  const bgColor =
    position <= 3
      ? 'bg-green-100 text-green-800'
      : position <= 10
        ? 'bg-blue-100 text-blue-800'
        : position <= 50
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-gray-100 text-gray-800';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${bgColor}`}
    >
      #{position}
    </span>
  );
}

function PositionChange({ change }: { change: number | null | undefined }) {
  if (change === null || change === undefined || change === 0) {
    return <span className="text-gray-500">—</span>;
  }

  // Positive change means improved (moved up in rankings = lower number)
  const improved = change > 0;

  return (
    <span
      className={`flex items-center gap-1 text-sm font-medium ${
        improved ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {improved ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
      {Math.abs(change)}
    </span>
  );
}

function VolumeDisplay({ volume }: { volume: number | null | undefined }) {
  if (volume === null || volume === undefined) {
    return <span className="text-gray-500 text-sm" title="No volume data yet">—</span>;
  }

  // Format with K/M suffix for large numbers
  const formatted = volume >= 1000000
    ? `${(volume / 1000000).toFixed(1)}M`
    : volume >= 1000
      ? `${(volume / 1000).toFixed(1)}K`
      : volume.toString();

  return (
    <span className="text-sm text-gray-700" title={`${volume.toLocaleString()} monthly searches`}>
      {formatted}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: number | null | undefined }) {
  if (difficulty === null || difficulty === undefined) {
    return <span className="text-gray-500 text-sm" title="No difficulty data yet">—</span>;
  }

  const level =
    difficulty <= 20 ? 'Very Easy'
      : difficulty <= 40 ? 'Easy'
        : difficulty <= 60 ? 'Moderate'
          : difficulty <= 80 ? 'Hard'
            : 'Very Hard';

  const bgColor =
    difficulty <= 20
      ? 'bg-green-100 text-green-800'
      : difficulty <= 40
        ? 'bg-lime-100 text-lime-800'
        : difficulty <= 60
          ? 'bg-yellow-100 text-yellow-800'
          : difficulty <= 80
            ? 'bg-orange-100 text-orange-800'
            : 'bg-red-100 text-red-800';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bgColor}`}
      title={`${level} to rank (${difficulty}/100)`}
    >
      {difficulty}
    </span>
  );
}

function IntentBadge({ intent }: { intent: string | null | undefined }) {
  if (!intent) {
    return <span className="text-gray-500 text-sm" title="No intent data yet">—</span>;
  }

  const config: Record<string, { bg: string; label: string; tooltip: string }> = {
    informational: {
      bg: 'bg-blue-100 text-blue-700',
      label: 'Info',
      tooltip: 'Informational: Searcher wants to learn something (e.g., "how to fix a leaky faucet")',
    },
    navigational: {
      bg: 'bg-purple-100 text-purple-700',
      label: 'Nav',
      tooltip: 'Navigational: Searcher looking for a specific website or page (e.g., "yelp login")',
    },
    commercial: {
      bg: 'bg-amber-100 text-amber-700',
      label: 'Comm',
      tooltip: 'Commercial: Searcher researching before purchase (e.g., "best plumber near me")',
    },
    transactional: {
      bg: 'bg-green-100 text-green-700',
      label: 'Trans',
      tooltip: 'Transactional: Searcher ready to buy or take action (e.g., "hire plumber portland")',
    },
  };

  const { bg, label, tooltip } = config[intent] || {
    bg: 'bg-gray-100 text-gray-700',
    label: intent,
    tooltip: intent,
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}
