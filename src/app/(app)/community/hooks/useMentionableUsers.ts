/**
 * useMentionableUsers Hook
 *
 * Search for users that can be mentioned in posts.
 *
 * Performance: Uses batch queries to avoid N+1 problem.
 * Instead of 2 queries per profile (account_users + businesses),
 * this uses 2 total batch queries after the initial search.
 */

'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/auth/providers/supabase';

interface MentionableUser {
  user_id: string;
  username: string;
  display_name: string;
  business_name: string;
  logo_url?: string;
}

export function useMentionableUsers() {
  const [users, setUsers] = useState<MentionableUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search community profiles by display_name_override, username, or business name
      const { data: profiles, error: profilesError } = await supabase
        .from('community_profiles')
        .select('user_id, username, display_name_override')
        .or(`username.ilike.%${query}%,display_name_override.ilike.%${query}%`)
        .limit(10);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      const userIds = profiles.map((p) => p.user_id);

      // Batch fetch account_users and businesses in parallel (2 queries instead of 2 * N)
      const [
        { data: accountUsers },
        // We'll fetch businesses after we have account IDs
      ] = await Promise.all([
        supabase
          .from('account_users')
          .select('user_id, account_id')
          .in('user_id', userIds),
      ]);

      // Build user_id -> account_id map (take first account per user)
      const userAccountMap = new Map<string, string>();
      for (const au of accountUsers || []) {
        if (!userAccountMap.has(au.user_id)) {
          userAccountMap.set(au.user_id, au.account_id);
        }
      }

      // Collect unique account IDs and batch fetch businesses
      const accountIds = [...new Set(userAccountMap.values())];
      const { data: businesses } = accountIds.length > 0
        ? await supabase
            .from('businesses')
            .select('account_id, name, logo_url')
            .in('account_id', accountIds)
        : { data: [] };

      // Build account_id -> business map (take first business per account)
      const businessMap = new Map<string, { name: string; logo_url: string | null }>();
      for (const b of businesses || []) {
        if (!businessMap.has(b.account_id)) {
          businessMap.set(b.account_id, { name: b.name, logo_url: b.logo_url });
        }
      }

      // Assemble results
      const usersWithBusinessInfo: MentionableUser[] = profiles.map((profile) => {
        const accountId = userAccountMap.get(profile.user_id);
        const business = accountId ? businessMap.get(accountId) : undefined;

        return {
          user_id: profile.user_id,
          username: profile.username,
          display_name: profile.display_name_override || profile.username,
          business_name: business?.name || 'Unknown',
          logo_url: business?.logo_url ?? undefined,
        };
      });

      setUsers(usersWithBusinessInfo);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  return {
    users,
    isLoading,
    searchUsers,
  };
}
