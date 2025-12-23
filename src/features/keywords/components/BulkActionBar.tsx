'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { type KeywordGroupData } from '../keywordUtils';

interface BulkActionBarProps {
  /** Number of selected keywords */
  selectedCount: number;
  /** Total number of keywords */
  totalCount: number;
  /** Available groups for moving */
  groups: KeywordGroupData[];
  /** Callback to select all keywords */
  onSelectAll: () => void;
  /** Callback to deselect all keywords */
  onDeselectAll: () => void;
  /** Callback to move selected keywords to a group */
  onMoveToGroup: (groupId: string) => void;
  /** Callback to delete selected keywords */
  onDelete: () => void;
  /** Callback to export selected keywords */
  onExport: () => void;
}

/**
 * BulkActionBar Component
 *
 * Fixed bottom bar that appears when keywords are selected.
 * Provides bulk actions: select/deselect all, move to group, delete, export.
 */
export function BulkActionBar({
  selectedCount,
  totalCount,
  groups,
  onSelectAll,
  onDeselectAll,
  onMoveToGroup,
  onDelete,
  onExport,
}: BulkActionBarProps) {
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-blue text-white shadow-2xl z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: count and select actions */}
          <div className="flex items-center gap-4">
            <span className="font-semibold text-lg">
              {selectedCount} keyword{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="h-6 w-px bg-white/30" />
            {selectedCount < totalCount ? (
              <button
                onClick={onSelectAll}
                className="text-sm text-white/90 hover:text-white underline"
              >
                Select all ({totalCount})
              </button>
            ) : (
              <button
                onClick={onDeselectAll}
                className="text-sm text-white/90 hover:text-white underline"
              >
                Deselect all
              </button>
            )}
          </div>

          {/* Right side: action buttons */}
          <div className="flex items-center gap-3">
            {/* Move to group dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon name="FaTags" className="w-4 h-4" />
                <span className="hidden sm:inline">Move to group</span>
                <Icon name="FaChevronDown" className="w-3 h-3" />
              </button>

              {showGroupDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowGroupDropdown(false)}
                  />
                  {/* Dropdown menu */}
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Select group
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            onMoveToGroup(group.id);
                            setShowGroupDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          <Icon name="FaTags" className="w-3 h-3 text-gray-400" />
                          <span>{group.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Export button */}
            <button
              onClick={onExport}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <Icon name="FaFileAlt" className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Delete button */}
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Icon name="FaTrash" className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
