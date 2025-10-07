/**
 * useMentions Hook
 *
 * Custom hook for searching mentionable users
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { MentionableUser } from '../types/community';

export function useMentionSearch(query: string) {
  const [users, setUsers] = useState<MentionableUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Call RPC function to search users (to be implemented by backend agent)
        const { data, error: rpcError } = await supabase.rpc('search_community_users', {
          search_query: query.toLowerCase(),
        });

        if (rpcError) throw rpcError;

        setUsers(data || []);
      } catch (err) {
        console.error('Error searching users:', err);
        setError(err as Error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchUsers, 300);

    return () => clearTimeout(timeoutId);
  }, [query, supabase]);

  return { users, isLoading, error };
}
