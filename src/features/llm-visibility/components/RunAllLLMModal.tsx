'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
  LLM_CREDIT_COSTS,
} from '../utils/types';

type RunMode = 'now' | 'schedule';
type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

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
  label: `${i.toString().padStart(2, '0')}:00`,
}));

interface RunAllLLMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStarted?: () => void;
}

interface BatchPreview {
  totalQuestions: number;
  keywordCount: number;
  providers: LLMProvider[];
  totalCredits: number;
  costPerProvider: Record<string, number>;
  creditBalance: number;
  hasCredits: boolean;
  activeRun: {
    runId: string;
    status: string;
    progress: number;
    total: number;
  } | null;
}

interface BatchStatus {
  runId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'scheduled';
  providers: LLMProvider[];
  totalQuestions: number;
  processedQuestions: number;
  successfulChecks: number;
  failedChecks: number;
  progress: number;
  errorMessage: string | null;
  scheduledFor?: string | null;
}

export default function RunAllLLMModal({
  isOpen,
  onClose,
  onStarted,
}: RunAllLLMModalProps) {
  const [selectedProviders, setSelectedProviders] = useState<LLMProvider[]>(['chatgpt', 'claude']);
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Schedule options
  const [runMode, setRunMode] = useState<RunMode>('now');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [hour, setHour] = useState(9); // 9 AM

  // Calculate cost based on selected providers
  const calculateCost = useCallback((questionCount: number, providers: LLMProvider[]) => {
    return providers.reduce((sum, p) => sum + LLM_CREDIT_COSTS[p], 0) * questionCount;
  }, []);

  // Load preview when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPreview();
    } else {
      // Reset state when modal closes
      setPreview(null);
      setBatchStatus(null);
      setError(null);
      setIsStarting(false);
      setRunMode('now');
      setFrequency('weekly');
      setDayOfWeek(1);
      setDayOfMonth(1);
      setHour(9);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Poll for batch status when running
  useEffect(() => {
    if (!batchStatus || !['pending', 'processing'].includes(batchStatus.status)) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const status = await apiClient.get<BatchStatus>(
          `/llm-visibility/batch-status?runId=${batchStatus.runId}`
        );
        setBatchStatus(status);

        if (['completed', 'failed'].includes(status.status)) {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('[RunAllLLM] Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [batchStatus?.runId, batchStatus?.status]);

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    setError(null);
    try {
      const providersParam = selectedProviders.join(',');
      const data = await apiClient.get<BatchPreview>(
        `/llm-visibility/batch-run?providers=${providersParam}`
      );
      setPreview(data);

      // If there's an active run, load its status
      if (data.activeRun) {
        const status = await apiClient.get<BatchStatus>(
          `/llm-visibility/batch-status?runId=${data.activeRun.runId}`
        );
        setBatchStatus(status);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const toggleProvider = useCallback((provider: LLMProvider) => {
    setSelectedProviders(prev => {
      if (prev.includes(provider)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(p => p !== provider);
      }
      return [...prev, provider];
    });
  }, []);

  // Recalculate cost when providers change
  const totalCredits = preview
    ? calculateCost(preview.totalQuestions, selectedProviders)
    : 0;

  const hasCredits = preview ? preview.creditBalance >= totalCredits : false;

  // Calculate the next scheduled time based on frequency
  const getNextScheduledTime = useCallback((): Date => {
    const now = new Date();

    switch (frequency) {
      case 'daily': {
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        next.setHours(hour, 0, 0, 0);
        return next;
      }
      case 'weekly': {
        const next = new Date(now);
        const currentDay = next.getDay();
        const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntil);
        next.setHours(hour, 0, 0, 0);
        return next;
      }
      case 'monthly': {
        const next = new Date(now);
        next.setMonth(next.getMonth() + 1);
        next.setDate(dayOfMonth);
        next.setHours(hour, 0, 0, 0);
        return next;
      }
    }
  }, [frequency, dayOfWeek, dayOfMonth, hour]);

  const handleStartBatch = async () => {
    if (!preview || selectedProviders.length === 0 || !hasCredits) return;

    setIsStarting(true);
    setError(null);

    // Calculate scheduled time if scheduling
    const scheduledTime = runMode === 'schedule' ? getNextScheduledTime() : null;

    try {
      const response = await apiClient.post<{
        success: boolean;
        runId: string;
        totalQuestions: number;
        providers: LLMProvider[];
        estimatedCredits: number;
        scheduled?: boolean;
        scheduledFor?: string;
        error?: string;
      }>('/llm-visibility/batch-run', {
        providers: selectedProviders,
        scheduledFor: scheduledTime?.toISOString() || undefined,
      });

      if (response.success) {
        // Set initial batch status
        setBatchStatus({
          runId: response.runId,
          status: response.scheduled ? 'scheduled' : 'pending',
          providers: response.providers,
          totalQuestions: response.totalQuestions,
          processedQuestions: 0,
          successfulChecks: 0,
          failedChecks: 0,
          progress: 0,
          errorMessage: null,
          scheduledFor: response.scheduledFor || null,
        });
        onStarted?.();
      } else {
        setError(response.error || 'Failed to start batch run');
      }
    } catch (err: any) {
      if (err?.status === 402) {
        setError(`Insufficient credits. Need ${err.required}, have ${err.available}`);
      } else if (err?.status === 409) {
        setError('A batch run is already in progress');
        // Load the existing run status
        if (err?.runId) {
          const status = await apiClient.get<BatchStatus>(
            `/llm-visibility/batch-status?runId=${err.runId}`
          );
          setBatchStatus(status);
        }
      } else {
        setError(err?.message || err?.error || 'Failed to start batch run');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const isRunning = batchStatus && ['pending', 'processing'].includes(batchStatus.status);
  const isScheduled = batchStatus?.status === 'scheduled';
  const isComplete = batchStatus?.status === 'completed';
  const isFailed = batchStatus?.status === 'failed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      showCloseButton={true}
      className="!p-0 flex flex-col max-h-[85vh]"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 pr-14 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="FaRocket" className="w-5 h-5 text-slate-blue" />
          <h3 className="text-lg font-semibold text-gray-900">Run all LLM checks</h3>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Check all your keyword questions across selected AI platforms
        </p>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto min-h-0">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="FaSpinner" className="w-6 h-6 text-slate-blue animate-spin" />
            </div>
          ) : isRunning ? (
            /* Running state */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="FaSpinner" className="w-5 h-5 text-slate-blue animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-slate-blue">
                      {batchStatus?.status === 'pending' ? 'Queued' : 'Processing'}...
                    </p>
                    <p className="text-xs text-slate-blue/70">
                      {batchStatus?.processedQuestions || 0} of {batchStatus?.totalQuestions || 0} questions
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-slate-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${batchStatus?.progress || 0}%` }}
                  />
                </div>
                <p className="text-xs text-center text-slate-blue/70 mt-2">
                  {batchStatus?.progress || 0}% complete
                </p>
              </div>
              <p className="text-xs text-gray-500 text-center">
                You can close this modal. Checks will continue in the background.
              </p>
            </div>
          ) : isScheduled ? (
            /* Scheduled state */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3">
                  <Icon name="FaClock" className="w-5 h-5 text-slate-blue" />
                  <div>
                    <p className="text-sm font-medium text-slate-blue">Checks scheduled</p>
                    <p className="text-xs text-slate-blue/70">
                      Will run at {batchStatus?.scheduledFor
                        ? new Date(batchStatus.scheduledFor).toLocaleString()
                        : 'scheduled time'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Credits have been reserved. Checks will run automatically at the scheduled time.
              </p>
            </div>
          ) : isComplete ? (
            /* Completed state */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <Icon name="FaCheckCircle" className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Batch complete</p>
                    <p className="text-xs text-green-700">
                      {batchStatus?.successfulChecks || 0} successful, {batchStatus?.failedChecks || 0} failed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : isFailed ? (
            /* Failed state */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center gap-3">
                  <Icon name="FaExclamationTriangle" className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Batch failed</p>
                    <p className="text-xs text-red-700">
                      {batchStatus?.errorMessage || 'An error occurred'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Configuration state */
            <>
              {/* Summary */}
              {preview && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Questions to check</span>
                    <span className="font-medium text-gray-900">{preview.totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Across concepts</span>
                    <span className="font-medium text-gray-900">{preview.keywordCount}</span>
                  </div>
                </div>
              )}

              {/* Provider selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check with
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LLM_PROVIDERS.map(provider => {
                    const isSelected = selectedProviders.includes(provider);
                    const colors = LLM_PROVIDER_COLORS[provider];
                    const cost = LLM_CREDIT_COSTS[provider];
                    const providerCost = preview ? cost * preview.totalQuestions : 0;

                    return (
                      <button
                        key={provider}
                        onClick={() => toggleProvider(provider)}
                        disabled={isStarting}
                        className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? `${colors.bg} ${colors.text} ${colors.border}`
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        } ${isStarting ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span>{LLM_PROVIDER_LABELS[provider]}</span>
                        <span className="text-xs opacity-70">{providerCost} cr</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Run mode toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When to run
                </label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setRunMode('now')}
                    disabled={isStarting}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      runMode === 'now'
                        ? 'bg-slate-blue text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon name="FaRocket" className="w-3.5 h-3.5 inline mr-1.5" />
                    Run now
                  </button>
                  <button
                    onClick={() => setRunMode('schedule')}
                    disabled={isStarting}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                      runMode === 'schedule'
                        ? 'bg-slate-blue text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon name="FaClock" className="w-3.5 h-3.5 inline mr-1.5" />
                    Schedule
                  </button>
                </div>
              </div>

              {/* Schedule options */}
              {runMode === 'schedule' && (
                <div className="space-y-3">
                  {/* Frequency */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Frequency</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['daily', 'weekly', 'monthly'] as ScheduleFrequency[]).map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setFrequency(freq)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors capitalize ${
                            frequency === freq
                              ? 'bg-blue-50 border-blue-300 text-slate-blue'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Day of week (for weekly) */}
                  {frequency === 'weekly' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
                      <select
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Day of month (for monthly) */}
                  {frequency === 'monthly' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Day of month</label>
                      <select
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                      >
                        {Array.from({ length: 28 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Hour */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                    <select
                      value={hour}
                      onChange={(e) => setHour(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                    >
                      {HOURS.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Next run preview */}
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      Next run: {getNextScheduledTime().toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Cost summary */}
              {preview && (
                <div className={`p-3 rounded-lg border ${
                  hasCredits ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${hasCredits ? 'text-slate-blue' : 'text-amber-800'}`}>
                        Total: {totalCredits} credits
                      </p>
                      <p className={`text-xs ${hasCredits ? 'text-slate-blue/70' : 'text-amber-700'}`}>
                        Balance: {preview.creditBalance} credits
                      </p>
                    </div>
                    {!hasCredits && (
                      <Icon name="FaExclamationTriangle" className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                </div>
              )}

              {/* No questions warning */}
              {preview && preview.totalQuestions === 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <Icon name="FaInfoCircle" className="w-4 h-4" />
                    No questions found. Add questions to your keyword concepts first.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <Icon name="FaExclamationTriangle" className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}
        </div>

      {/* Footer */}
      <Modal.Footer className="bg-gray-50 flex-shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          {isRunning ? 'Close' : isComplete || isFailed || isScheduled ? 'Done' : 'Cancel'}
        </button>
        {!isRunning && !isComplete && !isFailed && !isScheduled && (
          <button
            onClick={handleStartBatch}
            disabled={
              isStarting ||
              isLoadingPreview ||
              !hasCredits ||
              selectedProviders.length === 0 ||
              (preview?.totalQuestions || 0) === 0
            }
            className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {isStarting ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                {runMode === 'schedule' ? 'Scheduling...' : 'Starting...'}
              </>
            ) : runMode === 'schedule' ? (
              <>
                <Icon name="FaClock" className="w-4 h-4" />
                Schedule checks
              </>
            ) : (
              <>
                <Icon name="FaRocket" className="w-4 h-4" />
                Run all checks
              </>
            )}
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
