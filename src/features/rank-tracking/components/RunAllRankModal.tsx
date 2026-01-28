'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

type RunMode = 'now' | 'schedule';
type ScheduleOption = 'in1hour' | 'tomorrow8am' | 'custom';

interface RunAllRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStarted?: () => void;
}

interface BatchPreview {
  totalKeywords: number;
  conceptCount: number;
  totalCredits: number;
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalKeywords: number;
  processedKeywords: number;
  successfulChecks: number;
  failedChecks: number;
  progress: number;
  creditsRefunded?: number;
  errorMessage: string | null;
  scheduled?: boolean;
  scheduledFor?: string | null;
}

// Helper to calculate scheduled time
function getScheduledTime(option: ScheduleOption, customDate?: string, customTime?: string): Date | null {
  const now = new Date();

  switch (option) {
    case 'in1hour':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'tomorrow8am': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      return tomorrow;
    }
    case 'custom':
      if (customDate && customTime) {
        return new Date(`${customDate}T${customTime}`);
      }
      return null;
    default:
      return null;
  }
}

export default function RunAllRankModal({
  isOpen,
  onClose,
  onStarted,
}: RunAllRankModalProps) {
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Schedule state
  const [runMode, setRunMode] = useState<RunMode>('now');
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>('in1hour');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('08:00');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);

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
      setScheduleOption('in1hour');
      setCustomDate('');
      setCustomTime('08:00');
      setIsScheduled(false);
      setScheduledFor(null);
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
          `/rank-tracking/batch-status?runId=${batchStatus.runId}`
        );
        setBatchStatus(status);

        if (['completed', 'failed'].includes(status.status)) {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('[RunAllRank] Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [batchStatus?.runId, batchStatus?.status]);

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    setError(null);
    try {
      const data = await apiClient.get<BatchPreview>('/rank-tracking/batch-run');
      setPreview(data);

      // If there's an active run, load its status
      if (data.activeRun) {
        const status = await apiClient.get<BatchStatus>(
          `/rank-tracking/batch-status?runId=${data.activeRun.runId}`
        );
        setBatchStatus(status);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleStartBatch = async () => {
    if (!preview || !preview.hasCredits) return;

    // Validate schedule if in schedule mode
    let scheduleTime: Date | null = null;
    if (runMode === 'schedule') {
      scheduleTime = getScheduledTime(scheduleOption, customDate, customTime);
      if (!scheduleTime) {
        setError('Please select a valid schedule time');
        return;
      }
      if (scheduleTime <= new Date()) {
        setError('Scheduled time must be in the future');
        return;
      }
    }

    setIsStarting(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        runId: string;
        totalKeywords: number;
        estimatedCredits: number;
        scheduled?: boolean;
        scheduledFor?: string | null;
        error?: string;
      }>('/rank-tracking/batch-run', {
        scheduledFor: scheduleTime?.toISOString() || undefined,
      });

      if (response.success) {
        if (response.scheduled && response.scheduledFor) {
          // Show scheduled confirmation
          setIsScheduled(true);
          setScheduledFor(response.scheduledFor);
        } else {
          // Set initial batch status for immediate run
          setBatchStatus({
            runId: response.runId,
            status: 'pending',
            totalKeywords: response.totalKeywords,
            processedKeywords: 0,
            successfulChecks: 0,
            failedChecks: 0,
            progress: 0,
            errorMessage: null,
          });
        }
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
            `/rank-tracking/batch-status?runId=${err.runId}`
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

  if (!isOpen) return null;

  const isRunning = batchStatus && ['pending', 'processing'].includes(batchStatus.status);
  const isComplete = batchStatus?.status === 'completed';
  const isFailed = batchStatus?.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isRunning ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="FaChartLine" className="w-5 h-5 text-slate-blue" />
              <h3 className="text-lg font-semibold text-gray-900">Check all rankings</h3>
            </div>
            {!isRunning && !isScheduled && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1 text-gray-500 hover:text-gray-600 rounded transition-colors"
              >
                <Icon name="FaTimes" className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Check Google rankings for all your keywords (desktop &amp; mobile)
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="FaSpinner" className="w-6 h-6 text-slate-blue animate-spin" />
            </div>
          ) : isScheduled ? (
            /* Scheduled confirmation state */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <Icon name="FaCalendarAlt" className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Checks scheduled</p>
                    <p className="text-xs text-green-700">
                      Will run {scheduledFor ? new Date(scheduledFor).toLocaleString() : 'at scheduled time'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Credits have been reserved. You can close this modal.
              </p>
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
                      {batchStatus?.processedKeywords || 0} of {batchStatus?.totalKeywords || 0} keywords
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
              {/* Show refund message if credits were refunded */}
              {(batchStatus?.creditsRefunded ?? 0) > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Icon name="FaCoins" className="w-4 h-4 text-slate-blue" />
                    <p className="text-sm text-slate-blue">
                      {batchStatus?.creditsRefunded} credit{batchStatus?.creditsRefunded !== 1 ? 's' : ''} refunded for failed checks
                    </p>
                  </div>
                </div>
              )}
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
              {/* Show refund message if credits were refunded */}
              {(batchStatus?.creditsRefunded ?? 0) > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Icon name="FaCoins" className="w-4 h-4 text-slate-blue" />
                    <p className="text-sm text-slate-blue">
                      {batchStatus?.creditsRefunded} credit{batchStatus?.creditsRefunded !== 1 ? 's' : ''} refunded for failed checks
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Configuration state */
            <>
              {/* Run mode toggle */}
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setRunMode('now')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    runMode === 'now'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Check now
                </button>
                <button
                  onClick={() => setRunMode('schedule')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    runMode === 'schedule'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Schedule
                </button>
              </div>

              {/* Schedule options (only shown in schedule mode) */}
              {runMode === 'schedule' && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scheduleOption"
                        checked={scheduleOption === 'in1hour'}
                        onChange={() => setScheduleOption('in1hour')}
                        className="text-slate-blue focus:ring-slate-blue"
                      />
                      <span className="text-sm text-gray-700">In 1 hour</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scheduleOption"
                        checked={scheduleOption === 'tomorrow8am'}
                        onChange={() => setScheduleOption('tomorrow8am')}
                        className="text-slate-blue focus:ring-slate-blue"
                      />
                      <span className="text-sm text-gray-700">Tomorrow at 8 AM</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scheduleOption"
                        checked={scheduleOption === 'custom'}
                        onChange={() => setScheduleOption('custom')}
                        className="text-slate-blue focus:ring-slate-blue"
                      />
                      <span className="text-sm text-gray-700">Custom time</span>
                    </label>
                  </div>

                  {/* Custom date/time inputs */}
                  {scheduleOption === 'custom' && (
                    <div className="flex gap-2 pl-6">
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-slate-blue focus:border-slate-blue"
                      />
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-slate-blue focus:border-slate-blue"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {preview && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Keywords to check</span>
                    <span className="font-medium text-gray-900">{preview.totalKeywords}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Across concepts</span>
                    <span className="font-medium text-gray-900">{preview.conceptCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Devices per keyword</span>
                    <span className="font-medium text-gray-900">2 (desktop + mobile)</span>
                  </div>
                </div>
              )}

              {/* Cost summary */}
              {preview && (
                <div className={`p-3 rounded-lg border ${
                  preview.hasCredits ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${preview.hasCredits ? 'text-slate-blue' : 'text-amber-800'}`}>
                        Total: {preview.totalCredits} credits
                      </p>
                      <p className={`text-xs ${preview.hasCredits ? 'text-slate-blue/70' : 'text-amber-700'}`}>
                        Balance: {preview.creditBalance} credits
                      </p>
                    </div>
                    {!preview.hasCredits && (
                      <Icon name="FaExclamationTriangle" className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                </div>
              )}

              {/* No keywords warning */}
              {preview && preview.totalKeywords === 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <Icon name="FaInfoCircle" className="w-4 h-4" />
                    No keywords found. Add keywords to your account first.
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
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
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
                !preview?.hasCredits ||
                (preview?.totalKeywords || 0) === 0
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
                  <Icon name="FaCalendarAlt" className="w-4 h-4" />
                  Schedule checks
                </>
              ) : (
                <>
                  <Icon name="FaChartLine" className="w-4 h-4" />
                  Check all
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
