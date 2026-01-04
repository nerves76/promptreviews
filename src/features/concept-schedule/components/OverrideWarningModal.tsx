/**
 * OverrideWarningModal Component
 *
 * Shows warning when enabling concept schedule will pause existing
 * individual schedules (like LLM visibility schedules).
 */

'use client';

import Icon from '@/components/Icon';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import type { PausedScheduleDisplay } from '../services/override-manager';

interface OverrideWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  schedulesToPause: PausedScheduleDisplay[];
}

export function OverrideWarningModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  schedulesToPause,
}: OverrideWarningModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="FaExclamationTriangle" className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Existing schedules will be paused
        </h3>
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-3">
          Enabling concept-level scheduling will pause the following individual schedules:
        </p>

        <div className="space-y-2">
          {schedulesToPause.map((schedule, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
            >
              <div className="flex-shrink-0">
                {schedule.type === 'llm' && (
                  <Icon name="FaRobot" className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {schedule.type === 'llm' ? 'LLM Visibility' : schedule.type}
                </p>
                <p className="text-xs text-gray-600">
                  {schedule.frequency} - {schedule.details}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> These schedules will be automatically restored if you disable
            or delete the concept schedule.
          </p>
        </div>
      </div>

      <Modal.Footer>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <Icon name="FaSpinner" className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default OverrideWarningModal;
