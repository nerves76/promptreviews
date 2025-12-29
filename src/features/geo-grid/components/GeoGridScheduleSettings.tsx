/**
 * GeoGridScheduleSettings Component
 *
 * UI for configuring recurring geo-grid check schedules.
 * Supports daily, weekly, and monthly frequencies.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { GGConfig, ScheduleFrequency } from '../utils/types';
import { calculateGeogridCost } from '@/lib/credits';
import { ClockIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface GeoGridScheduleSettingsProps {
  config: GGConfig;
  keywordCount: number;
  creditBalance?: number;
  onScheduleUpdated?: () => void;
}

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
  label: `${i.toString().padStart(2, '0')}:00 UTC`,
}));

export function GeoGridScheduleSettings({
  config,
  keywordCount,
  creditBalance,
  onScheduleUpdated,
}: GeoGridScheduleSettingsProps) {
  const [frequency, setFrequency] = useState<ScheduleFrequency>(config.scheduleFrequency);
  const [dayOfWeek, setDayOfWeek] = useState(config.scheduleDayOfWeek ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState(config.scheduleDayOfMonth ?? 1);
  const [hour, setHour] = useState(config.scheduleHour ?? 9);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Calculate estimated cost per run
  const pointCount = config.checkPoints.length;
  const gridSize = Math.sqrt(pointCount);
  const estimatedCost = calculateGeogridCost(gridSize, keywordCount);

  // Check if balance is sufficient
  const hasInsufficientCredits = creditBalance !== undefined && creditBalance < estimatedCost;

  // Track changes
  useEffect(() => {
    const changed =
      frequency !== config.scheduleFrequency ||
      dayOfWeek !== (config.scheduleDayOfWeek ?? 1) ||
      dayOfMonth !== (config.scheduleDayOfMonth ?? 1) ||
      hour !== (config.scheduleHour ?? 9);
    setHasChanges(changed);
  }, [frequency, dayOfWeek, dayOfMonth, hour, config]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await apiClient.put('/geo-grid/schedule', {
        scheduleFrequency: frequency,
        scheduleDayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
        scheduleDayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
        scheduleHour: hour,
      });

      setHasChanges(false);
      onScheduleUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  }, [frequency, dayOfWeek, dayOfMonth, hour, onScheduleUpdated]);

  const formatNextRun = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Schedule Settings</h3>
      </div>

      {/* Cost Warning */}
      {keywordCount > 0 && (
        <div className={`mb-4 p-3 rounded-lg ${hasInsufficientCredits ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-start gap-2">
            {hasInsufficientCredits && <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />}
            <div>
              <p className={`text-sm font-medium ${hasInsufficientCredits ? 'text-red-700' : 'text-blue-700'}`}>
                Each check uses <strong>{estimatedCost} credits</strong>
              </p>
              <p className={`text-xs ${hasInsufficientCredits ? 'text-red-600' : 'text-blue-600'}`}>
                {gridSize}×{gridSize} grid × {keywordCount} keywords
              </p>
              {hasInsufficientCredits && (
                <p className="text-xs text-red-600 mt-1">
                  You only have {creditBalance} credits. Add more credits to avoid skipped checks.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Frequency Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frequency
        </label>
        <select
          value={frequency || ''}
          onChange={(e) => setFrequency((e.target.value || null) as ScheduleFrequency)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Manual only (no schedule)</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Weekly: Day of Week */}
      {frequency === 'weekly' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Day of Week
          </label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
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

      {/* Monthly: Day of Month */}
      {frequency === 'monthly' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Day of Month
          </label>
          <select
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day}
                {day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hour Selector */}
      {frequency && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time (UTC)
          </label>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-gray-500" />
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {HOURS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Next Scheduled Run */}
      {frequency && config.nextScheduledAt && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Next run:</span> {formatNextRun(config.nextScheduledAt)}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isSaving ? 'Saving...' : hasChanges ? 'Save Schedule' : 'No Changes'}
      </button>
    </div>
  );
}

export default GeoGridScheduleSettings;
