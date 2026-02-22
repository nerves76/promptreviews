/**
 * usePosts Hook
 *
 * Custom hook for fetching and managing posts with infinite scroll.
 *
 * Performance: Uses batch queries to avoid N+1 problem.
 * Instead of 6 queries per post (120+ for 20 posts), this uses 5-6 total
 * batch queries regardless of the number of posts.
 */

'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { Post, ReactionCount } from '../types/community';
import { SupabaseClient } from '@supabase/supabase-js';

const POSTS_PER_PAGE = 20;

/**
 * Batch-enrich raw posts with author info, reactions, and comment counts.
 * Reduces N+1 queries (6 per post) to 5 total batch queries.
 */
async function enrichPostsBatch(
  rawPosts: any[],
  supabase: SupabaseClient
): Promise<Post[]> {
  if (rawPosts.length === 0) return [];

  // Collect unique IDs for batch queries
  const postIds = rawPosts.map((p) => p.id);
  const authorIds = [...new Set(rawPosts.map((p) => p.author_id))];
  const accountIds = [...new Set(rawPosts.map((p) => p.account_id))];

  // Run all batch queries in parallel (5 queries total instead of 6 * N)
  const [
    { data: { user: currentUser } },
    { data: profiles },
    { data: businesses },
    { data: accountsData },
    { data: allReactions },
    { data: commentRows },
  ] = await Promise.all([
    // 1. Get current user (once, not per-post)
    supabase.auth.getUser(),
    // 2. Batch fetch all community profiles
    supabase
      .from('community_profiles')
      .select('user_id, username, display_name_override, business_name_override, profile_photo_url')
      .in('user_id', authorIds),
    // 3. Batch fetch all businesses
    supabase
      .from('businesses')
      .select('account_id, name, logo_url')
      .in('account_id', accountIds),
    // 4. Batch fetch account admin status
    supabase
      .from('accounts')
      .select('id, is_admin')
      .in('id', accountIds),
    // 5. Batch fetch all reactions for these posts
    supabase
      .from('post_reactions')
      .select('post_id, reaction, user_id')
      .in('post_id', postIds),
    // 6. Batch fetch comment post_ids to count client-side
    supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)
      .is('deleted_at', null),
  ]);

  // Build lookup maps for O(1) access
  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, p])
  );

  // For businesses, there may be multiple per account; take the first one
  const businessMap = new Map<string, { name: string; logo_url: string | null }>();
  for (const b of businesses || []) {
    if (!businessMap.has(b.account_id)) {
      businessMap.set(b.account_id, { name: b.name, logo_url: b.logo_url });
    }
  }

  const adminMap = new Map(
    (accountsData || []).map((a) => [a.id, !!a.is_admin])
  );

  // Group reactions by post_id
  const reactionsByPost = new Map<string, any[]>();
  for (const r of allReactions || []) {
    const list = reactionsByPost.get(r.post_id) || [];
    list.push(r);
    reactionsByPost.set(r.post_id, list);
  }

  // Count comments by post_id
  const commentCountMap = new Map<string, number>();
  for (const c of commentRows || []) {
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1);
  }

  // Assemble enriched posts
  return rawPosts.map((post) => {
    const profile = profileMap.get(post.author_id);
    const business = businessMap.get(post.account_id);
    const isAdmin = adminMap.get(post.account_id) || false;

    const author = profile
      ? {
          id: profile.user_id,
          username: profile.username,
          display_name: profile.display_name_override || profile.username,
          business_name: profile.business_name_override || business?.name || '',
          logo_url: business?.logo_url ?? undefined,
          profile_photo_url: profile.profile_photo_url ?? undefined,
          is_promptreviews_team: isAdmin,
        }
      : null;

    // Build reaction counts from batch data
    const postReactions = reactionsByPost.get(post.id) || [];
    const reactionCounts: ReactionCount[] = [];
    for (const r of postReactions) {
      const existing = reactionCounts.find((item) => item.emoji === r.reaction);
      if (existing) {
        existing.count++;
        existing.users.push(r.user_id);
      } else {
        reactionCounts.push({ emoji: r.reaction, count: 1, users: [r.user_id] });
      }
    }

    // Get current user's reactions from the batch data
    const userReactions = currentUser
      ? postReactions
          .filter((r: any) => r.user_id === currentUser.id)
          .map((r: any) => r.reaction)
      : [];

    const commentCount = commentCountMap.get(post.id) || 0;

    return {
      ...post,
      author,
      reaction_counts: reactionCounts,
      user_reactions: userReactions,
      comment_count: commentCount,
    };
  });
}

export function usePosts(channelId: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch initial posts
  const fetchPosts = useCallback(async () => {
    if (!channelId) {
      console.log('No channelId provided, skipping fetch');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching posts for channel:', channelId);
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(POSTS_PER_PAGE);

      console.log('Posts query result:', { data, error: fetchError });

      if (fetchError) {
        console.error('Supabase fetch error:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        });
        throw fetchError;
      }

      const postsWithAuthors = await enrichPostsBatch(data || [], supabase);

      setPosts(postsWithAuthors);
      setHasMore(data?.length === POSTS_PER_PAGE);
      setCursor(data && data.length > 0 ? data[data.length - 1].id : null);
    } catch (err: unknown) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err : new Error('An unexpected error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [channelId, supabase]);

  // Load more posts (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !cursor) return;

    setIsLoading(true);

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .gt('created_at', posts[posts.length - 1].created_at)
        .order('created_at', { ascending: true })
        .limit(POSTS_PER_PAGE);

      if (fetchError) throw fetchError;

      const postsWithAuthors = await enrichPostsBatch(data || [], supabase);

      setPosts((prev) => [...prev, ...postsWithAuthors]);
      setHasMore(data?.length === POSTS_PER_PAGE);
      setCursor(data && data.length > 0 ? data[data.length - 1].id : null);
    } catch (err) {
      console.error('Error loading more posts:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [channelId, cursor, hasMore, isLoading, posts, supabase]);

  // Create post
  const createPost = useCallback(
    async (data: { title: string; body?: string; external_url?: string; account_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('posts').insert({
        channel_id: channelId,
        author_id: user.id,
        account_id: data.account_id,
        title: data.title,
        body: data.body,
        external_url: data.external_url,
      });

      if (insertError) throw insertError;

      // Refresh posts
      await fetchPosts();
    },
    [channelId, fetchPosts, supabase]
  );

  // Update post
  const updatePost = useCallback(
    async (postId: string, data: { title: string; body: string }) => {
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Use API endpoint
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update post');
      }

      // Update local state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, title: data.title, body: data.body, updated_at: new Date().toISOString() }
            : p
        )
      );
    },
    [supabase]
  );

  // Delete post
  const deletePost = useCallback(
    async (postId: string) => {
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Use API endpoint instead of direct Supabase call to bypass RLS issues
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      // Remove from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    },
    [supabase]
  );

  return {
    posts,
    isLoading,
    error,
    hasMore,
    fetchPosts,
    loadMore,
    createPost,
    updatePost,
    deletePost,
  };
}
