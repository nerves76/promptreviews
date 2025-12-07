'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { type KeywordData, type KeywordGroupData, DEFAULT_GROUP_NAME } from '../keywordUtils';

interface UseKeywordsOptions {
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  /** Filter by group ID */
  groupId?: string;
  /** Filter by prompt page ID */
  promptPageId?: string;
  /** Include prompt page usage data */
  includeUsage?: boolean;
}

interface UseKeywordsResult {
  /** All keywords */
  keywords: KeywordData[];
  /** All groups */
  groups: KeywordGroupData[];
  /** Ungrouped keyword count */
  ungroupedCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Create a new keyword */
  createKeyword: (phrase: string, groupId?: string, promptPageId?: string) => Promise<KeywordData | null>;
  /** Create a keyword with concept fields (AI enriched) */
  createEnrichedKeyword: (data: {
    phrase: string;
    review_phrase: string;
    search_query: string;
    aliases?: string[];
    location_scope?: string | null;
    ai_generated?: boolean;
    groupId?: string;
    promptPageId?: string;
  }) => Promise<KeywordData | null>;
  /** Update a keyword */
  updateKeyword: (id: string, updates: Partial<{
    phrase: string;
    groupId: string;
    status: 'active' | 'paused';
    reviewPhrase: string;
    searchQuery: string;
    aliases: string[];
    locationScope: string | null;
  }>) => Promise<KeywordData | null>;
  /** Delete a keyword */
  deleteKeyword: (id: string) => Promise<boolean>;
  /** Create a new group */
  createGroup: (name: string, displayOrder?: number) => Promise<KeywordGroupData | null>;
  /** Update a group */
  updateGroup: (id: string, updates: Partial<{ name: string; displayOrder: number }>) => Promise<KeywordGroupData | null>;
  /** Delete a group */
  deleteGroup: (id: string) => Promise<boolean>;
  /** Move keyword to a different group */
  moveKeywordToGroup: (keywordId: string, groupId: string | null) => Promise<boolean>;
  /** Prompt page usage map (keywordId -> page names) */
  promptPageUsage: Record<string, string[]>;
}

/**
 * Hook for managing keywords and groups via the API.
 *
 * Provides CRUD operations and auto-refresh capabilities.
 */
export function useKeywords(options: UseKeywordsOptions = {}): UseKeywordsResult {
  const { autoFetch = true, groupId, promptPageId, includeUsage = false } = options;

  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [groups, setGroups] = useState<KeywordGroupData[]>([]);
  const [ungroupedCount, setUngroupedCount] = useState(0);
  const [promptPageUsage, setPromptPageUsage] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch keywords
  const fetchKeywords = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (groupId) params.set('groupId', groupId);
      if (promptPageId) params.set('promptPageId', promptPageId);
      if (includeUsage) params.set('includeUsage', 'true');

      const queryString = params.toString();
      const url = `/keywords${queryString ? `?${queryString}` : ''}`;
      const data = await apiClient.get(url);

      setKeywords(data.keywords || []);
      if (data.promptPageUsage) {
        setPromptPageUsage(data.promptPageUsage);
      }
    } catch (err: any) {
      console.error('Failed to fetch keywords:', err);
      throw err;
    }
  }, [groupId, promptPageId, includeUsage]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      const data = await apiClient.get('/keyword-groups');
      setGroups(data.groups || []);
      setUngroupedCount(data.ungroupedCount || 0);
    } catch (err: any) {
      console.error('Failed to fetch keyword groups:', err);
      throw err;
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchKeywords(), fetchGroups()]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load keywords');
    } finally {
      setIsLoading(false);
    }
  }, [fetchKeywords, fetchGroups]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);

  // Create keyword
  const createKeyword = useCallback(
    async (phrase: string, groupIdParam?: string, promptPageIdParam?: string): Promise<KeywordData | null> => {
      try {
        const body: { phrase: string; groupId?: string; promptPageId?: string } = { phrase };
        if (groupIdParam) body.groupId = groupIdParam;
        if (promptPageIdParam) body.promptPageId = promptPageIdParam;

        const data = await apiClient.post('/keywords', body);
        const newKeyword = data.keyword;

        // Optimistically update local state
        setKeywords((prev) => [newKeyword, ...prev]);

        return newKeyword;
      } catch (err: any) {
        console.error('Failed to create keyword:', err);
        setError(err?.message || 'Failed to create keyword');
        return null;
      }
    },
    []
  );

  // Create enriched keyword with concept fields
  const createEnrichedKeyword = useCallback(
    async (data: {
      phrase: string;
      review_phrase: string;
      search_query: string;
      aliases?: string[];
      location_scope?: string | null;
      ai_generated?: boolean;
      groupId?: string;
      promptPageId?: string;
    }): Promise<KeywordData | null> => {
      try {
        const body: Record<string, unknown> = {
          phrase: data.phrase,
          review_phrase: data.review_phrase,
          search_query: data.search_query,
          aliases: data.aliases || [],
          location_scope: data.location_scope || null,
          ai_generated: data.ai_generated ?? false,
        };
        if (data.groupId) body.groupId = data.groupId;
        if (data.promptPageId) body.promptPageId = data.promptPageId;

        const response = await apiClient.post('/keywords', body);
        const newKeyword = response.keyword;

        // Optimistically update local state
        setKeywords((prev) => [newKeyword, ...prev]);

        return newKeyword;
      } catch (err: any) {
        console.error('Failed to create enriched keyword:', err);
        setError(err?.message || 'Failed to create keyword');
        return null;
      }
    },
    []
  );

  // Update keyword
  const updateKeyword = useCallback(
    async (
      id: string,
      updates: Partial<{
        phrase: string;
        groupId: string;
        status: 'active' | 'paused';
        reviewPhrase: string;
        searchQuery: string;
        aliases: string[];
        locationScope: string | null;
      }>
    ): Promise<KeywordData | null> => {
      try {
        const data = await apiClient.put(`/keywords/${id}`, updates);
        const updatedKeyword = data.keyword;

        // Optimistically update local state
        setKeywords((prev) =>
          prev.map((kw) => (kw.id === id ? updatedKeyword : kw))
        );

        return updatedKeyword;
      } catch (err: any) {
        console.error('Failed to update keyword:', err);
        setError(err?.message || 'Failed to update keyword');
        return null;
      }
    },
    []
  );

  // Delete keyword
  const deleteKeyword = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/keywords/${id}`);

      // Optimistically update local state
      setKeywords((prev) => prev.filter((kw) => kw.id !== id));

      return true;
    } catch (err: any) {
      console.error('Failed to delete keyword:', err);
      setError(err?.message || 'Failed to delete keyword');
      return false;
    }
  }, []);

  // Create group
  const createGroup = useCallback(
    async (name: string, displayOrder?: number): Promise<KeywordGroupData | null> => {
      try {
        const body: { name: string; displayOrder?: number } = { name };
        if (displayOrder !== undefined) body.displayOrder = displayOrder;

        const data = await apiClient.post('/keyword-groups', body);
        const newGroup = data.group;

        // Optimistically update local state
        setGroups((prev) => [...prev, newGroup]);

        return newGroup;
      } catch (err: any) {
        console.error('Failed to create group:', err);
        setError(err?.message || 'Failed to create group');
        return null;
      }
    },
    []
  );

  // Update group
  const updateGroup = useCallback(
    async (
      id: string,
      updates: Partial<{ name: string; displayOrder: number }>
    ): Promise<KeywordGroupData | null> => {
      try {
        const data = await apiClient.put(`/keyword-groups/${id}`, updates);
        const updatedGroup = data.group;

        // Optimistically update local state
        setGroups((prev) =>
          prev.map((g) => (g.id === id ? updatedGroup : g))
        );

        return updatedGroup;
      } catch (err: any) {
        console.error('Failed to update group:', err);
        setError(err?.message || 'Failed to update group');
        return null;
      }
    },
    []
  );

  // Delete group
  const deleteGroup = useCallback(async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/keyword-groups/${id}`);

      // Optimistically update local state
      setGroups((prev) => prev.filter((g) => g.id !== id));

      // Refresh keywords since they may have moved to General
      await fetchKeywords();

      return true;
    } catch (err: any) {
      console.error('Failed to delete group:', err);
      setError(err?.message || 'Failed to delete group');
      return false;
    }
  }, [fetchKeywords]);

  // Move keyword to group
  const moveKeywordToGroup = useCallback(
    async (keywordId: string, newGroupId: string | null): Promise<boolean> => {
      try {
        await apiClient.put(`/keywords/${keywordId}`, { groupId: newGroupId });

        // Optimistically update local state
        setKeywords((prev) =>
          prev.map((kw) =>
            kw.id === keywordId
              ? {
                  ...kw,
                  groupId: newGroupId,
                  groupName: newGroupId
                    ? groups.find((g) => g.id === newGroupId)?.name || null
                    : null,
                }
              : kw
          )
        );

        return true;
      } catch (err: any) {
        console.error('Failed to move keyword:', err);
        setError(err?.message || 'Failed to move keyword');
        return false;
      }
    },
    [groups]
  );

  return {
    keywords,
    groups,
    ungroupedCount,
    isLoading,
    error,
    refresh,
    createKeyword,
    createEnrichedKeyword,
    updateKeyword,
    deleteKeyword,
    createGroup,
    updateGroup,
    deleteGroup,
    moveKeywordToGroup,
    promptPageUsage,
  };
}

/**
 * Hook for fetching a single keyword with details.
 */
export function useKeywordDetails(keywordId: string | null) {
  const [keyword, setKeyword] = useState<KeywordData | null>(null);
  const [promptPages, setPromptPages] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!keywordId) {
      setKeyword(null);
      setPromptPages([]);
      setRecentReviews([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get(`/keywords/${keywordId}`);
      setKeyword(data.keyword);
      setPromptPages(data.promptPages || []);
      setRecentReviews(data.recentReviews || []);
    } catch (err: any) {
      console.error('Failed to fetch keyword details:', err);
      setError(err?.message || 'Failed to load keyword details');
    } finally {
      setIsLoading(false);
    }
  }, [keywordId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    keyword,
    promptPages,
    recentReviews,
    isLoading,
    error,
    refresh: fetch,
  };
}
