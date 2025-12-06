/**
 * GeoGridKeywordPicker Component
 *
 * Interface for selecting keywords to track in geo grid.
 * Allows adding from existing keywords, creating new ones, and managing tracked list.
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { GGTrackedKeyword } from '../utils/types';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';

// ============================================
// Types
// ============================================

interface Keyword {
  id: string;
  phrase: string;
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

  // Use the keywords hook for creating new keywords
  const { createKeyword, refresh: refreshKeywords } = useKeywords();

  // Get IDs of already tracked keywords
  const trackedKeywordIds = useMemo(
    () => new Set(trackedKeywords.map((tk) => tk.keywordId)),
    [trackedKeywords]
  );

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
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (trackedKeywordId: string) => {
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

    // Check if we have room
    if (trackedKeywords.length >= maxKeywords) {
      alert(`Maximum of ${maxKeywords} keywords allowed`);
      return;
    }

    setIsCreating(true);
    try {
      // Split by comma for multiple keywords
      const phrases = newKeywordInput
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const newKeywordIds: string[] = [];

      for (const phrase of phrases) {
        // Check if keyword already exists in available keywords
        const existing = availableKeywords.find(
          (kw) => kw.phrase.toLowerCase() === phrase.toLowerCase()
        );

        if (existing) {
          // Use existing keyword if not already tracked
          if (!trackedKeywordIds.has(existing.id)) {
            newKeywordIds.push(existing.id);
          }
        } else {
          // Create new keyword in the library
          const newKeyword = await createKeyword(phrase);
          if (newKeyword) {
            newKeywordIds.push(newKeyword.id);
          }
        }

        // Check max limit
        if (trackedKeywords.length + newKeywordIds.length >= maxKeywords) {
          break;
        }
      }

      // Add the new keywords to geo-grid tracking
      if (newKeywordIds.length > 0) {
        await onAddKeywords(newKeywordIds);
      }

      // Refresh the keywords list
      await refreshKeywords();
      onKeywordsCreated?.();

      setNewKeywordInput('');
    } catch (error) {
      console.error('Error creating keywords:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Enter key in input
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
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tracked Keywords</h3>
            <p className="text-sm text-gray-500">
              {trackedKeywords.length} of {maxKeywords} keywords tracked
            </p>
          </div>
        </div>
      </div>

      {/* Currently Tracked */}
      <div className="px-6 py-4">
        {trackedKeywords.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No keywords being tracked yet. Add keywords below.
          </p>
        ) : (
          <div className="space-y-2">
            {trackedKeywords.map((tk) => (
              <div
                key={tk.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-900">{tk.phrase || tk.keywordId}</span>
                <button
                  onClick={() => handleRemove(tk.id)}
                  disabled={removingId === tk.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                >
                  {removingId === tk.id ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Keywords Section */}
      {canAddMore && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Add Keywords</h4>

          {/* New Keyword Input */}
          <div className="mb-4">
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
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Add Keyword
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              New keywords will be added to your Keyword Library and tracked for geo-grid ranking.
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
          )}

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
                      <span className="text-gray-900">{keyword.phrase}</span>
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
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  Add {selectedIds.size} Keyword{selectedIds.size !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}

          {/* Remaining slots info */}
          {selectedIds.size > 0 && (
            <p className="text-xs text-gray-500 text-center mt-2">
              {remainingSlots - selectedIds.size} slot{remainingSlots - selectedIds.size !== 1 ? 's' : ''} remaining after adding
            </p>
          )}
        </div>
      )}

      {/* Max reached message */}
      {!canAddMore && (
        <div className="px-6 py-4 border-t border-gray-200 bg-yellow-50">
          <p className="text-sm text-yellow-800">
            Maximum of {maxKeywords} keywords reached. Remove some to add more.
          </p>
        </div>
      )}
    </div>
  );
}

export default GeoGridKeywordPicker;
