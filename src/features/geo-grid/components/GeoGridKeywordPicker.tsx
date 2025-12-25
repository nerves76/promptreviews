/**
 * GeoGridKeywordPicker Component
 *
 * Interface for selecting keywords to track in geo grid.
 * Shows keywords as clickable chips with their search terms.
 * Clicking opens the keyword details sidebar for editing.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Icon from '@/components/Icon';
import { GGTrackedKeyword } from '../utils/types';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { KeywordDetailsSidebar } from '@/features/keywords/components';
import { type KeywordData, type SearchTerm, type RelatedQuestion } from '@/features/keywords/keywordUtils';
import { apiClient } from '@/utils/apiClient';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarKeyword, setSidebarKeyword] = useState<KeywordData | null>(null);

  // Use the keywords hook for creating new keywords
  const { createKeyword, refresh: refreshKeywords, keywords: allKeywords } = useKeywords();

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

  // Filter available keywords (not already tracked, matches search)
  const filteredAvailable = useMemo(() => {
    return availableKeywords.filter((keyword) => {
      if (trackedKeywordIds.has(keyword.id)) return false;
      if (searchQuery) {
        return keyword.phrase.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [availableKeywords, trackedKeywordIds, searchQuery]);

  const canAddMore = trackedKeywords.length < maxKeywords;
  const remainingSlots = maxKeywords - trackedKeywords.length;

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
  const handleKeywordUpdate = useCallback(async (id: string, updates: Partial<{
    phrase: string;
    groupId: string;
    status: 'active' | 'paused';
    reviewPhrase: string;
    searchQuery: string;
    searchTerms: SearchTerm[];
    aliases: string[];
    locationScope: string | null;
    relatedQuestions: RelatedQuestion[];
  }>) => {
    try {
      const data = await apiClient.put<{ keyword: KeywordData }>(`/keywords/${id}`, updates);
      if (data.keyword) {
        setSidebarKeyword(data.keyword);
        // Refresh keywords list to update search terms display
        await refreshKeywords();
      }
      return data.keyword;
    } catch (err) {
      console.error('Failed to update keyword:', err);
      return null;
    }
  }, [refreshKeywords]);

  const handleToggleSelect = (keywordId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(keywordId)) {
        next.delete(keywordId);
      } else if (next.size < remainingSlots) {
        next.add(keywordId);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsAdding(true);
    try {
      await onAddKeywords(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSearchQuery('');
      setShowLibrary(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent, trackedKeywordId: string) => {
    e.stopPropagation(); // Prevent opening sidebar
    setRemovingId(trackedKeywordId);
    try {
      await onRemoveKeyword(trackedKeywordId);
    } finally {
      setRemovingId(null);
    }
  };

  // Handle creating new keywords and adding them to tracking
  const handleCreateAndAdd = async () => {
    if (!newKeywordInput.trim() || isCreating) return;

    if (trackedKeywords.length >= maxKeywords) {
      alert(`Maximum of ${maxKeywords} keywords allowed`);
      return;
    }

    setIsCreating(true);
    try {
      const phrases = newKeywordInput
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const newKeywordIds: string[] = [];

      for (const phrase of phrases) {
        const existing = availableKeywords.find(
          (kw) => kw.phrase.toLowerCase() === phrase.toLowerCase()
        );

        if (existing) {
          if (!trackedKeywordIds.has(existing.id)) {
            newKeywordIds.push(existing.id);
          }
        } else {
          const newKeyword = await createKeyword(phrase);
          if (newKeyword) {
            newKeywordIds.push(newKeyword.id);
          }
        }

        if (trackedKeywords.length + newKeywordIds.length >= maxKeywords) {
          break;
        }
      }

      if (newKeywordIds.length > 0) {
        await onAddKeywords(newKeywordIds);
      }

      await refreshKeywords();
      onKeywordsCreated?.();
      setNewKeywordInput('');
    } catch (error) {
      console.error('Error creating keywords:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateAndAdd();
    }
  };

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
                onClick={() => setShowLibrary(!showLibrary)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <PlusIcon className="w-4 h-4" />
                Add keyword
              </button>
            )}
          </div>
        </div>

        {/* Tracked Keywords as Chips */}
        <div className="px-6 py-4">
          {trackedKeywords.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="FaKey" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No keywords being tracked yet</p>
              <p className="text-sm text-gray-400">Add keywords to track their geo-grid ranking</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {trackedKeywords.map((tk) => {
                const keywordData = keywordDataMap.get(tk.keywordId);
                const searchTerms = keywordData?.searchTerms || [];
                const hasSearchTerms = searchTerms.length > 0;

                return (
                  <div
                    key={tk.id}
                    onClick={() => handleKeywordClick(tk.keywordId)}
                    className="group relative bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-3 cursor-pointer transition-colors min-w-[200px] max-w-[300px]"
                  >
                    {/* Remove button */}
                    <button
                      onClick={(e) => handleRemove(e, tk.id)}
                      disabled={removingId === tk.id}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      {removingId === tk.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Concept name */}
                    <div className="flex items-center gap-2 mb-2 pr-6">
                      <span className="font-medium text-gray-900 text-sm">
                        {tk.phrase || keywordData?.phrase || tk.keywordId}
                      </span>
                      {!hasSearchTerms && (
                        <span title="No search terms - click to add">
                          <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
                        </span>
                      )}
                    </div>

                    {/* Search terms */}
                    {hasSearchTerms ? (
                      <div className="flex flex-wrap gap-1">
                        {searchTerms.slice(0, 3).map((term, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 text-xs bg-white border border-gray-200 rounded text-gray-600"
                          >
                            <Icon name="FaSearch" className="w-2.5 h-2.5 mr-1 text-gray-400" />
                            {term.term}
                          </span>
                        ))}
                        {searchTerms.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-500">
                            +{searchTerms.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600">
                        Click to add search terms
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Keywords Section */}
        {showLibrary && canAddMore && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {/* New Keyword Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Create new keyword
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type keywords (comma-separated)..."
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleCreateAndAdd}
                  disabled={!newKeywordInput.trim() || isCreating}
                  className="px-4 py-2 bg-slate-blue text-white font-medium rounded-lg hover:bg-slate-blue/90 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Add
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                New keywords will be added to your Keyword Concepts library
              </p>
            </div>

            {/* Divider */}
            {availableKeywords.length > 0 && (
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 border-t border-gray-300" />
                <span className="text-xs text-gray-500">or select from library</span>
                <div className="flex-1 border-t border-gray-300" />
              </div>
            )}

            {/* Search existing keywords */}
            {availableKeywords.length > 0 && (
              <>
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search existing keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Available Keywords List */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                  {filteredAvailable.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      {searchQuery
                        ? 'No matching keywords found'
                        : 'All keywords are already tracked'}
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredAvailable.map((keyword) => {
                        const isSelected = selectedIds.has(keyword.id);
                        const isDisabled = !isSelected && selectedIds.size >= remainingSlots;
                        const kwData = keywordDataMap.get(keyword.id);
                        const terms = kwData?.searchTerms || [];

                        return (
                          <button
                            key={keyword.id}
                            onClick={() => handleToggleSelect(keyword.id)}
                            disabled={isDisabled}
                            className={`
                              w-full flex items-center justify-between px-3 py-2 text-left
                              ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            <div>
                              <span className="text-gray-900 font-medium">{keyword.phrase}</span>
                              {terms.length > 0 && (
                                <span className="ml-2 text-xs text-gray-500">
                                  {terms.length} search term{terms.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {terms.length === 0 && (
                                <span className="ml-2 text-xs text-amber-600 flex items-center gap-1">
                                  <ExclamationTriangleIcon className="w-3 h-3" />
                                  No search terms
                                </span>
                              )}
                            </div>
                            {isSelected && <CheckIcon className="w-4 h-4 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add Button */}
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleAddSelected}
                    disabled={isAdding}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-blue text-white font-medium rounded-lg hover:bg-slate-blue/90 disabled:opacity-50"
                  >
                    {isAdding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4" />
                        Add {selectedIds.size} keyword{selectedIds.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                )}
              </>
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
