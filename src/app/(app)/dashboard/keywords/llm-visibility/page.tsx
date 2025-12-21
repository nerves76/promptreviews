'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PageCard from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
  LLM_CREDIT_COSTS,
  LLMVisibilitySummary,
  LLMVisibilityCheck,
} from '@/features/llm-visibility/utils/types';

interface KeywordWithQuestions {
  id: string;
  phrase: string;
  relatedQuestions: string[];
  summary?: LLMVisibilitySummary | null;
}

interface AccountSummary {
  totalKeywords: number;
  keywordsWithQuestions: number;
  totalQuestions: number;
  averageVisibility: number | null;
  providerStats: Record<string, { checked: number; cited: number }>;
}

/**
 * LLM Visibility Dashboard Page
 *
 * Shows account-wide LLM visibility tracking for keywords with related questions.
 */
export default function LLMVisibilityPage() {
  const pathname = usePathname();
  const [keywords, setKeywords] = useState<KeywordWithQuestions[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<LLMProvider[]>(['chatgpt']);
  const [error, setError] = useState<string | null>(null);

  // Fetch keywords with related questions
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch keywords with related questions
      // relatedQuestions can be either string[] or array of {question, funnelStage, addedAt} objects
      const keywordsData = await apiClient.get('/keywords') as {
        keywords?: Array<{
          id: string;
          phrase: string;
          relatedQuestions?: Array<string | { question: string; funnelStage?: string; addedAt?: string }>;
        }>
      };
      const keywordsWithQuestions: KeywordWithQuestions[] = (keywordsData.keywords || [])
        .filter((k) => k.relatedQuestions && k.relatedQuestions.length > 0)
        .map((k) => ({
          id: k.id,
          phrase: k.phrase,
          // Extract question text if it's an object, otherwise use the string directly
          relatedQuestions: (k.relatedQuestions || []).map(q =>
            typeof q === 'string' ? q : q.question
          ),
          summary: null,
        }));

      // Fetch summaries for each keyword
      const summariesPromises = keywordsWithQuestions.map(async (kw) => {
        try {
          const summaryData = await apiClient.get(`/llm-visibility/summary?keywordId=${kw.id}`) as { summary?: LLMVisibilitySummary | null };
          return { ...kw, summary: summaryData.summary || null };
        } catch {
          return kw;
        }
      });

      const keywordsWithSummaries = await Promise.all(summariesPromises);
      setKeywords(keywordsWithSummaries);

      // Calculate account summary
      const totalKeywords = keywordsWithSummaries.length;
      const totalQuestions = keywordsWithSummaries.reduce(
        (sum, kw) => sum + kw.relatedQuestions.length,
        0
      );
      const keywordsWithScores = keywordsWithSummaries.filter(
        (kw) => kw.summary?.visibilityScore !== undefined && kw.summary?.visibilityScore !== null
      );
      const averageVisibility =
        keywordsWithScores.length > 0
          ? keywordsWithScores.reduce((sum, kw) => sum + (kw.summary?.visibilityScore || 0), 0) /
            keywordsWithScores.length
          : null;

      // Aggregate provider stats
      const providerStats: Record<string, { checked: number; cited: number }> = {};
      for (const kw of keywordsWithSummaries) {
        if (kw.summary?.providerStats) {
          for (const [provider, stats] of Object.entries(kw.summary.providerStats as Record<string, any>)) {
            if (!providerStats[provider]) {
              providerStats[provider] = { checked: 0, cited: 0 };
            }
            providerStats[provider].checked += stats.questionsChecked || 0;
            providerStats[provider].cited += stats.questionsCited || 0;
          }
        }
      }

      setAccountSummary({
        totalKeywords,
        keywordsWithQuestions: totalKeywords,
        totalQuestions,
        averageVisibility,
        providerStats,
      });
    } catch (err) {
      console.error('[LLMVisibility] Error fetching data:', err);
      setError('Failed to load keywords');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle provider selection
  const toggleProvider = (provider: LLMProvider) => {
    setSelectedProviders((prev) => {
      if (prev.includes(provider)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== provider);
      }
      return [...prev, provider];
    });
  };

  // Track which question is being checked
  const [checkingQuestion, setCheckingQuestion] = useState<string | null>(null);

  // Run check for all questions of a keyword
  const handleRunCheck = async (keywordId: string, questions: string[]) => {
    setIsChecking(keywordId);
    setError(null);
    try {
      await apiClient.post('/llm-visibility/check', {
        keywordId,
        providers: selectedProviders,
      });
      // Refresh data after check
      await fetchData();
    } catch (err: any) {
      if (err?.status === 402) {
        setError(`Insufficient credits. Need ${err.required || 'more'}, have ${err.available || 0}`);
      } else {
        setError('Failed to run check');
      }
    } finally {
      setIsChecking(null);
    }
  };

  // Run check for a single question
  const handleCheckSingleQuestion = async (keywordId: string, question: string) => {
    const questionKey = `${keywordId}-${question}`;
    setCheckingQuestion(questionKey);
    setError(null);
    try {
      await apiClient.post('/llm-visibility/check', {
        keywordId,
        providers: selectedProviders,
        questions: [question],
      });
      // Refresh data after check
      await fetchData();
    } catch (err: any) {
      if (err?.status === 402) {
        setError(`Insufficient credits. Need ${err.required || 'more'}, have ${err.available || 0}`);
      } else {
        setError('Failed to run check');
      }
    } finally {
      setCheckingQuestion(null);
    }
  };

  // Calculate credit cost
  const getCreditCostPerQuestion = () => {
    return selectedProviders.reduce((sum, p) => sum + LLM_CREDIT_COSTS[p], 0);
  };

  const getKeywordCreditCost = (questionCount: number) => {
    return questionCount * getCreditCostPerQuestion();
  };

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">Keyword Concepts</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center w-full mt-0 mb-0 z-20 px-4">
        <div className="flex bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-1 shadow-lg gap-0">
          <Link
            href="/dashboard/keywords"
            className="px-6 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2 bg-transparent text-white hover:bg-white/10"
          >
            <Icon name="FaKey" className="w-[18px] h-[18px]" size={18} />
            Library
          </Link>
          <Link
            href="/dashboard/keywords/research"
            className="px-6 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2 bg-transparent text-white hover:bg-white/10"
          >
            <Icon name="FaSearch" className="w-[18px] h-[18px]" size={18} />
            Research
          </Link>
          <Link
            href="/dashboard/keywords/rank-tracking"
            className="px-6 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2 bg-transparent text-white hover:bg-white/10"
          >
            <Icon name="FaChartLine" className="w-[18px] h-[18px]" size={18} />
            Rank Tracking
          </Link>
          <Link
            href="/dashboard/keywords/llm-visibility"
            className={`px-6 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2 ${
              pathname.startsWith('/dashboard/keywords/llm-visibility')
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'
            }`}
          >
            <Icon name="FaSparkles" className="w-[18px] h-[18px]" size={18} />
            LLM Visibility
          </Link>
        </div>
      </div>

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaSparkles" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 w-full gap-2">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-slate-blue mb-2">LLM Visibility</h2>
            <p className="text-gray-600 text-base max-w-md">
              Track whether AI assistants cite your domain when answering questions related to your
              keywords.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
          </div>
        ) : keywords.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Account Summary */}
            {accountSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                  <div className="text-2xl font-bold text-purple-700">
                    {accountSummary.averageVisibility !== null
                      ? `${accountSummary.averageVisibility.toFixed(0)}%`
                      : '--'}
                  </div>
                  <div className="text-sm text-gray-600">Avg visibility</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-2xl font-bold text-gray-800">
                    {accountSummary.keywordsWithQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Keywords tracked</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-2xl font-bold text-gray-800">
                    {accountSummary.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Total questions</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex gap-2 flex-wrap">
                    {LLM_PROVIDERS.map((provider) => {
                      const stats = accountSummary.providerStats[provider];
                      const colors = LLM_PROVIDER_COLORS[provider];
                      return (
                        <span
                          key={provider}
                          className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                          title={`${stats?.cited || 0}/${stats?.checked || 0} cited`}
                        >
                          {provider.charAt(0).toUpperCase()}
                          {stats ? ` ${stats.cited}/${stats.checked}` : ''}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">By provider</div>
                </div>
              </div>
            )}

            {/* Provider Selector */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex flex-col gap-3">
                <div className="text-sm font-medium text-gray-700">Select AI providers to check:</div>
                <div className="flex flex-wrap gap-4">
                  {LLM_PROVIDERS.map((provider) => {
                    const isSelected = selectedProviders.includes(provider);
                    const colors = LLM_PROVIDER_COLORS[provider];
                    return (
                      <label
                        key={provider}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        {/* Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isSelected}
                          onClick={() => toggleProvider(provider)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                            isSelected ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              isSelected ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>
                            {LLM_PROVIDER_LABELS[provider]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {LLM_CREDIT_COSTS[provider]} credit{LLM_CREDIT_COSTS[provider] !== 1 ? 's' : ''} per question
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {selectedProviders.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Cost per question: {selectedProviders.reduce((sum, p) => sum + LLM_CREDIT_COSTS[p], 0)} credit{selectedProviders.reduce((sum, p) => sum + LLM_CREDIT_COSTS[p], 0) !== 1 ? 's' : ''}
                    ({selectedProviders.map(p => LLM_PROVIDER_LABELS[p]).join(' + ')})
                  </div>
                )}
              </div>
            </div>

            {/* Keywords List */}
            <div className="space-y-4">
              {keywords.map((keyword) => (
                <KeywordVisibilityCard
                  key={keyword.id}
                  keyword={keyword}
                  selectedProviders={selectedProviders}
                  isChecking={isChecking === keyword.id}
                  checkingQuestion={checkingQuestion}
                  creditCostPerQuestion={getCreditCostPerQuestion()}
                  totalCreditCost={getKeywordCreditCost(keyword.relatedQuestions.length)}
                  onRunCheck={() => handleRunCheck(keyword.id, keyword.relatedQuestions)}
                  onCheckQuestion={(question) => handleCheckSingleQuestion(keyword.id, question)}
                />
              ))}
            </div>
          </>
        )}
      </PageCard>
    </div>
  );
}

// ============================================
// Keyword Visibility Card Component
// ============================================

function KeywordVisibilityCard({
  keyword,
  selectedProviders,
  isChecking,
  checkingQuestion,
  creditCostPerQuestion,
  totalCreditCost,
  onRunCheck,
  onCheckQuestion,
}: {
  keyword: KeywordWithQuestions;
  selectedProviders: LLMProvider[];
  isChecking: boolean;
  checkingQuestion: string | null;
  creditCostPerQuestion: number;
  totalCreditCost: number;
  onRunCheck: () => void;
  onCheckQuestion: (question: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<LLMVisibilityCheck[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const summary = keyword.summary;
  const questionCount = keyword.relatedQuestions.length;
  const providerCount = selectedProviders.length;

  // Fetch results when expanded
  useEffect(() => {
    if (isExpanded && results.length === 0) {
      fetchResults();
    }
  }, [isExpanded]);

  // Refresh results after a check completes
  useEffect(() => {
    if (!isChecking && !checkingQuestion && isExpanded) {
      fetchResults();
    }
  }, [isChecking, checkingQuestion]);

  const fetchResults = async () => {
    setIsLoadingResults(true);
    try {
      const data = await apiClient.get<{ results: LLMVisibilityCheck[] }>(
        `/llm-visibility/results?keywordId=${keyword.id}&limit=100`
      );
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Group results by question
  const getQuestionResults = (question: string): Map<LLMProvider, LLMVisibilityCheck | null> => {
    const questionResults = new Map<LLMProvider, LLMVisibilityCheck | null>();
    // Initialize all providers as null
    LLM_PROVIDERS.forEach(p => questionResults.set(p, null));

    // Find the most recent result for each provider for this question
    for (const result of results) {
      if (result.question === question) {
        const existing = questionResults.get(result.llmProvider);
        if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
          questionResults.set(result.llmProvider, result);
        }
      }
    }
    return questionResults;
  };

  // Get last checked time for a question
  const getLastChecked = (question: string): string | null => {
    const questionResults = results.filter(r => r.question === question);
    if (questionResults.length === 0) return null;
    const latest = questionResults.reduce((a, b) =>
      new Date(a.checkedAt) > new Date(b.checkedAt) ? a : b
    );
    return latest.checkedAt;
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 min-w-0"
            >
              <Icon
                name={isExpanded ? 'FaChevronDown' : 'FaChevronRight'}
                className="w-3 h-3 text-gray-400 flex-shrink-0"
              />
              <span className="font-semibold text-gray-900 truncate">{keyword.phrase}</span>
            </button>
            <span className="text-sm text-gray-500 flex-shrink-0">
              {questionCount} question{questionCount !== 1 ? 's' : ''}
            </span>
          </div>
          {summary && (
            <div className="flex items-center gap-4 mt-2 ml-5">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-purple-600">
                  {summary.visibilityScore?.toFixed(0) ?? '--'}%
                </span>
                <span className="text-xs text-gray-500">visibility</span>
              </div>
              <div className="flex gap-1">
                {LLM_PROVIDERS.map((provider) => {
                  const stats = summary.providerStats?.[provider] as
                    | { questionsChecked: number; questionsCited: number }
                    | undefined;
                  const colors = LLM_PROVIDER_COLORS[provider];

                  if (!stats || stats.questionsChecked === 0) {
                    return (
                      <span
                        key={provider}
                        className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-400"
                        title="Not checked"
                      >
                        {provider.charAt(0).toUpperCase()}
                      </span>
                    );
                  }

                  return (
                    <span
                      key={provider}
                      className={`px-1.5 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}
                      title={`${stats.questionsCited}/${stats.questionsChecked} cited`}
                    >
                      {provider.charAt(0).toUpperCase()} {stats.questionsCited}/{stats.questionsChecked}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            onClick={onRunCheck}
            disabled={isChecking || selectedProviders.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isChecking
                ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                : selectedProviders.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                Check all ({totalCreditCost} credits)
              </>
            )}
          </button>
          {selectedProviders.length > 0 && !isChecking && (
            <span className="text-xs text-gray-400">
              {questionCount} × {providerCount} provider{providerCount !== 1 ? 's' : ''} × {creditCostPerQuestion / providerCount} credit{creditCostPerQuestion / providerCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Questions */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Related questions
            </div>
            {selectedProviders.length > 0 && (
              <div className="text-xs text-gray-400">
                {creditCostPerQuestion} credit{creditCostPerQuestion !== 1 ? 's' : ''} per question
              </div>
            )}
          </div>

          {isLoadingResults && results.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin inline mr-2" />
              Loading results...
            </div>
          ) : (
            <div className="space-y-3">
              {keyword.relatedQuestions.map((question, idx) => {
                const questionKey = `${keyword.id}-${question}`;
                const isCheckingThis = checkingQuestion === questionKey;
                const questionResults = getQuestionResults(question);
                const lastChecked = getLastChecked(question);
                const hasResults = Array.from(questionResults.values()).some(r => r !== null);
                const isQuestionExpanded = expandedQuestion === question;

                return (
                  <div key={idx} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    {/* Question row */}
                    <div className="flex items-center justify-between gap-3 py-3 px-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 text-sm">
                          <Icon name="FaQuestionCircle" className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{question}</span>
                        </div>

                        {/* Provider results badges */}
                        {hasResults && (
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            {LLM_PROVIDERS.map((provider) => {
                              const result = questionResults.get(provider);
                              const colors = LLM_PROVIDER_COLORS[provider];

                              if (!result) {
                                return (
                                  <span
                                    key={provider}
                                    className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-400"
                                    title="Not checked"
                                  >
                                    {LLM_PROVIDER_LABELS[provider].charAt(0)}
                                  </span>
                                );
                              }

                              return (
                                <span
                                  key={provider}
                                  className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${
                                    result.domainCited
                                      ? `${colors.bg} ${colors.text}`
                                      : 'bg-red-50 text-red-600'
                                  }`}
                                  title={
                                    result.domainCited
                                      ? `Cited at position ${result.citationPosition} of ${result.totalCitations}`
                                      : 'Not cited'
                                  }
                                >
                                  {result.domainCited ? (
                                    <>
                                      <Icon name="FaCheck" className="w-2.5 h-2.5" />
                                      {LLM_PROVIDER_LABELS[provider].charAt(0)}
                                      {result.citationPosition && (
                                        <span className="opacity-70">#{result.citationPosition}</span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <Icon name="FaTimes" className="w-2.5 h-2.5" />
                                      {LLM_PROVIDER_LABELS[provider].charAt(0)}
                                    </>
                                  )}
                                </span>
                              );
                            })}
                            {lastChecked && (
                              <span className="text-xs text-gray-400 ml-2">
                                {formatRelativeTime(lastChecked)}
                              </span>
                            )}
                            {hasResults && (
                              <button
                                onClick={() => setExpandedQuestion(isQuestionExpanded ? null : question)}
                                className="text-xs text-purple-600 hover:text-purple-700 ml-2"
                              >
                                {isQuestionExpanded ? 'Hide details' : 'View details'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onCheckQuestion(question)}
                        disabled={isCheckingThis || isChecking || selectedProviders.length === 0}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                          isCheckingThis
                            ? 'bg-purple-100 text-purple-400'
                            : selectedProviders.length === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        {isCheckingThis ? (
                          <>
                            <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <Icon name="FaSearch" className="w-3 h-3" />
                            Check ({creditCostPerQuestion})
                          </>
                        )}
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isQuestionExpanded && hasResults && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                        {LLM_PROVIDERS.map((provider) => {
                          const result = questionResults.get(provider);
                          if (!result) return null;

                          const colors = LLM_PROVIDER_COLORS[provider];

                          return (
                            <div key={provider} className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`font-medium text-sm ${colors.text}`}>
                                  {LLM_PROVIDER_LABELS[provider]}
                                </span>
                                <span className={`text-xs ${colors.text}`}>
                                  {result.domainCited ? (
                                    <>Cited #{result.citationPosition} of {result.totalCitations}</>
                                  ) : (
                                    <>Not cited ({result.totalCitations} total citations)</>
                                  )}
                                </span>
                              </div>
                              {result.responseSnippet && (
                                <div className="text-sm text-gray-700 bg-white/60 rounded p-2 mt-2">
                                  <div className="text-xs text-gray-500 mb-1">Response snippet:</div>
                                  <p className="line-clamp-4">{result.responseSnippet}</p>
                                </div>
                              )}
                              {result.citationUrl && (
                                <div className="text-xs text-gray-600 mt-2">
                                  <span className="text-gray-500">Cited URL:</span>{' '}
                                  <a
                                    href={result.citationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:underline"
                                  >
                                    {result.citationUrl}
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
        <Icon name="FaSparkles" className="w-8 h-8 text-purple-600" size={32} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No keywords with questions yet</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Add related questions to your keywords to start tracking LLM visibility. Questions are how
        people ask AI assistants about your services.
      </p>
      <Link
        href="/dashboard/keywords"
        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
      >
        <Icon name="FaKey" className="w-5 h-5" />
        Go to Keyword Library
      </Link>

      {/* Feature highlights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <Icon name="FaSparkles" className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">AI visibility</h4>
          <p className="text-sm text-gray-600">
            See if ChatGPT, Claude, Gemini, and Perplexity cite your domain.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Icon name="FaQuestionCircle" className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Question-based</h4>
          <p className="text-sm text-gray-600">
            Track real questions people ask AI about your services.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <Icon name="FaClock" className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Scheduled checks</h4>
          <p className="text-sm text-gray-600">
            Automate checks daily, weekly, or monthly to track trends.
          </p>
        </div>
      </div>
    </div>
  );
}
