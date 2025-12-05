'use client';

import { useState, useMemo } from 'react';
import Icon from '@/components/Icon';
import KeywordGroupAccordion, { UngroupedKeywordsSection } from './KeywordGroupAccordion';
import KeywordChip from './KeywordChip';
import { useKeywords, useKeywordDetails } from '../hooks/useKeywords';
import { type KeywordData, type KeywordGroupData, DEFAULT_GROUP_NAME } from '../keywordUtils';

interface KeywordManagerProps {
  /** Optional prompt page ID to filter keywords */
  promptPageId?: string;
  /** Whether to show in compact mode (for embedding in other UIs) */
  compact?: boolean;
  /** Callback when keyword selection changes (for prompt page editor) */
  onSelectionChange?: (selectedKeywordIds: string[]) => void;
  /** Initially selected keyword IDs */
  selectedKeywordIds?: string[];
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
}: KeywordManagerProps) {
  const {
    keywords,
    groups,
    ungroupedCount,
    isLoading,
    error,
    refresh,
    createKeyword,
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

  // Handle adding new keyword
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
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Keyword Library</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage keywords across your prompt pages. Keywords with 4+ words show usage indicators.
          </p>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Total:</span>
          <span className="font-semibold text-gray-800">{stats.total}</span>
        </div>
        {stats.overused > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-sm text-red-700">{stats.overused} overused</span>
          </div>
        )}
        {stats.needsRotation > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-sm text-orange-700">{stats.needsRotation} need rotation</span>
          </div>
        )}
        <div className="flex-1" />
        <button
          onClick={refresh}
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
          title="Refresh"
        >
          <Icon name="FaRedo" className="w-4 h-4" />
        </button>
      </div>

      {/* Search and Add */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="FaSearch"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Add keyword input */}
        <div className="flex gap-2 flex-1 min-w-[250px]">
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

        {/* Add group button */}
        <button
          onClick={() => setShowNewGroupModal(true)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Icon name="FaPlus" className="w-4 h-4" />
          <span>New Group</span>
        </button>
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
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-40 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Keyword Details</h3>
              <button
                onClick={() => setSelectedKeywordId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <Icon name="FaTimes" className="w-5 h-5" />
              </button>
            </div>

            {/* Keyword info */}
            <div className="space-y-4">
              <div>
                <KeywordChip keyword={selectedKeyword} size="lg" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Word count:</span>
                  <span className="ml-2 font-medium">{selectedKeyword.wordCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span
                    className={`ml-2 font-medium ${
                      selectedKeyword.status === 'active' ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {selectedKeyword.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Uses:</span>
                  <span className="ml-2 font-medium">{selectedKeyword.reviewUsageCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Group:</span>
                  <span className="ml-2 font-medium">{selectedKeyword.groupName || 'None'}</span>
                </div>
              </div>

              {/* Prompt pages */}
              {promptPages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Used in Prompt Pages</h4>
                  <div className="space-y-1">
                    {promptPages.map((page: any) => (
                      <div
                        key={page.id}
                        className="text-sm text-gray-600 flex items-center gap-2"
                      >
                        <Icon name="FaFileAlt" className="w-3 h-3 text-gray-400" />
                        <span>{page.name || page.slug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent reviews */}
              {recentReviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Matches</h4>
                  <div className="space-y-2">
                    {recentReviews.slice(0, 5).map((review: any) => (
                      <div
                        key={review.id}
                        className="text-sm p-2 bg-gray-50 rounded"
                      >
                        <div className="font-medium text-gray-700">{review.reviewerName}</div>
                        {review.content && (
                          <div className="text-gray-500 text-xs line-clamp-2 mt-1">
                            {review.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
