'use client';

import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';

interface ConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when user cancels or closes */
  onClose: () => void;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Modal title */
  title?: string;
  /** Description / body text */
  message: string;
  /** Label for confirm button (default: "Delete") */
  confirmLabel?: string;
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Whether confirm action is in progress */
  isLoading?: boolean;
  /** Visual variant (default: "destructive") */
  variant?: 'destructive' | 'default';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  variant = 'destructive',
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="flex items-center gap-3 mb-3">
        {variant === 'destructive' && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Icon name="FaExclamationTriangle" size={18} className="text-red-600" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <Modal.Footer className="mt-0">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Icon name="FaSpinner" size={14} className="animate-spin mr-1.5" />
              Deleting...
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
