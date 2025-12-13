'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Icon from '@/components/Icon';
import KeywordGroupAccordion, { UngroupedKeywordsSection } from './KeywordGroupAccordion';
import KeywordChip from './KeywordChip';
import KeywordConceptInput from './KeywordConceptInput';
import { useKeywords, useKeywordDetails } from '../hooks/useKeywords';
import { type KeywordData, type KeywordGroupData, DEFAULT_GROUP_NAME, type LocationScope } from '../keywordUtils';

interface KeywordManagerProps {
  /** Optional prompt page ID to filter keywords */
  promptPageId?: string;
  /** Whether to show in compact mode (for embedding in other UIs) */
  compact?: boolean;
  /** Callback when keyword selection changes (for prompt page editor) */
  onSelectionChange?: (selectedKeywordIds: string[]) => void;
  /** Initially selected keyword IDs */
  selectedKeywordIds?: string[];
  /** Business info for AI enrichment context */
  businessName?: string;
  businessCity?: string;
  businessState?: string;
  /** Whether to use AI-powered keyword input (default: true) */
  useAiEnrichment?: boolean;
}

/**
 * KeywordManager Component
 *
 * Full-featured keyword management UI with:
 * - Group accordion view
 * - Add keyword input
 * - Create/edit/delete groups
 * - Keyword details panel
 * - Search/filter
 * - Usage statistics
 */
export default function KeywordManager({
  promptPageId,
  compact = false,
  onSelectionChange,
  selectedKeywordIds = [],
  businessName,
  businessCity,
  businessState,
  useAiEnrichment = true,
}: KeywordManagerProps) {
  const {
    keywords,
    groups,
    ungroupedCount,
    isLoading,
    error,
    refresh,
    createKeyword,
    createEnrichedKeyword,
    updateKeyword,
    deleteKeyword,
    createGroup,
    updateGroup,
    deleteGroup,
  } = useKeywords({ includeUsage: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<KeywordGroupData | null>(null);
  const [showQuickInput, setShowQuickInput] = useState(!useAiEnrichment);

  // Fetch details for selected keyword
  const { keyword: selectedKeyword, promptPages, recentReviews } = useKeywordDetails(selectedKeywordId);

  // Filter keywords by search query
  const filteredKeywords = useMemo(() => {
    if (!searchQuery.trim()) return keywords;
    const query = searchQuery.toLowerCase();
    return keywords.filter(
      (kw) =>
        kw.phrase.toLowerCase().includes(query) ||
        kw.groupName?.toLowerCase().includes(query)
    );
  }, [keywords, searchQuery]);

  // Group keywords by group
  const keywordsByGroup = useMemo(() => {
    const grouped: Record<string, KeywordData[]> = {};
    const ungrouped: KeywordData[] = [];

    for (const kw of filteredKeywords) {
      if (kw.groupId) {
        if (!grouped[kw.groupId]) grouped[kw.groupId] = [];
        grouped[kw.groupId].push(kw);
      } else {
        ungrouped.push(kw);
      }
    }

    return { grouped, ungrouped };
  }, [filteredKeywords]);

  // Stats
  const stats = useMemo(() => {
    const total = keywords.length;
    const overused = keywords.filter((k) => k.usageColor === 'red').length;
    const needsRotation = keywords.filter((k) => k.usageColor === 'orange').length;
    return { total, overused, needsRotation };
  }, [keywords]);

  // Handle adding new keyword (quick input - comma-separated)
  const handleAddKeyword = async () => {
    if (!newKeywordInput.trim()) return;

    // Split by comma for multiple keywords
    const phrases = newKeywordInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    for (const phrase of phrases) {
      await createKeyword(phrase, undefined, promptPageId);
    }

    setNewKeywordInput('');
  };

  // Handle adding AI-enriched keyword
  const handleAddEnrichedKeyword = useCallback(
    async (keyword: {
      phrase: string;
      review_phrase: string;
      search_query: string;
      aliases: string[];
      location_scope: string | null;
      ai_generated: boolean;
    }) => {
      await createEnrichedKeyword({
        ...keyword,
        promptPageId,
      });
    },
    [createEnrichedKeyword, promptPageId]
  );

  // Handle creating new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    await createGroup(newGroupName.trim());
    setNewGroupName('');
    setShowNewGroupModal(false);
  };

  // Handle updating group
  const handleUpdateGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;

    await updateGroup(editingGroup.id, { name: newGroupName.trim() });
    setNewGroupName('');
    setEditingGroup(null);
  };

  // Handle deleting group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? Keywords will be moved to "General".')) return;
    await deleteGroup(groupId);
  };

  // Handle keyword click
  const handleKeywordClick = (keyword: KeywordData) => {
    if (onSelectionChange) {
      // Toggle selection mode
      const isSelected = selectedKeywordIds.includes(keyword.id);
      const newSelection = isSelected
        ? selectedKeywordIds.filter((id) => id !== keyword.id)
        : [...selectedKeywordIds, keyword.id];
      onSelectionChange(newSelection);
    } else {
      // Details view mode
      setSelectedKeywordId(keyword.id);
    }
  };

  // Handle keyword remove
  const handleKeywordRemove = async (keywordId: string) => {
    if (!confirm('Delete this keyword permanently?')) return;
    await deleteKeyword(keywordId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="FaSpinner" className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading keywords...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <Icon name="FaExclamationTriangle" className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={refresh}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={`${compact ? '' : 'p-6'}`}>
      {/* Header */}
      {!compact && (
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-blue">Keyword Library</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage keywords across your prompt pages. Keywords with 4+ words show usage indicators.
            </p>
          </div>
          {/* New Group button - top right */}
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 flex items-center gap-2"
          >
            <Icon name="FaPlus" className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <Icon
            name="FaSearch"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          />
        </div>
      </div>

      {/* Add Keyword Section */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Add Keyword</h3>
          {useAiEnrichment && (
            <button
              onClick={() => setShowQuickInput(!showQuickInput)}
              className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
            >
              {showQuickInput ? (
                <>
                  <Icon name="FaSparkles" className="w-3 h-3" />
                  Use AI enrichment
                </>
              ) : (
                <>
                  <Icon name="FaRocket" className="w-3 h-3" />
                  Quick add (bulk)
                </>
              )}
            </button>
          )}
        </div>

        {showQuickInput ? (
          /* Quick input - comma-separated */
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddKeyword();
              }}
              placeholder="Add keywords (comma-separated)..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleAddKeyword}
              disabled={!newKeywordInput.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Icon name="FaPlus" className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* AI-enriched input */
          <KeywordConceptInput
            onKeywordAdded={handleAddEnrichedKeyword}
            businessName={businessName}
            businessCity={businessCity}
            businessState={businessState}
            placeholder="Enter a keyword (e.g., best green eggs ham San Diego)"
          />
        )}
      </div>

      {/* Groups and keywords section header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Your Keywords</h3>
      </div>

      {/* Groups and keywords */}
      <div className="space-y-3">
        {/* Sorted groups (General first, then alphabetically) */}
        {groups
          .sort((a, b) => {
            if (a.name === DEFAULT_GROUP_NAME) return -1;
            if (b.name === DEFAULT_GROUP_NAME) return 1;
            return a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);
          })
          .map((group) => (
            <KeywordGroupAccordion
              key={group.id}
              group={group}
              keywords={keywordsByGroup.grouped[group.id] || []}
              defaultExpanded={group.name === DEFAULT_GROUP_NAME}
              onKeywordClick={handleKeywordClick}
              onKeywordRemove={handleKeywordRemove}
              onGroupEdit={(g) => {
                setEditingGroup(g);
                setNewGroupName(g.name);
              }}
              onGroupDelete={handleDeleteGroup}
              isDefaultGroup={group.name === DEFAULT_GROUP_NAME}
            />
          ))}

        {/* Ungrouped keywords */}
        <UngroupedKeywordsSection
          keywords={keywordsByGroup.ungrouped}
          onKeywordClick={handleKeywordClick}
          onKeywordRemove={handleKeywordRemove}
        />
      </div>

      {/* Empty state */}
      {keywords.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaTags" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No keywords yet</p>
          <p className="text-sm mt-1">Add keywords to start tracking their usage in reviews.</p>
        </div>
      )}

      {/* New/Edit Group Modal */}
      {(showNewGroupModal || editingGroup) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editingGroup ? handleUpdateGroup() : handleCreateGroup();
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewGroupModal(false);
                  setEditingGroup(null);
                  setNewGroupName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingGroup ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyword Details Sidebar */}
      {selectedKeyword && !onSelectionChange && (
        <KeywordDetailsSidebar
          keyword={selectedKeyword}
          promptPages={promptPages}
          recentReviews={recentReviews}
          groups={groups}
          onClose={() => setSelectedKeywordId(null)}
          onUpdate={updateKeyword}
        />
      )}
    </div>
  );
}

// ============================================
// Keyword Details Sidebar Component
// ============================================

interface KeywordDetailsSidebarProps {
  keyword: KeywordData;
  promptPages: any[];
  recentReviews: any[];
  groups: KeywordGroupData[];
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
}

const LOCATION_SCOPES: { value: LocationScope | null; label: string }[] = [
  { value: null, label: 'Not set' },
  { value: 'local', label: 'Local (neighborhood)' },
  { value: 'city', label: 'City' },
  { value: 'region', label: 'Region' },
  { value: 'state', label: 'State' },
  { value: 'national', label: 'National' },
];

function KeywordDetailsSidebar({
  keyword,
  promptPages,
  recentReviews,
  groups,
  onClose,
  onUpdate,
}: KeywordDetailsSidebarProps) {
  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedSearchQuery, setEditedSearchQuery] = useState(keyword.searchQuery || '');
  const [editedAliasesInput, setEditedAliasesInput] = useState((keyword.aliases || []).join(', '));
  const [editedLocationScope, setEditedLocationScope] = useState<LocationScope | null>(keyword.locationScope);
  const [editedGroupId, setEditedGroupId] = useState<string | null>(keyword.groupId);

  // Reset editing state when keyword changes
  useEffect(() => {
    setEditedSearchQuery(keyword.searchQuery || '');
    setEditedAliasesInput((keyword.aliases || []).join(', '));
    setEditedLocationScope(keyword.locationScope);
    setEditedGroupId(keyword.groupId);
    setIsEditing(false);
  }, [keyword.id, keyword.searchQuery, keyword.aliases, keyword.locationScope, keyword.groupId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const aliases = editedAliasesInput
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      await onUpdate(keyword.id, {
        searchQuery: editedSearchQuery || '',
        aliases,
        locationScope: editedLocationScope,
        groupId: editedGroupId || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save keyword:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedSearchQuery(keyword.searchQuery || '');
    setEditedAliasesInput((keyword.aliases || []).join(', '));
    setEditedLocationScope(keyword.locationScope);
    setEditedGroupId(keyword.groupId);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-40 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Keyword Details</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <Icon name="FaTimes" className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Keyword chip */}
          <div>
            <KeywordChip keyword={keyword} size="lg" />
            {keyword.aiGenerated && (
              <span className="inline-flex items-center gap-1 text-xs text-indigo-500 mt-2">
                <Icon name="FaSparkles" className="w-3 h-3" />
                AI Generated
              </span>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-gray-50 rounded-lg">
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
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">SEO & Matching Settings</h4>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Icon name="FaEdit" className="w-3 h-3" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    {isSaving && <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />}
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Search Query */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Search Query (for rank tracking)
                </label>
                {keyword.isUsedInRankTracking && (
                  <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg min-h-[36px]">
                    {keyword.searchQuery || <span className="text-gray-400 italic">Not set</span>}
                  </div>
                )}
              </div>

              {/* Aliases */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Aliases (alternative matching phrases)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedAliasesInput}
                    onChange={(e) => setEditedAliasesInput(e.target.value)}
                    placeholder="alias1, alias2, alias3"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg min-h-[36px]">
                    {keyword.aliases && keyword.aliases.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {keyword.aliases.map((alias, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs">
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
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Location Scope
                </label>
                {isEditing ? (
                  <select
                    value={editedLocationScope || ''}
                    onChange={(e) => setEditedLocationScope((e.target.value || null) as LocationScope | null)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {LOCATION_SCOPES.map((scope) => (
                      <option key={scope.value || 'null'} value={scope.value || ''}>
                        {scope.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                    {keyword.locationScope ? (
                      <span className="capitalize">{keyword.locationScope}</span>
                    ) : (
                      <span className="text-gray-400 italic">Not set</span>
                    )}
                  </div>
                )}
              </div>

              {/* Group */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Group
                </label>
                {isEditing ? (
                  <select
                    value={editedGroupId || ''}
                    onChange={(e) => setEditedGroupId(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">No group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                    {keyword.groupName || <span className="text-gray-400 italic">No group</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Review Phrase (read-only, AI-generated) */}
          {keyword.reviewPhrase && (
            <div className="border-t border-gray-200 pt-4">
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Review Phrase (AI-generated)
              </label>
              <div className="text-sm text-gray-700 bg-indigo-50 px-3 py-2 rounded-lg italic">
                "{keyword.reviewPhrase}"
              </div>
            </div>
          )}

          {/* Prompt pages */}
          {promptPages.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Used in Prompt Pages</h4>
              <div className="space-y-1">
                {promptPages.map((page: any) => (
                  <div key={page.id} className="text-sm text-gray-600 flex items-center gap-2">
                    <Icon name="FaFileAlt" className="w-3 h-3 text-gray-400" />
                    <span>{page.name || page.slug}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent reviews */}
          {recentReviews.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Matches</h4>
              <div className="space-y-2">
                {recentReviews.slice(0, 5).map((review: any) => (
                  <div key={review.id} className="text-sm p-2 bg-gray-50 rounded">
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
      </div>
    </div>
  );
}
