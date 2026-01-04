'use client';

import Icon from '@/components/Icon';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';

interface DisconnectConfirmModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DisconnectConfirmModal({
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: DisconnectConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="md">
      <div className="flex items-center space-x-3 mb-4">
        <Icon name="FaExclamationTriangle" className="w-6 h-6 text-red-500" />
        <h3 className="text-lg font-semibold text-gray-900">Disconnect Google Business Profile?</h3>
      </div>
      <p className="text-gray-600 mb-6">
        This will remove your Google Business Profile connection and all stored business locations.
        You'll need to reconnect and fetch your locations again to use posting features.
      </p>
      <Modal.Footer className="mt-0">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Disconnecting...
            </>
          ) : (
            <>
              <Icon name="FaTimes" className="w-4 h-4 mr-2" />
              Yes, disconnect
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
