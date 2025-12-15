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
      const keywordsData = await apiClient.get('/keywords?hasQuestions=true') as { keywords?: Array<{ id: string; phrase: string; related_questions?: string[] }> };
      const keywordsWithQuestions: KeywordWithQuestions[] = (keywordsData.keywords || [])
        .filter((k) => k.related_questions && k.related_questions.length > 0)
        .map((k) => ({
          id: k.id,
          phrase: k.phrase,
          relatedQuestions: k.related_questions || [],
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

  // Run check for a keyword
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

  // Calculate credit cost for a keyword
  const getKeywordCreditCost = (questionCount: number) => {
    return questionCount * selectedProviders.reduce((sum, p) => sum + LLM_CREDIT_COSTS[p], 0);
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
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-sm font-medium text-gray-700">Check visibility on:</div>
                <div className="flex flex-wrap gap-2">
                  {LLM_PROVIDERS.map((provider) => {
                    const isSelected = selectedProviders.includes(provider);
                    const colors = LLM_PROVIDER_COLORS[provider];
                    return (
                      <button
                        key={provider}
                        onClick={() => toggleProvider(provider)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? `${colors.bg} ${colors.text} ${colors.border} border`
                            : 'bg-white text-gray-500 border border-gray-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {LLM_PROVIDER_LABELS[provider]}
                        <span className="ml-1 opacity-60">({LLM_CREDIT_COSTS[provider]})</span>
                      </button>
                    );
                  })}
                </div>
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
                  creditCost={getKeywordCreditCost(keyword.relatedQuestions.length)}
                  onRunCheck={() => handleRunCheck(keyword.id, keyword.relatedQuestions)}
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
  creditCost,
  onRunCheck,
}: {
  keyword: KeywordWithQuestions;
  selectedProviders: LLMProvider[];
  isChecking: boolean;
  creditCost: number;
  onRunCheck: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = keyword.summary;

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
              {keyword.relatedQuestions.length} questions
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

        <button
          onClick={onRunCheck}
          disabled={isChecking || selectedProviders.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isChecking
              ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
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
              Check ({creditCost})
            </>
          )}
        </button>
      </div>

      {/* Expanded Questions */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Related questions
          </div>
          <div className="space-y-2">
            {keyword.relatedQuestions.map((question, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <Icon name="FaQuestionCircle" className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{question}</span>
              </div>
            ))}
          </div>
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
