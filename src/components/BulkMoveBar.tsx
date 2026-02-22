'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

export interface GroupOption {
  id: string;
  name: string;
}

interface BulkMoveBarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Total number of items */
  totalCount: number;
  /** Available groups for moving */
  groups: GroupOption[];
  /** Label for items (e.g., "queries", "terms") */
  itemLabel: string;
  /** Callback to select all items */
  onSelectAll: () => void;
  /** Callback to deselect all items */
  onDeselectAll: () => void;
  /** Callback to move selected items to a group */
  onMoveToGroup: (groupId: string | null) => void;
  /** Optional callback to delete selected items */
  onDelete?: () => void;
}

/**
 * BulkMoveBar Component
 *
 * Fixed bottom bar that appears when items are selected.
 * Provides bulk actions: select/deselect all, move to group.
 */
export function BulkMoveBar({
  selectedCount,
  totalCount,
  groups,
  itemLabel,
  onSelectAll,
  onDeselectAll,
  onMoveToGroup,
  onDelete,
}: BulkMoveBarProps) {
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);

  if (selectedCount === 0) return null;

  // Get selected group name for display
  const getSelectedGroupName = () => {
    if (selectedGroupId === undefined) return 'Select group';
    const group = groups.find(g => g.id === selectedGroupId);
    return group?.name || 'Select group';
  };

  const handleMove = () => {
    if (selectedGroupId !== undefined) {
      onMoveToGroup(selectedGroupId);
      setSelectedGroupId(undefined);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-blue text-white shadow-2xl z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: count and select actions */}
          <div className="flex items-center gap-4">
            <span className="font-semibold text-lg whitespace-nowrap">
              {selectedCount} {itemLabel} selected
            </span>
            <div className="h-6 w-px bg-white/30" />
            {selectedCount < totalCount ? (
              <button
                onClick={onSelectAll}
                className="text-sm text-white/90 hover:text-white underline whitespace-nowrap"
              >
                Select all ({totalCount})
              </button>
            ) : (
              <button
                onClick={onDeselectAll}
                className="text-sm text-white/90 hover:text-white underline whitespace-nowrap"
              >
                Deselect all
              </button>
            )}
          </div>

          {/* Right side: action buttons */}
          <div className="flex items-center gap-3">
            {/* Group dropdown selector */}
            <div className="relative">
              <button
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap min-w-[140px]"
              >
                <Icon name="FaTags" className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-[120px]">{getSelectedGroupName()}</span>
                <Icon name="FaChevronDown" className="w-3 h-3 flex-shrink-0" />
              </button>

              {showGroupDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setShowGroupDropdown(false)}
                  />
                  {/* Dropdown menu */}
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[101]">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Select target group
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            setSelectedGroupId(group.id);
                            setShowGroupDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                            selectedGroupId === group.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon name="FaTags" className="w-3 h-3 text-gray-500" />
                          <span>{group.name}</span>
                        </button>
                      ))}
                      {groups.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500 italic">
                          No groups available
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Move button */}
            <button
              onClick={handleMove}
              disabled={selectedGroupId === undefined}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                selectedGroupId !== undefined
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              <Icon name="FaArrowRight" className="w-4 h-4" />
              <span>Move</span>
            </button>

            {/* Delete button (optional) */}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                aria-label={`Delete selected ${itemLabel}`}
              >
                <Icon name="FaTrash" className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            {/* Clear selection button */}
            <button
              onClick={onDeselectAll}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
              aria-label="Clear selection"
            >
              <Icon name="FaTimes" className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkMoveBar;
