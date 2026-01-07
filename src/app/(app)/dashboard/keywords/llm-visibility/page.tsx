'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
  LLM_CREDIT_COSTS,
  LLMVisibilitySummary,
  LLMVisibilityCheck,
} from '@/features/llm-visibility/utils/types';
import { CheckLLMModal, LLMVisibilityTrendChart } from '@/features/llm-visibility/components';
import { KeywordDetailsSidebar } from '@/features/keywords/components/KeywordDetailsSidebar';
import { CheckRankModal } from '@/features/rank-tracking/components';
import { type KeywordData } from '@/features/keywords/keywordUtils';
import { useBusinessData } from '@/auth/hooks/granularAuthHooks';

interface KeywordWithQuestions {
  id: string;
  phrase: string;
  relatedQuestions: Array<{
    question: string;
    funnelStage?: 'top' | 'middle' | 'bottom';
  }>;
  summary?: LLMVisibilitySummary | null;
}

interface QuestionRow {
  question: string;
  funnelStage: 'top' | 'middle' | 'bottom';
  conceptId: string;
  conceptName: string;
  results: Map<LLMProvider, LLMVisibilityCheck | null>;
  lastCheckedAt: string | null;
}

interface AccountSummary {
  totalKeywords: number;
  keywordsWithQuestions: number;
  totalQuestions: number;
  averageVisibility: number | null;
  providerStats: Record<string, { checked: number; cited: number; mentioned: number }>;
}

// Sort options
type SortField = 'question' | 'concept' | 'funnel' | 'lastChecked';
type SortDirection = 'asc' | 'desc';

// Funnel stage label helper
const FUNNEL_LABELS: Record<string, string> = {
  top: 'Top',
  middle: 'Mid',
  bottom: 'Bot',
};

const FUNNEL_COLORS: Record<string, { bg: string; text: string }> = {
  top: { bg: 'bg-blue-100', text: 'text-blue-700' },
  middle: { bg: 'bg-amber-100', text: 'text-amber-700' },
  bottom: { bg: 'bg-green-100', text: 'text-green-700' },
};

/**
 * LLM Visibility Dashboard Page
 *
 * Shows account-wide LLM visibility tracking for keywords with related questions.
 * Displays all questions in a flat table with concept column.
 */
export default function LLMVisibilityPage() {
    // Track selected account to refetch when it changes
  const { selectedAccountId } = useAccountData();
  const { business } = useBusinessData();
  const [keywords, setKeywords] = useState<KeywordWithQuestions[]>([]);
  const [allResults, setAllResults] = useState<LLMVisibilityCheck[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProviders, setSelectedProviders] = useState<LLMProvider[]>(['chatgpt', 'claude']);
  const [error, setError] = useState<string | null>(null);

  // Modal state for checking a single question
  const [checkingModal, setCheckingModal] = useState<{ question: string; conceptId: string } | null>(null);

  // Sidebar state for editing concepts
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [isLoadingKeyword, setIsLoadingKeyword] = useState(false);

  // Check rank modal state
  const [checkingRank, setCheckingRank] = useState<{
    keyword: string;
    conceptId: string;
    locationCode?: number;
    locationName?: string;
  } | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('concept');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter state
  const [filterConcept, setFilterConcept] = useState<string | null>(null);
  const [filterFunnel, setFilterFunnel] = useState<string | null>(null);

  // Expanded row state (for showing details)
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Fetch keywords with related questions and all results
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch keywords with related questions
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
          relatedQuestions: (k.relatedQuestions || []).map(q => {
            if (typeof q === 'string') {
              return { question: q, funnelStage: 'top' as const };
            }
            return {
              question: q.question,
              funnelStage: (q.funnelStage as 'top' | 'middle' | 'bottom') || 'top'
            };
          }),
          summary: null,
        }));

      setKeywords(keywordsWithQuestions);

      // Fetch all LLM visibility results for all keywords in parallel
      const resultsPromises = keywordsWithQuestions.map(async (kw) => {
        try {
          const data = await apiClient.get<{ results: LLMVisibilityCheck[] }>(
            `/llm-visibility/results?keywordId=${kw.id}&limit=200`
          );
          return data.results || [];
        } catch {
          return [];
        }
      });

      const allResultsArrays = await Promise.all(resultsPromises);
      const flatResults = allResultsArrays.flat();
      setAllResults(flatResults);

      // Calculate account summary
      const totalKeywords = keywordsWithQuestions.length;
      const totalQuestions = keywordsWithQuestions.reduce(
        (sum, kw) => sum + kw.relatedQuestions.length,
        0
      );

      // Aggregate provider stats from results
      const providerStats: Record<string, { checked: number; cited: number; mentioned: number }> = {};

      // Group results by question+provider to get unique checks
      const uniqueChecks = new Map<string, LLMVisibilityCheck>();
      for (const result of flatResults) {
        const key = `${result.question}:${result.llmProvider}`;
        const existing = uniqueChecks.get(key);
        if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
          uniqueChecks.set(key, result);
        }
      }

      for (const result of uniqueChecks.values()) {
        if (!providerStats[result.llmProvider]) {
          providerStats[result.llmProvider] = { checked: 0, cited: 0, mentioned: 0 };
        }
        providerStats[result.llmProvider].checked++;
        if (result.domainCited) providerStats[result.llmProvider].cited++;
        if (result.brandMentioned) providerStats[result.llmProvider].mentioned++;
      }

      // Calculate average visibility
      const citedCount = Array.from(uniqueChecks.values()).filter(r => r.domainCited).length;
      const averageVisibility = uniqueChecks.size > 0
        ? (citedCount / uniqueChecks.size) * 100
        : null;

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

  // Clear data and refetch when account changes
  useEffect(() => {
    // Clear stale data immediately when account changes
    setKeywords([]);
    setAllResults([]);
    setAccountSummary(null);
    setError(null);

    if (selectedAccountId) {
      fetchData();
    }
  }, [selectedAccountId]); // Only depend on selectedAccountId to avoid infinite loops

  // Also fetch on mount
  useEffect(() => {
    if (selectedAccountId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Build flattened question rows with results
  const questionRows = useMemo((): QuestionRow[] => {
    const rows: QuestionRow[] = [];

    for (const kw of keywords) {
      for (const q of kw.relatedQuestions) {
        // Get results for this question
        const questionResults = new Map<LLMProvider, LLMVisibilityCheck | null>();
        LLM_PROVIDERS.forEach(p => questionResults.set(p, null));

        let lastCheckedAt: string | null = null;

        for (const result of allResults) {
          if (result.question === q.question) {
            const existing = questionResults.get(result.llmProvider);
            if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
              questionResults.set(result.llmProvider, result);
              if (!lastCheckedAt || new Date(result.checkedAt) > new Date(lastCheckedAt)) {
                lastCheckedAt = result.checkedAt;
              }
            }
          }
        }

        rows.push({
          question: q.question,
          funnelStage: q.funnelStage || 'top',
          conceptId: kw.id,
          conceptName: kw.phrase,
          results: questionResults,
          lastCheckedAt,
        });
      }
    }

    return rows;
  }, [keywords, allResults]);

  // Get unique concept names for filter
  const conceptOptions = useMemo(() => {
    return Array.from(new Set(keywords.map(k => k.phrase))).sort();
  }, [keywords]);

  // Apply filters and sorting
  const filteredAndSortedRows = useMemo(() => {
    let rows = [...questionRows];

    // Apply filters
    if (filterConcept) {
      rows = rows.filter(r => r.conceptName === filterConcept);
    }
    if (filterFunnel) {
      rows = rows.filter(r => r.funnelStage === filterFunnel);
    }

    // Apply sorting
    rows.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'question':
          comparison = a.question.localeCompare(b.question);
          break;
        case 'concept':
          comparison = a.conceptName.localeCompare(b.conceptName);
          break;
        case 'funnel':
          const funnelOrder = { top: 0, middle: 1, bottom: 2 };
          comparison = funnelOrder[a.funnelStage] - funnelOrder[b.funnelStage];
          break;
        case 'lastChecked':
          if (!a.lastCheckedAt && !b.lastCheckedAt) comparison = 0;
          else if (!a.lastCheckedAt) comparison = 1;
          else if (!b.lastCheckedAt) comparison = -1;
          else comparison = new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return rows;
  }, [questionRows, filterConcept, filterFunnel, sortField, sortDirection]);

  // Handle sort header click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  // Handle check complete - refresh data
  const handleCheckComplete = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Open sidebar to edit a concept
  const handleOpenConceptSidebar = useCallback(async (conceptId: string) => {
    setIsLoadingKeyword(true);
    setSidebarOpen(true);
    try {
      const response = await apiClient.get<{ keyword: any }>(`/keywords/${conceptId}`);
      console.log('[LLMVisibility] API response:', response);
      console.log('[LLMVisibility] keyword.relatedQuestions:', response.keyword?.relatedQuestions);
      if (response.keyword) {
        // The API already returns transformed data, no need to transform again
        setSelectedKeyword(response.keyword);
        console.log('[LLMVisibility] Set selectedKeyword:', response.keyword);
      }
    } catch (err) {
      console.error('[LLMVisibility] Error loading keyword:', err);
      setSelectedKeyword(null);
    } finally {
      setIsLoadingKeyword(false);
    }
  }, []);

  // Handle keyword update from sidebar
  const handleKeywordUpdate = useCallback(async (id: string, updates: Partial<KeywordData>): Promise<KeywordData | null> => {
    try {
      const response = await apiClient.put<{ keyword: any }>(`/keywords/${id}`, updates);
      if (response.keyword) {
        const transformed = transformKeywordToResponse(response.keyword);
        setSelectedKeyword(transformed);
        // Refresh main data to reflect changes
        fetchData();
        return transformed;
      }
      return null;
    } catch (err) {
      console.error('[LLMVisibility] Error updating keyword:', err);
      return null;
    }
  }, [fetchData]);

  // Close sidebar
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
    setSelectedKeyword(null);
  }, []);

  // Handle check rank - opens modal
  const handleCheckRank = useCallback((keyword: string, conceptId: string) => {
    // Use selected keyword's location if available, otherwise business location
    const locationCode = selectedKeyword?.searchVolumeLocationCode || business?.location_code;
    const locationName = selectedKeyword?.searchVolumeLocationName || business?.location_name;

    setCheckingRank({
      keyword,
      conceptId,
      locationCode: locationCode ?? undefined,
      locationName: locationName ?? undefined,
    });
  }, [selectedKeyword, business]);

  // Perform rank check (called from modal)
  const performRankCheck = useCallback(async (
    locationCode: number,
    locationName: string
  ): Promise<{
    desktop: { position: number | null; found: boolean };
    mobile: { position: number | null; found: boolean };
  }> => {
    if (!checkingRank) throw new Error('No keyword selected');

    // Check both desktop and mobile in parallel
    const [desktopResponse, mobileResponse] = await Promise.all([
      apiClient.post<{
        success: boolean;
        position: number | null;
        found: boolean;
        foundUrl: string | null;
        creditsUsed: number;
        creditsRemaining: number;
        error?: string;
      }>('/rank-tracking/check-keyword', {
        keyword: checkingRank.keyword,
        keywordId: checkingRank.conceptId,
        locationCode,
        device: 'desktop',
      }),
      apiClient.post<{
        success: boolean;
        position: number | null;
        found: boolean;
        foundUrl: string | null;
        creditsUsed: number;
        creditsRemaining: number;
        error?: string;
      }>('/rank-tracking/check-keyword', {
        keyword: checkingRank.keyword,
        keywordId: checkingRank.conceptId,
        locationCode,
        device: 'mobile',
      }),
    ]);

    if (!desktopResponse.success) {
      throw new Error(desktopResponse.error || 'Failed to check desktop rank');
    }
    if (!mobileResponse.success) {
      throw new Error(mobileResponse.error || 'Failed to check mobile rank');
    }

    return {
      desktop: { position: desktopResponse.position, found: desktopResponse.found },
      mobile: { position: mobileResponse.position, found: mobileResponse.found },
    };
  }, [checkingRank]);

  // Handle rank check complete - refresh sidebar data
  const handleRankCheckComplete = useCallback(() => {
    // Refresh sidebar data if open
    if (selectedKeyword) {
      handleOpenConceptSidebar(selectedKeyword.id);
    }
  }, [selectedKeyword, handleOpenConceptSidebar]);

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <Icon
        name={sortDirection === 'asc' ? 'FaChevronUp' : 'FaChevronDown'}
        className="w-3 h-3 text-slate-blue"
      />
    );
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
      <SubNav
        items={[
          { label: 'Library', icon: 'FaKey', href: '/dashboard/keywords', matchType: 'exact' },
          { label: 'Rank Tracking', icon: 'FaChartLine', href: '/dashboard/keywords/rank-tracking', matchType: 'startsWith' },
          { label: 'LLM Visibility', icon: 'FaSparkles', href: '/dashboard/keywords/llm-visibility', matchType: 'startsWith' },
        ]}
      />

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaSparkles" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-16"
      >
        {/* Header */}
        <PageCardHeader
          title="LLM visibility"
          description="Track whether AI assistants cite your domain or mention your brand when answering questions."
          actions={
            <Link
              href="/dashboard/keywords"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 rounded-lg transition-colors"
            >
              <Icon name="FaPlus" className="w-4 h-4" />
              Add concept
            </Link>
          }
        />

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
            {/* Trend Chart */}
            <LLMVisibilityTrendChart results={allResults} isLoading={isLoading} />

            {/* Account Summary */}
            {accountSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                  <div className="text-2xl font-bold text-purple-700">
                    {accountSummary.averageVisibility !== null
                      ? `${accountSummary.averageVisibility.toFixed(0)}%`
                      : '--'}
                  </div>
                  <div className="text-sm text-gray-600">Citation rate</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-2xl font-bold text-gray-800">
                    {accountSummary.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Questions tracked</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-2xl font-bold text-gray-800">
                    {accountSummary.keywordsWithQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Concepts</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex gap-1.5 flex-wrap">
                    {LLM_PROVIDERS.map((provider) => {
                      const stats = accountSummary.providerStats[provider];
                      const colors = LLM_PROVIDER_COLORS[provider];
                      const citedOrMentioned = (stats?.cited || 0) + (stats?.mentioned || 0) -
                        Math.min(stats?.cited || 0, stats?.mentioned || 0); // Avoid double counting
                      return (
                        <span
                          key={provider}
                          className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                          title={`${stats?.cited || 0} cited, ${stats?.mentioned || 0} mentioned / ${stats?.checked || 0} checked`}
                        >
                          {LLM_PROVIDER_LABELS[provider].charAt(0)}
                          {stats ? ` ${stats.cited}/${stats.checked}` : ''}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">By provider</div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {/* Concept filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Concept:</label>
                <select
                  value={filterConcept || ''}
                  onChange={(e) => setFilterConcept(e.target.value || null)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                >
                  <option value="">All concepts</option>
                  {conceptOptions.map(concept => (
                    <option key={concept} value={concept}>{concept}</option>
                  ))}
                </select>
              </div>

              {/* Funnel filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Funnel:</label>
                <select
                  value={filterFunnel || ''}
                  onChange={(e) => setFilterFunnel(e.target.value || null)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                >
                  <option value="">All stages</option>
                  <option value="top">Top of funnel</option>
                  <option value="middle">Middle of funnel</option>
                  <option value="bottom">Bottom of funnel</option>
                </select>
              </div>

              {/* Clear filters */}
              {(filterConcept || filterFunnel) && (
                <button
                  onClick={() => {
                    setFilterConcept(null);
                    setFilterFunnel(null);
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Clear filters
                </button>
              )}

              {/* Results count */}
              <div className="text-sm text-gray-500 ml-auto">
                {filteredAndSortedRows.length} question{filteredAndSortedRows.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Questions Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 transition-colors min-w-[400px]"
                      onClick={() => handleSort('question')}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Question</span>
                        <SortIndicator field="question" />
                      </div>
                    </th>
                    <th
                      className="text-center py-3 px-2 cursor-pointer hover:bg-gray-100 transition-colors w-16"
                      onClick={() => handleSort('funnel')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Funnel</span>
                        <SortIndicator field="funnel" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-3 cursor-pointer hover:bg-gray-100 transition-colors w-36"
                      onClick={() => handleSort('concept')}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Concept</span>
                        <SortIndicator field="concept" />
                      </div>
                    </th>
                    {/* Provider columns */}
                    {LLM_PROVIDERS.map(provider => {
                      const colors = LLM_PROVIDER_COLORS[provider];
                      return (
                        <th key={provider} className="text-center py-3 px-2 w-20">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${colors.bg} ${colors.text}`}>
                            {LLM_PROVIDER_LABELS[provider]}
                          </span>
                        </th>
                      );
                    })}
                    <th
                      className="text-center py-3 px-2 cursor-pointer hover:bg-gray-100 transition-colors w-24"
                      onClick={() => handleSort('lastChecked')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Checked</span>
                        <SortIndicator field="lastChecked" />
                      </div>
                    </th>
                    <th className="text-center py-3 px-3 w-20">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedRows.map((row, idx) => {
                    const rowKey = `${row.conceptId}-${row.question}`;
                    const isExpanded = expandedRow === rowKey;
                    const funnelColor = FUNNEL_COLORS[row.funnelStage] || FUNNEL_COLORS.top;
                    const hasAnyResults = Array.from(row.results.values()).some(r => r !== null);

                    return (
                      <React.Fragment key={rowKey}>
                        <tr
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            isExpanded ? 'bg-blue-50' : ''
                          }`}
                        >
                          {/* Question */}
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRow(isExpanded ? null : rowKey);
                              }}
                              className="text-left text-sm text-gray-900 hover:text-purple-600 transition-colors flex items-start gap-2 w-full"
                            >
                              <Icon
                                name={isExpanded ? 'FaChevronDown' : 'FaChevronRight'}
                                className="w-3 h-3 text-gray-500 mt-1 flex-shrink-0"
                              />
                              <span>{row.question}</span>
                            </button>
                          </td>

                          {/* Funnel Stage */}
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${funnelColor.bg} ${funnelColor.text}`}>
                              {FUNNEL_LABELS[row.funnelStage]}
                            </span>
                          </td>

                          {/* Concept */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 truncate max-w-[110px]" title={row.conceptName}>
                                {row.conceptName}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenConceptSidebar(row.conceptId);
                                }}
                                className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                title={`Edit ${row.conceptName}`}
                              >
                                <Icon name="FaEdit" className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Provider Status Columns */}
                          {LLM_PROVIDERS.map(provider => {
                            const result = row.results.get(provider);

                            if (!result) {
                              // Not checked yet
                              return (
                                <td key={provider} className="py-3 px-2 text-center">
                                  <span className="text-gray-300" title="Not checked">—</span>
                                </td>
                              );
                            }

                            // Checked - show results
                            return (
                              <td key={provider} className="py-3 px-2 text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  {/* Citation status */}
                                  {result.domainCited ? (
                                    <span className="text-green-600 text-xs font-medium flex items-center gap-0.5" title={`Cited at position ${result.citationPosition}`}>
                                      <Icon name="FaLink" className="w-3 h-3" />
                                      #{result.citationPosition || '?'}
                                    </span>
                                  ) : (
                                    <span className="text-amber-500 text-xs flex items-center gap-0.5" title="Checked - not cited">
                                      <Icon name="FaTimes" className="w-3 h-3" />
                                    </span>
                                  )}
                                  {/* Brand mention status */}
                                  {result.brandMentioned && (
                                    <span className="text-blue-600 text-xs font-medium flex items-center gap-0.5" title="Brand mentioned in response">
                                      <Icon name="FaUser" className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* Last Checked */}
                          <td className="py-3 px-2 text-center">
                            <span className="text-xs text-gray-500">
                              {row.lastCheckedAt ? formatRelativeTime(row.lastCheckedAt) : '—'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setCheckingModal({ question: row.question, conceptId: row.conceptId })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Icon name="FaSearch" className="w-3 h-3" />
                              Check
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr className="bg-blue-50">
                            <td colSpan={7 + LLM_PROVIDERS.length} className="p-4">
                              {(() => {
                                const resultsWithData = LLM_PROVIDERS
                                  .map(provider => ({ provider, result: row.results.get(provider) }))
                                  .filter(({ result }) => result !== null);

                                if (resultsWithData.length === 0) {
                                  return (
                                    <div className="text-center text-gray-500 text-sm py-4">
                                      No checks performed yet. Click "Check" to query AI assistants.
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-4">
                                    {resultsWithData.map(({ provider, result }) => {
                                      if (!result) return null;
                                      const colors = LLM_PROVIDER_COLORS[provider];

                                      return (
                                        <div key={provider} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                                          {/* Provider header with status */}
                                          <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors.bg} ${colors.text}`}>
                                              {LLM_PROVIDER_LABELS[provider]}
                                            </span>
                                            <div className="flex items-center gap-3 text-xs">
                                              {result.domainCited ? (
                                                <span className="text-green-600 font-medium flex items-center gap-1">
                                                  <Icon name="FaLink" className="w-3 h-3" />
                                                  Cited #{result.citationPosition} of {result.totalCitations}
                                                </span>
                                              ) : (
                                                <span className="text-gray-500">Not cited ({result.totalCitations} total citations)</span>
                                              )}
                                              {result.brandMentioned && (
                                                <span className="text-blue-600 font-medium flex items-center gap-1">
                                                  <Icon name="FaUser" className="w-3 h-3" />
                                                  Brand mentioned
                                                </span>
                                              )}
                                              <span className="text-gray-500">
                                                {formatRelativeTime(result.checkedAt)}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Response snippet */}
                                          {result.responseSnippet && (
                                            <div className="text-sm text-gray-700 mb-3 pl-4 border-l-2 border-gray-200">
                                              {result.responseSnippet}
                                            </div>
                                          )}

                                          {/* Citations list */}
                                          {result.citations && result.citations.length > 0 && (
                                            <div className="mt-2">
                                              <div className="text-xs text-gray-500 mb-1">Sources cited:</div>
                                              <div className="flex flex-wrap gap-2">
                                                {result.citations.map((citation, cidx) => (
                                                  <a
                                                    key={cidx}
                                                    href={citation.url || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                                      citation.isOurs
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                    title={citation.title || citation.url}
                                                  >
                                                    <span className="font-medium">#{citation.position}</span>
                                                    <span className="truncate max-w-[150px]">{citation.domain}</span>
                                                    {citation.isOurs && <span className="text-green-600 font-bold">(You)</span>}
                                                  </a>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Brand entities mentioned in response */}
                                          {result.mentionedBrands && result.mentionedBrands.length > 0 && (
                                            <div className="mt-2">
                                              <div className="text-xs text-gray-500 mb-1">Brands mentioned:</div>
                                              <div className="flex flex-wrap gap-2">
                                                {result.mentionedBrands.map((brand, bidx) => (
                                                  <span
                                                    key={bidx}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 text-purple-700 border border-purple-200"
                                                    title={brand.category || undefined}
                                                  >
                                                    <Icon name="FaBuilding" className="w-2.5 h-2.5" />
                                                    <span>{brand.title}</span>
                                                    {brand.category && (
                                                      <span className="text-purple-500 text-[10px]">({brand.category})</span>
                                                    )}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

              {filteredAndSortedRows.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No questions match your filters
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Icon name="FaLink" className="w-3 h-3 text-green-600" />
                <span>Domain cited as source</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="FaUser" className="w-3 h-3 text-blue-600" />
                <span>Brand mentioned in response</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="FaTimes" className="w-3 h-3 text-amber-500" />
                <span>Checked - not cited</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-300">—</span>
                <span>Not checked yet</span>
              </div>
            </div>
          </>
        )}
      </PageCard>

      {/* Check LLM Modal */}
      <CheckLLMModal
        question={checkingModal?.question || ''}
        keywordId={checkingModal?.conceptId || ''}
        isOpen={!!checkingModal}
        onClose={() => setCheckingModal(null)}
        onCheckComplete={handleCheckComplete}
        businessName={business?.name || undefined}
      />

      {/* Concept Details Sidebar */}
      <KeywordDetailsSidebar
        isOpen={sidebarOpen}
        keyword={selectedKeyword}
        onClose={handleCloseSidebar}
        onUpdate={handleKeywordUpdate}
        onCheckRank={handleCheckRank}
        onRefresh={async () => {
          if (selectedKeyword) {
            await handleOpenConceptSidebar(selectedKeyword.id);
          }
        }}
      />

      {/* Check Rank Modal */}
      <CheckRankModal
        keyword={checkingRank?.keyword || ''}
        isOpen={!!checkingRank}
        onClose={() => setCheckingRank(null)}
        onCheck={performRankCheck}
        onCheckComplete={handleRankCheckComplete}
        defaultLocationCode={checkingRank?.locationCode}
        defaultLocationName={checkingRank?.locationName}
        locationLocked={!!checkingRank?.locationCode}
      />
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
