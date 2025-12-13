/**
 * AddKeywordsModal Component
 *
 * Modal for adding keywords to a rank tracking group.
 * Two tabs: "Your Library" (existing keywords) and "Discover" (keyword research).
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/(app)/components/ui/button';
import { useKeywordDiscovery } from '../hooks';
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
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Library tab
  const { keywords: libraryKeywords, isLoading: libraryLoading, refresh: refreshLibrary } = useKeywords();
  const [librarySearch, setLibrarySearch] = useState('');

  // Discovery tab
  const { discover, getSuggestions, isLoading: discoveryLoading, error: discoveryError, isRateLimited } = useKeywordDiscovery();
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Fetch library keywords on open
  useEffect(() => {
    if (isOpen) {
      refreshLibrary();
    }
  }, [isOpen, refreshLibrary]);

  const handleDiscoverySearch = async () => {
    if (!discoveryQuery.trim()) return;

    const result = await discover(discoveryQuery.trim(), locationCode);
    setDiscoveryResult(result);

    // Also fetch suggestions
    const sugs = await getSuggestions(discoveryQuery.trim());
    setSuggestions(sugs);
  };

  const handleAddSelected = async () => {
    if (selectedKeywordIds.length === 0) return;

    setIsSubmitting(true);
    const result = await onAdd(selectedKeywordIds);
    setIsSubmitting(false);

    if (result.success) {
      setSelectedKeywordIds([]);
      onSuccess();
    }
  };

  const handleCreateConcept = async (keyword: string, searchVolume: number, cpc: number | null) => {
    try {
      // Create a new keyword concept in the library
      const response = await apiClient.post<{ keyword: { id: string } }>('/keywords', {
        phrase: keyword,
        review_phrase: keyword,
        search_query: keyword,
        aliases: [],
        location_scope: null,
        ai_generated: false,
      });

      // Add it to the selection
      const newKeywordId = response.keyword.id;
      setSelectedKeywordIds([...selectedKeywordIds, newKeywordId]);

      // Refresh library
      await refreshLibrary();

      // Switch to library tab
      setSelectedTab(0);
    } catch (err) {
      console.error('Failed to create keyword:', err);
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

                {/* Tabs */}
                <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                  <Tab.List className="flex border-b">
                    <Tab
                      className={({ selected }) =>
                        `px-6 py-3 text-sm font-medium border-b-2 ${
                          selected ? 'border-slate-blue text-slate-blue' : 'border-transparent text-gray-500'
                        }`
                      }
                    >
                      Your Library
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `px-6 py-3 text-sm font-medium border-b-2 ${
                          selected ? 'border-slate-blue text-slate-blue' : 'border-transparent text-gray-500'
                        }`
                      }
                    >
                      Discover
                    </Tab>
                  </Tab.List>

                  <Tab.Panels className="p-6">
                    {/* Library Tab */}
                    <Tab.Panel>
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
                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {libraryLoading ? (
                          <div className="text-center py-8 text-gray-500">Loading keywords...</div>
                        ) : filteredLibrary.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">No keywords found</div>
                        ) : (
                          filteredLibrary.map((kw) => (
                            <label
                              key={kw.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedKeywordIds.includes(kw.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedKeywordIds([...selectedKeywordIds, kw.id]);
                                  } else {
                                    setSelectedKeywordIds(selectedKeywordIds.filter((id) => id !== kw.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium">
                                  {kw.searchQuery || kw.phrase}
                                </div>
                                {kw.searchQuery && kw.searchQuery !== kw.phrase && (
                                  <div className="text-xs text-gray-500 truncate">
                                    from: &ldquo;{kw.phrase}&rdquo;
                                  </div>
                                )}
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </Tab.Panel>

                    {/* Discovery Tab */}
                    <Tab.Panel>
                      {isRateLimited ? (
                        <div className="text-center py-8 text-gray-500">
                          You've reached your daily keyword research limit. Try again tomorrow.
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={discoveryQuery}
                                onChange={(e) => setDiscoveryQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleDiscoverySearch()}
                                placeholder="Enter a keyword to research..."
                                className="w-full pl-10 pr-3 py-2 border rounded-lg"
                              />
                            </div>
                            <Button onClick={handleDiscoverySearch} disabled={discoveryLoading}>
                              {discoveryLoading ? 'Searching...' : 'Search'}
                            </Button>
                          </div>

                          {discoveryResult && (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto">
                              {/* Main keyword result */}
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{discoveryResult.keyword}</span>
                                  <span className="text-slate-blue font-semibold">
                                    {discoveryResult.volume?.toLocaleString()}/mo
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>CPC: ${discoveryResult.cpc?.toFixed(2) || '-'}</span>
                                  <span>Competition: {discoveryResult.competitionLevel || '-'}</span>
                                  {discoveryResult.trend && (
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs ${
                                        discoveryResult.trend === 'rising'
                                          ? 'bg-green-100 text-green-700'
                                          : discoveryResult.trend === 'falling'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {discoveryResult.trend}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  className="mt-3"
                                  onClick={() =>
                                    handleCreateConcept(
                                      discoveryResult.keyword,
                                      discoveryResult.volume,
                                      discoveryResult.cpc
                                    )
                                  }
                                >
                                  <PlusIcon className="w-4 h-4 mr-1" />
                                  Add to Library
                                </Button>
                              </div>

                              {/* Suggestions */}
                              {suggestions.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Related Keywords</h4>
                                  <div className="space-y-2">
                                    {suggestions.slice(0, 10).map((sug, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between p-2 bg-white border rounded-lg"
                                      >
                                        <span className="text-sm">{sug.keyword}</span>
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm text-gray-500">
                                            {sug.volume?.toLocaleString()}/mo
                                          </span>
                                          <button
                                            className="text-xs text-slate-blue hover:underline"
                                            onClick={() => handleCreateConcept(sug.keyword, sug.volume, sug.cpc)}
                                          >
                                            Add to library
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{selectedKeywordIds.length} keywords selected</span>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddSelected}
                      disabled={selectedKeywordIds.length === 0 || isSubmitting}
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
