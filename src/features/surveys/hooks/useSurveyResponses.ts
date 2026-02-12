'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { SurveyResponse, SurveyResponseSummary } from '../types';

export function useSurveyResponses(surveyId: string | null, page: number = 1, pageSize: number = 20) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = useCallback(async () => {
    if (!surveyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<{ responses: SurveyResponse[]; total: number }>(
        `/surveys/${surveyId}/responses?page=${page}&pageSize=${pageSize}`
      );
      setResponses(data.responses);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch responses');
    } finally {
      setLoading(false);
    }
  }, [surveyId, page, pageSize]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  return { responses, total, loading, error, refetch: fetchResponses };
}

export function useSurveyResponseSummary(surveyId: string | null) {
  const [summary, setSummary] = useState<SurveyResponseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!surveyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<SurveyResponseSummary>(`/surveys/${surveyId}/responses/summary`);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refetch: fetchSummary };
}
