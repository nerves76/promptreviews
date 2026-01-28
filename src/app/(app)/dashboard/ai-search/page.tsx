'use client';

import React, { useState, useEffect, useCallback, useMemo, useTransition, useRef, useDeferredValue } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import PromptyIcon from '@/app/(app)/components/prompt-modules/PromptyIcon';
import { apiClient } from '@/utils/apiClient';
import { ArrowUpTrayIcon, XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_MODELS,
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
import { Button } from '@/app/(app)/components/ui/button';
import { useAISearchQueryGroups, type AISearchQueryGroupData } from '@/features/ai-search/hooks/useAISearchQueryGroups';
import { BulkMoveBar } from '@/components/BulkMoveBar';
import { ManageGroupsModal } from '@/components/ManageGroupsModal';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';
import BatchRunHistoryDropdown from '@/components/BatchRunHistoryDropdown';

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

interface ProviderConsistency {
  totalChecks: number;
  citedCount: number;
  mentionedCount: number;
  citationConsistency: number; // 0-100, how often the majority citation answer appears
  mentionConsistency: number; // 0-100, how often the majority mention answer appears
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
  consistency: Map<LLMProvider, ProviderConsistency | null>; // Per-provider consistency
}

interface AccountSummary {
  totalKeywords: number;
  keywordsWithQuestions: number;
  totalQuestions: number;
  questionsChecked: number;
  questionsCited: number;
  questionsMentioned: number;
  averageVisibility: number | null;
  providerStats: Record<string, { checked: number; cited: number; mentioned: number }>;
  overallConsistency: number | null;
  providerConsistency: Record<string, number | null>;
}

// Helper to calculate standard deviation
function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(variance);
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
const PAGE_SIZE = 50;

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
  const [selectedProviders, setSelectedProviders] = useState<Set<LLMProvider>>(() => new Set(LLM_PROVIDERS));
  const [error, setError] = useState<string | null>(null);

  // Modal state for checking a single question
  const [checkingModal, setCheckingModal] = useState<{ question: string; conceptId: string } | null>(null);

  // Modal state for adding new concept
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal state for run all batch
  const [showRunAllModal, setShowRunAllModal] = useState(false);

  // Track active batch run for progress banner
  interface BatchStatus {
    runId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'scheduled';
    providers: LLMProvider[];
    totalQuestions: number;
    processedQuestions: number;
    successfulChecks: number;
    failedChecks: number;
    progress: number;
    creditsRefunded: number;
    errorMessage: string | null;
  }
  const [activeBatchRun, setActiveBatchRun] = useState<BatchStatus | null>(null);
  const [showCompletedBanner, setShowCompletedBanner] = useState(false); // Keep banner visible after completion
  const [isRetryingFailed, setIsRetryingFailed] = useState(false);

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

  // Toggle provider selection for stats filtering
  const toggleProvider = (provider: LLMProvider) => {
    setSelectedProviders(prev => {
      const next = new Set(prev);
      if (next.has(provider)) {
        // Don't allow deselecting all providers
        if (next.size > 1) {
          next.delete(provider);
        }
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  // Use keywords hook to create new concepts
  const { createKeyword, deleteKeyword, refresh: refreshKeywords } = useKeywords({ autoFetch: false });

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

  // Defer filter values for expensive computations (INP optimization)
  // This keeps the select UI responsive while filtering happens in background
  const deferredFilterGroup = useDeferredValue(filterGroup);
  const deferredFilterConcept = useDeferredValue(filterConcept);
  const deferredFilterFunnel = useDeferredValue(filterFunnel);

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

  // Show consistency columns toggle (default hidden to reduce visual clutter)
  const [showConsistency, setShowConsistency] = useState(false);

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    keywordsCreated?: number;
    duplicatesUpdated?: number;
    questionsAddedToDuplicates?: number;
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state (single concept)
  const [conceptToDelete, setConceptToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCounts, setDeleteCounts] = useState<{
    searchTerms: number;
    aliases: number;
    aiQuestions: number;
    llmChecks: number;
    rankChecks: number;
    geoGridChecks: number;
    geoGridTracked: boolean;
    hasSchedule: boolean;
    scheduleFrequency: string | null;
    promptPages: number;
    reviewMatches: number;
  } | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // Bulk delete state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteAction, setBulkDeleteAction] = useState<'questions' | 'concepts' | null>(null);

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
          relatedQuestions: (k.relatedQuestions || []).map((q) => {
            if (typeof q === 'string') {
              // Handle edge case: stringified JSON objects
              if (q.startsWith('{') && q.includes('"question"')) {
                try {
                  const parsed = JSON.parse(q);
                  if (parsed && typeof parsed.question === 'string') {
                    return {
                      id: `${k.id}-${parsed.question}`,
                      question: parsed.question,
                      funnelStage: (parsed.funnelStage || parsed.funnel_stage || 'top') as 'top' | 'middle' | 'bottom',
                      groupId: parsed.groupId || parsed.group_id || null,
                    };
                  }
                } catch {
                  // Not valid JSON, use as plain string
                }
              }
              // Use question text in composite ID so bulk-move API can extract it
              return { id: `${k.id}-${q}`, question: q, funnelStage: 'top' as const, groupId: null };
            }
            return {
              // Use question text in composite ID so bulk-move API can extract it
              id: q.id || `${k.id}-${q.question}`,
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

      // Count unique questions that have at least one citation from any provider
      const citedQuestions = new Set(
        Array.from(uniqueChecks.values())
          .filter(r => r.domainCited)
          .map(r => r.question)
      );
      const questionsCited = citedQuestions.size;

      // Count unique questions that have at least one brand mention from any provider
      const mentionedQuestions = new Set(
        Array.from(uniqueChecks.values())
          .filter(r => r.brandMentioned)
          .map(r => r.question)
      );
      const questionsMentioned = mentionedQuestions.size;

      // Calculate consistency (standard deviation of citation rates)
      const questionRates = new Map<string, { cited: number; total: number }>();
      for (const result of uniqueChecks.values()) {
        const existing = questionRates.get(result.question) || { cited: 0, total: 0 };
        existing.total++;
        if (result.domainCited) existing.cited++;
        questionRates.set(result.question, existing);
      }

      // Overall consistency (std dev of per-question citation rates)
      const rates = Array.from(questionRates.values()).map(q => (q.cited / q.total) * 100);
      const overallConsistency = rates.length > 1 ? calculateStdDev(rates) : null;

      // Per-provider consistency
      const providerConsistency: Record<string, number | null> = {};
      for (const provider of LLM_PROVIDERS) {
        const providerResults = Array.from(uniqueChecks.values()).filter(r => r.llmProvider === provider);
        if (providerResults.length > 1) {
          const providerRates = providerResults.map(r => r.domainCited ? 100 : 0);
          providerConsistency[provider] = calculateStdDev(providerRates);
        } else {
          providerConsistency[provider] = null;
        }
      }

      setAccountSummary({
        totalKeywords,
        keywordsWithQuestions: totalKeywords,
        totalQuestions,
        questionsChecked: uniqueQuestionsChecked,
        questionsCited,
        questionsMentioned,
        averageVisibility,
        providerStats,
        overallConsistency,
        providerConsistency,
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

  // Poll for batch status when there's an active run
  useEffect(() => {
    if (!activeBatchRun || !['pending', 'processing'].includes(activeBatchRun.status)) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const status = await apiClient.get<BatchStatus>(
          `/llm-visibility/batch-status?runId=${activeBatchRun.runId}`
        );
        setActiveBatchRun(status);

        // If completed or failed, refresh data and show toast
        if (['completed', 'failed'].includes(status.status)) {
          clearInterval(pollInterval);
          setShowCompletedBanner(true); // Keep banner visible
          fetchData(); // Refresh to show new check results

          // Show toast notification
          if (status.status === 'completed') {
            if (status.failedChecks > 0) {
              showError(
                `LLM checks completed with ${status.failedChecks} failures. ` +
                `${status.creditsRefunded > 0 ? `${status.creditsRefunded} credits refunded.` : ''}`
              );
            } else {
              showSuccess(`All ${status.successfulChecks} LLM checks completed successfully!`);
            }
          } else {
            showError(`LLM batch run failed: ${status.errorMessage || 'Unknown error'}`);
          }
        }
      } catch (err) {
        console.error('[AISearch] Batch polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [activeBatchRun?.runId, activeBatchRun?.status, fetchData, showSuccess, showError]);

  // Check for active or recently completed batch run on mount
  useEffect(() => {
    const checkActiveBatch = async () => {
      try {
        const status = await apiClient.get<BatchStatus>('/llm-visibility/batch-status');
        if (!status) return;

        if (['pending', 'processing'].includes(status.status)) {
          // Active run - show progress banner
          setActiveBatchRun(status);
        } else if (['completed', 'failed'].includes(status.status)) {
          // Check if this run completed recently (within last 2 hours) and has failures
          // Show the banner so user can see results and retry if needed
          const completedAt = (status as BatchStatus & { completedAt?: string }).completedAt;
          const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
          const isRecent = completedAt && new Date(completedAt).getTime() > twoHoursAgo;
          const hasFailures = (status.failedChecks || 0) > 0;

          if (isRecent && hasFailures) {
            setActiveBatchRun(status);
            setShowCompletedBanner(true);
          }
        }
      } catch {
        // No batch run or error - ignore
      }
    };
    if (selectedAccountId) {
      checkActiveBatch();
    }
  }, [selectedAccountId]);

  // Build flattened question rows with results
  const questionRows = useMemo((): QuestionRow[] => {
    const rows: QuestionRow[] = [];

    for (const kw of keywords) {
      for (const q of kw.relatedQuestions) {
        // Get results for this question
        const questionResults = new Map<LLMProvider, LLMVisibilityCheck | null>();
        LLM_PROVIDERS.forEach(p => questionResults.set(p, null));

        // Track ALL results per provider for consistency calculation
        const providerChecks = new Map<LLMProvider, { total: number; cited: number; mentioned: number }>();
        LLM_PROVIDERS.forEach(p => providerChecks.set(p, { total: 0, cited: 0, mentioned: 0 }));

        let lastCheckedAt: string | null = null;

        for (const result of allResults) {
          if (result.question === q.question) {
            // Update most recent result
            const existing = questionResults.get(result.llmProvider);
            if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
              questionResults.set(result.llmProvider, result);
              if (!lastCheckedAt || new Date(result.checkedAt) > new Date(lastCheckedAt)) {
                lastCheckedAt = result.checkedAt;
              }
            }

            // Track for consistency calculation
            const checks = providerChecks.get(result.llmProvider)!;
            checks.total++;
            if (result.domainCited) {
              checks.cited++;
            }
            if (result.brandMentioned) {
              checks.mentioned++;
            }
          }
        }

        // Calculate per-provider consistency (for both citations and mentions)
        const consistencyMap = new Map<LLMProvider, ProviderConsistency | null>();
        LLM_PROVIDERS.forEach(provider => {
          const checks = providerChecks.get(provider)!;
          if (checks.total === 0) {
            consistencyMap.set(provider, null);
          } else {
            // Consistency = how often the majority answer appears
            // If 8/10 cited, consistency = 80%. If 5/10 cited, consistency = 50%.
            const citationMajority = Math.max(checks.cited, checks.total - checks.cited);
            const citationConsistency = Math.round((citationMajority / checks.total) * 100);

            const mentionMajority = Math.max(checks.mentioned, checks.total - checks.mentioned);
            const mentionConsistency = Math.round((mentionMajority / checks.total) * 100);

            consistencyMap.set(provider, {
              totalChecks: checks.total,
              citedCount: checks.cited,
              mentionedCount: checks.mentioned,
              citationConsistency,
              mentionConsistency,
            });
          }
        });

        rows.push({
          id: q.id || `${kw.id}-${q.question}`,
          question: q.question,
          funnelStage: q.funnelStage || 'top',
          conceptId: kw.id,
          conceptName: kw.phrase,
          groupId: q.groupId || null,
          results: questionResults,
          lastCheckedAt,
          consistency: consistencyMap,
        });
      }
    }

    return rows;
  }, [keywords, allResults]);

  // Get unique concept names for filter
  const conceptOptions = useMemo(() => {
    return Array.from(new Set(keywords.map(k => k.phrase))).sort();
  }, [keywords]);

  // Calculate actual ungrouped count from the displayed data
  // This fixes the mismatch between API count (from keyword_questions table only)
  // and UI display (which may include questions from JSONB field)
  const actualUngroupedCount = useMemo(() => {
    return questionRows.filter(r => !r.groupId).length;
  }, [questionRows]);

  // Apply filters and sorting (uses deferred values for INP optimization)
  const filteredAndSortedRows = useMemo(() => {
    let rows = [...questionRows];

    // Apply filters using deferred values for smoother UI
    if (deferredFilterConcept) {
      rows = rows.filter(r => r.conceptName === deferredFilterConcept);
    }
    if (deferredFilterFunnel) {
      rows = rows.filter(r => r.funnelStage === deferredFilterFunnel);
    }
    if (deferredFilterGroup) {
      if (deferredFilterGroup === 'ungrouped') {
        rows = rows.filter(r => !r.groupId);
      } else {
        rows = rows.filter(r => r.groupId === deferredFilterGroup);
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
  }, [questionRows, deferredFilterConcept, deferredFilterFunnel, deferredFilterGroup, sortField, sortDirection]);

  // Calculate display stats based on selected providers and optional group filter
  const displayStats = useMemo(() => {
    // Determine which questions to include
    let relevantQuestions: Set<string>;
    let totalQuestions: number;

    if (filterGroup) {
      // When group filter is active, use filtered rows
      const rows = filteredAndSortedRows;
      if (rows.length === 0) return null;
      relevantQuestions = new Set(rows.map(r => r.question));
      totalQuestions = rows.length;
    } else {
      // No group filter - use all questions
      relevantQuestions = new Set(questionRows.map(r => r.question));
      totalQuestions = questionRows.length;
    }

    if (relevantQuestions.size === 0) return null;

    // Get results only for relevant questions AND selected providers
    const filteredResults = allResults.filter(r =>
      relevantQuestions.has(r.question) && selectedProviders.has(r.llmProvider)
    );

    // Group results by question+provider to get unique checks (most recent per combo)
    const uniqueChecks = new Map<string, LLMVisibilityCheck>();
    for (const result of filteredResults) {
      const key = `${result.question}:${result.llmProvider}`;
      const existing = uniqueChecks.get(key);
      if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
        uniqueChecks.set(key, result);
      }
    }

    // Calculate provider stats (only for selected providers)
    const providerStats: Record<string, { checked: number; cited: number; mentioned: number }> = {};
    for (const result of uniqueChecks.values()) {
      if (!providerStats[result.llmProvider]) {
        providerStats[result.llmProvider] = { checked: 0, cited: 0, mentioned: 0 };
      }
      providerStats[result.llmProvider].checked++;
      if (result.domainCited) providerStats[result.llmProvider].cited++;
      if (result.brandMentioned) providerStats[result.llmProvider].mentioned++;
    }

    // Calculate citation rate (across selected providers)
    const citedCount = Array.from(uniqueChecks.values()).filter(r => r.domainCited).length;
    const mentionedCount = Array.from(uniqueChecks.values()).filter(r => r.brandMentioned).length;
    const averageVisibility = uniqueChecks.size > 0
      ? (citedCount / uniqueChecks.size) * 100
      : null;
    const averageMentionRate = uniqueChecks.size > 0
      ? (mentionedCount / uniqueChecks.size) * 100
      : null;

    // Count unique questions that have been checked (by selected providers)
    const questionsChecked = new Set(
      Array.from(uniqueChecks.values()).map(r => r.question)
    ).size;

    // Count unique questions that have at least one citation from selected providers
    const citedQuestions = new Set(
      Array.from(uniqueChecks.values())
        .filter(r => r.domainCited)
        .map(r => r.question)
    );
    const questionsCited = citedQuestions.size;

    // Count unique questions that have at least one brand mention from selected providers
    const mentionedQuestions = new Set(
      Array.from(uniqueChecks.values())
        .filter(r => r.brandMentioned)
        .map(r => r.question)
    );
    const questionsMentioned = mentionedQuestions.size;

    // Calculate REPEATABILITY (how consistent is each provider when asked the same question multiple times)
    // This uses the per-question consistency scores from questionRows

    // Get relevant rows (filtered if group filter active)
    const relevantRows = filterGroup
      ? filteredAndSortedRows
      : questionRows;

    // Calculate per-provider citation consistency (average of per-question consistency scores)
    const providerCitationConsistency: Record<string, number | null> = {};
    for (const provider of LLM_PROVIDERS) {
      if (!selectedProviders.has(provider)) {
        providerCitationConsistency[provider] = null;
        continue;
      }

      const scores: number[] = [];
      for (const row of relevantRows) {
        const consistency = row.consistency.get(provider as LLMProvider);
        if (consistency && consistency.totalChecks >= 2) {
          scores.push(consistency.citationConsistency);
        }
      }

      providerCitationConsistency[provider] = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : null;
    }

    // Calculate overall citation consistency (average across all providers)
    const allCitationScores = Object.values(providerCitationConsistency).filter((v): v is number => v !== null);
    const overallCitationConsistency = allCitationScores.length > 0
      ? Math.round(allCitationScores.reduce((sum, s) => sum + s, 0) / allCitationScores.length)
      : null;

    // Calculate per-provider mention consistency
    const providerMentionConsistency: Record<string, number | null> = {};
    for (const provider of LLM_PROVIDERS) {
      if (!selectedProviders.has(provider)) {
        providerMentionConsistency[provider] = null;
        continue;
      }

      const scores: number[] = [];
      for (const row of relevantRows) {
        const consistency = row.consistency.get(provider as LLMProvider);
        if (consistency && consistency.totalChecks >= 2) {
          scores.push(consistency.mentionConsistency);
        }
      }

      providerMentionConsistency[provider] = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : null;
    }

    // Calculate overall mention consistency (average across all providers)
    const allMentionScores = Object.values(providerMentionConsistency).filter((v): v is number => v !== null);
    const overallMentionConsistency = allMentionScores.length > 0
      ? Math.round(allMentionScores.reduce((sum, s) => sum + s, 0) / allMentionScores.length)
      : null;

    return {
      totalQuestions,
      questionsChecked,
      questionsCited,
      questionsMentioned,
      averageVisibility,
      averageMentionRate,
      providerStats,
      overallCitationConsistency,
      providerCitationConsistency,
      overallMentionConsistency,
      providerMentionConsistency,
      isFiltered: !!filterGroup,
    };
  }, [filterGroup, filteredAndSortedRows, questionRows, allResults, selectedProviders]);

  // Get group name for display
  const activeGroupName = useMemo(() => {
    if (!filterGroup) return null;
    if (filterGroup === 'ungrouped') return 'Ungrouped';
    const group = queryGroups.find(g => g.id === filterGroup);
    return group?.name || 'Unknown group';
  }, [filterGroup, queryGroups]);

  // Calculate trend data (comparing last 30 days vs previous 30 days)
  const trendStats = useMemo(() => {
    // Get relevant results (filtered by group if active AND selected providers)
    let relevantResults = allResults.filter(r => selectedProviders.has(r.llmProvider));
    if (filterGroup && filteredAndSortedRows.length > 0) {
      const filteredQuestions = new Set(filteredAndSortedRows.map(r => r.question));
      relevantResults = relevantResults.filter(r => filteredQuestions.has(r.question));
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
          ? { direction: 'up' as const, change: Math.round(current) }
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
  }, [allResults, filterGroup, filteredAndSortedRows, selectedProviders]);

  // Filter results for chart when group filter and/or provider filter is active
  const chartResults = useMemo(() => {
    let results = allResults.filter(r => selectedProviders.has(r.llmProvider));
    if (filterGroup && filteredAndSortedRows.length > 0) {
      const filteredQuestions = new Set(filteredAndSortedRows.map(r => r.question));
      results = results.filter(r => filteredQuestions.has(r.question));
    }
    return results;
  }, [allResults, filterGroup, filteredAndSortedRows, selectedProviders]);

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
      const response = await apiClient.download('/keywords/upload?type=llm');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'llm-visibility-template.csv';
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
        duplicatesUpdated?: number;
        questionsAddedToDuplicates?: number;
        duplicatePhrases?: string[];
        errors?: string[];
      }>('/keywords/upload', formData);

      setImportResult({
        success: true,
        message: result.message || 'Import successful',
        keywordsCreated: result.keywordsCreated,
        duplicatesUpdated: result.duplicatesUpdated,
        questionsAddedToDuplicates: result.questionsAddedToDuplicates,
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

  // Handle selecting a concept for deletion (fetch counts first)
  const handleSelectConceptToDelete = useCallback(async (id: string, name: string) => {
    setConceptToDelete({ id, name });
    setDeleteCounts(null);
    setIsLoadingCounts(true);
    try {
      const response = await apiClient.get<{
        counts: {
          searchTerms: number;
          aliases: number;
          aiQuestions: number;
          llmChecks: number;
          rankChecks: number;
          geoGridChecks: number;
          geoGridTracked: boolean;
          hasSchedule: boolean;
          scheduleFrequency: string | null;
          promptPages: number;
          reviewMatches: number;
        };
      }>(`/keywords/${id}/delete-counts`);
      setDeleteCounts(response.counts);
    } catch (err) {
      console.error('[AISearch] Error fetching delete counts:', err);
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  // Handle concept deletion
  const handleDeleteConcept = useCallback(async () => {
    if (!conceptToDelete) return;
    setIsDeleting(true);
    try {
      await deleteKeyword(conceptToDelete.id);
      setConceptToDelete(null);
      setDeleteCounts(null);
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('[AISearch] Error deleting concept:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [conceptToDelete, deleteKeyword, fetchData]);

  // Handle bulk delete of selected questions only
  const handleBulkDeleteQuestions = useCallback(async () => {
    if (selectedQuestionIds.size === 0) return;
    setBulkDeleteAction('questions');
    try {
      const questionIds = Array.from(selectedQuestionIds);
      await apiClient.post('/keyword-questions/bulk-delete', { questionIds });
      setSelectedQuestionIds(new Set());
      setShowBulkDeleteModal(false);
      showSuccess(`Deleted ${questionIds.length} question${questionIds.length === 1 ? '' : 's'}`);
      await fetchData();
      await refreshGroups(); // Refresh group counts
    } catch (err) {
      console.error('[AISearch] Error bulk deleting questions:', err);
      showError('Failed to delete questions. Please try again.');
    } finally {
      setBulkDeleteAction(null);
    }
  }, [selectedQuestionIds, fetchData, refreshGroups, showSuccess, showError]);

  // Handle bulk delete of concepts containing selected questions
  const handleBulkDeleteConcepts = useCallback(async () => {
    if (selectedQuestionIds.size === 0) return;
    setBulkDeleteAction('concepts');
    try {
      // Get unique concept IDs from selected questions
      const conceptIds = new Set<string>();
      filteredAndSortedRows.forEach(row => {
        if (selectedQuestionIds.has(row.id)) {
          conceptIds.add(row.conceptId);
        }
      });

      // Delete each concept
      let deletedCount = 0;
      for (const conceptId of conceptIds) {
        try {
          await deleteKeyword(conceptId);
          deletedCount++;
        } catch (err) {
          console.error(`[AISearch] Error deleting concept ${conceptId}:`, err);
        }
      }

      setSelectedQuestionIds(new Set());
      setShowBulkDeleteModal(false);
      showSuccess(`Deleted ${deletedCount} concept${deletedCount === 1 ? '' : 's'}`);
      await fetchData();
      await refreshGroups(); // Refresh group counts
    } catch (err) {
      console.error('[AISearch] Error bulk deleting concepts:', err);
      showError('Failed to delete concepts. Please try again.');
    } finally {
      setBulkDeleteAction(null);
    }
  }, [selectedQuestionIds, filteredAndSortedRows, deleteKeyword, fetchData, refreshGroups, showSuccess, showError]);

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
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">LLM Visibility</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <SubNav
        items={[
          { label: 'LLM tracking', icon: 'FaSparkles', href: '/dashboard/ai-search', matchType: 'exact' },
          { label: 'Visibility opportunities', icon: 'FaGlobe', href: '/dashboard/ai-search/research-sources', matchType: 'exact' },
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
          description="Track whether LLM chatbots cite your domain or mention your brand when answering questions."
          actions={
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {keywords.length > 0 && (() => {
                const isBatchRunning = !!(activeBatchRun && ['pending', 'processing'].includes(activeBatchRun.status));

                // Handle retry from history dropdown
                const handleRetryFromHistory = async (runId: string) => {
                  try {
                    const response = await apiClient.post<{
                      success: boolean;
                      runId: string;
                      totalQuestions: number;
                      providers: LLMProvider[];
                      estimatedCredits: number;
                      error?: string;
                    }>('/llm-visibility/batch-run', {
                      providers: ['chatgpt', 'claude', 'gemini', 'perplexity'], // Default to all providers
                      retryFailedFromRunId: runId,
                    });

                    if (response.success) {
                      setShowCompletedBanner(false);
                      setActiveBatchRun({
                        runId: response.runId,
                        status: 'pending',
                        providers: response.providers,
                        totalQuestions: response.totalQuestions,
                        processedQuestions: 0,
                        successfulChecks: 0,
                        failedChecks: 0,
                        progress: 0,
                        creditsRefunded: 0,
                        errorMessage: null,
                      });
                      showSuccess(`Retrying ${response.totalQuestions} failed checks...`);
                    } else {
                      showError(response.error || 'Failed to start retry');
                    }
                  } catch (err: unknown) {
                    let errorMessage = 'Failed to retry failed checks';
                    if (err instanceof Error) {
                      const errAny = err as { responseBody?: { required?: number; available?: number } };
                      if (errAny.responseBody?.required !== undefined && errAny.responseBody?.available !== undefined) {
                        errorMessage = `Insufficient credits: need ${errAny.responseBody.required}, have ${errAny.responseBody.available}`;
                      } else {
                        errorMessage = err.message;
                      }
                    }
                    showError(errorMessage);
                  }
                };

                return (
                  <>
                    <button
                      onClick={() => setShowRunAllModal(true)}
                      disabled={isBatchRunning}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                        isBatchRunning
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'text-white bg-green-600 hover:bg-green-700'
                      }`}
                      title={isBatchRunning ? 'Batch check already in progress' : 'Run LLM visibility checks on all questions'}
                    >
                      {isBatchRunning ? (
                        <>
                          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                          {activeBatchRun.progress}% complete
                        </>
                      ) : (
                        <>
                          <PromptyIcon className="w-4 h-4" />
                          Check all
                        </>
                      )}
                    </button>
                    <BatchRunHistoryDropdown
                      feature="llm_visibility"
                      onRetry={handleRetryFromHistory}
                    />
                  </>
                );
              })()}
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

        {/* Batch Progress Banner - shows during run AND after completion */}
        {activeBatchRun && (
          ['pending', 'processing'].includes(activeBatchRun.status) ||
          (showCompletedBanner && ['completed', 'failed'].includes(activeBatchRun.status))
        ) && !showRunAllModal && (() => {
          const isRunning = ['pending', 'processing'].includes(activeBatchRun.status);
          const isCompleted = activeBatchRun.status === 'completed';
          const isFailed = activeBatchRun.status === 'failed';
          const hasFailures = (activeBatchRun.failedChecks || 0) > 0;

          // Progress banner styling based on status
          const bannerStyles = isRunning
            ? 'bg-blue-50 border-blue-200'
            : isCompleted && !hasFailures
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200';

          const textColor = isRunning
            ? 'text-slate-blue'
            : isCompleted && !hasFailures
              ? 'text-green-700'
              : 'text-amber-700';

          const iconColor = isRunning
            ? 'text-slate-blue'
            : isCompleted && !hasFailures
              ? 'text-green-600'
              : 'text-amber-600';

          // Time estimate for running state
          const remaining = activeBatchRun.totalQuestions - activeBatchRun.processedQuestions;
          const secondsPerQuestion = 4 * (activeBatchRun.providers?.length || 4);
          const estimatedSeconds = remaining * secondsPerQuestion;
          const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
          const timeEstimate = estimatedMinutes <= 1 ? 'less than a minute' : `~${estimatedMinutes} min`;

          // Retry failed checks handler
          const handleRetryFailed = async () => {
            if (isRetryingFailed || !activeBatchRun.failedChecks) return;
            setIsRetryingFailed(true);
            try {
              const response = await apiClient.post<{
                success: boolean;
                runId: string;
                totalQuestions: number;
                providers: LLMProvider[];
                estimatedCredits: number;
                error?: string;
              }>('/llm-visibility/batch-run', {
                providers: activeBatchRun.providers,
                retryFailedFromRunId: activeBatchRun.runId,
              });

              if (response.success) {
                setShowCompletedBanner(false);
                setActiveBatchRun({
                  runId: response.runId,
                  status: 'pending',
                  providers: response.providers,
                  totalQuestions: response.totalQuestions,
                  processedQuestions: 0,
                  successfulChecks: 0,
                  failedChecks: 0,
                  progress: 0,
                  creditsRefunded: 0,
                  errorMessage: null,
                });
                showSuccess(`Retrying ${response.totalQuestions} failed checks...`);
              } else {
                showError(response.error || 'Failed to start retry');
              }
            } catch (err: unknown) {
              // Parse error to get better message for insufficient credits
              let errorMessage = 'Failed to retry failed checks';
              if (err instanceof Error) {
                const errAny = err as { responseBody?: { required?: number; available?: number; error?: string } };
                // Check if this is an insufficient credits error with details
                if (errAny.responseBody?.required !== undefined && errAny.responseBody?.available !== undefined) {
                  errorMessage = `Insufficient credits: need ${errAny.responseBody.required}, have ${errAny.responseBody.available}`;
                } else {
                  errorMessage = err.message;
                }
              }
              showError(errorMessage);
            } finally {
              setIsRetryingFailed(false);
            }
          };

          // Dismiss handler
          const handleDismiss = () => {
            setShowCompletedBanner(false);
            setActiveBatchRun(null);
          };

          return (
          <div className={`mb-6 p-4 border rounded-xl ${bannerStyles}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isRunning ? (
                  <Icon name="FaSpinner" className={`w-5 h-5 ${iconColor} animate-spin`} />
                ) : isCompleted && !hasFailures ? (
                  <Icon name="FaCheckCircle" className={`w-5 h-5 ${iconColor}`} />
                ) : (
                  <Icon name="FaExclamationTriangle" className={`w-5 h-5 ${iconColor}`} />
                )}
                <div>
                  <p className={`text-sm font-medium ${textColor}`}>
                    {isRunning
                      ? `${activeBatchRun.status === 'pending' ? 'Queued' : 'Checking'} LLM visibility...`
                      : isCompleted && !hasFailures
                        ? 'LLM checks completed successfully!'
                        : isFailed
                          ? 'LLM batch run failed'
                          : `LLM checks completed with ${activeBatchRun.failedChecks} failures`
                    }
                  </p>
                  <p className={`text-xs ${textColor}/70`}>
                    {isRunning ? (
                      <>
                        {activeBatchRun.processedQuestions} of {activeBatchRun.totalQuestions} questions · {activeBatchRun.progress}% complete · {timeEstimate} remaining
                      </>
                    ) : (
                      <>
                        {activeBatchRun.successfulChecks} successful
                        {hasFailures && `, ${activeBatchRun.failedChecks} failed`}
                        {(activeBatchRun.creditsRefunded || 0) > 0 && (
                          <> · <Icon name="FaCoins" className="w-3 h-3 inline" /> {activeBatchRun.creditsRefunded} credits refunded</>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isRunning ? (
                  <>
                    {/* Progress bar */}
                    <div className="w-32 bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-slate-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${activeBatchRun.progress}%` }}
                      />
                    </div>
                    <button
                      onClick={() => setShowRunAllModal(true)}
                      className="text-xs text-slate-blue hover:text-slate-blue/80 font-medium"
                    >
                      Details
                    </button>
                  </>
                ) : (
                  <>
                    {/* Retry failed button */}
                    {hasFailures && (
                      <button
                        onClick={handleRetryFailed}
                        disabled={isRetryingFailed}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                          isRetryingFailed
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
                        }`}
                      >
                        {isRetryingFailed ? (
                          <>
                            <Icon name="FaSpinner" className="w-3 h-3 inline mr-1 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <Icon name="FaRedo" className="w-3 h-3 inline mr-1" />
                            Retry {activeBatchRun.failedChecks} failed
                          </>
                        )}
                      </button>
                    )}
                    {/* Dismiss button */}
                    <button
                      onClick={handleDismiss}
                      className={`text-xs ${textColor}/70 hover:${textColor} font-medium`}
                      aria-label="Dismiss notification"
                    >
                      <Icon name="FaTimes" className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
          </div>
        ) : keywords.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Trend Chart - filtered by group when filter active */}
            <LLMVisibilityTrendChart results={chartResults} isLoading={isLoading} />

            {/* Provider Filter Row */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Include providers:</span>
              <div className="flex flex-wrap gap-2">
                {LLM_PROVIDERS.map((provider) => {
                  const isSelected = selectedProviders.has(provider);
                  const colors = LLM_PROVIDER_COLORS[provider];
                  return (
                    <button
                      key={provider}
                      onClick={() => toggleProvider(provider)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                        isSelected
                          ? `${colors.bg} ${colors.text} ${colors.border} border`
                          : 'bg-gray-100 text-gray-400 border border-gray-200 line-through'
                      }`}
                      title={isSelected ? `Click to exclude ${LLM_PROVIDER_LABELS[provider]}` : `Click to include ${LLM_PROVIDER_LABELS[provider]}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        isSelected ? `${colors.border} ${colors.text}` : 'border-gray-300'
                      }`}>
                        {isSelected && <Icon name="FaCheck" className="w-2 h-2" />}
                      </span>
                      {LLM_PROVIDER_LABELS[provider]}
                      <span className="opacity-70">({LLM_PROVIDER_MODELS[provider]})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary Stats */}
            {displayStats && (
              <div className="mb-6">
                {/* Group filter indicator */}
                {displayStats.isFiltered && activeGroupName && (
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Citation Rate with Trend and Per-Model Rates */}
                  <div className={`p-4 rounded-xl border ${displayStats.isFiltered ? 'bg-gradient-to-br from-slate-blue/10 to-blue-50 border-slate-blue/20' : 'bg-gradient-to-br from-blue-50 to-pink-50 border-blue-100'}`}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-blue">
                        {displayStats.averageVisibility !== null ? `${displayStats.averageVisibility.toFixed(2)}%` : '--'}
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
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      Citation rate
                      <span title="Percentage of checks where your site was cited as a source in the AI response">
                        <Icon name="FaInfoCircle" className="w-3 h-3 text-gray-400 cursor-help" />
                      </span>
                    </div>
                    {/* Per-model citation rates - only show selected providers */}
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {LLM_PROVIDERS.filter(p => selectedProviders.has(p)).map((provider) => {
                        const stats = displayStats.providerStats[provider];
                        const colors = LLM_PROVIDER_COLORS[provider];
                        const rate = stats && stats.checked > 0
                          ? Math.round((stats.cited / stats.checked) * 100)
                          : null;
                        return (
                          <span
                            key={provider}
                            className={`px-1.5 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}
                            title={`${LLM_PROVIDER_LABELS[provider]}: ${stats?.cited || 0} cited / ${stats?.checked || 0} checked`}
                          >
                            {rate !== null ? `${rate}%` : '--'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mention Rate with Per-Model Rates */}
                  <div className={`p-4 rounded-xl border ${displayStats.isFiltered ? 'bg-gradient-to-br from-blue-50/80 to-cyan-50 border-blue-100' : 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-100'}`}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {displayStats.averageMentionRate !== null ? `${displayStats.averageMentionRate.toFixed(2)}%` : '--'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      Mention rate
                      <span title="Percentage of checks where your brand was mentioned in the AI response text">
                        <Icon name="FaInfoCircle" className="w-3 h-3 text-gray-400 cursor-help" />
                      </span>
                    </div>
                    {/* Per-model mention rates - only show selected providers */}
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {LLM_PROVIDERS.filter(p => selectedProviders.has(p)).map((provider) => {
                        const stats = displayStats.providerStats[provider];
                        const colors = LLM_PROVIDER_COLORS[provider];
                        const rate = stats && stats.checked > 0
                          ? Math.round((stats.mentioned / stats.checked) * 100)
                          : null;
                        return (
                          <span
                            key={provider}
                            className={`px-1.5 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}
                            title={`${LLM_PROVIDER_LABELS[provider]}: ${stats?.mentioned || 0} mentioned / ${stats?.checked || 0} checked`}
                          >
                            {rate !== null ? `${rate}%` : '--'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Questions Tracked & Cited */}
                  <div className={`p-4 rounded-xl border ${displayStats.isFiltered ? 'bg-slate-50 border-slate-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-2xl font-bold text-gray-800">
                      {displayStats.questionsChecked}/{displayStats.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Questions tracked</div>
                    <div className="mt-1 text-sm flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        <span className="font-semibold text-green-600">{displayStats.questionsCited}</span>
                        <span className="text-gray-500"> cited</span>
                      </span>
                      <span>
                        <span className="font-semibold text-blue-600">{displayStats.questionsMentioned}</span>
                        <span className="text-gray-500"> mentioned</span>
                      </span>
                    </div>
                  </div>

                  {/* Consistency - how consistent is each provider across multiple checks of the same question */}
                  <div className={`p-4 rounded-xl border ${displayStats.isFiltered ? 'bg-slate-50 border-slate-200' : 'bg-gray-50 border-gray-200'}`}>
                    {/* Citation consistency */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="FaLink" className="w-4 h-4 text-green-600" />
                        <span className="text-2xl font-bold text-gray-800">
                          {displayStats.overallCitationConsistency !== null
                            ? `${displayStats.overallCitationConsistency}%`
                            : '--'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                        Citation consistency
                        <span title="How often each provider gives the same citation answer when re-checking the same question">
                          <Icon name="FaInfoCircle" className="w-3 h-3 text-gray-400 cursor-help" />
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {LLM_PROVIDERS.filter(p => selectedProviders.has(p)).map((provider) => {
                          const score = displayStats.providerCitationConsistency[provider];
                          const colors = LLM_PROVIDER_COLORS[provider];
                          return (
                            <span
                              key={provider}
                              className={`px-1 py-0.5 rounded text-[10px] ${colors.bg} ${colors.text}`}
                              title={`${LLM_PROVIDER_LABELS[provider]}: ${score !== null ? `${score}% citation consistent` : 'needs 2+ checks'}`}
                            >
                              {score !== null ? `${score}%` : '--'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mention consistency */}
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon name="FaCommentAlt" className="w-4 h-4 text-blue-600" />
                        <span className="text-2xl font-bold text-gray-800">
                          {displayStats.overallMentionConsistency !== null
                            ? `${displayStats.overallMentionConsistency}%`
                            : '--'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                        Mention consistency
                        <span title="How often each provider gives the same mention answer when re-checking the same question">
                          <Icon name="FaInfoCircle" className="w-3 h-3 text-gray-400 cursor-help" />
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {LLM_PROVIDERS.filter(p => selectedProviders.has(p)).map((provider) => {
                          const score = displayStats.providerMentionConsistency[provider];
                          const colors = LLM_PROVIDER_COLORS[provider];
                          return (
                            <span
                              key={provider}
                              className={`px-1 py-0.5 rounded text-[10px] ${colors.bg} ${colors.text}`}
                              title={`${LLM_PROVIDER_LABELS[provider]}: ${score !== null ? `${score}% mention consistent` : 'needs 2+ checks'}`}
                            >
                              {score !== null ? `${score}%` : '--'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
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
                  <option value="ungrouped">Ungrouped ({actualUngroupedCount})</option>
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
                onClick={() => startTransition(() => setShowManageGroupsModal(true))}
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

              {/* Show consistency toggle */}
              <button
                onClick={() => setShowConsistency(!showConsistency)}
                className="inline-flex items-center gap-2 text-sm text-gray-600"
                title={showConsistency ? 'Hide consistency columns' : 'Show consistency columns'}
              >
                <span>Consistency</span>
                <div className={`relative w-9 h-5 rounded-full transition-colors ${showConsistency ? 'bg-slate-blue' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showConsistency ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>

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
                    {/* Provider columns - results and consistency (citations + mentions) */}
                    {LLM_PROVIDERS.map(provider => {
                      const colors = LLM_PROVIDER_COLORS[provider];
                      return (
                        <React.Fragment key={provider}>
                          <th className="text-center py-3 px-2 w-16 align-middle">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${colors.bg} ${colors.text}`}>
                              {LLM_PROVIDER_LABELS[provider]}
                            </span>
                          </th>
                          {showConsistency && (
                            <>
                              <th className="text-center py-3 px-1 w-9 align-middle">
                                <span
                                  className={`cursor-help ${colors.text}`}
                                  title={`${LLM_PROVIDER_LABELS[provider]} citation consistency: How often this provider gives the same citation answer when re-checking`}
                                >
                                  <Icon name="FaLink" className="w-3 h-3" />
                                </span>
                              </th>
                              <th className="text-center py-3 px-1 w-9 align-middle">
                                <span
                                  className={`cursor-help ${colors.text}`}
                                  title={`${LLM_PROVIDER_LABELS[provider]} mention consistency: How often this provider gives the same mention answer when re-checking`}
                                >
                                  <Icon name="FaCommentAlt" className="w-3 h-3" />
                                </span>
                              </th>
                            </>
                          )}
                        </React.Fragment>
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
                                aria-label={`Edit ${row.conceptName}`}
                              >
                                <Icon name="FaEdit" className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectConceptToDelete(row.conceptId, row.conceptName);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title={`Delete ${row.conceptName}`}
                                aria-label={`Delete ${row.conceptName}`}
                              >
                                <Icon name="FaTrash" className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Provider Status Columns + Consistency */}
                          {LLM_PROVIDERS.map(provider => {
                            const result = row.results.get(provider);
                            const consistencyData = row.consistency.get(provider);
                            const colors = LLM_PROVIDER_COLORS[provider];
                            const isBatchRunning = activeBatchRun && ['pending', 'processing'].includes(activeBatchRun.status);
                            const providerInBatch = isBatchRunning && activeBatchRun.providers.includes(provider);

                            if (!result) {
                              // Not checked yet - show pending indicator if batch is running for this provider
                              return (
                                <React.Fragment key={provider}>
                                  <td className="py-3 px-2 text-center">
                                    {providerInBatch ? (
                                      <span className="text-blue-400" title="Check pending...">
                                        <Icon name="FaClock" className="w-3.5 h-3.5" />
                                      </span>
                                    ) : (
                                      <span className="text-gray-300" title="Not checked">—</span>
                                    )}
                                  </td>
                                  {showConsistency && (
                                    <>
                                      <td className="py-3 px-1 text-center">
                                        <span className="text-gray-300 text-[10px]">—</span>
                                      </td>
                                      <td className="py-3 px-1 text-center">
                                        <span className="text-gray-300 text-[10px]">—</span>
                                      </td>
                                    </>
                                  )}
                                </React.Fragment>
                              );
                            }

                            // Checked - show results
                            return (
                              <React.Fragment key={provider}>
                                <td className="py-3 px-2 text-center">
                                  <div className="flex flex-col items-center gap-0.5">
                                    {/* Citation status - show link if cited */}
                                    {result.domainCited ? (
                                      <span className="text-green-600 text-xs font-medium flex items-center gap-0.5" title={`Cited at position ${result.citationPosition}`}>
                                        <Icon name="FaLink" className="w-3 h-3" />
                                        #{result.citationPosition || '?'}
                                      </span>
                                    ) : result.brandMentioned ? (
                                      /* Brand mention without citation - show chat icon only, no X */
                                      <span className="text-slate-blue text-xs font-medium flex items-center gap-0.5" title="Brand mentioned in response (no citation link)">
                                        <Icon name="FaCommentAlt" className="w-3 h-3" />
                                      </span>
                                    ) : (
                                      /* Not cited and not mentioned - show X */
                                      <span className="text-amber-500 text-xs flex items-center gap-0.5" title="Checked - not cited or mentioned">
                                        <Icon name="FaTimes" className="w-3 h-3" />
                                      </span>
                                    )}
                                  </div>
                                </td>
                                {showConsistency && (
                                  <>
                                    {/* Citation consistency */}
                                    <td className="py-3 px-1 text-center">
                                      {consistencyData && consistencyData.totalChecks > 1 ? (
                                        <span
                                          className={`px-1 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}
                                          title={`${consistencyData.citationConsistency}% citation consistent (${consistencyData.citedCount}/${consistencyData.totalChecks} cited)`}
                                        >
                                          {consistencyData.citationConsistency}%
                                        </span>
                                      ) : (
                                        <span className="text-gray-300 text-[10px]">—</span>
                                      )}
                                    </td>
                                    {/* Mention consistency */}
                                    <td className="py-3 px-1 text-center">
                                      {consistencyData && consistencyData.totalChecks > 1 ? (
                                        <span
                                          className={`px-1 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}
                                          title={`${consistencyData.mentionConsistency}% mention consistent (${consistencyData.mentionedCount}/${consistencyData.totalChecks} mentioned)`}
                                        >
                                          {consistencyData.mentionConsistency}%
                                        </span>
                                      ) : (
                                        <span className="text-gray-300 text-[10px]">—</span>
                                      )}
                                    </td>
                                  </>
                                )}
                              </React.Fragment>
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
                            <td colSpan={8 + LLM_PROVIDERS.length * (showConsistency ? 3 : 1)} className="p-4">
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
                                                <span className="text-slate-blue font-medium flex items-center gap-1">
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
                <Icon name="FaCommentAlt" className="w-3 h-3 text-slate-blue" />
                <span>Brand mentioned in response</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon name="FaTimes" className="w-3 h-3 text-amber-500" />
                <span>Not cited or mentioned</span>
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
        onStarted={(batchStatus) => {
          setActiveBatchRun(batchStatus);
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
        ungroupedCount={actualUngroupedCount}
        onDelete={() => setShowBulkDeleteModal(true)}
      />

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Delete selected items"
        size="md"
      >
        {(() => {
          // Calculate unique concepts for selected questions
          const selectedConceptIds = new Set<string>();
          const selectedConceptNames: string[] = [];
          filteredAndSortedRows.forEach(row => {
            if (selectedQuestionIds.has(row.id) && !selectedConceptIds.has(row.conceptId)) {
              selectedConceptIds.add(row.conceptId);
              selectedConceptNames.push(row.conceptName);
            }
          });
          const conceptCount = selectedConceptIds.size;
          const questionCount = selectedQuestionIds.size;

          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You have <strong>{questionCount}</strong> {questionCount === 1 ? 'question' : 'questions'} selected
                from <strong>{conceptCount}</strong> {conceptCount === 1 ? 'concept' : 'concepts'}.
              </p>

              <p className="text-sm text-gray-600">What would you like to delete?</p>

              {/* Option 1: Delete questions only */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Delete questions only</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Remove the {questionCount} selected {questionCount === 1 ? 'question' : 'questions'} from their concepts.
                      The concepts and all other data will remain.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleBulkDeleteQuestions}
                    disabled={bulkDeleteAction !== null}
                    className="whitespace-nowrap"
                  >
                    {bulkDeleteAction === 'questions' ? (
                      <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Delete {questionCount} {questionCount === 1 ? 'question' : 'questions'}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Option 2: Delete entire concepts */}
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800">Delete entire concepts</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Permanently delete {conceptCount} {conceptCount === 1 ? 'concept' : 'concepts'} and ALL associated data
                      including questions, rank checks, LLM checks, geo-grid data, and schedules.
                    </p>
                    {conceptCount <= 5 && (
                      <p className="text-xs text-red-600 mt-2">
                        Concepts: {selectedConceptNames.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleBulkDeleteConcepts}
                    disabled={bulkDeleteAction !== null}
                    className="whitespace-nowrap bg-red-700 hover:bg-red-800"
                  >
                    {bulkDeleteAction === 'concepts' ? (
                      <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Delete {conceptCount} {conceptCount === 1 ? 'concept' : 'concepts'}</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowBulkDeleteModal(false)}
            disabled={bulkDeleteAction !== null}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

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

      {/* Delete Concept Modal */}
      <Modal
        isOpen={!!conceptToDelete}
        onClose={() => { setConceptToDelete(null); setDeleteCounts(null); }}
        title="Delete concept"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>&quot;{conceptToDelete?.name}&quot;</strong>?
        </p>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">Warning: This will permanently delete:</p>
          {isLoadingCounts ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-700">
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
              Loading details...
            </div>
          ) : deleteCounts ? (
            <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
              {deleteCounts.searchTerms > 0 && (
                <li>{deleteCounts.searchTerms} search {deleteCounts.searchTerms === 1 ? 'term' : 'terms'}</li>
              )}
              {deleteCounts.aliases > 0 && (
                <li>{deleteCounts.aliases} review {deleteCounts.aliases === 1 ? 'alias' : 'aliases'}</li>
              )}
              {deleteCounts.aiQuestions > 0 && (
                <li>{deleteCounts.aiQuestions} AI visibility {deleteCounts.aiQuestions === 1 ? 'question' : 'questions'}</li>
              )}
              {deleteCounts.llmChecks > 0 && (
                <li>{deleteCounts.llmChecks} LLM visibility {deleteCounts.llmChecks === 1 ? 'check' : 'checks'}</li>
              )}
              {deleteCounts.rankChecks > 0 && (
                <li>{deleteCounts.rankChecks} rank {deleteCounts.rankChecks === 1 ? 'check' : 'checks'}</li>
              )}
              {deleteCounts.geoGridChecks > 0 && (
                <li>{deleteCounts.geoGridChecks} geo grid {deleteCounts.geoGridChecks === 1 ? 'check' : 'checks'}</li>
              )}
              {deleteCounts.promptPages > 0 && (
                <li>{deleteCounts.promptPages} prompt page {deleteCounts.promptPages === 1 ? 'assignment' : 'assignments'}</li>
              )}
              {deleteCounts.reviewMatches > 0 && (
                <li>{deleteCounts.reviewMatches} review {deleteCounts.reviewMatches === 1 ? 'match' : 'matches'}</li>
              )}
              {deleteCounts.hasSchedule && (
                <li>1 scheduled check ({deleteCounts.scheduleFrequency})</li>
              )}
              {deleteCounts.searchTerms === 0 && deleteCounts.aliases === 0 && deleteCounts.aiQuestions === 0 &&
               deleteCounts.llmChecks === 0 && deleteCounts.rankChecks === 0 && deleteCounts.geoGridChecks === 0 &&
               deleteCounts.promptPages === 0 && deleteCounts.reviewMatches === 0 && !deleteCounts.hasSchedule && (
                <li>The concept (no associated data)</li>
              )}
            </ul>
          ) : (
            <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
              <li>The concept and all associated data</li>
            </ul>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          This action cannot be undone.
        </p>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => { setConceptToDelete(null); setDeleteCounts(null); }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConcept}
            disabled={isDeleting || isLoadingCounts}
          >
            {isDeleting ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Delete concept'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

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
                      {importResult.keywordsCreated ? (
                        <p>{importResult.keywordsCreated} new concepts created</p>
                      ) : null}
                      {importResult.duplicatesUpdated ? (
                        <p>{importResult.duplicatesUpdated} existing concepts updated with {importResult.questionsAddedToDuplicates} questions</p>
                      ) : null}
                      {!importResult.keywordsCreated && !importResult.duplicatesUpdated && (
                        <p>No changes made</p>
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
