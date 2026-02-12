'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { Survey } from '../types';

export function useSurvey(surveyId: string | null) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurvey = useCallback(async () => {
    if (!surveyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Survey>(`/surveys/${surveyId}`);
      setSurvey(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch survey');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  const updateSurvey = useCallback(async (updates: Partial<Survey> & { questions?: any[] }) => {
    if (!surveyId) return;
    const data = await apiClient.put<Survey>(`/surveys/${surveyId}`, updates);
    setSurvey(data);
    return data;
  }, [surveyId]);

  return { survey, loading, error, refetch: fetchSurvey, updateSurvey };
}
