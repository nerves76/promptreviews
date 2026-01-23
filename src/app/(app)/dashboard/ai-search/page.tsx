'use client';

import React, { useState, useEffect, useCallback, useMemo, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { ArrowUpTrayIcon, XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
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
import { CheckLLMModal, LLMVisibilityTrendChart, AddLLMConceptModal, RunAllLLMModal, CitationTimeline } from '@/features/llm-visibility/components';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { KeywordDetailsSidebar } from '@/features/keywords/components/KeywordDetailsSidebar';
import { CheckRankModal } from '@/features/rank-tracking/components';
import { type KeywordData, transformKeywordToResponse } from '@/features/keywords/keywordUtils';
import { useBusinessData } from '@/auth/hooks/granularAuthHooks';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/app/(app)/components/ui/modal';
import { useAISearchQueryGroups, type AISearchQueryGroupData } from '@/features/ai-search/hooks/useAISearchQueryGroups';
import { BulkMoveBar } from '@/components/BulkMoveBar';
import { ManageGroupsModal } from '@/components/ManageGroupsModal';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';

interface KeywordWithQuestions {
  id: string;
  phrase: string;
  relatedQuestions: Array<{
    id?: string; // keyword_questions.id
    question: string;
    funnelStage?: 'top' | 'middle' | 'bottom';
    groupId?: string | null;
  }>;
  summary?: LLMVisibilitySummary | null;
}

interface QuestionRow {
  id: string; // keyword_questions.id for selection
  question: string;
  funnelStage: 'top' | 'middle' | 'bottom';
  conceptId: string;
  conceptName: string;
  groupId: string | null;
  results: Map<LLMProvider, LLMVisibilityCheck | null>;
  lastCheckedAt: string | null;
}

interface AccountSummary {
  totalKeywords: number;
  keywordsWithQuestions: number;
  totalQuestions: number;
  questionsChecked: number;
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

// Pagination
const PAGE_SIZE = 100;

/**
 * AI Search Dashboard Page
 *
 * Shows account-wide LLM visibility tracking for keywords with related questions.
 * Displays all questions in a flat table with concept column.
 */
export default function AISearchPage() {
  // Read query params for deep linking
  const searchParams = useSearchParams();
  const conceptFromUrl = searchParams.get('concept');

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

  // Modal state for adding new concept
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal state for run all batch
  const [showRunAllModal, setShowRunAllModal] = useState(false);

  // Modal state for viewing full LLM response
  const [responseModal, setResponseModal] = useState<{
    provider: LLMProvider;
    question: string;
    response: string;
  } | null>(null);

  // Track expanded accordions per provider result (key = "providerId-section")
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());

  const toggleAccordion = (key: string) => {
    setExpandedAccordions(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Use keywords hook to create new concepts
  const { createKeyword, refresh: refreshKeywords } = useKeywords({ autoFetch: false });

  // Group management
  const {
    groups: queryGroups,
    ungroupedCount: queryUngroupedCount,
    isLoading: isLoadingGroups,
    createGroup: createQueryGroup,
    updateGroup: updateQueryGroup,
    deleteGroup: deleteQueryGroup,
    reorderGroups: reorderQueryGroups,
    bulkMoveQueries,
    refresh: refreshGroups,
  } = useAISearchQueryGroups();

  // Selection state for bulk operations
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [showManageGroupsModal, setShowManageGroupsModal] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  // Toast notifications
  const { toasts, success: showSuccess, error: showError, closeToast } = useToast();

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

  // Filter state - initialize from URL if present
  const [filterConcept, setFilterConcept] = useState<string | null>(conceptFromUrl);
  const [filterFunnel, setFilterFunnel] = useState<string | null>(null);

  // Use transition for non-blocking sort/filter updates (INP optimization)
  const [isPending, startTransition] = useTransition();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Update filter when URL param changes
  useEffect(() => {
    if (conceptFromUrl) {
      setFilterConcept(conceptFromUrl);
    }
  }, [conceptFromUrl]);

  // Expanded row state (for showing details)
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    keywordsCreated?: number;
    duplicatesSkipped?: number;
    skippedPhrases?: string[];
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          relatedQuestions?: Array<string | { id?: string; question: string; funnelStage?: string; groupId?: string | null; addedAt?: string }>;
        }>
      };

      const keywordsWithQuestions: KeywordWithQuestions[] = (keywordsData.keywords || [])
        .filter((k) => k.relatedQuestions && k.relatedQuestions.length > 0)
        .map((k) => ({
          id: k.id,
          phrase: k.phrase,
          relatedQuestions: (k.relatedQuestions || []).map((q, idx) => {
            if (typeof q === 'string') {
              return { id: `${k.id}-${idx}`, question: q, funnelStage: 'top' as const, groupId: null };
            }
            return {
              id: q.id || `${k.id}-${idx}`,
              question: q.question,
              funnelStage: (q.funnelStage as 'top' | 'middle' | 'bottom') || 'top',
              groupId: q.groupId || null,
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

      // Count unique questions that have been checked (have at least one result)
      const uniqueQuestionsChecked = new Set(
        Array.from(uniqueChecks.values()).map(r => r.question)
      ).size;

      setAccountSummary({
        totalKeywords,
        keywordsWithQuestions: totalKeywords,
        totalQuestions,
        questionsChecked: uniqueQuestionsChecked,
        averageVisibility,
        providerStats,
      });
    } catch (err) {
      console.error('[AISearch] Error fetching data:', err);
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
          id: q.id || `${kw.id}-${q.question}`,
          question: q.question,
          funnelStage: q.funnelStage || 'top',
          conceptId: kw.id,
          conceptName: kw.phrase,
          groupId: q.groupId || null,
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
    if (filterGroup) {
      if (filterGroup === 'ungrouped') {
        rows = rows.filter(r => !r.groupId);
      } else {
        rows = rows.filter(r => r.groupId === filterGroup);
      }
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
  }, [questionRows, filterConcept, filterFunnel, filterGroup, sortField, sortDirection]);

  // Calculate filtered stats when group filter is active
  const filteredStats = useMemo(() => {
    // Only calculate when a group filter is applied
    if (!filterGroup) return null;

    const rows = filteredAndSortedRows;
    if (rows.length === 0) return null;

    // Get unique questions in the filtered set
    const filteredQuestions = new Set(rows.map(r => r.question));

    // Get results only for filtered questions
    const filteredResults = allResults.filter(r => filteredQuestions.has(r.question));

    // Group results by question+provider to get unique checks
    const uniqueChecks = new Map<string, LLMVisibilityCheck>();
    for (const result of filteredResults) {
      const key = `${result.question}:${result.llmProvider}`;
      const existing = uniqueChecks.get(key);
      if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
        uniqueChecks.set(key, result);
      }
    }

    // Calculate provider stats
    const providerStats: Record<string, { checked: number; cited: number; mentioned: number }> = {};
    for (const result of uniqueChecks.values()) {
      if (!providerStats[result.llmProvider]) {
        providerStats[result.llmProvider] = { checked: 0, cited: 0, mentioned: 0 };
      }
      providerStats[result.llmProvider].checked++;
      if (result.domainCited) providerStats[result.llmProvider].cited++;
      if (result.brandMentioned) providerStats[result.llmProvider].mentioned++;
    }

    // Calculate citation rate
    const citedCount = Array.from(uniqueChecks.values()).filter(r => r.domainCited).length;
    const averageVisibility = uniqueChecks.size > 0
      ? (citedCount / uniqueChecks.size) * 100
      : null;

    // Count unique questions that have been checked
    const questionsChecked = new Set(
      Array.from(uniqueChecks.values()).map(r => r.question)
    ).size;

    // Count unique concepts
    const uniqueConcepts = new Set(rows.map(r => r.conceptId)).size;

    return {
      totalQuestions: rows.length,
      questionsChecked,
      averageVisibility,
      providerStats,
      uniqueConcepts,
    };
  }, [filterGroup, filteredAndSortedRows, allResults]);

  // Get group name for display
  const activeGroupName = useMemo(() => {
    if (!filterGroup) return null;
    if (filterGroup === 'ungrouped') return 'Ungrouped';
    const group = queryGroups.find(g => g.id === filterGroup);
    return group?.name || 'Unknown group';
  }, [filterGroup, queryGroups]);

  // Calculate trend data (comparing last 30 days vs previous 30 days)
  const trendStats = useMemo(() => {
    // Get relevant results (filtered by group if active)
    let relevantResults = allResults;
    if (filterGroup && filteredAndSortedRows.length > 0) {
      const filteredQuestions = new Set(filteredAndSortedRows.map(r => r.question));
      relevantResults = allResults.filter(r => filteredQuestions.has(r.question));
    }

    if (relevantResults.length === 0) {
      return null;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Split results into current period (last 30 days) and previous period (30-60 days ago)
    const currentPeriod = relevantResults.filter(r => new Date(r.checkedAt) >= thirtyDaysAgo);
    const previousPeriod = relevantResults.filter(r => {
      const date = new Date(r.checkedAt);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    // Helper to calculate citation rate
    const calcRate = (results: typeof relevantResults) => {
      if (results.length === 0) return null;
      const cited = results.filter(r => r.domainCited).length;
      return (cited / results.length) * 100;
    };

    // Helper to calculate trend
    const calcTrend = (current: number | null, previous: number | null) => {
      if (current === null) return { direction: 'stable' as const, change: 0 };
      if (previous === null || previous === 0) {
        return current > 0
          ? { direction: 'up' as const, change: current }
          : { direction: 'stable' as const, change: 0 };
      }
      const change = current - previous;
      const threshold = 2; // Need at least 2% change to show trend
      if (Math.abs(change) < threshold) {
        return { direction: 'stable' as const, change: 0 };
      }
      return {
        direction: change > 0 ? 'up' as const : 'down' as const,
        change: Math.round(change),
      };
    };

    // Overall trend
    const overallCurrent = calcRate(currentPeriod);
    const overallPrevious = calcRate(previousPeriod);
    const overallTrend = calcTrend(overallCurrent, overallPrevious);

    // Per-provider trends
    const providerTrends: Record<string, { direction: 'up' | 'down' | 'stable'; change: number; currentRate: number | null }> = {};

    LLM_PROVIDERS.forEach(provider => {
      const providerCurrent = currentPeriod.filter(r => r.llmProvider === provider);
      const providerPrevious = previousPeriod.filter(r => r.llmProvider === provider);

      const currentRate = calcRate(providerCurrent);
      const previousRate = calcRate(providerPrevious);
      const trend = calcTrend(currentRate, previousRate);

      providerTrends[provider] = {
        ...trend,
        currentRate,
      };
    });

    return {
      overall: {
        ...overallTrend,
        currentRate: overallCurrent,
        hasData: currentPeriod.length > 0,
        hasPreviousData: previousPeriod.length > 0,
      },
      providers: providerTrends,
      periodLabel: previousPeriod.length > 0 ? 'vs last month' : 'last 30 days',
    };
  }, [allResults, filterGroup, filteredAndSortedRows]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedRows.length / PAGE_SIZE);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedRows.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedRows, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterConcept, filterFunnel, filterGroup, sortField, sortDirection]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedQuestionIds(new Set());
  }, [filterConcept, filterFunnel, filterGroup]);

  // Selection handlers
  const toggleQuestionSelection = useCallback((id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllQuestions = useCallback(() => {
    setSelectedQuestionIds(new Set(filteredAndSortedRows.map(r => r.id)));
  }, [filteredAndSortedRows]);

  const deselectAllQuestions = useCallback(() => {
    setSelectedQuestionIds(new Set());
  }, []);

  // Handle bulk move
  const handleBulkMoveToGroup = useCallback(async (groupId: string | null) => {
    const questionIds = Array.from(selectedQuestionIds);
    const count = questionIds.length;
    const success = await bulkMoveQueries(questionIds, groupId);
    if (success) {
      setSelectedQuestionIds(new Set());
      await fetchData(); // Refresh to show updated group assignments

      // Show success notification
      const groupName = groupId === null
        ? 'Ungrouped'
        : queryGroups.find(g => g.id === groupId)?.name || 'group';
      showSuccess(`Moved ${count} ${count === 1 ? 'query' : 'queries'} to ${groupName}`);
    } else {
      showError('Failed to move queries. Please try again.');
    }
  }, [selectedQuestionIds, bulkMoveQueries, fetchData, queryGroups, showSuccess, showError]);

  // Handle sort header click (wrapped in transition to avoid INP issues)
  const handleSort = (field: SortField) => {
    startTransition(() => {
      if (sortField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    });
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

  // Handle adding a new LLM concept
  const handleAddLLMConcept = useCallback(async (data: {
    name: string;
    questions: Array<{ question: string; funnelStage: 'top' | 'middle' | 'bottom' }>;
  }) => {
    // Create keyword with the name as the phrase
    const newKeyword = await createKeyword(data.name);
    if (!newKeyword) {
      throw new Error('Failed to create keyword concept');
    }

    // Update the keyword to add the related questions and enable LLM visibility
    const now = new Date().toISOString();
    const relatedQuestions = data.questions.map((q) => ({
      question: q.question,
      funnelStage: q.funnelStage,
      addedAt: now,
    }));

    await apiClient.put(`/keywords/${newKeyword.id}`, {
      relatedQuestions,
      isUsedInLLMVisibility: true,
    });

    // Refresh data
    await refreshKeywords();
    await fetchData();
  }, [createKeyword, refreshKeywords, fetchData]);

  // Handle template download for import
  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.download('/keywords/upload');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'concepts-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download failed:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  // Handle file selection for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);

    // Parse preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .slice(0, 6); // Header + 5 rows

      const rows = lines.map(line => {
        const result: string[] = [];
        let inQuotes = false;
        let current = '';

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      setImportPreview(rows);
    };
    reader.readAsText(file);
  };

  // Handle import submit
  const handleImportSubmit = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const result = await apiClient.upload<{
        message?: string;
        error?: string;
        keywordsCreated?: number;
        duplicatesSkipped?: number;
        skippedPhrases?: string[];
        errors?: string[];
      }>('/keywords/upload', formData);

      setImportResult({
        success: true,
        message: result.message || 'Import successful',
        keywordsCreated: result.keywordsCreated,
        duplicatesSkipped: result.duplicatesSkipped,
        skippedPhrases: result.skippedPhrases,
        errors: result.errors,
      });
      // Refresh the data after successful import
      await refreshKeywords();
      await fetchData();
    } catch (error: any) {
      setImportResult({
        success: false,
        message: error?.responseBody?.error || error?.message || 'Import failed',
        errors: error?.responseBody?.errors,
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Reset import modal
  const resetImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open sidebar to edit a concept
  const handleOpenConceptSidebar = useCallback(async (conceptId: string) => {
    setIsLoadingKeyword(true);
    setSidebarOpen(true);
    try {
      const response = await apiClient.get<{ keyword: any }>(`/keywords/${conceptId}`);
      if (response.keyword) {
        // The API already returns transformed data, no need to transform again
        setSelectedKeyword(response.keyword);
      }
    } catch (err) {
      console.error('[AISearch] Error loading keyword:', err);
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
      console.error('[AISearch] Error updating keyword:', err);
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
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">AI Search</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <SubNav
        items={[
          { label: 'AI Visibility', icon: 'FaSparkles', href: '/dashboard/ai-search', matchType: 'exact' },
          { label: 'Visibility Opportunities', icon: 'FaGlobe', href: '/dashboard/ai-search/research-sources', matchType: 'exact' },
          { label: 'Competitors', icon: 'FaUsers', href: '/dashboard/ai-search/competitors', matchType: 'exact' },
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
            <div className="flex items-center gap-2">
              {keywords.length > 0 && (
                <button
                  onClick={() => setShowRunAllModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors whitespace-nowrap"
                  title="Run LLM visibility checks on all questions"
                >
                  <Icon name="FaRocket" className="w-4 h-4" />
                  Check all
                </button>
              )}
              {allResults.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      const response = await apiClient.download('/llm-visibility/export');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `llm-visibility-export-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    } catch (error) {
                      console.error('Export failed:', error);
                      alert('Failed to export LLM visibility data. Please try again.');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                  title="Export all LLM visibility results to CSV"
                >
                  <Icon name="FaFileAlt" className="w-4 h-4" />
                  Export CSV
                </button>
              )}
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                title="Import concepts from CSV"
                aria-label="Import concepts"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-blue hover:bg-slate-blue/90 rounded-lg transition-colors whitespace-nowrap"
              >
                <Icon name="FaPlus" className="w-4 h-4" />
                Add concept
              </button>
            </div>
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

            {/* Summary Stats - Show filtered when group selected, otherwise account-wide */}
            {(filteredStats || accountSummary) && (
              <div className="mb-6">
                {/* Group filter indicator */}
                {filteredStats && activeGroupName && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-blue/10 border border-slate-blue/20 rounded-lg text-sm font-medium text-slate-blue">
                      <Icon name="FaTags" className="w-3.5 h-3.5" />
                      Showing stats for: {activeGroupName}
                    </span>
                    <button
                      onClick={() => startTransition(() => setFilterGroup(null))}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <Icon name="FaTimes" className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Citation Rate with Trend */}
                  <div className={`p-4 rounded-xl border ${filteredStats ? 'bg-gradient-to-br from-slate-blue/10 to-blue-50 border-slate-blue/20' : 'bg-gradient-to-br from-blue-50 to-pink-50 border-blue-100'}`}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-blue">
                        {filteredStats
                          ? (filteredStats.averageVisibility !== null ? `${filteredStats.averageVisibility.toFixed(0)}%` : '--')
                          : (accountSummary?.averageVisibility !== null ? `${accountSummary!.averageVisibility!.toFixed(0)}%` : '--')}
                      </span>
                      {trendStats?.overall.hasData && (
                        <span className={`text-sm font-medium flex items-center gap-0.5 ${
                          trendStats.overall.direction === 'up' ? 'text-green-600' :
                          trendStats.overall.direction === 'down' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {trendStats.overall.direction === 'up' && '↑'}
                          {trendStats.overall.direction === 'down' && '↓'}
                          {trendStats.overall.direction === 'stable' && '→'}
                          {trendStats.overall.change !== 0 && (
                            <span>{trendStats.overall.change > 0 ? '+' : ''}{trendStats.overall.change}%</span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Citation rate
                      {trendStats?.overall.hasPreviousData && (
                        <span className="text-xs text-gray-400 ml-1">({trendStats.periodLabel})</span>
                      )}
                    </div>
                  </div>

                  {/* Questions Tracked */}
                  <div className={`p-4 rounded-xl border ${filteredStats ? 'bg-slate-50 border-slate-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-2xl font-bold text-gray-800">
                      {filteredStats
                        ? `${filteredStats.questionsChecked}/${filteredStats.totalQuestions}`
                        : `${accountSummary?.questionsChecked}/${accountSummary?.totalQuestions}`}
                    </div>
                    <div className="text-sm text-gray-600">Questions tracked</div>
                  </div>

                  {/* Concepts */}
                  <div className={`p-4 rounded-xl border ${filteredStats ? 'bg-slate-50 border-slate-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-2xl font-bold text-gray-800">
                      {filteredStats
                        ? filteredStats.uniqueConcepts
                        : accountSummary?.keywordsWithQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Concepts</div>
                  </div>

                  {/* By Provider with Trends */}
                  <div className={`p-4 rounded-xl border ${filteredStats ? 'bg-slate-50 border-slate-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex gap-2 flex-wrap">
                      {LLM_PROVIDERS.map((provider) => {
                        const stats = filteredStats
                          ? filteredStats.providerStats[provider]
                          : accountSummary?.providerStats[provider];
                        const colors = LLM_PROVIDER_COLORS[provider];
                        const trend = trendStats?.providers[provider];
                        const rate = stats && stats.checked > 0
                          ? Math.round((stats.cited / stats.checked) * 100)
                          : null;

                        return (
                          <span
                            key={provider}
                            className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text} whitespace-nowrap flex items-center gap-1`}
                            title={`${stats?.cited || 0} cited / ${stats?.checked || 0} checked${trend?.change ? ` (${trend.change > 0 ? '+' : ''}${trend.change}% vs last month)` : ''}`}
                          >
                            {LLM_PROVIDER_LABELS[provider]}
                            {rate !== null ? ` ${rate}%` : ''}
                            {trend && trend.direction !== 'stable' && (
                              <span className={trend.direction === 'up' ? 'text-green-700' : 'text-red-700'}>
                                {trend.direction === 'up' ? '↑' : '↓'}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">By provider (30-day trend)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {/* Group filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Group:</label>
                <select
                  value={filterGroup || ''}
                  onChange={(e) => startTransition(() => setFilterGroup(e.target.value || null))}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                >
                  <option value="">All groups</option>
                  <option value="ungrouped">Ungrouped ({queryUngroupedCount})</option>
                  {queryGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name} ({group.queryCount})</option>
                  ))}
                </select>
              </div>

              {/* Funnel filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Funnel:</label>
                <select
                  value={filterFunnel || ''}
                  onChange={(e) => startTransition(() => setFilterFunnel(e.target.value || null))}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                >
                  <option value="">All stages</option>
                  <option value="top">Top of funnel</option>
                  <option value="middle">Middle of funnel</option>
                  <option value="bottom">Bottom of funnel</option>
                </select>
              </div>

              {/* Concept filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Concept:</label>
                <select
                  value={filterConcept || ''}
                  onChange={(e) => startTransition(() => setFilterConcept(e.target.value || null))}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 max-w-[200px]"
                >
                  <option value="">All concepts</option>
                  {conceptOptions.map(concept => (
                    <option key={concept} value={concept}>{concept}</option>
                  ))}
                </select>
              </div>

              {/* Manage groups button */}
              <button
                onClick={() => setShowManageGroupsModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icon name="FaCog" className="w-3.5 h-3.5" />
                Manage groups
              </button>

              {/* Clear filters */}
              {(filterConcept || filterFunnel || filterGroup) && (
                <button
                  onClick={() => startTransition(() => {
                    setFilterConcept(null);
                    setFilterFunnel(null);
                    setFilterGroup(null);
                  })}
                  className="text-sm text-slate-blue hover:text-slate-blue/80"
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
            <div className={`overflow-x-auto border border-gray-200 rounded-xl transition-opacity duration-150 ${isPending ? 'opacity-70' : ''}`}>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {/* Checkbox column */}
                    <th className="py-3 px-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.size > 0 && selectedQuestionIds.size === filteredAndSortedRows.length}
                        onChange={() => {
                          if (selectedQuestionIds.size === filteredAndSortedRows.length) {
                            deselectAllQuestions();
                          } else {
                            selectAllQuestions();
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                        aria-label={selectedQuestionIds.size === filteredAndSortedRows.length ? 'Deselect all' : 'Select all'}
                      />
                    </th>
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
                  {paginatedRows.map((row) => {
                    const rowKey = `${row.conceptId}-${row.question}`;
                    const isExpanded = expandedRow === rowKey;
                    const funnelColor = FUNNEL_COLORS[row.funnelStage] || FUNNEL_COLORS.top;

                    return (
                      <React.Fragment key={rowKey}>
                        <tr
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            isExpanded ? 'bg-blue-50' : ''
                          } ${selectedQuestionIds.has(row.id) ? 'bg-blue-50' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={selectedQuestionIds.has(row.id)}
                              onChange={() => toggleQuestionSelection(row.id)}
                              className="w-4 h-4 rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                              aria-label={`Select question: ${row.question.slice(0, 50)}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          {/* Question */}
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startTransition(() => setExpandedRow(isExpanded ? null : rowKey));
                              }}
                              className="text-left text-sm text-gray-900 hover:text-slate-blue transition-colors flex items-start gap-2 w-full"
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
                                className="p-1 text-gray-500 hover:text-slate-blue hover:bg-blue-50 rounded transition-colors"
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
                                      <Icon name="FaCommentAlt" className="w-2.5 h-2.5" />
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
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors"
                              title="Check if AI assistants cite your business for this question"
                            >
                              <Icon name="FaSearch" className="w-3 h-3" />
                              Check
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr className="bg-blue-50">
                            <td colSpan={8 + LLM_PROVIDERS.length} className="p-4">
                              {/* Citation Timeline */}
                              <CitationTimeline
                                question={row.question}
                                keywordId={row.conceptId}
                                className="mb-4 pb-4 border-b border-gray-200"
                              />

                              {(() => {
                                const resultsWithData = LLM_PROVIDERS
                                  .map(provider => ({ provider, result: row.results.get(provider) }))
                                  .filter(({ result }) => result !== null);

                                if (resultsWithData.length === 0) {
                                  return (
                                    <div className="text-center text-gray-500 text-sm py-4">
                                      No checks performed yet. Click &quot;Check&quot; to query AI assistants.
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
                                                  <Icon name="FaCommentAlt" className="w-3 h-3" />
                                                  Brand mentioned
                                                </span>
                                              )}
                                              <span className="text-gray-500">
                                                {formatRelativeTime(result.checkedAt)}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Response excerpt with view button */}
                                          {(result.responseSnippet || result.fullResponse) && (
                                            <div className="mb-3">
                                              <div className="text-sm text-gray-700 pl-4 border-l-2 border-gray-200">
                                                {(() => {
                                                  const fullText = result.fullResponse || result.responseSnippet || '';
                                                  const excerpt = fullText.length > 200
                                                    ? fullText.slice(0, 200).trim() + '...'
                                                    : fullText;
                                                  return excerpt;
                                                })()}
                                              </div>
                                              {(result.fullResponse || result.responseSnippet || '').length > 200 && (
                                                <button
                                                  onClick={() => setResponseModal({
                                                    provider,
                                                    question: row.question,
                                                    response: result.fullResponse || result.responseSnippet || '',
                                                  })}
                                                  className="mt-2 ml-4 text-xs text-slate-blue hover:text-slate-blue/80 font-medium flex items-center gap-1"
                                                >
                                                  <Icon name="FaEye" className="w-3 h-3" />
                                                  View full response
                                                </button>
                                              )}
                                            </div>
                                          )}

                                          {/* Brand entities mentioned in response */}
                                          {result.mentionedBrands && result.mentionedBrands.length > 0 && (
                                            <div className="mt-4">
                                              <div className="text-sm font-medium text-gray-600 mb-2">Brands mentioned:</div>
                                              <div className="flex flex-wrap gap-2">
                                                {result.mentionedBrands.map((brand, bidx) => (
                                                  <span
                                                    key={bidx}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-100 text-slate-blue border border-blue-200"
                                                    title={brand.category || undefined}
                                                  >
                                                    <span>{brand.title}</span>
                                                    {brand.category && (
                                                      <span className="text-slate-blue text-[10px]">({brand.category})</span>
                                                    )}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Fan-out queries - collapsible accordion */}
                                          {result.fanOutQueries && result.fanOutQueries.length > 0 && (
                                            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                                              <button
                                                onClick={() => toggleAccordion(`${result.id}-searches`)}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                                aria-expanded={expandedAccordions.has(`${result.id}-searches`)}
                                                aria-label={`Toggle searches performed section`}
                                              >
                                                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                  <Icon name="FaSearch" className="w-3.5 h-3.5 text-amber-600" />
                                                  Searches performed ({result.fanOutQueries.length})
                                                </span>
                                                <Icon
                                                  name={expandedAccordions.has(`${result.id}-searches`) ? 'FaChevronUp' : 'FaChevronDown'}
                                                  className="w-3 h-3 text-gray-400"
                                                />
                                              </button>
                                              {expandedAccordions.has(`${result.id}-searches`) && (
                                                <div className="p-3 bg-white">
                                                  <div className="flex flex-wrap gap-2">
                                                    {result.fanOutQueries.map((query, qidx) => (
                                                      <span
                                                        key={qidx}
                                                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200"
                                                        title={query}
                                                      >
                                                        {query}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Search results - collapsible accordion */}
                                          {result.searchResults && result.searchResults.length > 0 && (
                                            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                                              <button
                                                onClick={() => toggleAccordion(`${result.id}-websites`)}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                                aria-expanded={expandedAccordions.has(`${result.id}-websites`)}
                                                aria-label={`Toggle websites used for research section`}
                                              >
                                                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                  <Icon name="FaGlobe" className="w-3.5 h-3.5 text-slate-blue" />
                                                  Websites used for research ({result.searchResults.length})
                                                </span>
                                                <Icon
                                                  name={expandedAccordions.has(`${result.id}-websites`) ? 'FaChevronUp' : 'FaChevronDown'}
                                                  className="w-3 h-3 text-gray-400"
                                                />
                                              </button>
                                              {expandedAccordions.has(`${result.id}-websites`) && (
                                                <div className="p-3 bg-white">
                                                  <div className="space-y-1.5">
                                                    {result.searchResults.map((sr, sridx) => (
                                                      <div key={sridx} className="flex items-start gap-2">
                                                        <a
                                                          href={sr.url || '#'}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className={`text-xs break-all hover:underline ${
                                                            sr.isOurs
                                                              ? 'text-green-700 font-medium'
                                                              : 'text-slate-600'
                                                          }`}
                                                          title={sr.title || undefined}
                                                        >
                                                          {sr.url || sr.domain}
                                                        </a>
                                                        {sr.isOurs && (
                                                          <span className="text-[10px] text-green-600 font-bold bg-green-100 px-1.5 py-0.5 rounded whitespace-nowrap">You</span>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Sources cited - collapsible accordion */}
                                          {result.citations && result.citations.length > 0 && (
                                            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                                              <button
                                                onClick={() => toggleAccordion(`${result.id}-citations`)}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                                aria-expanded={expandedAccordions.has(`${result.id}-citations`)}
                                                aria-label={`Toggle sources cited section`}
                                              >
                                                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                  <Icon name="FaLink" className="w-3.5 h-3.5 text-green-600" />
                                                  Sources cited ({result.citations.length})
                                                </span>
                                                <Icon
                                                  name={expandedAccordions.has(`${result.id}-citations`) ? 'FaChevronUp' : 'FaChevronDown'}
                                                  className="w-3 h-3 text-gray-400"
                                                />
                                              </button>
                                              {expandedAccordions.has(`${result.id}-citations`) && (
                                                <div className="p-3 bg-white">
                                                  <div className="space-y-1.5">
                                                    {result.citations.map((citation, cidx) => (
                                                      <div key={cidx} className="flex items-start gap-2">
                                                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">#{citation.position}</span>
                                                        <a
                                                          href={citation.url || '#'}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className={`text-xs break-all hover:underline ${
                                                            citation.isOurs
                                                              ? 'text-green-700 font-medium'
                                                              : 'text-slate-600'
                                                          }`}
                                                          title={citation.title || undefined}
                                                        >
                                                          {citation.url || citation.domain}
                                                        </a>
                                                        {citation.isOurs && (
                                                          <span className="text-[10px] text-green-600 font-bold bg-green-100 px-1.5 py-0.5 rounded whitespace-nowrap">You</span>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
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

              {/* Pagination */}
              {filteredAndSortedRows.length > PAGE_SIZE && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredAndSortedRows.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => startTransition(() => setCurrentPage(page))}
                />
              )}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Icon name="FaLink" className="w-3 h-3 text-green-600" />
                <span>Domain cited as source</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="FaCommentAlt" className="w-3 h-3 text-blue-600" />
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

      {/* Add LLM Concept Modal */}
      <AddLLMConceptModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddLLMConcept}
      />

      {/* Concept Details Sidebar */}
      <KeywordDetailsSidebar
        isOpen={sidebarOpen}
        keyword={selectedKeyword}
        isLoading={isLoadingKeyword}
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

      {/* Run All LLM Modal */}
      <RunAllLLMModal
        isOpen={showRunAllModal}
        onClose={() => setShowRunAllModal(false)}
        onStarted={() => {
          // Could trigger a refresh when batch completes
        }}
      />

      {/* Full Response Modal */}
      <Modal
        isOpen={!!responseModal}
        onClose={() => setResponseModal(null)}
        title={`${responseModal ? LLM_PROVIDER_LABELS[responseModal.provider] : ''} response`}
        size="2xl"
      >
        {responseModal && (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Question:</div>
              <div className="text-sm font-medium text-gray-700">{responseModal.question}</div>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
              {responseModal.response}
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Move Bar */}
      <BulkMoveBar
        selectedCount={selectedQuestionIds.size}
        totalCount={filteredAndSortedRows.length}
        groups={queryGroups.map(g => ({ id: g.id, name: g.name }))}
        itemLabel={selectedQuestionIds.size === 1 ? 'query' : 'queries'}
        onSelectAll={selectAllQuestions}
        onDeselectAll={deselectAllQuestions}
        onMoveToGroup={handleBulkMoveToGroup}
        allowUngrouped={true}
        ungroupedCount={queryUngroupedCount}
      />

      {/* Manage Groups Modal */}
      <ManageGroupsModal
        isOpen={showManageGroupsModal}
        onClose={() => setShowManageGroupsModal(false)}
        title="Manage query groups"
        itemLabel="queries"
        groups={queryGroups.map(g => ({
          id: g.id,
          name: g.name,
          displayOrder: g.displayOrder,
          itemCount: g.queryCount,
        }))}
        isLoading={isLoadingGroups}
        onCreateGroup={async (name) => {
          const result = await createQueryGroup(name);
          return result ? {
            id: result.id,
            name: result.name,
            displayOrder: result.displayOrder,
            itemCount: result.queryCount,
          } : null;
        }}
        onUpdateGroup={async (id, name) => {
          const result = await updateQueryGroup(id, { name });
          return result ? {
            id: result.id,
            name: result.name,
            displayOrder: result.displayOrder,
            itemCount: result.queryCount,
          } : null;
        }}
        onDeleteGroup={deleteQueryGroup}
        onReorderGroups={reorderQueryGroups}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Import concepts</h3>
              <button onClick={resetImportModal} className="text-gray-500 hover:text-gray-600" aria-label="Close modal">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Template download */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Download template</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Download our CSV template with all available fields and example data.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Download template
                </button>
              </div>

              {/* File upload */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Upload CSV file</h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-slate-blue file:text-white
                    hover:file:bg-slate-blue/90
                    file:cursor-pointer cursor-pointer"
                />
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {importPreview[0]?.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {header || `Col ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importPreview.slice(1).map((row, rowIdx) => (
                          <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-2 text-gray-700 max-w-[200px] truncate">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import result */}
              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h4 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {importResult.success ? 'Import complete' : 'Import failed'}
                  </h4>
                  <p className={`text-sm mt-1 ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {importResult.message}
                  </p>
                  {importResult.success && (
                    <div className="mt-2 text-sm text-green-700">
                      <p>{importResult.keywordsCreated} concepts created</p>
                      {importResult.duplicatesSkipped ? (
                        <p>{importResult.duplicatesSkipped} duplicates skipped</p>
                      ) : null}
                      {importResult.skippedPhrases && importResult.skippedPhrases.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-amber-600 hover:text-amber-700">
                            View {importResult.duplicatesSkipped} skipped duplicates
                          </summary>
                          <ul className="mt-1 text-xs text-gray-600 max-h-32 overflow-y-auto pl-4">
                            {importResult.skippedPhrases.map((phrase, i) => (
                              <li key={i} className="list-disc">{phrase}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Warnings/Errors:</p>
                      <ul className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>...and {importResult.errors.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={resetImportModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {importResult?.success ? 'Close' : 'Cancel'}
              </button>
              {!importResult?.success && (
                <button
                  onClick={handleImportSubmit}
                  disabled={!importFile || isImporting}
                  className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isImporting && <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />}
                  {isImporting ? 'Importing...' : 'Import concepts'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <Icon name="FaSparkles" className="w-8 h-8 text-slate-blue" size={32} />
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
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Icon name="FaSparkles" className="w-6 h-6 text-slate-blue" />
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
