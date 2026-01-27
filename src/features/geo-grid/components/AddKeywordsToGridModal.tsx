/**
 * AddKeywordsToGridModal Component
 *
 * Modal for adding keywords to geo grid tracking.
 * Follows the same pattern as rank tracking's AddKeywordsModal.
 */

'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { apiClient } from '@/utils/apiClient';
import type { KeywordData, RelatedQuestion, FunnelStage } from '@/features/keywords/keywordUtils';

/** Info about a keyword tracked in another config */
interface OtherConfigTracking {
  keywordId: string;
  locationName: string;
}

interface AddKeywordsToGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** IDs of keywords already tracked in THIS config */
  trackedKeywordIds: Set<string>;
  /** Keywords tracked in OTHER configs (for duplicate prevention) */
  keywordsInOtherConfigs?: OtherConfigTracking[];
  /** Callback to add keywords to grid */
  onAdd: (keywordIds: string[]) => Promise<void>;
  /** Max keywords allowed */
  maxKeywords?: number;
  /** Current tracked count */
  currentCount: number;
}

export function AddKeywordsToGridModal({
  isOpen,
  onClose,
  trackedKeywordIds,
  keywordsInOtherConfigs = [],
  onAdd,
  maxKeywords = 20,
  currentCount,
}: AddKeywordsToGridModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newKeywordPhrase, setNewKeywordPhrase] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const {
    keywords: libraryKeywords,
    isLoading: libraryLoading,
    refresh: refreshLibrary,
    createEnrichedKeyword,
  } = useKeywords();

  const remainingSlots = maxKeywords - currentCount;

  // Build a map of keyword ID -> location name for keywords tracked in other configs
  const otherConfigsMap = new Map<string, string>();
  for (const item of keywordsInOtherConfigs) {
    otherConfigsMap.set(item.keywordId, item.locationName);
  }

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshLibrary();
      setSearchQuery('');
      setNewKeywordPhrase('');
    }
  }, [isOpen, refreshLibrary]);

  // Create a new keyword with search term and add to grid
  const handleCreateAndAdd = async () => {
    const phrase = newKeywordPhrase.trim();
    if (!phrase) return;

    if (remainingSlots <= 0) {
      return;
    }

    setIsCreating(true);
    try {
      // Try AI enrichment first
      let enrichment = {
        review_phrase: phrase,
        search_query: phrase.toLowerCase(),
        aliases: [] as string[],
        location_scope: null as string | null,
        related_questions: [] as RelatedQuestion[],
        ai_generated: false,
      };

      try {
        const enrichResponse = await apiClient.post<{
          success: boolean;
          enrichment?: {
            review_phrase: string;
            search_query: string;
            aliases: string[];
            location_scope: string | null;
            related_questions: string[];
          };
        }>('/ai/enrich-keyword', { phrase });

        if (enrichResponse.success && enrichResponse.enrichment) {
          enrichment = {
            review_phrase: enrichResponse.enrichment.review_phrase,
            search_query: enrichResponse.enrichment.search_query,
            aliases: enrichResponse.enrichment.aliases || [],
            location_scope: enrichResponse.enrichment.location_scope,
            related_questions: (enrichResponse.enrichment.related_questions || []).map(q => ({
              question: q,
              funnelStage: 'middle' as FunnelStage,
              addedAt: new Date().toISOString(),
            })),
            ai_generated: true,
          };
        }
      } catch (err) {
        console.warn('AI enrichment failed, using defaults:', err);
      }

      // Create keyword with enriched data and search term
      const newKeyword = await createEnrichedKeyword({
        phrase,
        review_phrase: enrichment.review_phrase,
        search_query: enrichment.search_query,
        search_terms: [
          {
            term: enrichment.search_query || phrase,
            isCanonical: true,
            addedAt: new Date().toISOString(),
          },
        ],
        aliases: enrichment.aliases,
        location_scope: enrichment.location_scope,
        related_questions: enrichment.related_questions,
        ai_generated: enrichment.ai_generated,
      });

      if (newKeyword) {
        // Add directly to grid
        await onAdd([newKeyword.id]);
        setNewKeywordPhrase('');
        await refreshLibrary();
      }
    } catch (err) {
      console.error('Failed to create keyword:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Track which keyword is currently being added
  const [addingKeywordId, setAddingKeywordId] = useState<string | null>(null);

  // Add a single keyword directly
  const handleAddSingle = async (keywordId: string) => {
    if (remainingSlots <= 0) return;

    setAddingKeywordId(keywordId);
    try {
      await onAdd([keywordId]);
      await refreshLibrary();
    } catch (err) {
      console.error('Failed to add keyword:', err);
    } finally {
      setAddingKeywordId(null);
    }
  };

  // Filter keywords: not already tracked, matches search
  const filteredKeywords = libraryKeywords.filter((kw) => {
    if (trackedKeywordIds.has(kw.id)) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        kw.phrase.toLowerCase().includes(search) ||
        kw.searchTerms?.some((st) => st.term.toLowerCase().includes(search))
      );
    }
    return true;
  });

  // Get search term count for display
  const getSearchTermCount = (kw: KeywordData): number => {
    return kw.searchTerms?.length ?? 0;
  };

  const hasSearchTerm = (kw: KeywordData): boolean => {
    return (kw.searchTerms?.length ?? 0) > 0;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Add keywords to grid
        </h2>
        <p className="text-sm text-gray-500">
          {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
        </p>
      </div>

      {/* Content */}
      <div>
        {/* Create New Keyword */}
        <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Create new keyword to track
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeywordPhrase}
              onChange={(e) => setNewKeywordPhrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
              placeholder="Enter keyword (e.g., plumber denver)"
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isCreating || remainingSlots <= 0}
            />
            <Button
              size="sm"
              onClick={handleCreateAndAdd}
              disabled={
                !newKeywordPhrase.trim() ||
                isCreating ||
                remainingSlots <= 0
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This will create a keyword concept with the phrase as the search term
          </p>
        </div>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">
              or select from your library
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keywords..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Keyword List */}
        <div className="max-h-[300px] overflow-y-auto border rounded-lg">
          {libraryLoading ? (
            <div className="text-center py-8 text-gray-500">Loading keywords...</div>
          ) : filteredKeywords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {libraryKeywords.length === 0
                ? 'No keywords in your library yet. Create one above!'
                : trackedKeywordIds.size === libraryKeywords.length
                  ? 'All keywords are already tracked'
                  : 'No keywords match your search'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredKeywords.map((kw) => {
                const searchTermCount = getSearchTermCount(kw);
                const hasSearch = hasSearchTerm(kw);
                const isAdding = addingKeywordId === kw.id;
                const isAtLimit = remainingSlots <= 0;
                const trackedInLocation = otherConfigsMap.get(kw.id);
                const isTrackedElsewhere = !!trackedInLocation;

                return (
                  <div
                    key={kw.id}
                    className={`flex items-center justify-between px-4 py-3 ${isTrackedElsewhere ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${isTrackedElsewhere ? 'text-gray-500' : 'text-gray-900'}`}>
                        {kw.phrase}
                      </div>
                      <div className="text-sm mt-0.5">
                        {isTrackedElsewhere ? (
                          <span className="text-blue-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            Tracked in {trackedInLocation}
                          </span>
                        ) : hasSearch ? (
                          <span className="text-gray-500">
                            {searchTermCount} search term{searchTermCount !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            No search terms
                          </span>
                        )}
                      </div>
                    </div>
                    {isTrackedElsewhere ? (
                      <span className="ml-3 px-3 py-1.5 text-sm text-gray-400">
                        Already tracked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddSingle(kw.id)}
                        disabled={isAdding || isAtLimit}
                        className="ml-3 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:bg-gray-100 disabled:text-gray-500 rounded-lg transition-colors flex items-center gap-1"
                      >
                        {isAdding ? (
                          <>
                            <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <PlusIcon className="w-4 h-4" />
                            Add
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddKeywordsToGridModal;
