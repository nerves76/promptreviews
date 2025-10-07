/**
 * useMentionableUsers Hook
 *
 * Search for users that can be mentioned in posts
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

      // Get business info for each user
      const usersWithBusinessInfo = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get account info
          const { data: accountUser } = await supabase
            .from('account_users')
            .select('account_id')
            .eq('user_id', profile.user_id)
            .limit(1)
            .single();

          // Get business info
          const { data: business } = await supabase
            .from('businesses')
            .select('name, logo_url')
            .eq('account_id', accountUser?.account_id || '')
            .limit(1)
            .single();

          return {
            user_id: profile.user_id,
            username: profile.username,
            display_name: profile.display_name_override || profile.username,
            business_name: business?.name || 'Unknown',
            logo_url: business?.logo_url,
          };
        })
      );

      // Filter out users where business name also matches the query for better relevance
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
