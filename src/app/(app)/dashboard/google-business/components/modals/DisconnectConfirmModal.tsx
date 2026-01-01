'use client';

import Icon from '@/components/Icon';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="FaExclamationTriangle" className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Disconnect Google Business Profile?</h3>
        </div>
        <p className="text-gray-600 mb-6">
          This will remove your Google Business Profile connection and all stored business locations.
          You'll need to reconnect and fetch your locations again to use posting features.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Disconnecting...</span>
              </>
            ) : (
              <>
                <Icon name="FaTimes" className="w-4 h-4" />
                <span>Yes, Disconnect</span>
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
