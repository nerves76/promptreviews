'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';

// Types
export interface BacklinkDomainSummary {
  id: string;
  accountId: string;
  domain: string;
  scheduleFrequency: 'daily' | 'weekly' | 'monthly' | null;
  scheduleDayOfWeek: number | null;
  scheduleDayOfMonth: number | null;
  scheduleHour: number;
  nextScheduledAt: string | null;
  lastScheduledRunAt: string | null;
  lastCheckedAt: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastCheck: {
    id: string;
    backlinksTotal: number;
    referringDomainsTotal: number;
    rank: number | null;
    checkedAt: string;
  } | null;
}

export interface CreateDomainInput {
  domain: string;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly';
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
}

export interface UpdateDomainInput {
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | null;
  scheduleDayOfWeek?: number | null;
  scheduleDayOfMonth?: number | null;
  scheduleHour?: number;
  isEnabled?: boolean;
}

export interface CheckResult {
  success: boolean;
  checkId?: string;
  summary?: {
    backlinksTotal: number;
    referringDomainsTotal: number;
    rank: number | null;
    backlinksFollow: number;
    backlinksNofollow: number;
    checkedAt: string;
  };
  creditsUsed?: number;
  apiCost?: number;
  error?: string;
}

interface UseBacklinkDomainsReturn {
  domains: BacklinkDomainSummary[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addDomain: (input: CreateDomainInput) => Promise<{ success: boolean; domain?: BacklinkDomainSummary; error?: string }>;
  updateDomain: (id: string, input: UpdateDomainInput) => Promise<{ success: boolean; error?: string }>;
  deleteDomain: (id: string) => Promise<{ success: boolean; error?: string }>;
  runCheck: (domainId: string, checkType?: 'summary' | 'full') => Promise<CheckResult>;
}

/**
 * Hook for managing tracked backlink domains
 *
 * Provides CRUD operations and check functionality for backlink tracking.
 */
export function useBacklinkDomains(): UseBacklinkDomainsReturn {
  const [domains, setDomains] = useState<BacklinkDomainSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedAccountId } = useAccountData();

  // Fetch domains
  const fetchDomains = useCallback(async () => {
    if (!selectedAccountId) {
      setDomains([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{ domains: BacklinkDomainSummary[] }>(
        '/backlinks/domains'
      );

      setDomains(response.domains || []);
    } catch (err) {
      console.error('[useBacklinkDomains] Failed to fetch domains:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch domains');
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  // Initial fetch
  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  // Add domain
  const addDomain = useCallback(async (input: CreateDomainInput) => {
    try {
      const response = await apiClient.post<{
        domain: BacklinkDomainSummary;
        created: boolean;
      }>('/backlinks/domains', input);

      if (response.domain) {
        setDomains((prev) => [response.domain, ...prev]);
        return { success: true, domain: response.domain };
      }

      return { success: false, error: 'Failed to add domain' };
    } catch (err) {
      console.error('[useBacklinkDomains] Failed to add domain:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add domain',
      };
    }
  }, []);

  // Update domain
  const updateDomain = useCallback(async (id: string, input: UpdateDomainInput) => {
    try {
      const response = await apiClient.put<{
        domain: BacklinkDomainSummary;
        updated: boolean;
      }>(`/backlinks/domains/${id}`, input);

      if (response.updated) {
        setDomains((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...response.domain } : d))
        );
        return { success: true };
      }

      return { success: false, error: 'Failed to update domain' };
    } catch (err) {
      console.error('[useBacklinkDomains] Failed to update domain:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update domain',
      };
    }
  }, []);

  // Delete domain
  const deleteDomain = useCallback(async (id: string) => {
    try {
      const response = await apiClient.delete<{ deleted: boolean }>(
        `/backlinks/domains/${id}`
      );

      if (response.deleted) {
        setDomains((prev) => prev.filter((d) => d.id !== id));
        return { success: true };
      }

      return { success: false, error: 'Failed to delete domain' };
    } catch (err) {
      console.error('[useBacklinkDomains] Failed to delete domain:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete domain',
      };
    }
  }, []);

  // Run check
  const runCheck = useCallback(async (
    domainId: string,
    checkType: 'summary' | 'full' = 'full'
  ): Promise<CheckResult> => {
    try {
      const response = await apiClient.post<CheckResult>('/backlinks/check', {
        domainId,
        checkType,
      });

      if (response.success) {
        // Refresh domains to get updated lastCheck
        await fetchDomains();
      }

      return response;
    } catch (err) {
      console.error('[useBacklinkDomains] Check failed:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Check failed',
      };
    }
  }, [fetchDomains]);

  return {
    domains,
    isLoading,
    error,
    refresh: fetchDomains,
    addDomain,
    updateDomain,
    deleteDomain,
    runCheck,
  };
}
