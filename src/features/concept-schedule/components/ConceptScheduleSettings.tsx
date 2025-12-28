/**
 * ConceptScheduleSettings Component
 *
 * Main UI for configuring concept-level scheduled checks.
 * Allows enabling/disabling different check types (search rank, geo-grid, LLM)
 * and setting schedule frequency.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import Icon from '@/components/Icon';
import { Button } from '@/app/(app)/components/ui/button';
import { CostBreakdownDisplay } from './CostBreakdownDisplay';
import { OverrideWarningModal } from './OverrideWarningModal';
import type {
  ConceptSchedule,
  ConceptCostBreakdown,
  ScheduleFrequency,
} from '../utils/types';
import type { PausedScheduleDisplay } from '../services/override-manager';
import {
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  type LLMProvider,
} from '@/features/llm-visibility/utils/types';

interface ConceptScheduleSettingsProps {
  keywordId: string;
  keywordName: string;
  creditBalance?: number;
  onScheduleUpdated?: () => void;
  defaultExpanded?: boolean;
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

export function ConceptScheduleSettings({
  keywordId,
  keywordName,
  creditBalance,
  onScheduleUpdated,
  defaultExpanded = false,
}: ConceptScheduleSettingsProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Schedule state
  const [schedule, setSchedule] = useState<ConceptSchedule | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<ConceptCostBreakdown | null>(null);

  // Form state
  const [frequency, setFrequency] = useState<ScheduleFrequency | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [hour, setHour] = useState(9);
  const [searchRankEnabled, setSearchRankEnabled] = useState(true);
  const [geoGridEnabled, setGeoGridEnabled] = useState(true);
  const [llmVisibilityEnabled, setLlmVisibilityEnabled] = useState(true);
  const [llmProviders, setLlmProviders] = useState<LLMProvider[]>([...LLM_PROVIDERS]);

  // Override warning modal
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [schedulesToPause, setSchedulesToPause] = useState<PausedScheduleDisplay[]>([]);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  // Fetch existing schedule
  useEffect(() => {
    async function fetchSchedule() {
      try {
        setIsLoading(true);
        const response = await apiClient.get<{
          schedule: ConceptSchedule | null;
          costBreakdown?: ConceptCostBreakdown;
        }>(`/concept-schedule?keywordId=${keywordId}`);

        if (response.schedule) {
          setSchedule(response.schedule);
          setFrequency(response.schedule.scheduleFrequency);
          setDayOfWeek(response.schedule.scheduleDayOfWeek ?? 1);
          setDayOfMonth(response.schedule.scheduleDayOfMonth ?? 1);
          setHour(response.schedule.scheduleHour);
          setSearchRankEnabled(response.schedule.searchRankEnabled);
          setGeoGridEnabled(response.schedule.geoGridEnabled);
          setLlmVisibilityEnabled(response.schedule.llmVisibilityEnabled);
          setLlmProviders(response.schedule.llmProviders);
        }

        if (response.costBreakdown) {
          setCostBreakdown(response.costBreakdown);
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

  // Fetch cost preview when settings change
  useEffect(() => {
    async function fetchCostPreview() {
      try {
        const response = await apiClient.post<{
          costBreakdown: ConceptCostBreakdown;
          hasExistingIndividualSchedules: boolean;
          schedulesToPause: PausedScheduleDisplay[];
        }>('/concept-schedule/cost-preview', {
          keywordId,
          searchRankEnabled,
          geoGridEnabled,
          llmVisibilityEnabled,
          llmProviders,
        });

        setCostBreakdown(response.costBreakdown);
        setSchedulesToPause(response.schedulesToPause || []);
      } catch (err) {
        console.error('Failed to fetch cost preview:', err);
      }
    }

    if (keywordId && !isLoading) {
      fetchCostPreview();
    }
  }, [keywordId, searchRankEnabled, geoGridEnabled, llmVisibilityEnabled, llmProviders, isLoading]);

  // Handle save
  const handleSave = useCallback(async (skipWarning = false) => {
    // Check for existing schedules to pause (only for new schedules)
    if (!schedule && schedulesToPause.length > 0 && !skipWarning) {
      setPendingSaveData({
        keywordId,
        scheduleFrequency: frequency,
        scheduleDayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        scheduleDayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        scheduleHour: hour,
        searchRankEnabled,
        geoGridEnabled,
        llmVisibilityEnabled,
        llmProviders,
      });
      setShowOverrideWarning(true);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        schedule: ConceptSchedule;
        costBreakdown: ConceptCostBreakdown;
      }>('/concept-schedule', {
        keywordId,
        scheduleFrequency: frequency,
        scheduleDayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        scheduleDayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        scheduleHour: hour,
        searchRankEnabled,
        geoGridEnabled,
        llmVisibilityEnabled,
        llmProviders,
      });

      setSchedule(response.schedule);
      setCostBreakdown(response.costBreakdown);
      onScheduleUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setIsSaving(false);
      setShowOverrideWarning(false);
      setPendingSaveData(null);
    }
  }, [keywordId, frequency, dayOfWeek, dayOfMonth, hour, searchRankEnabled, geoGridEnabled, llmVisibilityEnabled, llmProviders, schedule, schedulesToPause, onScheduleUpdated]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!schedule) return;

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.delete(`/concept-schedule?keywordId=${keywordId}`);
      setSchedule(null);
      setFrequency(null);
      onScheduleUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    } finally {
      setIsSaving(false);
    }
  }, [keywordId, schedule, onScheduleUpdated]);

  // Toggle LLM provider
  const toggleProvider = (provider: LLMProvider) => {
    setLlmProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    );
  };

  // Format next run date
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

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <Icon name="FaSpinner" className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon name="FaCalendarAlt" className="w-5 h-5 text-slate-blue" />
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Schedule</h4>
              {schedule?.scheduleFrequency && (
                <p className="text-xs text-gray-500">
                  {schedule.scheduleFrequency.charAt(0).toUpperCase() + schedule.scheduleFrequency.slice(1)} at {HOURS.find(h => h.value === schedule.scheduleHour)?.label}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {schedule && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                Active
              </span>
            )}
            <Icon
              name={isExpanded ? 'FaChevronUp' : 'FaChevronDown'}
              className="w-4 h-4 text-gray-400"
            />
          </div>
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-4 space-y-4 border-t border-gray-200">
            {/* Error display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Check type toggles */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Check types</label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchRankEnabled}
                  onChange={(e) => setSearchRankEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Icon name="FaSearch" className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Search rank tracking</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={geoGridEnabled}
                  onChange={(e) => setGeoGridEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Icon name="FaMapMarker" className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-gray-700">Local ranking grid</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={llmVisibilityEnabled}
                  onChange={(e) => setLlmVisibilityEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <Icon name="FaRobot" className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-700">LLM visibility</span>
                </div>
              </label>
            </div>

            {/* LLM Providers */}
            {llmVisibilityEnabled && (
              <div className="space-y-2 pl-7">
                <label className="block text-xs font-medium text-gray-500">LLM providers</label>
                <div className="flex flex-wrap gap-2">
                  {LLM_PROVIDERS.map((provider) => (
                    <button
                      key={provider}
                      onClick={() => toggleProvider(provider)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        llmProviders.includes(provider)
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {LLM_PROVIDER_LABELS[provider]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule frequency */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <select
                value={frequency || ''}
                onChange={(e) => setFrequency((e.target.value || null) as ScheduleFrequency | null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Manual only (no schedule)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Day of week (weekly) */}
            {frequency === 'weekly' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Day of week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Day of month (monthly) */}
            {frequency === 'monthly' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Day of month</label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {Array.from({ length: 28 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hour */}
            {frequency && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Time (UTC)</label>
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {HOURS.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cost breakdown */}
            {costBreakdown && (
              <CostBreakdownDisplay
                costBreakdown={costBreakdown}
                creditBalance={creditBalance}
              />
            )}

            {/* Next run info */}
            {schedule?.nextScheduledAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Icon name="FaClock" className="w-4 h-4" />
                <span>Next run: {formatNextRun(schedule.nextScheduledAt)}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving || (!searchRankEnabled && !geoGridEnabled && !llmVisibilityEnabled)}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Icon name="FaSpinner" className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : schedule ? (
                  'Update schedule'
                ) : (
                  'Enable schedule'
                )}
              </Button>

              {schedule && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Icon name="FaTrash" className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Override Warning Modal */}
      <OverrideWarningModal
        isOpen={showOverrideWarning}
        onClose={() => {
          setShowOverrideWarning(false);
          setPendingSaveData(null);
        }}
        onConfirm={() => handleSave(true)}
        isLoading={isSaving}
        schedulesToPause={schedulesToPause}
      />
    </>
  );
}

export default ConceptScheduleSettings;
