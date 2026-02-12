'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { Survey, SurveyStatus } from '../types';

export function useSurveys(statusFilter?: SurveyStatus | 'all') {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await apiClient.get<{ surveys: Survey[]; total: number }>(`/surveys${params}`);
      setSurveys(data.surveys);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch surveys');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  return { surveys, total, loading, error, refetch: fetchSurveys };
}
