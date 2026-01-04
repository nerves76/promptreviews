'use client';

import Icon from '@/components/Icon';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';

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
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="md">
      <div className="flex items-center space-x-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Fetch business locations</h3>
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
      <Modal.Footer className="mt-0">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>
          Fetch locations
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
