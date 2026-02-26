'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { Proposal } from '../types';

export function useProposal(proposalId: string | null) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposal = useCallback(async () => {
    if (!proposalId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Proposal>(`/proposals/${proposalId}`);
      setProposal(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contract');
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  const updateProposal = useCallback(async (updates: Partial<Proposal>) => {
    if (!proposalId) return;
    const data = await apiClient.put<Proposal>(`/proposals/${proposalId}`, updates);
    setProposal(data);
    return data;
  }, [proposalId]);

  return { proposal, loading, error, refetch: fetchProposal, updateProposal };
}
