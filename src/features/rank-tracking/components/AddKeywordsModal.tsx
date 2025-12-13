/**
 * AddKeywordsModal Component
 *
 * Modal for adding keywords from your library to a rank tracking group.
 * For keyword research/discovery, users are directed to the dedicated research page.
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/app/(app)/components/ui/button';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { apiClient } from '@/utils/apiClient';

interface AddKeywordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  locationCode: number;
  onAdd: (keywordIds: string[]) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => void;
}

export default function AddKeywordsModal({
  isOpen,
  onClose,
  groupId,
  locationCode,
  onAdd,
  onSuccess,
}: AddKeywordsModalProps) {
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  // Track custom search queries for keywords that don't have one
  const [customSearchQueries, setCustomSearchQueries] = useState<Record<string, string>>({});
  // For creating new keywords inline
  const [newSearchPhrase, setNewSearchPhrase] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { keywords: libraryKeywords, isLoading: libraryLoading, refresh: refreshLibrary, updateKeyword, createEnrichedKeyword } = useKeywords();

  // Fetch library keywords on open
  useEffect(() => {
    if (isOpen) {
      refreshLibrary();
      setSelectedKeywordIds([]);
      setLibrarySearch('');
      setCustomSearchQueries({});
      setNewSearchPhrase('');
    }
  }, [isOpen, refreshLibrary]);

  // Create a new keyword with AI enrichment and add it to selected
  const handleCreateAndSelect = async () => {
    const phrase = newSearchPhrase.trim();
    if (!phrase) return;

    setIsCreating(true);
    try {
      // First, get AI enrichment (review phrase, search query, questions)
      let enrichment = {
        review_phrase: phrase,
        search_query: phrase.toLowerCase(),
        aliases: [] as string[],
        location_scope: null as string | null,
        related_questions: [] as string[],
        ai_generated: false,
      };

      try {
        const enrichResponse = await apiClient.post<{
          success: boolean;
          enrichment?: typeof enrichment;
        }>('/ai/enrich-keyword', { phrase });

        if (enrichResponse.success && enrichResponse.enrichment) {
          enrichment = { ...enrichResponse.enrichment, ai_generated: true };
        }
      } catch (err) {
        console.warn('AI enrichment failed, using defaults:', err);
      }

      // Create the keyword with enriched data
      const newKeyword = await createEnrichedKeyword({
        phrase,
        review_phrase: enrichment.review_phrase,
        search_query: enrichment.search_query,
        aliases: enrichment.aliases,
        location_scope: enrichment.location_scope,
        related_questions: enrichment.related_questions,
        ai_generated: enrichment.ai_generated,
      });

      if (newKeyword) {
        // Add to selected list
        setSelectedKeywordIds(prev => [...prev, newKeyword.id]);
        setNewSearchPhrase('');
        // Refresh to get updated keyword
        await refreshLibrary();
      }
    } catch (err) {
      console.error('Failed to create keyword:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddSelected = async () => {
    if (selectedKeywordIds.length === 0) return;

    setIsSubmitting(true);

    // First, update keywords that have custom search queries
    for (const keywordId of selectedKeywordIds) {
      const customQuery = customSearchQueries[keywordId];
      if (customQuery) {
        await updateKeyword(keywordId, { searchQuery: customQuery });
      }
    }

    const result = await onAdd(selectedKeywordIds);
    setIsSubmitting(false);

    if (result.success) {
      setSelectedKeywordIds([]);
      setCustomSearchQueries({});
      onSuccess();
    }
  };

  // Filter library keywords by searchQuery or phrase
  const filteredLibrary = libraryKeywords.filter((kw) => {
    const search = librarySearch.toLowerCase();
    return (
      kw.phrase.toLowerCase().includes(search) ||
      (kw.searchQuery && kw.searchQuery.toLowerCase().includes(search))
    );
  });

  // Check if all selected keywords have valid search queries
  const allSelectedHaveSearchQuery = selectedKeywordIds.every((id) => {
    const kw = libraryKeywords.find((k) => k.id === id);
    if (!kw) return false;
    // Has existing searchQuery or has a non-empty custom one
    return kw.searchQuery || (customSearchQueries[id] && customSearchQueries[id].trim());
  });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <Dialog.Title className="text-lg font-semibold">Add Keywords</Dialog.Title>
                  <button onClick={onClose}>
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Create New Keyword */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Create new keyword to track
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSearchPhrase}
                        onChange={(e) => setNewSearchPhrase(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateAndSelect()}
                        placeholder="Enter search phrase (e.g., plumber portland oregon)"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        disabled={isCreating}
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateAndSelect}
                        disabled={!newSearchPhrase.trim() || isCreating}
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        {isCreating ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-gray-500">or select from your library</span>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={librarySearch}
                        onChange={(e) => setLibrarySearch(e.target.value)}
                        placeholder="Search your keywords..."
                        className="w-full pl-10 pr-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Keyword List */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {libraryLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading keywords...</div>
                    ) : filteredLibrary.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {libraryKeywords.length === 0 ? (
                          <div>
                            <p className="mb-2">No keywords in your library yet.</p>
                            <Link
                              href="/dashboard/keywords/research"
                              className="text-slate-blue hover:underline inline-flex items-center gap-1"
                              onClick={onClose}
                            >
                              Research keywords
                              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            </Link>
                          </div>
                        ) : (
                          'No keywords match your search'
                        )}
                      </div>
                    ) : (
                      filteredLibrary.map((kw) => {
                        const isSelected = selectedKeywordIds.includes(kw.id);
                        const needsSearchQuery = !kw.searchQuery;
                        const customQuery = customSearchQueries[kw.id];

                        return (
                          <div
                            key={kw.id}
                            className="p-3 hover:bg-gray-50 rounded-lg"
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedKeywordIds([...selectedKeywordIds, kw.id]);
                                    // Pre-fill with phrase if no search query
                                    if (needsSearchQuery && !customQuery) {
                                      setCustomSearchQueries(prev => ({
                                        ...prev,
                                        [kw.id]: kw.phrase
                                      }));
                                    }
                                  } else {
                                    setSelectedKeywordIds(selectedKeywordIds.filter((id) => id !== kw.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium">{kw.searchQuery || kw.phrase}</div>
                                {kw.searchQuery && kw.searchQuery !== kw.phrase && (
                                  <div className="text-xs text-gray-500 truncate">
                                    from: &ldquo;{kw.phrase}&rdquo;
                                  </div>
                                )}
                              </div>
                            </label>

                            {/* Show input to set search query if needed and selected */}
                            {isSelected && needsSearchQuery && (
                              <div className="mt-2 ml-7">
                                <label className="block text-xs text-gray-500 mb-1">
                                  Search phrase for rank tracking:
                                </label>
                                <input
                                  type="text"
                                  value={customQuery || ''}
                                  onChange={(e) => setCustomSearchQueries(prev => ({
                                    ...prev,
                                    [kw.id]: e.target.value
                                  }))}
                                  placeholder="Enter search phrase..."
                                  className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Research link */}
                  {libraryKeywords.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Link
                        href="/dashboard/keywords/research"
                        className="text-sm text-slate-blue hover:underline inline-flex items-center gap-1"
                        onClick={onClose}
                      >
                        Need new keywords? Research keywords
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-gray-500">{selectedKeywordIds.length} keywords selected</span>
                    {selectedKeywordIds.length > 0 && !allSelectedHaveSearchQuery && (
                      <span className="text-amber-600 ml-2">• Enter search phrases above</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddSelected}
                      disabled={selectedKeywordIds.length === 0 || isSubmitting || !allSelectedHaveSearchQuery}
                    >
                      {isSubmitting
                        ? 'Adding...'
                        : `Add ${selectedKeywordIds.length} Keyword${selectedKeywordIds.length !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
