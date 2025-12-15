'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
  LLM_CREDIT_COSTS,
  LLMVisibilityCheck,
} from '../utils/types';
import { useLLMVisibility } from '../hooks/useLLMVisibility';

interface LLMVisibilitySectionProps {
  keywordId: string;
  questions: string[];
  /** Callback when credit balance changes */
  onBalanceChange?: (balance: { totalCredits: number }) => void;
}

/**
 * LLM Visibility Section Component
 *
 * Displays LLM visibility status for a keyword's related questions.
 * Shows which AI assistants cite the user's domain when asked these questions.
 */
export function LLMVisibilitySection({
  keywordId,
  questions,
  onBalanceChange,
}: LLMVisibilitySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<LLMProvider[]>(['chatgpt']);

  const {
    summary,
    results,
    isLoading,
    isChecking,
    error,
    questionVisibility,
    fetchSummary,
    fetchResults,
    runCheck,
  } = useLLMVisibility({ keywordId });

  // Fetch data when expanded
  useEffect(() => {
    if (isExpanded && keywordId) {
      fetchSummary();
      fetchResults();
    }
  }, [isExpanded, keywordId, fetchSummary, fetchResults]);

  // Calculate credit cost
  const creditCost = questions.length * selectedProviders.reduce(
    (sum, p) => sum + LLM_CREDIT_COSTS[p],
    0
  );

  // Handle check
  const handleRunCheck = async () => {
    const response = await runCheck(selectedProviders);
    if (response?.balance && onBalanceChange) {
      onBalanceChange({ totalCredits: response.balance.totalCredits });
    }
  };

  // Toggle provider selection
  const toggleProvider = (provider: LLMProvider) => {
    setSelectedProviders(prev => {
      if (prev.includes(provider)) {
        // Don't allow deselecting all providers
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== provider);
      }
      return [...prev, provider];
    });
  };

  // Build question visibility map from results
  const questionResultsMap = new Map<string, Map<LLMProvider, LLMVisibilityCheck>>();
  for (const result of results) {
    if (!questionResultsMap.has(result.question)) {
      questionResultsMap.set(result.question, new Map());
    }
    const providerMap = questionResultsMap.get(result.question)!;
    // Keep most recent result per provider
    const existing = providerMap.get(result.llmProvider);
    if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
      providerMap.set(result.llmProvider, result);
    }
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-purple-100/50 rounded-xl">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Icon name="FaSparkles" className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-medium uppercase tracking-wider text-purple-600">
            LLM visibility
          </span>
        </div>
        <div className="flex items-center gap-2">
          {summary && (
            <span className="text-sm font-semibold text-purple-700">
              {summary.visibilityScore?.toFixed(0) ?? '--'}%
            </span>
          )}
          <Icon
            name={isExpanded ? 'FaChevronUp' : 'FaChevronDown'}
            className="w-3 h-3 text-purple-400"
          />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/60 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">
                  {summary.visibilityScore?.toFixed(0) ?? '--'}%
                </div>
                <div className="text-xs text-gray-500">Visibility score</div>
              </div>
              <div className="bg-white/60 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-gray-700">
                  {summary.questionsWithCitation}/{summary.totalQuestions}
                </div>
                <div className="text-xs text-gray-500">Questions cited</div>
              </div>
            </div>
          )}

          {/* Provider Selector */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Check visibility on:</div>
            <div className="flex flex-wrap gap-1">
              {LLM_PROVIDERS.map(provider => {
                const isSelected = selectedProviders.includes(provider);
                const colors = LLM_PROVIDER_COLORS[provider];
                return (
                  <button
                    key={provider}
                    onClick={() => toggleProvider(provider)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? `${colors.bg} ${colors.text} ${colors.border} border`
                        : 'bg-gray-100 text-gray-500 border border-gray-200 opacity-50'
                    }`}
                  >
                    {LLM_PROVIDER_LABELS[provider]}
                    <span className="ml-1 opacity-60">({LLM_CREDIT_COSTS[provider]})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Run Check Button */}
          <button
            onClick={handleRunCheck}
            disabled={isChecking || selectedProviders.length === 0}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              isChecking
                ? 'bg-purple-200 text-purple-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isChecking ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Icon name="FaSearch" className="w-4 h-4" />
                Check visibility ({creditCost} credits)
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Question Results */}
          {questions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Results by question:</div>
              {questions.map((question, idx) => {
                const providerResults = questionResultsMap.get(question);
                return (
                  <QuestionRow
                    key={idx}
                    question={question}
                    providerResults={providerResults}
                  />
                );
              })}
            </div>
          )}

          {/* Last Checked */}
          {summary?.lastCheckedAt && (
            <div className="text-xs text-gray-400 text-center">
              Last checked: {new Date(summary.lastCheckedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual question row showing provider badges
 */
function QuestionRow({
  question,
  providerResults,
}: {
  question: string;
  providerResults?: Map<LLMProvider, LLMVisibilityCheck>;
}) {
  return (
    <div className="bg-white/60 p-2 rounded-lg">
      <div className="text-sm text-gray-700 mb-1.5 line-clamp-2">{question}</div>
      <div className="flex gap-1">
        {LLM_PROVIDERS.map(provider => {
          const result = providerResults?.get(provider);
          const colors = LLM_PROVIDER_COLORS[provider];

          let statusClass = 'bg-gray-100 text-gray-400'; // Not checked
          let icon = null;

          if (result) {
            if (result.domainCited) {
              statusClass = `${colors.bg} ${colors.text}`;
              icon = <Icon name="FaCheck" className="w-2 h-2 ml-0.5" />;
            } else {
              statusClass = 'bg-gray-200 text-gray-500';
            }
          }

          return (
            <span
              key={provider}
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${statusClass}`}
              title={
                result
                  ? result.domainCited
                    ? `Cited${result.citationPosition ? ` (#${result.citationPosition})` : ''}`
                    : 'Not cited'
                  : 'Not checked'
              }
            >
              {provider.charAt(0).toUpperCase()}
              {icon}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default LLMVisibilitySection;
