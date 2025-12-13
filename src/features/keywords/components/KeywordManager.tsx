'use client';

import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from 'react';
import { Transition, Dialog } from '@headlessui/react';
import Icon from '@/components/Icon';
import KeywordGroupAccordion, { UngroupedKeywordsSection } from './KeywordGroupAccordion';
import KeywordChip from './KeywordChip';
import KeywordConceptInput from './KeywordConceptInput';
import { useKeywords, useKeywordDetails } from '../hooks/useKeywords';
import { type KeywordData, type KeywordGroupData, DEFAULT_GROUP_NAME, type LocationScope } from '../keywordUtils';
import { apiClient } from '@/utils/apiClient';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

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
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<KeywordGroupData | null>(null);

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    keywordsCreated?: number;
    duplicatesSkipped?: number;
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle export
  const handleExport = async () => {
    try {
      const response = await fetch('/api/keywords/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          'X-Selected-Account': localStorage.getItem('selectedAccountId') || '',
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyword-concepts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export keywords. Please try again.');
    }
  };

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/keywords/upload', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          'X-Selected-Account': localStorage.getItem('selectedAccountId') || '',
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'keyword-concepts-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download failed:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  // Handle file selection for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);

    // Parse preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .slice(0, 6); // Header + 5 rows

      const rows = lines.map(line => {
        const result: string[] = [];
        let inQuotes = false;
        let current = '';

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      setImportPreview(rows);
    };
    reader.readAsText(file);
  };

  // Handle import submit
  const handleImportSubmit = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/keywords/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          'X-Selected-Account': localStorage.getItem('selectedAccountId') || '',
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message || 'Import successful',
          keywordsCreated: result.keywordsCreated,
          duplicatesSkipped: result.duplicatesSkipped,
          errors: result.errors,
        });
        refresh(); // Refresh the keyword list
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Import failed',
          errors: result.errors,
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Reset import modal
  const resetImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    <div>
      {/* Header */}
      {!compact && (
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-blue">Keyword Concepts library</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage keywords across your prompt pages. Keywords with 4+ words show usage indicators.
            </p>
          </div>
          {/* Action buttons - top right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 flex items-center gap-2"
            >
              <Icon name="FaPlus" className="w-4 h-4" />
              <span>New Group</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Keyword Section */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700">Add Keyword</h3>
        <p className="text-xs text-gray-500 mb-3">What do people type into search engines to find businesses like yours?</p>
        <KeywordConceptInput
          onKeywordAdded={handleAddEnrichedKeyword}
          businessName={businessName}
          businessCity={businessCity}
          businessState={businessState}
          placeholder="Enter a keyword (e.g., best green eggs ham San Diego)"
        />
      </div>

      {/* Groups and keywords section header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Concept groups</h3>
        {/* Subtle search */}
        <div className="relative">
          <Icon
            name="FaSearch"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-32 pl-6 pr-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-slate-blue focus:border-transparent focus:w-48 transition-all"
          />
        </div>
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Import Keyword Concepts</h3>
              <button onClick={resetImportModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Template download */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Download Template</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Download our CSV template with all available fields and example data.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              {/* File upload */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Upload CSV File</h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-slate-blue file:text-white
                    hover:file:bg-slate-blue/90
                    file:cursor-pointer cursor-pointer"
                />
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {importPreview[0]?.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {header || `Col ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importPreview.slice(1).map((row, rowIdx) => (
                          <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-2 text-gray-700 max-w-[200px] truncate">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import result */}
              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h4 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {importResult.success ? 'Import Complete' : 'Import Failed'}
                  </h4>
                  <p className={`text-sm mt-1 ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {importResult.message}
                  </p>
                  {importResult.success && (
                    <div className="mt-2 text-sm text-green-700">
                      <p>{importResult.keywordsCreated} keywords created</p>
                      {importResult.duplicatesSkipped ? (
                        <p>{importResult.duplicatesSkipped} duplicates skipped</p>
                      ) : null}
                    </div>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Warnings/Errors:</p>
                      <ul className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>...and {importResult.errors.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={resetImportModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {importResult?.success ? 'Close' : 'Cancel'}
              </button>
              {!importResult?.success && (
                <button
                  onClick={handleImportSubmit}
                  disabled={!importFile || isImporting}
                  className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isImporting && <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />}
                  {isImporting ? 'Importing...' : 'Import Keywords'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyword Details Sidebar */}
      {!onSelectionChange && (
        <KeywordDetailsSidebar
          isOpen={!!selectedKeyword}
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
  isOpen: boolean;
  keyword: KeywordData | null;
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
  isOpen,
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
  const [editedSearchQuery, setEditedSearchQuery] = useState(keyword?.searchQuery || '');
  const [editedAliasesInput, setEditedAliasesInput] = useState((keyword?.aliases || []).join(', '));
  const [editedLocationScope, setEditedLocationScope] = useState<LocationScope | null>(keyword?.locationScope || null);
  const [editedGroupId, setEditedGroupId] = useState<string | null>(keyword?.groupId || null);

  // Reset editing state when keyword changes
  useEffect(() => {
    if (keyword) {
      setEditedSearchQuery(keyword.searchQuery || '');
      setEditedAliasesInput((keyword.aliases || []).join(', '));
      setEditedLocationScope(keyword.locationScope);
      setEditedGroupId(keyword.groupId);
      setIsEditing(false);
    }
  }, [keyword?.id, keyword?.searchQuery, keyword?.aliases, keyword?.locationScope, keyword?.groupId]);

  const handleSave = async () => {
    if (!keyword) return;
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
    if (!keyword) return;
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
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" />
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
                                "{keyword.reviewPhrase}"
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

                              {/* Group */}
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
                            </div>
                          </div>

                          {/* Prompt pages */}
                          {promptPages.length > 0 && (
                            <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Used in Prompt Pages</span>
                              <div className="space-y-1 mt-2">
                                {promptPages.map((page: any) => (
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
                                {recentReviews.slice(0, 5).map((review: any) => (
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
