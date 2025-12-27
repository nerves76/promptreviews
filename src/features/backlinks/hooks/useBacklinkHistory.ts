'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';

// Types
export interface BacklinkCheckSummary {
  id: string;
  domainId: string;
  backlinksTotal: number;
  referringDomainsTotal: number;
  referringDomainsNofollow: number;
  referringMainDomains: number;
  referringIps: number;
  referringSubnets: number;
  rank: number | null;
  backlinksFollow: number;
  backlinksNofollow: number;
  backlinksText: number;
  backlinksImage: number;
  backlinksRedirect: number;
  backlinksForm: number;
  backlinksFrame: number;
  referringPages: number;
  apiCostUsd: number | null;
  checkedAt: string;
  createdAt: string;
}

export interface BacklinkTrendPoint {
  date: string;
  backlinksTotal: number;
  referringDomainsTotal: number;
  rank: number | null;
  backlinksChange: number;
  referringDomainsChange: number;
  rankChange: number;
}

export interface BacklinkAnchorItem {
  id: string;
  anchorText: string;
  backlinksCount: number;
  referringDomainsCount: number;
  percentage: string;
  firstSeen: string | null;
  lastSeen: string | null;
  rank: number | null;
}

export interface ReferringDomainItem {
  id: string;
  referringDomain: string;
  backlinksCount: number;
  rank: number | null;
  spamScore: number | null;
  firstSeen: string | null;
  lastSeen: string | null;
  isFollow: boolean;
}

export interface NewLostBacklinkItem {
  id: string;
  changeType: 'new' | 'lost';
  sourceUrl: string | null;
  sourceDomain: string | null;
  targetUrl: string | null;
  anchorText: string | null;
  linkType: string | null;
  isFollow: boolean;
  firstSeen: string | null;
  lastSeen: string | null;
  sourceRank: number | null;
  detectedAt: string;
}

interface UseBacklinkHistoryOptions {
  domainId: string | null;
  autoFetch?: boolean;
}

interface UseBacklinkHistoryReturn {
  checks: BacklinkCheckSummary[];
  trend: BacklinkTrendPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching backlink check history and trends
 */
export function useBacklinkHistory({
  domainId,
  autoFetch = true,
}: UseBacklinkHistoryOptions): UseBacklinkHistoryReturn {
  const [checks, setChecks] = useState<BacklinkCheckSummary[]>([]);
  const [trend, setTrend] = useState<BacklinkTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!domainId) {
      setChecks([]);
      setTrend([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{
        domain: string;
        checks: BacklinkCheckSummary[];
        trend: BacklinkTrendPoint[];
      }>(`/backlinks/results?domainId=${domainId}`);

      setChecks(response.checks || []);
      setTrend(response.trend || []);
    } catch (err) {
      console.error('[useBacklinkHistory] Failed to fetch history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    if (autoFetch) {
      fetchHistory();
    }
  }, [fetchHistory, autoFetch]);

  return {
    checks,
    trend,
    isLoading,
    error,
    refresh: fetchHistory,
  };
}

/**
 * Hook for fetching anchor text distribution
 */
export function useBacklinkAnchors(domainId: string | null): {
  anchors: BacklinkAnchorItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [anchors, setAnchors] = useState<BacklinkAnchorItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnchors = useCallback(async () => {
    if (!domainId) {
      setAnchors([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{
        anchors: BacklinkAnchorItem[];
      }>(`/backlinks/anchors?domainId=${domainId}`);

      setAnchors(response.anchors || []);
    } catch (err) {
      console.error('[useBacklinkAnchors] Failed to fetch anchors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch anchors');
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchAnchors();
  }, [fetchAnchors]);

  return { anchors, isLoading, error, refresh: fetchAnchors };
}

/**
 * Hook for fetching referring domains
 */
export function useReferringDomains(domainId: string | null): {
  referringDomains: ReferringDomainItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [referringDomains, setReferringDomains] = useState<ReferringDomainItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    if (!domainId) {
      setReferringDomains([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{
        referringDomains: ReferringDomainItem[];
      }>(`/backlinks/referring-domains?domainId=${domainId}`);

      setReferringDomains(response.referringDomains || []);
    } catch (err) {
      console.error('[useReferringDomains] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch referring domains');
    } finally {
      setIsLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  return { referringDomains, isLoading, error, refresh: fetchDomains };
}

/**
 * Hook for fetching new/lost backlinks
 */
export function useNewLostBacklinks(
  domainId: string | null,
  type: 'new' | 'lost' | 'all' = 'all'
): {
  backlinks: NewLostBacklinkItem[];
  newCount: number;
  lostCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [backlinks, setBacklinks] = useState<NewLostBacklinkItem[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [lostCount, setLostCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBacklinks = useCallback(async () => {
    if (!domainId) {
      setBacklinks([]);
      setNewCount(0);
      setLostCount(0);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{
        backlinks: NewLostBacklinkItem[];
        newCount: number;
        lostCount: number;
      }>(`/backlinks/new-lost?domainId=${domainId}&type=${type}`);

      setBacklinks(response.backlinks || []);
      setNewCount(response.newCount || 0);
      setLostCount(response.lostCount || 0);
    } catch (err) {
      console.error('[useNewLostBacklinks] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch new/lost backlinks');
    } finally {
      setIsLoading(false);
    }
  }, [domainId, type]);

  useEffect(() => {
    fetchBacklinks();
  }, [fetchBacklinks]);

  return { backlinks, newCount, lostCount, isLoading, error, refresh: fetchBacklinks };
}
