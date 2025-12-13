'use client';

import { useState, useEffect, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import Icon from '@/components/Icon';
import { type KeywordData, type LocationScope } from '../keywordUtils';

const LOCATION_SCOPES: { value: LocationScope | null; label: string }[] = [
  { value: null, label: 'Not set' },
  { value: 'local', label: 'Local (neighborhood)' },
  { value: 'city', label: 'City' },
  { value: 'region', label: 'Region' },
  { value: 'state', label: 'State' },
  { value: 'national', label: 'National' },
];

export interface KeywordDetailsSidebarProps {
  isOpen: boolean;
  keyword: KeywordData | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<{
    phrase: string;
    groupId: string;
    status: 'active' | 'paused';
    reviewPhrase: string;
    searchQuery: string;
    aliases: string[];
    locationScope: string | null;
  }>) => Promise<KeywordData | null>;
  /** Optional: Show prompt pages this keyword is used in */
  promptPages?: Array<{ id: string; name?: string; slug?: string }>;
  /** Optional: Show recent reviews matching this keyword */
  recentReviews?: Array<{ id: string; reviewerName: string; content?: string }>;
  /** Optional: List of groups for the group selector */
  groups?: Array<{ id: string; name: string }>;
  /** Optional: Show the group selector (defaults to false) */
  showGroupSelector?: boolean;
}

export function KeywordDetailsSidebar({
  isOpen,
  keyword,
  onClose,
  onUpdate,
  promptPages = [],
  recentReviews = [],
  groups = [],
  showGroupSelector = false,
}: KeywordDetailsSidebarProps) {
  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedReviewPhrase, setEditedReviewPhrase] = useState(keyword?.reviewPhrase || '');
  const [editedSearchQuery, setEditedSearchQuery] = useState(keyword?.searchQuery || '');
  const [editedAliasesInput, setEditedAliasesInput] = useState((keyword?.aliases || []).join(', '));
  const [editedLocationScope, setEditedLocationScope] = useState<LocationScope | null>(keyword?.locationScope || null);
  const [editedGroupId, setEditedGroupId] = useState<string | null>(keyword?.groupId || null);

  // Reset editing state when keyword changes
  useEffect(() => {
    if (keyword) {
      setEditedReviewPhrase(keyword.reviewPhrase || '');
      setEditedSearchQuery(keyword.searchQuery || '');
      setEditedAliasesInput((keyword.aliases || []).join(', '));
      setEditedLocationScope(keyword.locationScope);
      setEditedGroupId(keyword.groupId);
      setIsEditing(false);
    }
  }, [keyword]);

  const handleSave = async () => {
    if (!keyword) return;
    setIsSaving(true);
    try {
      const aliases = editedAliasesInput
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      await onUpdate(keyword.id, {
        reviewPhrase: editedReviewPhrase || '',
        searchQuery: editedSearchQuery || '',
        aliases,
        locationScope: editedLocationScope,
        ...(showGroupSelector && { groupId: editedGroupId || undefined }),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save keyword:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!keyword) return;
    setEditedReviewPhrase(keyword.reviewPhrase || '');
    setEditedSearchQuery(keyword.searchQuery || '');
    setEditedAliasesInput((keyword.aliases || []).join(', '));
    setEditedLocationScope(keyword.locationScope);
    setEditedGroupId(keyword.groupId);
    setIsEditing(false);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/20 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white/80 backdrop-blur-xl shadow-2xl">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Keyword Concept</span>
                          {keyword && (
                            <Dialog.Title className="text-xl font-bold text-gray-900 mt-1">{keyword.phrase}</Dialog.Title>
                          )}
                        </div>
                        <button
                          onClick={onClose}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                        >
                          <Icon name="FaTimes" className="w-5 h-5" />
                        </button>
                      </div>

                      {keyword && (
                        <div className="space-y-4">
                          {/* Suggested Phrase (AI-generated) */}
                          {keyword.reviewPhrase && (
                            <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-sm border border-indigo-100/50 rounded-xl">
                              <span className="text-xs font-medium uppercase tracking-wider text-indigo-600">Suggested Phrase</span>
                              <p className="text-sm text-gray-700 mt-2 italic leading-relaxed">
                                &ldquo;{keyword.reviewPhrase}&rdquo;
                              </p>
                            </div>
                          )}

                          {/* Stats grid */}
                          <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div>
                              <span className="text-gray-500 block text-xs">Word count</span>
                              <span className="font-medium">{keyword.wordCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Status</span>
                              <span className={`font-medium ${keyword.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                                {keyword.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Uses</span>
                              <span className="font-medium">{keyword.reviewUsageCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Group</span>
                              <span className="font-medium">{keyword.groupName || 'None'}</span>
                            </div>
                          </div>

                          {/* Editable fields section */}
                          <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">SEO & Matching</span>
                              {!isEditing ? (
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="text-xs text-slate-blue hover:text-slate-blue/80 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/50 transition-colors"
                                >
                                  <Icon name="FaEdit" className="w-3 h-3" />
                                  Edit
                                </button>
                              ) : (
                                <div className="flex gap-2 items-center">
                                  <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-white/50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-3 py-1 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {isSaving && <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />}
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              {/* Suggested Phrase (editable) */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                  Suggested Phrase (customer-facing)
                                </label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedReviewPhrase}
                                    onChange={(e) => setEditedReviewPhrase(e.target.value)}
                                    placeholder="e.g., best marketing consultant in Portland"
                                    className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg min-h-[36px]">
                                    {keyword.reviewPhrase || <span className="text-gray-400 italic">Not set</span>}
                                  </div>
                                )}
                              </div>

                              {/* Search Query */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                  Search Query (for rank tracking)
                                </label>
                                {keyword.isUsedInRankTracking && (
                                  <div className="mb-2 px-3 py-2 bg-amber-50/80 border border-amber-200/50 rounded-lg text-xs text-amber-700">
                                    <Icon name="FaExclamationTriangle" className="w-3 h-3 inline mr-1" />
                                    Used in rank tracking. Create a new keyword to track a different term.
                                  </div>
                                )}
                                {isEditing && !keyword.isUsedInRankTracking ? (
                                  <input
                                    type="text"
                                    value={editedSearchQuery}
                                    onChange={(e) => setEditedSearchQuery(e.target.value)}
                                    placeholder="e.g., best green eggs ham San Diego"
                                    className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg min-h-[36px]">
                                    {keyword.searchQuery || <span className="text-gray-400 italic">Not set</span>}
                                  </div>
                                )}
                              </div>

                              {/* Aliases */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                  Aliases (alternative matching phrases)
                                </label>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedAliasesInput}
                                    onChange={(e) => setEditedAliasesInput(e.target.value)}
                                    placeholder="alias1, alias2, alias3"
                                    className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg min-h-[36px]">
                                    {keyword.aliases && keyword.aliases.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {keyword.aliases.map((alias, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-indigo-50/80 border border-indigo-100/50 rounded text-xs text-indigo-700">
                                            {alias}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">No aliases</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Location Scope */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                  Location Scope
                                </label>
                                {isEditing ? (
                                  <select
                                    value={editedLocationScope || ''}
                                    onChange={(e) => setEditedLocationScope((e.target.value || null) as LocationScope | null)}
                                    className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                  >
                                    {LOCATION_SCOPES.map((scope) => (
                                      <option key={scope.value || 'null'} value={scope.value || ''}>
                                        {scope.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg">
                                    {keyword.locationScope ? (
                                      <span className="capitalize">{keyword.locationScope}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">Not set</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Group (optional) */}
                              {showGroupSelector && groups.length > 0 && (
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">
                                    Group
                                  </label>
                                  {isEditing ? (
                                    <select
                                      value={editedGroupId || ''}
                                      onChange={(e) => setEditedGroupId(e.target.value || null)}
                                      className="w-full px-3 py-2 text-sm bg-white/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 transition-all"
                                    >
                                      <option value="">No group</option>
                                      {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                          {group.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <div className="text-sm text-gray-700 bg-white/80 px-3 py-2 rounded-lg">
                                      {keyword.groupName || <span className="text-gray-400 italic">No group</span>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Prompt pages */}
                          {promptPages.length > 0 && (
                            <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Used in Prompt Pages</span>
                              <div className="space-y-1 mt-2">
                                {promptPages.map((page) => (
                                  <div key={page.id} className="text-sm text-gray-600 flex items-center gap-2">
                                    <Icon name="FaFileAlt" className="w-3 h-3 text-indigo-400" />
                                    <span>{page.name || page.slug}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recent reviews */}
                          {recentReviews.length > 0 && (
                            <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Recent Matches</span>
                              <div className="space-y-2 mt-2">
                                {recentReviews.slice(0, 5).map((review) => (
                                  <div key={review.id} className="text-sm p-2 bg-white/80 rounded-lg">
                                    <div className="font-medium text-gray-700">{review.reviewerName}</div>
                                    {review.content && (
                                      <div className="text-gray-500 text-xs line-clamp-2 mt-1">{review.content}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default KeywordDetailsSidebar;
