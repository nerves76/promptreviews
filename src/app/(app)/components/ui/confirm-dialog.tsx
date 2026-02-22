'use client';

import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import { LoadingSpinner } from '@/app/(app)/components/ui/loading-spinner';
import Icon from '@/components/Icon';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called when user cancels or closes */
  onClose: () => void;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Description / body text (supports ReactNode for rich content) */
  message: React.ReactNode;
  /** Label for confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Visual variant for the confirm button */
  confirmVariant?: 'danger' | 'primary';
  /** Whether confirm action is in progress */
  isLoading?: boolean;
}

/**
 * Centralized confirmation dialog built on top of the Modal component.
 *
 * Usage:
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete item"
 *   message="Are you sure you want to delete this item? This cannot be undone."
 *   confirmLabel="Delete"
 *   confirmVariant="danger"
 *   isLoading={isDeleting}
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className="flex items-center gap-3 mb-3">
        {confirmVariant === 'danger' && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Icon name="FaExclamationTriangle" size={18} className="text-red-600" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="text-gray-600 text-sm mb-6">
        {message}
      </div>

      <Modal.Footer className="mt-0">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={confirmVariant === 'danger' ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <LoadingSpinner size="xs" />
              {confirmLabel}...
            </span>
          ) : (
            confirmLabel
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
