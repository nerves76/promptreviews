'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLMVisibilityCheck,
  LLMVisibilitySummary,
  LLMVisibilitySchedule,
  LLMCheckResponse,
  QuestionVisibility,
} from '../utils/types';

interface UseLLMVisibilityOptions {
  keywordId: string | null;
}

interface UseLLMVisibilityReturn {
  // State
  summary: LLMVisibilitySummary | null;
  results: LLMVisibilityCheck[];
  schedule: LLMVisibilitySchedule | null;
  isLoading: boolean;
  isChecking: boolean;
  error: string | null;

  // Computed
  questionVisibility: QuestionVisibility[];

  // Actions
  fetchSummary: () => Promise<void>;
  fetchResults: (provider?: LLMProvider) => Promise<void>;
  fetchSchedule: () => Promise<void>;
  runCheck: (providers?: LLMProvider[], questionIndices?: number[]) => Promise<LLMCheckResponse | null>;
  updateSchedule: (updates: Partial<LLMVisibilitySchedule>) => Promise<void>;
  deleteSchedule: () => Promise<void>;
}

export function useLLMVisibility({ keywordId }: UseLLMVisibilityOptions): UseLLMVisibilityReturn {
  // Track selected account to clear data when it changes
  const { selectedAccountId } = useAccountData();

  const [summary, setSummary] = useState<LLMVisibilitySummary | null>(null);
  const [results, setResults] = useState<LLMVisibilityCheck[]>([]);
  const [schedule, setSchedule] = useState<LLMVisibilitySchedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear data when account changes to prevent cross-account data leakage
  useEffect(() => {
    setSummary(null);
    setResults([]);
    setSchedule(null);
    setError(null);
  }, [selectedAccountId]);

  // Fetch summary for a keyword
  const fetchSummary = useCallback(async () => {
    if (!keywordId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get(`/llm-visibility/summary?keywordId=${keywordId}`) as { summary?: LLMVisibilitySummary };
      setSummary(data.summary || null);
    } catch (err) {
      console.error('[useLLMVisibility] Error fetching summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    } finally {
      setIsLoading(false);
    }
  }, [keywordId]);

  // Fetch recent results
  const fetchResults = useCallback(async (provider?: LLMProvider) => {
    if (!keywordId) return;

    setIsLoading(true);
    setError(null);

    try {
      let url = `/llm-visibility/results?keywordId=${keywordId}`;
      if (provider) {
        url += `&provider=${provider}`;
      }

      const data = await apiClient.get(url) as { results?: LLMVisibilityCheck[] };
      setResults(data.results || []);
    } catch (err) {
      console.error('[useLLMVisibility] Error fetching results:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  }, [keywordId]);

  // Fetch schedule
  const fetchSchedule = useCallback(async () => {
    if (!keywordId) return;

    try {
      const data = await apiClient.get(`/llm-visibility/schedule?keywordId=${keywordId}`) as { schedule?: LLMVisibilitySchedule };
      setSchedule(data.schedule || null);
    } catch (err) {
      console.error('[useLLMVisibility] Error fetching schedule:', err);
      // Don't set error for schedule fetch - it's optional
    }
  }, [keywordId]);

  // Run a visibility check
  const runCheck = useCallback(async (
    providers: LLMProvider[] = ['chatgpt'],
    questionIndices?: number[]
  ): Promise<LLMCheckResponse | null> => {
    if (!keywordId) return null;

    setIsChecking(true);
    setError(null);

    try {
      const data = await apiClient.post('/llm-visibility/check', {
        keywordId,
        providers,
        questionIndices,
      }) as LLMCheckResponse;

      // Update local state with new summary
      if (data.summary) {
        setSummary(data.summary as LLMVisibilitySummary);
      }

      // Refresh results
      await fetchResults();

      return data as LLMCheckResponse;
    } catch (err: any) {
      console.error('[useLLMVisibility] Error running check:', err);

      // Handle insufficient credits specifically
      if (err?.status === 402 || err?.error === 'Insufficient credits') {
        setError(`Insufficient credits. Need ${err.required || 'more'}, have ${err.available || 0}`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to run check');
      }

      return null;
    } finally {
      setIsChecking(false);
    }
  }, [keywordId, fetchResults]);

  // Update schedule
  const updateSchedule = useCallback(async (updates: Partial<LLMVisibilitySchedule>) => {
    if (!keywordId) return;

    setError(null);

    try {
      const data = await apiClient.put('/llm-visibility/schedule', {
        keywordId,
        ...updates,
      }) as { schedule?: LLMVisibilitySchedule };
      setSchedule(data.schedule || null);
    } catch (err) {
      console.error('[useLLMVisibility] Error updating schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
      throw err;
    }
  }, [keywordId]);

  // Delete schedule
  const deleteSchedule = useCallback(async () => {
    if (!keywordId) return;

    setError(null);

    try {
      await apiClient.delete(`/llm-visibility/schedule?keywordId=${keywordId}`);
      setSchedule(null);
    } catch (err) {
      console.error('[useLLMVisibility] Error deleting schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
      throw err;
    }
  }, [keywordId]);

  // Compute question-level visibility from results
  const questionVisibility: QuestionVisibility[] = (() => {
    if (results.length === 0) return [];

    // Group results by question
    const questionMap = new Map<string, QuestionVisibility>();

    for (const result of results) {
      if (!questionMap.has(result.question)) {
        questionMap.set(result.question, {
          question: result.question,
          questionIndex: -1, // We don't know the index from results alone
          results: new Map(),
          citedCount: 0,
          checkedCount: 0,
          lastCheckedAt: null,
        });
      }

      const qv = questionMap.get(result.question)!;

      // Only keep the most recent result per provider
      const existing = qv.results.get(result.llmProvider);
      if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
        qv.results.set(result.llmProvider, result);
      }
    }

    // Calculate stats for each question
    for (const qv of questionMap.values()) {
      qv.checkedCount = qv.results.size;
      const resultValues = Array.from(qv.results.values());
      qv.citedCount = resultValues.filter(r => r && r.domainCited).length;

      // Find most recent check
      if (resultValues.length > 0) {
        const latestCheck = resultValues.reduce((latest, check) => {
          if (!latest) return check;
          if (!check) return latest;
          return new Date(check.checkedAt) > new Date(latest.checkedAt) ? check : latest;
        });
        if (latestCheck) {
          qv.lastCheckedAt = latestCheck.checkedAt;
        }
      }
    }

    return Array.from(questionMap.values());
  })();

  return {
    summary,
    results,
    schedule,
    isLoading,
    isChecking,
    error,
    questionVisibility,
    fetchSummary,
    fetchResults,
    fetchSchedule,
    runCheck,
    updateSchedule,
    deleteSchedule,
  };
}

export default useLLMVisibility;
