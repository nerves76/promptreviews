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
import { XMarkIcon, MagnifyingGlassIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/app/(app)/components/ui/button';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';

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

  const { keywords: libraryKeywords, isLoading: libraryLoading, refresh: refreshLibrary } = useKeywords();

  // Fetch library keywords on open
  useEffect(() => {
    if (isOpen) {
      refreshLibrary();
      setSelectedKeywordIds([]);
      setLibrarySearch('');
    }
  }, [isOpen, refreshLibrary]);

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

                {/* Content */}
                <div className="p-6">
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
