'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import { ConfirmDialog } from '@/app/(app)/components/ui/confirm-dialog';
import { LoadingSpinner } from '@/app/(app)/components/ui/loading-spinner';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { ProposalTermsTemplate } from '../types';

interface SavedTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (body: string) => void;
}

export function SavedTermsModal({ isOpen, onClose, onImport }: SavedTermsModalProps) {
  const [templates, setTemplates] = useState<ProposalTermsTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProposalTermsTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ templates: ProposalTermsTemplate[] }>(
        '/proposals/terms-templates'
      );
      setTemplates(data.templates);
    } catch (err) {
      console.error('[SavedTermsModal] Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  const handleImport = (template: ProposalTermsTemplate) => {
    onImport(template.body);
    onClose();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/proposals/terms-templates/${deleteTarget.id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    } catch (err) {
      console.error('[SavedTermsModal] Failed to delete template:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Saved terms" size="lg">
        <Modal.Body>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="FaBookmark" size={24} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No saved terms yet.</p>
              <p className="text-xs text-gray-500 mt-1">
                Save terms from any contract to build your library.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start gap-3 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {template.name}
                    </p>
                    {template.body && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {template.body.slice(0, 150)}
                        {template.body.length > 150 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleImport(template)}
                    >
                      Use
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(template)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Delete saved terms "${template.name}"`}
                    >
                      <Icon name="FaTrash" size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete saved terms"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </>
  );
}
