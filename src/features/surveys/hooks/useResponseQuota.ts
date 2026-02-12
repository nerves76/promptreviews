'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { ResponseQuota } from '../types';

export function useResponseQuota(surveyId: string | null) {
  const [quota, setQuota] = useState<ResponseQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    if (!surveyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<ResponseQuota>(`/surveys/${surveyId}/response-quota`);
      setQuota(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quota');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return { quota, loading, error, refetch: fetchQuota };
}
