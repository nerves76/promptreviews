/**
 * KeywordScheduleModal Component
 *
 * Modal for editing per-keyword scheduling settings.
 * Allows users to inherit config schedule, set custom schedule, or disable scheduling.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import { GGTrackedKeyword, GGConfig, ScheduleMode, ScheduleFrequency } from '../utils/types';
import { calculateGeogridCost } from '@/lib/credits/service';

// ============================================
// Types
// ============================================

interface KeywordScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: GGTrackedKeyword | null;
  config: GGConfig | null;
  onSave: (updates: {
    scheduleMode: ScheduleMode;
    scheduleFrequency: ScheduleFrequency;
    scheduleDayOfWeek: number | null;
    scheduleDayOfMonth: number | null;
    scheduleHour: number;
  }) => Promise<void>;
}

// ============================================
// Constants
// ============================================

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i < 12 ? 'AM' : 'PM'}`,
}));

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${getOrdinalSuffix(i + 1)}`,
}));

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatScheduleDescription(
  frequency: ScheduleFrequency,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
  hour: number
): string {
  const hourLabel = HOURS.find((h) => h.value === hour)?.label || `${hour}:00`;

  switch (frequency) {
    case 'daily':
      return `Daily at ${hourLabel} UTC`;
    case 'weekly':
      const dayName = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label || 'Monday';
      return `Every ${dayName} at ${hourLabel} UTC`;
    case 'monthly':
      const dayNum = dayOfMonth || 1;
      return `Monthly on the ${dayNum}${getOrdinalSuffix(dayNum)} at ${hourLabel} UTC`;
    default:
      return 'Manual only';
  }
}

// ============================================
// Component
// ============================================

export function KeywordScheduleModal({
  isOpen,
  onClose,
  keyword,
  config,
  onSave,
}: KeywordScheduleModalProps) {
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('inherit');
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>('weekly');
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState<number>(1); // Monday
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState<number>(1);
  const [scheduleHour, setScheduleHour] = useState<number>(9);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when keyword changes
  useEffect(() => {
    if (keyword) {
      setScheduleMode(keyword.scheduleMode || 'inherit');
      setScheduleFrequency(keyword.scheduleFrequency || 'weekly');
      setScheduleDayOfWeek(keyword.scheduleDayOfWeek ?? 1);
      setScheduleDayOfMonth(keyword.scheduleDayOfMonth ?? 1);
      setScheduleHour(keyword.scheduleHour ?? 9);
    }
  }, [keyword]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        scheduleMode,
        scheduleFrequency: scheduleMode === 'custom' ? scheduleFrequency : null,
        scheduleDayOfWeek: scheduleMode === 'custom' && scheduleFrequency === 'weekly' ? scheduleDayOfWeek : null,
        scheduleDayOfMonth: scheduleMode === 'custom' && scheduleFrequency === 'monthly' ? scheduleDayOfMonth : null,
        scheduleHour: scheduleMode === 'custom' ? scheduleHour : 9,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate credit cost preview
  const gridPoints = config?.checkPoints?.length || 5;
  const creditCost = calculateGeogridCost(gridPoints);

  // Get inherited schedule description
  const inheritedSchedule = config?.scheduleFrequency
    ? formatScheduleDescription(
        config.scheduleFrequency,
        config.scheduleDayOfWeek,
        config.scheduleDayOfMonth,
        config.scheduleHour
      )
    : 'No config schedule set';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyword schedule" size="md">
      <div className="space-y-6">
        {/* Keyword name */}
        {keyword && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-500">Keyword</div>
            <div className="font-medium text-gray-900">{keyword.phrase || keyword.keywordId}</div>
          </div>
        )}

        {/* Warning if keyword already has a schedule */}
        {keyword && (() => {
          const mode = keyword.scheduleMode || 'inherit';
          const hasExistingSchedule =
            (mode === 'inherit' && config?.scheduleFrequency) ||
            (mode === 'custom' && keyword.scheduleFrequency);

          if (hasExistingSchedule) {
            return (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800">This keyword already has a schedule</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Saving changes will replace the current one.
                </p>
              </div>
            );
          }
          return null;
        })()}

        {/* Schedule mode selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Schedule mode</label>
          <div className="space-y-2">
            {/* Inherit option */}
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="scheduleMode"
                value="inherit"
                checked={scheduleMode === 'inherit'}
                onChange={() => setScheduleMode('inherit')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Inherit from config</div>
                <div className="text-sm text-gray-500">{inheritedSchedule}</div>
              </div>
            </label>

            {/* Custom option */}
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="scheduleMode"
                value="custom"
                checked={scheduleMode === 'custom'}
                onChange={() => setScheduleMode('custom')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Custom schedule</div>
                <div className="text-sm text-gray-500">Set a different schedule for this keyword</div>
              </div>
            </label>

            {/* Off option */}
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="scheduleMode"
                value="off"
                checked={scheduleMode === 'off'}
                onChange={() => setScheduleMode('off')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Manual only</div>
                <div className="text-sm text-gray-500">Only check when you trigger it manually</div>
              </div>
            </label>
          </div>
        </div>

        {/* Custom schedule options */}
        {scheduleMode === 'custom' && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-sm font-medium text-blue-800">Custom schedule settings</div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={scheduleFrequency || 'weekly'}
                onChange={(e) => setScheduleFrequency(e.target.value as ScheduleFrequency)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Day of week (for weekly) */}
            {scheduleFrequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of week</label>
                <select
                  value={scheduleDayOfWeek}
                  onChange={(e) => setScheduleDayOfWeek(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Day of month (for monthly) */}
            {scheduleFrequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of month</label>
                <select
                  value={scheduleDayOfMonth}
                  onChange={(e) => setScheduleDayOfMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DAYS_OF_MONTH.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hour */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time (UTC)</label>
              <select
                value={scheduleHour}
                onChange={(e) => setScheduleHour(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {HOURS.map((hour) => (
                  <option key={hour.value} value={hour.value}>
                    {hour.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule preview */}
            <div className="pt-2 border-t border-blue-200">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Schedule:</span>{' '}
                {formatScheduleDescription(scheduleFrequency, scheduleDayOfWeek, scheduleDayOfMonth, scheduleHour)}
              </div>
            </div>
          </div>
        )}

        {/* Credit cost info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Cost per check</div>
              <div className="text-xs text-gray-500">{gridPoints} grid points</div>
            </div>
            <div className="text-lg font-bold text-slate-blue">{creditCost} credits</div>
          </div>
        </div>
      </div>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save schedule'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default KeywordScheduleModal;
