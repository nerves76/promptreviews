'use client';

import { useState, useCallback, useEffect } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';

export interface GroupData {
  id: string;
  name: string;
  displayOrder: number;
  itemCount: number;
}

interface ManageGroupsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Title for the modal */
  title: string;
  /** Label for items (e.g., "queries", "terms") */
  itemLabel: string;
  /** List of groups */
  groups: GroupData[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback to create a new group */
  onCreateGroup: (name: string) => Promise<GroupData | null>;
  /** Callback to update a group */
  onUpdateGroup: (id: string, name: string) => Promise<GroupData | null>;
  /** Callback to delete a group */
  onDeleteGroup: (id: string) => Promise<boolean>;
  /** Callback to reorder groups */
  onReorderGroups: (updates: { id: string; displayOrder: number }[]) => Promise<boolean>;
}

/**
 * ManageGroupsModal Component
 *
 * Modal for managing groups: create, rename, delete, and reorder.
 */
export function ManageGroupsModal({
  isOpen,
  onClose,
  title,
  itemLabel,
  groups,
  isLoading = false,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onReorderGroups,
}: ManageGroupsModalProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<GroupData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNewGroupName('');
      setEditingGroupId(null);
      setEditingName('');
      setDeletingGroupId(null);
      setGroupToDelete(null);
      setError(null);
    }
  }, [isOpen]);

  const handleCreateGroup = useCallback(async () => {
    if (!newGroupName.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await onCreateGroup(newGroupName.trim());
      if (result) {
        setNewGroupName('');
      } else {
        setError('Failed to create group');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create group');
    } finally {
      setIsSaving(false);
    }
  }, [newGroupName, onCreateGroup]);

  const handleStartEdit = useCallback((group: GroupData) => {
    setEditingGroupId(group.id);
    setEditingName(group.name);
    setError(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingGroupId || !editingName.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await onUpdateGroup(editingGroupId, editingName.trim());
      if (result) {
        setEditingGroupId(null);
        setEditingName('');
      } else {
        setError('Failed to update group');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update group');
    } finally {
      setIsSaving(false);
    }
  }, [editingGroupId, editingName, onUpdateGroup]);

  const handleCancelEdit = useCallback(() => {
    setEditingGroupId(null);
    setEditingName('');
  }, []);

  // Show confirmation modal for group deletion
  const handleDeleteGroupClick = useCallback((group: GroupData) => {
    setGroupToDelete(group);
  }, []);

  // Actually delete the group after confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!groupToDelete) return;

    setDeletingGroupId(groupToDelete.id);
    setError(null);

    try {
      const success = await onDeleteGroup(groupToDelete.id);
      if (!success) {
        setError('Failed to delete group');
      }
      setGroupToDelete(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete group');
    } finally {
      setDeletingGroupId(null);
    }
  }, [groupToDelete, onDeleteGroup]);

  const handleMoveUp = useCallback(async (index: number) => {
    if (index === 0) return;

    const updates = [
      { id: groups[index].id, displayOrder: groups[index - 1].displayOrder },
      { id: groups[index - 1].id, displayOrder: groups[index].displayOrder },
    ];

    try {
      await onReorderGroups(updates);
    } catch (err: any) {
      setError(err?.message || 'Failed to reorder groups');
    }
  }, [groups, onReorderGroups]);

  const handleMoveDown = useCallback(async (index: number) => {
    if (index === groups.length - 1) return;

    const updates = [
      { id: groups[index].id, displayOrder: groups[index + 1].displayOrder },
      { id: groups[index + 1].id, displayOrder: groups[index].displayOrder },
    ];

    try {
      await onReorderGroups(updates);
    } catch (err: any) {
      setError(err?.message || 'Failed to reorder groups');
    }
  }, [groups, onReorderGroups]);

  const isGeneralGroup = (name: string) => name === 'General';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Create new group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Create new group
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              maxLength={30}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newGroupName.trim()) {
                  handleCreateGroup();
                }
              }}
            />
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isSaving}
              className="whitespace-nowrap"
            >
              <Icon name="FaPlus" className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Groups list */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Groups ({groups.length})
          </label>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="FaSpinner" className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No groups yet. Create one above.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {groups.map((group, index) => (
                <div
                  key={group.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <Icon name="FaChevronUp" className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === groups.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <Icon name="FaChevronDown" className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Group name */}
                  <div className="flex-1 min-w-0">
                    {editingGroupId === group.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-2 py-1 border border-slate-blue rounded focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                        maxLength={30}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Icon name="FaTags" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {group.name}
                        </span>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          ({group.itemCount} {itemLabel})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    {editingGroupId === group.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editingName.trim() || isSaving}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                          aria-label="Save"
                        >
                          <Icon name="FaCheck" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                          aria-label="Cancel"
                        >
                          <Icon name="FaTimes" className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(group)}
                          disabled={isGeneralGroup(group.name)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Rename group"
                          title={isGeneralGroup(group.name) ? 'Cannot rename General group' : 'Rename group'}
                        >
                          <Icon name="FaEdit" className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroupClick(group)}
                          disabled={isGeneralGroup(group.name) || deletingGroupId === group.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Delete group"
                          title={isGeneralGroup(group.name) ? 'Cannot delete General group' : 'Delete group'}
                        >
                          {deletingGroupId === group.id ? (
                            <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                          ) : (
                            <Icon name="FaTrash" className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info text */}
        <p className="text-sm text-gray-500">
          Deleting a group will move its {itemLabel} to &quot;Ungrouped&quot;.
        </p>

        {/* Delete Confirmation Dialog */}
        {groupToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setGroupToDelete(null)} />
            <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete group?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete <strong>&quot;{groupToDelete.name}&quot;</strong>?
              </p>
              {groupToDelete.itemCount > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>{groupToDelete.itemCount}</strong> {itemLabel} will be moved to &quot;Ungrouped&quot;.
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setGroupToDelete(null)}
                  disabled={deletingGroupId === groupToDelete.id}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={deletingGroupId === groupToDelete.id}
                >
                  {deletingGroupId === groupToDelete.id ? 'Deleting...' : 'Delete group'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ManageGroupsModal;
