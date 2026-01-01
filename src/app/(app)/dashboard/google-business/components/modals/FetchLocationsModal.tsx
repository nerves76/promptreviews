'use client';

import Icon from '@/components/Icon';

interface FetchLocationsModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FetchLocationsModal({
  isOpen,
  onConfirm,
  onCancel,
}: FetchLocationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Fetch Business Locations</h3>
        </div>
        <p className="text-gray-600 mb-6">
          This will retrieve all your Google Business Profile locations and their details.
          The process is usually quick but may take a moment depending on the number of locations.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6">
          <div className="flex items-start space-x-2">
            <Icon name="FaInfoCircle" className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Choose locations to manage (limited by plan)</li>
                <li>Location details saved for quick access</li>
                <li>Post updates to your selected locations</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>Fetch locations</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
