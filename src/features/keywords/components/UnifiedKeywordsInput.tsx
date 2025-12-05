'use client';

import { useState, useMemo, useEffect } from 'react';
import Icon from '@/components/Icon';
import KeywordChip from './KeywordChip';
import { useKeywords } from '../hooks/useKeywords';
import { type KeywordData, DEFAULT_GROUP_NAME } from '../keywordUtils';

interface UnifiedKeywordsInputProps {
  /** Current prompt page ID (for usage tracking) */
  promptPageId?: string;
  /** Selected keyword IDs for this prompt page */
  selectedKeywordIds: string[];
  /** Callback when selection changes */
  onChange: (keywordIds: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Maximum keywords allowed */
  maxKeywords?: number;
  /** Show the keyword library picker */
  showLibraryPicker?: boolean;
}

/**
 * UnifiedKeywordsInput Component
 *
 * A keyword input that integrates with the unified keyword system.
 * Allows users to:
 * - Select existing keywords from their library
 * - Add new keywords (which get added to the library)
 * - See usage indicators on long-tail keywords
 *
 * This component connects keywords to prompt pages via the
 * keyword_prompt_page_usage junction table.
 */
export default function UnifiedKeywordsInput({
  promptPageId,
  selectedKeywordIds,
  onChange,
  placeholder = 'Add keywords...',
  disabled = false,
  maxKeywords,
  showLibraryPicker = true,
}: UnifiedKeywordsInputProps) {
  const { keywords, groups, isLoading, createKeyword, refresh } = useKeywords();

  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get selected keywords data
  const selectedKeywords = useMemo(
    () => keywords.filter((kw) => selectedKeywordIds.includes(kw.id)),
    [keywords, selectedKeywordIds]
  );

  // Get available keywords (not selected)
  const availableKeywords = useMemo(() => {
    const unselected = keywords.filter((kw) => !selectedKeywordIds.includes(kw.id));
    if (!searchQuery.trim()) return unselected;
    const query = searchQuery.toLowerCase();
    return unselected.filter((kw) => kw.phrase.toLowerCase().includes(query));
  }, [keywords, selectedKeywordIds, searchQuery]);

  // Group available keywords
  const groupedAvailable = useMemo(() => {
    const grouped: Record<string, KeywordData[]> = {};
    for (const kw of availableKeywords) {
      const groupName = kw.groupName || 'Other';
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(kw);
    }
    return grouped;
  }, [availableKeywords]);

  // Handle adding keywords from input
  const handleAddFromInput = async () => {
    if (!inputValue.trim() || disabled) return;

    // Split by comma
    const phrases = inputValue
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const newIds: string[] = [...selectedKeywordIds];

    for (const phrase of phrases) {
      // Check if keyword already exists
      const existing = keywords.find(
        (kw) => kw.phrase.toLowerCase() === phrase.toLowerCase()
      );

      if (existing) {
        // Select existing keyword
        if (!newIds.includes(existing.id)) {
          newIds.push(existing.id);
        }
      } else {
        // Create new keyword
        const newKeyword = await createKeyword(phrase, undefined, promptPageId);
        if (newKeyword) {
          newIds.push(newKeyword.id);
        }
      }
    }

    // Check max limit
    if (maxKeywords && newIds.length > maxKeywords) {
      alert(`Maximum ${maxKeywords} keywords allowed`);
      return;
    }

    onChange(newIds);
    setInputValue('');
    await refresh(); // Refresh to get the new keyword data
  };

  // Handle selecting from library
  const handleSelectKeyword = (keywordId: string) => {
    if (disabled) return;

    const newIds = [...selectedKeywordIds, keywordId];

    if (maxKeywords && newIds.length > maxKeywords) {
      alert(`Maximum ${maxKeywords} keywords allowed`);
      return;
    }

    onChange(newIds);
  };

  // Handle removing a keyword
  const handleRemoveKeyword = (keywordId: string) => {
    if (disabled) return;
    onChange(selectedKeywordIds.filter((id) => id !== keywordId));
  };

  return (
    <div className="space-y-2">
      {/* Selected keywords display */}
      {selectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {selectedKeywords.map((keyword) => (
            <KeywordChip
              key={keyword.id}
              keyword={keyword}
              onRemove={disabled ? undefined : handleRemoveKeyword}
              size="md"
            />
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="flex gap-2">
        <div
          className={`relative flex-1 ${isFocused ? 'ring-2 ring-indigo-500 rounded-md' : ''}`}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                handleAddFromInput();
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              if (inputValue.trim()) handleAddFromInput();
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {inputValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              Press Enter to add
            </div>
          )}
        </div>

        {/* Library picker toggle */}
        {showLibraryPicker && (
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            disabled={disabled || isLoading}
            className={`
              px-3 py-2 border rounded-md transition-colors
              ${showPicker
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Browse keyword library"
          >
            <Icon name="FaTags" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {selectedKeywords.length > 0
            ? `${selectedKeywords.length} keyword${selectedKeywords.length === 1 ? '' : 's'} selected`
            : 'No keywords selected'}
          {maxKeywords && ` (max: ${maxKeywords})`}
        </span>
        <span className="text-gray-400">
          Keywords with 4+ words show usage indicators
        </span>
      </div>

      {/* Library picker dropdown */}
      {showPicker && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-lg max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Icon
                name="FaSearch"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Keywords list */}
          <div className="overflow-y-auto max-h-60 p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-gray-500">
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : availableKeywords.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                {searchQuery ? 'No matching keywords' : 'No more keywords available'}
              </div>
            ) : (
              Object.entries(groupedAvailable)
                .sort(([a], [b]) => {
                  if (a === DEFAULT_GROUP_NAME) return -1;
                  if (b === DEFAULT_GROUP_NAME) return 1;
                  return a.localeCompare(b);
                })
                .map(([groupName, groupKeywords]) => (
                  <div key={groupName} className="mb-3 last:mb-0">
                    <div className="text-xs font-medium text-gray-500 px-2 py-1">
                      {groupName}
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {groupKeywords.map((keyword) => (
                        <button
                          key={keyword.id}
                          type="button"
                          onClick={() => handleSelectKeyword(keyword.id)}
                          className="group"
                        >
                          <KeywordChip
                            keyword={keyword}
                            size="sm"
                            onClick={() => handleSelectKeyword(keyword.id)}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="w-full py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
