/**
 * ScheduleSettings Component
 *
 * Modal for configuring automated rank checking schedules.
 * TODO: Implement full functionality
 */

'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ScheduleFrequency } from '../utils/types';

interface ScheduleConfig {
  frequency: ScheduleFrequency | null;
  hour: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
}

interface ScheduleSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentSchedule: ScheduleConfig;
}

export default function ScheduleSettings({
  isOpen,
  onClose,
  groupId,
  currentSchedule,
}: ScheduleSettingsProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Schedule Settings
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-500"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>Schedule configuration coming soon...</p>
                  <p className="text-sm mt-2">Group ID: {groupId}</p>
                  <p className="text-sm">
                    Current: {currentSchedule.frequency || 'None'}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90"
                >
                  Save
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
