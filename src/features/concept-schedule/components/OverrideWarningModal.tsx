/**
 * OverrideWarningModal Component
 *
 * Shows warning when enabling concept schedule will pause existing
 * individual schedules (like LLM visibility schedules).
 */

'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Icon from '@/components/Icon';
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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900 flex items-center gap-2"
                >
                  <Icon name="FaExclamationTriangle" className="w-5 h-5 text-amber-500" />
                  Existing schedules will be paused
                </Dialog.Title>

                <div className="mt-4">
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

                <div className="mt-6 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Icon name="FaSpinner" className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default OverrideWarningModal;
