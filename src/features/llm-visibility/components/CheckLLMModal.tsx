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
}

export default function CheckLLMModal({
  question,
  keywordId,
  isOpen,
  onClose,
  onCheckComplete,
  businessName,
}: CheckLLMModalProps) {
  const [selectedProviders, setSelectedProviders] = useState<LLMProvider[]>(['chatgpt', 'claude']);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<LLMCheckResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCredits = selectedProviders.reduce((sum, p) => sum + LLM_CREDIT_COSTS[p], 0);

  // Reset state when question changes (modal might stay mounted)
  useEffect(() => {
    setResults(null);
    setError(null);
    setIsChecking(false);
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

    console.log('[CheckLLMModal] Starting check for question:', question.substring(0, 50));
    console.log('[CheckLLMModal] Selected providers:', selectedProviders);

    setIsChecking(true);
    setError(null);
    setResults(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        checksPerformed: number;
        results?: LLMCheckResult[];
        errors?: string[];
      }>('/llm-visibility/check', {
        keywordId,
        providers: selectedProviders,
        questions: [question], // Pass specific question as array
      });

      console.log('[CheckLLMModal] API Response:', {
        success: response.success,
        checksPerformed: response.checksPerformed,
        resultsCount: response.results?.length,
        hasErrors: response.errors?.length,
        rawResponse: response,
      });

      if (response.success && response.results && response.results.length > 0) {
        console.log('[CheckLLMModal] Setting results:', response.results);
        setResults(response.results);
        // Trigger refresh of enrichment data
        onCheckComplete?.();
      } else if (response.errors && response.errors.length > 0) {
        console.log('[CheckLLMModal] Setting error from response.errors:', response.errors);
        setError(response.errors.join(', '));
      } else {
        console.log('[CheckLLMModal] Fallback error - no results returned', {
          success: response.success,
          results: response.results,
        });
        setError('Check failed - no results returned');
      }
    } catch (err: any) {
      console.error('[CheckLLMModal] Caught error:', err);
      if (err?.status === 402 || err?.error === 'Insufficient credits') {
        setError(`Insufficient credits. Need ${err.required || totalCredits}, have ${err.available || 0}`);
      } else {
        setError(err?.message || err?.error || 'Failed to check visibility');
      }
    } finally {
      console.log('[CheckLLMModal] Setting isChecking to false');
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    setResults(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="FaSparkles" className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Check AI visibility</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 text-gray-500 hover:text-gray-600 rounded transition-colors"
            >
              <Icon name="FaTimes" className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            &quot;{question}&quot;
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
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
                    disabled={isChecking || results !== null}
                    className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? `${colors.bg} ${colors.text} ${colors.border}`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    } ${(isChecking || results !== null) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span>{LLM_PROVIDER_LABELS[provider]}</span>
                    <span className="text-xs opacity-70">{cost} cr</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checking progress indicator */}
          {isChecking && (
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Icon name="FaSpinner" className="w-6 h-6 text-purple-600 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Querying {selectedProviders.length} AI{selectedProviders.length > 1 ? 's' : ''}...
                  </p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    This typically takes {selectedProviders.length <= 2 ? '15-30' : '30-60'} seconds
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && results.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Results</div>
              {results.map((result, idx) => {
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
                const citedCount = results.filter(r => r.domainCited).length;
                const mentionedCount = results.filter(r => r.brandMentioned).length;
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
                            ? `Found in ${Math.max(citedCount, mentionedCount)} of ${results.length} AI${results.length > 1 ? 's' : ''}`
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
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {!results && `${totalCredits} credit${totalCredits !== 1 ? 's' : ''}`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {results ? 'Done' : 'Cancel'}
            </button>
            {!results && (
              <button
                onClick={handleCheck}
                disabled={selectedProviders.length === 0 || isChecking}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isChecking ? (
                  <>
                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                    Checking {selectedProviders.length} AI{selectedProviders.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Icon name="FaSparkles" className="w-4 h-4" />
                    Check now
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
