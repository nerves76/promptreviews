'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

type AnalysisType = 'domain' | 'competitor';

interface RunAllAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisType: AnalysisType;
  onComplete?: () => void;
}

interface BatchPreview {
  hasActiveRun: boolean;
  runId?: string;
  status?: string;
  totalItems: number;
  processedItems?: number;
  progress?: number;
  estimatedCredits: number;
  creditBalance: number;
  hasEnoughCredits: boolean;
}

interface BatchStatus {
  runId: string;
  batchType: AnalysisType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  progress: number;
  estimatedCredits: number;
  errorMessage: string | null;
}

const TYPE_LABELS: Record<AnalysisType, string> = {
  domain: 'Domain analysis',
  competitor: 'Competitor analysis',
};

const TYPE_DESCRIPTIONS: Record<AnalysisType, string> = {
  domain: 'Analyze all domains from your research sources to identify visibility opportunities',
  competitor: 'Generate AI insights for all competitors mentioned in your LLM checks',
};

const TYPE_ICONS: Record<AnalysisType, 'FaGlobe' | 'FaUsers'> = {
  domain: 'FaGlobe',
  competitor: 'FaUsers',
};

export default function RunAllAnalysisModal({
  isOpen,
  onClose,
  analysisType,
  onComplete,
}: RunAllAnalysisModalProps) {
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, [isOpen, analysisType]);

  // Poll for batch status when running
  useEffect(() => {
    if (!batchStatus || !['pending', 'processing'].includes(batchStatus.status)) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const status = await apiClient.get<BatchStatus>(
          `/llm-visibility/batch-analyze-status?runId=${batchStatus.runId}`
        );
        setBatchStatus(status);

        if (['completed', 'failed'].includes(status.status)) {
          clearInterval(pollInterval);
          if (status.status === 'completed') {
            onComplete?.();
          }
        }
      } catch (err) {
        console.error('[RunAllAnalysis] Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [batchStatus?.runId, batchStatus?.status, onComplete]);

  const loadPreview = async () => {
    setIsLoadingPreview(true);
    setError(null);
    try {
      const data = await apiClient.get<BatchPreview>(
        `/llm-visibility/batch-analyze?type=${analysisType}`
      );
      setPreview(data);

      // If there's an active run, load its status
      if (data.hasActiveRun && data.runId) {
        const status = await apiClient.get<BatchStatus>(
          `/llm-visibility/batch-analyze-status?runId=${data.runId}`
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
    if (!preview || !preview.hasEnoughCredits) return;

    setIsStarting(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        runId: string;
        totalItems: number;
        estimatedCredits: number;
        error?: string;
      }>('/llm-visibility/batch-analyze', {
        type: analysisType,
      });

      if (response.success) {
        // Set initial batch status
        setBatchStatus({
          runId: response.runId,
          batchType: analysisType,
          status: 'pending',
          totalItems: response.totalItems,
          processedItems: 0,
          successfulItems: 0,
          failedItems: 0,
          progress: 0,
          estimatedCredits: response.estimatedCredits,
          errorMessage: null,
        });
      } else {
        setError(response.error || 'Failed to start batch run');
      }
    } catch (err: any) {
      if (err?.status === 402) {
        setError(`Insufficient credits. Need ${err.required}, have ${err.available}`);
      } else if (err?.status === 409) {
        setError('A batch analysis is already in progress');
        // Load the existing run status
        if (err?.runId) {
          const status = await apiClient.get<BatchStatus>(
            `/llm-visibility/batch-analyze-status?runId=${err.runId}`
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
        {/* Standardized close button */}
        {!isRunning && (
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
            style={{ width: 48, height: 48 }}
            aria-label="Close modal"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 pr-12">
          <div className="flex items-center gap-2">
            <Icon name={TYPE_ICONS[analysisType]} className="w-5 h-5 text-slate-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Run all {TYPE_LABELS[analysisType].toLowerCase()}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {TYPE_DESCRIPTIONS[analysisType]}
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
                      {batchStatus?.processedItems || 0} of {batchStatus?.totalItems || 0} {analysisType === 'domain' ? 'domains' : 'competitors'}
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
                You can close this modal. Analysis will continue in the background.
              </p>
            </div>
          ) : isComplete ? (
            /* Completed state */
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <Icon name="FaCheckCircle" className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Analysis complete</p>
                    <p className="text-xs text-green-700">
                      {batchStatus?.successfulItems || 0} analyzed, {batchStatus?.failedItems || 0} failed
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
                    <p className="text-sm font-medium text-red-800">Analysis failed</p>
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
                    <span className="text-gray-600">
                      {analysisType === 'domain' ? 'Domains to analyze' : 'Competitors to analyze'}
                    </span>
                    <span className="font-medium text-gray-900">{preview.totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Cost per item</span>
                    <span className="font-medium text-gray-900">1 credit</span>
                  </div>
                </div>
              )}

              {/* Cost summary */}
              {preview && preview.totalItems > 0 && (
                <div className={`p-3 rounded-lg border ${
                  preview.hasEnoughCredits ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${preview.hasEnoughCredits ? 'text-slate-blue' : 'text-amber-800'}`}>
                        Total: {preview.estimatedCredits} credits
                      </p>
                      <p className={`text-xs ${preview.hasEnoughCredits ? 'text-slate-blue/70' : 'text-amber-700'}`}>
                        Balance: {preview.creditBalance} credits
                      </p>
                    </div>
                    {!preview.hasEnoughCredits && (
                      <Icon name="FaExclamationTriangle" className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                </div>
              )}

              {/* No items warning */}
              {preview && preview.totalItems === 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <Icon name="FaInfoCircle" className="w-4 h-4" />
                    {analysisType === 'domain'
                      ? 'No domains need analysis. All domains have already been analyzed.'
                      : 'No competitors need analysis. All competitors have already been analyzed.'}
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
                !preview?.hasEnoughCredits ||
                (preview?.totalItems || 0) === 0
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
                  Analyze all
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
