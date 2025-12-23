'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { type KeywordData } from '../keywordUtils';

interface BulkDeleteModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Keywords to be deleted */
  keywords: KeywordData[];
  /** Callback when user confirms deletion */
  onConfirm: () => Promise<void>;
  /** Callback to close the modal */
  onClose: () => void;
  /** Whether deletion is in progress */
  isDeleting?: boolean;
}

/**
 * BulkDeleteModal Component
 *
 * Confirmation modal for bulk keyword deletion.
 * Shows list of keywords to be deleted, warning, and progress indicator.
 */
export function BulkDeleteModal({
  isOpen,
  keywords,
  onConfirm,
  onClose,
  isDeleting = false,
}: BulkDeleteModalProps) {
  const [progress, setProgress] = useState({ current: 0, total: keywords.length });

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Icon name="FaExclamationTriangle" className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete {keywords.length} keyword{keywords.length !== 1 ? 's' : ''}?
              </h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Icon name="FaTimes" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Warning */}
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="FaInfoCircle" className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">Warning</p>
                <p>
                  Deleting these keywords will remove them from your library permanently.
                  Any usage data and associations will be lost.
                </p>
              </div>
            </div>
          </div>

          {/* Keyword list */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Keywords to be deleted:
            </h4>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <ul className="divide-y divide-gray-100">
                {keywords.map((keyword) => (
                  <li
                    key={keyword.id}
                    className="px-3 py-2 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name="FaStar" className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{keyword.phrase}</span>
                    </div>
                    {keyword.groupName && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {keyword.groupName}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Progress indicator */}
          {isDeleting && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="FaSpinner" className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-900">
                  Deleting keywords...
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {progress.current} of {progress.total} deleted
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting && <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete keywords'}
          </button>
        </div>
      </div>
    </div>
  );
}
