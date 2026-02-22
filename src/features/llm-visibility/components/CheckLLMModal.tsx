'use client';

import { useState, useCallback, useEffect, useTransition, useRef } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { Modal } from '@/app/(app)/components/ui/modal';
import RunCountSelector from './RunCountSelector';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
  LLM_CREDIT_COSTS,
  LLMCheckResult,
} from '../utils/types';

interface CheckLLMModalProps {
  question: string;
  keywordId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Called when a check completes successfully, to trigger data refresh */
  onCheckComplete?: () => void;
  /** Business name to display in results (e.g., "Acme Co was not mentioned") */
  businessName?: string;
  /** If provided, delegates the check to the parent (runs in background, modal closes) */
  onStartCheck?: (keywordId: string, question: string, providers: LLMProvider[], runCount: number) => void;
}

export default function CheckLLMModal({
  question,
  keywordId,
  isOpen,
  onClose,
  onCheckComplete,
  businessName,
  onStartCheck,
}: CheckLLMModalProps) {
  const [selectedProviders, setSelectedProviders] = useState<LLMProvider[]>(['chatgpt', 'claude']);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<LLMCheckResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Multi-run state
  const [runCount, setRunCount] = useState(1);
  const [currentRun, setCurrentRun] = useState(0);
  const [allRunResults, setAllRunResults] = useState<LLMCheckResult[][]>([]);
  const cancelledRef = useRef(false);

  const totalCredits = selectedProviders.reduce((sum, p) => sum + LLM_CREDIT_COSTS[p], 0);
  const displayCredits = totalCredits * runCount;

  // Reset state when question changes (modal might stay mounted)
  useEffect(() => {
    setResults(null);
    setError(null);
    setIsChecking(false);
    setRunCount(1);
    setCurrentRun(0);
    setAllRunResults([]);
    cancelledRef.current = false;
  }, [question]);

  const toggleProvider = useCallback((provider: LLMProvider) => {
    setSelectedProviders(prev => {
      if (prev.includes(provider)) {
        // Don't allow deselecting the last provider
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== provider);
      }
      return [...prev, provider];
    });
  }, []);

  const handleCheck = async () => {
    if (selectedProviders.length === 0) return;

    // If parent wants to handle the check (background mode), delegate
    if (onStartCheck) {
      onStartCheck(keywordId, question, selectedProviders, runCount);
      return;
    }

    console.log('[CheckLLMModal] Starting check for question:', question.substring(0, 50));
    console.log('[CheckLLMModal] Selected providers:', selectedProviders, 'runCount:', runCount);

    setIsChecking(true);
    setError(null);
    setResults(null);
    setAllRunResults([]);
    setCurrentRun(0);
    cancelledRef.current = false;

    if (runCount === 1) {
      // Single run - keep original behavior
      try {
        const response = await apiClient.post<{
          success: boolean;
          checksPerformed: number;
          results?: LLMCheckResult[];
          errors?: string[];
        }>('/llm-visibility/check', {
          keywordId,
          providers: selectedProviders,
          questions: [question],
        });

        if (response.success && response.results && response.results.length > 0) {
          setResults(response.results);
          onCheckComplete?.();
        } else if (response.errors && response.errors.length > 0) {
          setError(response.errors.join(', '));
        } else {
          setError('Check failed - no results returned');
        }
      } catch (err: any) {
        if (err?.status === 402 || err?.error === 'Insufficient credits') {
          setError(`Insufficient credits. Need ${err.required || totalCredits}, have ${err.available || 0}`);
        } else {
          setError(err?.message || err?.error || 'Failed to check visibility');
        }
      } finally {
        setIsChecking(false);
      }
    } else {
      // Multi-run mode
      const collected: LLMCheckResult[][] = [];

      for (let i = 0; i < runCount; i++) {
        if (cancelledRef.current) break;

        setCurrentRun(i + 1);

        try {
          const response = await apiClient.post<{
            success: boolean;
            checksPerformed: number;
            results?: LLMCheckResult[];
            errors?: string[];
          }>('/llm-visibility/check', {
            keywordId,
            providers: selectedProviders,
            questions: [question],
          });

          if (response.success && response.results && response.results.length > 0) {
            collected.push(response.results);
            setAllRunResults([...collected]);
          } else if (response.errors && response.errors.length > 0) {
            // Run failed but continue with remaining runs
            console.warn(`[CheckLLMModal] Run ${i + 1} error:`, response.errors);
          }
        } catch (err: any) {
          if (err?.status === 402 || err?.error === 'Insufficient credits') {
            setError(`Insufficient credits after ${collected.length} run${collected.length !== 1 ? 's' : ''}. Need more credits to continue.`);
            break;
          }
          console.error(`[CheckLLMModal] Run ${i + 1} failed:`, err);
        }

        // Delay between runs (not after the last one)
        if (i < runCount - 1 && !cancelledRef.current) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      if (collected.length > 0) {
        onCheckComplete?.();
      }
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    // Signal cancellation for multi-run
    cancelledRef.current = true;
    // Use startTransition to defer state updates and improve INP
    startTransition(() => {
      setResults(null);
      setError(null);
      setAllRunResults([]);
      setCurrentRun(0);
    });
    onClose();
  };

  // Determine what to show
  const hasMultiRunResults = allRunResults.length > 0;
  const hasSingleRunResults = results !== null && results.length > 0;
  const showResults = hasSingleRunResults || hasMultiRunResults;
  const isConfiguring = !isChecking && !showResults;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Icon name="FaSparkles" className="w-5 h-5 text-slate-blue" />
          <h3 className="text-lg font-semibold text-gray-900">Check AI visibility</h3>
        </div>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          &quot;{question}&quot;
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
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

              return (
                <button
                  key={provider}
                  onClick={() => toggleProvider(provider)}
                  disabled={isChecking || showResults}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  } ${(isChecking || showResults) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span>{LLM_PROVIDER_LABELS[provider]}</span>
                  <span className="text-xs opacity-70">{cost} cr</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Run count selector */}
        {isConfiguring && (
          <>
            <RunCountSelector
              value={runCount}
              onChange={setRunCount}
              disabled={isChecking}
            />
            {runCount > 1 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Icon name="FaClock" className="w-3 h-3" />
                <span>~{Math.ceil((runCount * 14) / 60)} min for {runCount} runs</span>
              </div>
            )}
          </>
        )}

        {/* Checking progress indicator */}
        {isChecking && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Icon name="FaSpinner" className="w-6 h-6 text-slate-blue animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-blue">
                  {runCount > 1
                    ? `Run ${currentRun} of ${runCount} — querying ${selectedProviders.length} AI${selectedProviders.length > 1 ? 's' : ''}...`
                    : `Querying ${selectedProviders.length} AI${selectedProviders.length > 1 ? 's' : ''}...`}
                </p>
                <p className="text-xs text-slate-blue mt-0.5">
                  {runCount > 1
                    ? 'Results accumulate as each run completes. You can close this window.'
                    : 'This typically takes 1-3 minutes. You can close this window.'}
                </p>
              </div>
            </div>
            {/* Multi-run progress bar */}
            {runCount > 1 && (
              <div className="mt-3">
                <div className="w-full bg-blue-200 rounded-full h-1.5">
                  <div
                    className="bg-slate-blue h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(allRunResults.length / runCount) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-blue/70">
                    {allRunResults.length} of {runCount} runs complete
                  </p>
                  {(() => {
                    const remaining = runCount - allRunResults.length;
                    // ~14s per run (12s check + 2s delay)
                    const remainingSecs = remaining * 14;
                    const mins = Math.ceil(remainingSecs / 60);
                    return (
                      <p className="text-xs text-slate-blue/70">
                        ~{mins} min remaining
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Multi-run aggregated results */}
        {hasMultiRunResults && !hasSingleRunResults && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">
              Results ({allRunResults.length} of {runCount} runs)
            </div>

            {/* Per-provider consistency */}
            {(() => {
              const totalRuns = allRunResults.length;
              // Group results by provider
              const providerStats: Record<string, { cited: number; mentioned: number }> = {};

              for (const runResults of allRunResults) {
                for (const result of runResults) {
                  if (!providerStats[result.provider]) {
                    providerStats[result.provider] = { cited: 0, mentioned: 0 };
                  }
                  if (result.domainCited) providerStats[result.provider].cited++;
                  if (result.brandMentioned) providerStats[result.provider].mentioned++;
                }
              }

              return Object.entries(providerStats).map(([provider, stats]) => {
                const colors = LLM_PROVIDER_COLORS[provider as LLMProvider];
                const citedPct = Math.round((stats.cited / totalRuns) * 100);
                const mentionedPct = Math.round((stats.mentioned / totalRuns) * 100);
                const hasSomeVisibility = stats.cited > 0 || stats.mentioned > 0;

                return (
                  <div
                    key={provider}
                    className={`p-3 rounded-lg border ${
                      hasSomeVisibility ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {LLM_PROVIDER_LABELS[provider as LLMProvider]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Icon name="FaLink" className={`w-3 h-3 ${stats.cited > 0 ? 'text-green-600' : 'text-gray-500'}`} />
                        <span className={stats.cited > 0 ? 'text-green-700 font-medium' : 'text-gray-500'}>
                          Cited: {stats.cited}/{totalRuns} ({citedPct}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="FaCheckCircle" className={`w-3 h-3 ${stats.mentioned > 0 ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={stats.mentioned > 0 ? 'text-blue-700 font-medium' : 'text-gray-500'}>
                          Mentioned: {stats.mentioned}/{totalRuns} ({mentionedPct}%)
                        </span>
                      </div>
                    </div>
                    {/* Mini progress bar for cited rate */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${
                          citedPct >= 50 ? 'bg-green-500' : citedPct > 0 ? 'bg-amber-400' : 'bg-gray-300'
                        }`}
                        style={{ width: `${citedPct}%` }}
                      />
                    </div>
                  </div>
                );
              });
            })()}

            {/* Overall summary */}
            {!isChecking && (() => {
              const totalRuns = allRunResults.length;
              const allResults = allRunResults.flat();
              const citedCount = allResults.filter(r => r.domainCited).length;
              const mentionedCount = allResults.filter(r => r.brandMentioned).length;
              const totalChecks = allResults.length;
              const hasVisibility = citedCount > 0 || mentionedCount > 0;

              return (
                <div className={`p-3 rounded-lg ${
                  hasVisibility ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Icon
                      name={hasVisibility ? "FaCheckCircle" : "FaInfoCircle"}
                      className={`w-4 h-4 ${hasVisibility ? 'text-green-600' : 'text-amber-600'}`}
                    />
                    <span className={`text-sm font-medium ${hasVisibility ? 'text-green-800' : 'text-amber-800'}`}>
                      {hasVisibility
                        ? `Cited in ${citedCount} of ${totalChecks} checks across ${totalRuns} runs`
                        : businessName
                          ? `"${businessName}" was not found in any of ${totalRuns} runs`
                          : `Not found in any of ${totalRuns} runs`}
                    </span>
                  </div>
                  {hasVisibility && (
                    <p className="text-xs text-gray-600 ml-6 mt-1">
                      {citedCount > 0 && `${citedCount}/${totalChecks} cited`}
                      {citedCount > 0 && mentionedCount > 0 && ' · '}
                      {mentionedCount > 0 && `${mentionedCount}/${totalChecks} mentioned`}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Single-run results (original display) */}
        {hasSingleRunResults && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Results</div>
            {results!.map((result, idx) => {
              const colors = LLM_PROVIDER_COLORS[result.provider];
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    result.domainCited || result.brandMentioned
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {LLM_PROVIDER_LABELS[result.provider]}
                    </span>
                    <div className="flex items-center gap-2">
                      {result.domainCited ? (
                        <span className="text-green-600 font-medium text-xs flex items-center gap-1" title="Website cited as source">
                          <Icon name="FaLink" className="w-3 h-3" />
                          Cited{result.citationPosition ? ` #${result.citationPosition}` : ''}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Not cited</span>
                      )}
                      {result.brandMentioned ? (
                        <span className="text-blue-600 font-medium text-xs flex items-center gap-1" title="Brand name mentioned in response">
                          <Icon name="FaCheckCircle" className="w-3 h-3" />
                          Mentioned
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs" title={businessName ? `${businessName} was not mentioned` : 'Business not mentioned'}>
                          Not mentioned
                        </span>
                      )}
                    </div>
                  </div>
                  {result.citationUrl && (
                    <p className="text-xs text-gray-500 mt-1.5 truncate">
                      {result.citationUrl}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            {(() => {
              const citedCount = results!.filter(r => r.domainCited).length;
              const mentionedCount = results!.filter(r => r.brandMentioned).length;
              const hasVisibility = citedCount > 0 || mentionedCount > 0;
              return (
                <div className={`p-3 rounded-lg ${
                  hasVisibility ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Icon
                        name={hasVisibility ? "FaCheckCircle" : "FaInfoCircle"}
                        className={`w-4 h-4 ${hasVisibility ? 'text-green-600' : 'text-amber-600'}`}
                      />
                      <span className={`text-sm font-medium ${hasVisibility ? 'text-green-800' : 'text-amber-800'}`}>
                        {hasVisibility
                          ? `Found in ${Math.max(citedCount, mentionedCount)} of ${results!.length} AI${results!.length > 1 ? 's' : ''}`
                          : businessName
                            ? `"${businessName}" was not found in any AI response`
                            : 'Your business was not found in any AI response'}
                      </span>
                    </div>
                    {hasVisibility && (
                      <p className="text-xs text-gray-600 ml-6">
                        {citedCount > 0 && `${citedCount} cited your website`}
                        {citedCount > 0 && mentionedCount > 0 && ' • '}
                        {mentionedCount > 0 && `${mentionedCount} mentioned your brand`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
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
      <Modal.Footer className="mt-6 border-t border-gray-100 pt-4 -mx-6 px-6 -mb-6 pb-6 bg-gray-50 rounded-b-2xl flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {!showResults && `${displayCredits} credit${displayCredits !== 1 ? 's' : ''}`}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            {showResults && !isChecking ? 'Done' : 'Cancel'}
          </button>
          {!showResults && !isChecking && (
            <button
              onClick={handleCheck}
              disabled={selectedProviders.length === 0 || isChecking}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Icon name="FaSparkles" className="w-4 h-4" />
              Check now
            </button>
          )}
          {isChecking && (
            <button
              onClick={handleCheck}
              disabled
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg opacity-50 cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
              {runCount > 1
                ? `Run ${currentRun}/${runCount}...`
                : `Checking ${selectedProviders.length} AI${selectedProviders.length > 1 ? 's' : ''}...`}
            </button>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
}
