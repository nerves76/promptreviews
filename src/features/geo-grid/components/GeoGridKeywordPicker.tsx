/**
 * GeoGridKeywordPicker Component
 *
 * Interface for selecting keywords to track in geo grid.
 * Shows keywords as clickable chips with their search terms.
 * Clicking opens the keyword details sidebar for editing.
 * Uses a modal for adding new keywords (matching rank tracking pattern).
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Icon from '@/components/Icon';
import { GGTrackedKeyword } from '../utils/types';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { KeywordDetailsSidebar } from '@/features/keywords/components';
import { type KeywordData, type SearchTerm } from '@/features/keywords/keywordUtils';
import { apiClient } from '@/utils/apiClient';
import { AddKeywordsToGridModal } from './AddKeywordsToGridModal';

// ============================================
// Types
// ============================================

interface Keyword {
  id: string;
  phrase: string;
  searchTerms?: SearchTerm[];
}

interface GeoGridKeywordPickerProps {
  /** Currently tracked keywords */
  trackedKeywords: GGTrackedKeyword[];
  /** Available keywords to add from */
  availableKeywords: Keyword[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback to add keywords */
  onAddKeywords: (keywordIds: string[]) => Promise<void>;
  /** Callback to remove a tracked keyword */
  onRemoveKeyword: (trackedKeywordId: string) => Promise<void>;
  /** Max keywords that can be tracked */
  maxKeywords?: number;
  /** Callback to refresh available keywords after creating new ones */
  onKeywordsCreated?: () => void;
}

// ============================================
// Component
// ============================================

export function GeoGridKeywordPicker({
  trackedKeywords,
  availableKeywords,
  isLoading,
  onAddKeywords,
  onRemoveKeyword,
  maxKeywords = 20,
  onKeywordsCreated,
}: GeoGridKeywordPickerProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarKeyword, setSidebarKeyword] = useState<KeywordData | null>(null);

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

  const canAddMore = trackedKeywords.length < maxKeywords;

  // Handle clicking a keyword chip to open sidebar
  const handleKeywordClick = useCallback(async (keywordId: string) => {
    try {
      const data = await apiClient.get<{ keyword: KeywordData | null }>(
        `/keywords/${keywordId}`
      );
      if (data.keyword) {
        setSidebarKeyword(data.keyword);
        setSidebarOpen(true);
      }
    } catch (err) {
      console.error('Failed to load keyword:', err);
    }
  }, []);

  // Handle keyword update from sidebar
  const handleKeywordUpdate = useCallback(async (id: string, updates: Partial<KeywordData>) => {
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
  }, [refreshKeywords, onKeywordsCreated]);

  // Handle removing a tracked keyword
  const handleRemove = useCallback(async (e: React.MouseEvent, trackedKeywordId: string) => {
    e.stopPropagation();
    if (removingId) return;

    setRemovingId(trackedKeywordId);
    try {
      await onRemoveKeyword(trackedKeywordId);
    } finally {
      setRemovingId(null);
    }
  }, [removingId, onRemoveKeyword]);

  // Handle adding keywords from modal
  const handleAddFromModal = useCallback(async (keywordIds: string[]) => {
    await onAddKeywords(keywordIds);
    await refreshKeywords();
    onKeywordsCreated?.();
  }, [onAddKeywords, refreshKeywords, onKeywordsCreated]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-48 bg-gray-100 rounded-lg" />
            ))}
          </div>
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
              </p>
            </div>
            {canAddMore && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <PlusIcon className="w-4 h-4" />
                Add keywords
              </button>
            )}
          </div>
        </div>

        {/* Tracked Keywords Table */}
        <div className="px-6 py-4">
          {trackedKeywords.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="FaKey" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No keywords being tracked yet</p>
              <p className="text-sm text-gray-400 mb-4">Add keywords to track their local ranking</p>
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
            <div className="overflow-hidden border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyword concept
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Search term
                    </th>
                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trackedKeywords.map((tk) => {
                    const keywordData = keywordDataMap.get(tk.keywordId);
                    const searchTerms = keywordData?.searchTerms || [];
                    const hasSearchTerms = searchTerms.length > 0;
                    const primarySearchTerm = searchTerms.find(st => st.isCanonical) || searchTerms[0];

                    return (
                      <tr
                        key={tk.id}
                        onClick={() => handleKeywordClick(tk.keywordId)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">
                            {tk.phrase || keywordData?.phrase || tk.keywordId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {hasSearchTerms ? (
                            <span className="text-gray-600">{primarySearchTerm?.term}</span>
                          ) : (
                            <span className="text-amber-600 text-sm flex items-center gap-1">
                              <ExclamationTriangleIcon className="w-4 h-4" />
                              No search term — click to add
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => handleRemove(e, tk.id)}
                            disabled={removingId === tk.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Remove from grid"
                          >
                            {removingId === tk.id ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
    </>
  );
}

export default GeoGridKeywordPicker;
