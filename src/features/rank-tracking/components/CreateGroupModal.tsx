/**
 * CreateGroupModal Component
 *
 * Modal for creating a new rank tracking group.
 */

'use client';

import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/(app)/components/ui/button';
import LocationPicker from './LocationPicker';
import { RankKeywordGroup } from '../utils/types';

// ============================================
// Types
// ============================================

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateGroupData) => Promise<{ success: boolean; error?: string; group?: RankKeywordGroup }>;
  onSuccess: () => void;
}

interface CreateGroupData {
  name: string;
  device: 'desktop' | 'mobile';
  locationCode: number;
  locationName: string;
}

// ============================================
// Component
// ============================================

export default function CreateGroupModal({ isOpen, onClose, onCreate, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [location, setLocation] = useState<{ code: number; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !location) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await onCreate({
      name: name.trim(),
      device,
      locationCode: location.code,
      locationName: location.name,
    });

    setIsSubmitting(false);

    if (result.success) {
      // Reset form
      setName('');
      setDevice('desktop');
      setLocation(null);
      onSuccess();
    } else {
      setError(result.error || 'Failed to create group');
    }
  };

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
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Create Keyword Group
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Group Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Portland Desktop"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    />
                  </div>

                  {/* Device Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Device
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setDevice('desktop')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                          device === 'desktop'
                            ? 'border-slate-blue bg-slate-blue/5 text-slate-blue'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <ComputerDesktopIcon className="w-5 h-5" />
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setDevice('mobile')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                          device === 'mobile'
                            ? 'border-slate-blue bg-slate-blue/5 text-slate-blue'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <DevicePhoneMobileIcon className="w-5 h-5" />
                        Mobile
                      </button>
                    </div>
                  </div>

                  {/* Location Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <LocationPicker
                      value={location}
                      onChange={setLocation}
                      placeholder="Search for a city, state, or country..."
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      {error}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Group'}
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
