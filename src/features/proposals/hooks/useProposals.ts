'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { Proposal, ProposalStatus } from '../types';

export function useProposals(statusFilter?: ProposalStatus | 'all', isTemplate?: boolean) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (isTemplate) params.set('is_template', 'true');
      const qs = params.toString();
      const data = await apiClient.get<{ proposals: Proposal[]; total: number }>(
        `/proposals${qs ? `?${qs}` : ''}`
      );
      setProposals(data.proposals);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, isTemplate]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return { proposals, total, loading, error, refetch: fetchProposals };
}
