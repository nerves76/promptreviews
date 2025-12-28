/**
 * ConceptScheduleSettings Component
 *
 * A button that shows schedule status and opens a modal for configuration.
 */

'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';
import Icon from '@/components/Icon';
import { ScheduleSettingsModal } from './ScheduleSettingsModal';
import type { ConceptSchedule } from '../utils/types';

interface ConceptScheduleSettingsProps {
  keywordId: string;
  keywordName: string;
  creditBalance?: number;
  onScheduleUpdated?: () => void;
  /** Compact mode for sidebar - shows just an icon button */
  compact?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00 UTC`,
}));

export function ConceptScheduleSettings({
  keywordId,
  keywordName,
  creditBalance,
  onScheduleUpdated,
  compact = false,
}: ConceptScheduleSettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<ConceptSchedule | null>(null);

  // Fetch existing schedule
  useEffect(() => {
    async function fetchSchedule() {
      try {
        setIsLoading(true);
        const response = await apiClient.get<{
          schedule: ConceptSchedule | null;
        }>(`/concept-schedule?keywordId=${keywordId}`);

        if (response.schedule) {
          setSchedule(response.schedule);
        }
      } catch (err) {
        console.error('Failed to fetch concept schedule:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (keywordId) {
      fetchSchedule();
    }
  }, [keywordId]);

  // Refresh schedule after modal closes
  const handleScheduleUpdated = () => {
    // Refetch schedule
    apiClient.get<{ schedule: ConceptSchedule | null }>(`/concept-schedule?keywordId=${keywordId}`)
      .then(response => setSchedule(response.schedule))
      .catch(err => console.error('Failed to refresh schedule:', err));

    onScheduleUpdated?.();
  };

  // Format schedule summary
  const getScheduleSummary = () => {
    if (!schedule?.scheduleFrequency) return null;

    const freq = schedule.scheduleFrequency.charAt(0).toUpperCase() + schedule.scheduleFrequency.slice(1);
    const time = HOURS.find(h => h.value === schedule.scheduleHour)?.label || '';
    return `${freq} at ${time}`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'p-2' : 'p-3'} text-gray-400`}>
        <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
        {!compact && <span className="text-sm">Loading...</span>}
      </div>
    );
  }

  // Compact mode - just an icon button
  if (compact) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`p-2 rounded-lg transition-colors ${
            schedule
              ? 'text-green-600 hover:bg-green-50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title={schedule ? `Scheduled: ${getScheduleSummary()}` : 'Set up schedule'}
        >
          <Icon name="FaCalendarAlt" className="w-4 h-4" />
        </button>

        <ScheduleSettingsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          keywordId={keywordId}
          keywordName={keywordName}
          creditBalance={creditBalance}
          onScheduleUpdated={handleScheduleUpdated}
        />
      </>
    );
  }

  // Full mode - button with status
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon name="FaCalendarAlt" className="w-4 h-4 text-slate-blue" />
          <span className="text-sm font-medium text-gray-900">Schedule</span>
          {schedule?.scheduleFrequency && (
            <span className="text-xs text-gray-500">· {getScheduleSummary()}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {schedule ? (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
              Active
            </span>
          ) : (
            <span className="text-xs text-gray-400">Not scheduled</span>
          )}
          <Icon name="FaChevronRight" className="w-3 h-3 text-gray-400" />
        </div>
      </button>

      <ScheduleSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        keywordId={keywordId}
        keywordName={keywordName}
        creditBalance={creditBalance}
        onScheduleUpdated={handleScheduleUpdated}
      />
    </>
  );
}

export default ConceptScheduleSettings;
