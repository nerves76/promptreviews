'use client';

import { useState, useCallback, useEffect } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
  LLM_CREDIT_COSTS,
} from '../utils/types';

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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  providers: LLMProvider[];
  totalQuestions: number;
  processedQuestions: number;
  successfulChecks: number;
  failedChecks: number;
  progress: number;
  errorMessage: string | null;
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

  const handleStartBatch = async () => {
    if (!preview || selectedProviders.length === 0 || !hasCredits) return;

    setIsStarting(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        runId: string;
        totalQuestions: number;
        providers: LLMProvider[];
        estimatedCredits: number;
        error?: string;
      }>('/llm-visibility/batch-run', {
        providers: selectedProviders,
      });

      if (response.success) {
        // Set initial batch status
        setBatchStatus({
          runId: response.runId,
          status: 'pending',
          providers: response.providers,
          totalQuestions: response.totalQuestions,
          processedQuestions: 0,
          successfulChecks: 0,
          failedChecks: 0,
          progress: 0,
          errorMessage: null,
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
              <Icon name="FaRocket" className="w-5 h-5 text-slate-blue" />
              <h3 className="text-lg font-semibold text-gray-900">Run all LLM checks</h3>
            </div>
            {!isRunning && (
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
            Check all your keyword questions across selected AI platforms
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
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
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            {isRunning ? 'Close' : isComplete || isFailed ? 'Done' : 'Cancel'}
          </button>
          {!isRunning && !isComplete && !isFailed && (
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
                  Starting...
                </>
              ) : (
                <>
                  <Icon name="FaRocket" className="w-4 h-4" />
                  Run all checks
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
