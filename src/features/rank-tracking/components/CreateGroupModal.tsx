/**
 * CreateGroupModal Component
 *
 * Modal for creating a new rank tracking group.
 */

'use client';

import { useState } from 'react';
import { ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/(app)/components/ui/button';
import { Modal } from '@/app/(app)/components/ui/modal';
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create keyword group"
      size="md"
      allowOverflow
    >
      <Modal.Body>
        {/* Group Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Group name
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
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create group'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
