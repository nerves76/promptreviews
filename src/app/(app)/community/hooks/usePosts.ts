/**
 * usePosts Hook
 *
 * Custom hook for fetching and managing posts with infinite scroll
 */

'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { Post, PostsResponse } from '../types/community';

const POSTS_PER_PAGE = 20;

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
        .order('created_at', { ascending: false })
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

      // Transform the data to include proper author info
      const postsWithAuthors = await Promise.all(
        (data || []).map(async (post) => {
          try {
            // Get community profile for the author
            const { data: profile, error: profileError } = await supabase
              .from('community_profiles')
              .select('user_id, username, display_name_override')
              .eq('user_id', post.author_id)
              .single();

            if (profileError) {
              console.error('Profile fetch error for user', post.author_id, profileError);
              return { ...post, author: null };
            }

            if (!profile) {
              return { ...post, author: null };
            }

            // Get business info from the businesses table using the post's account_id
            const { data: business } = await supabase
              .from('businesses')
              .select('name, logo_url')
              .eq('account_id', post.account_id)
              .limit(1)
              .single();

            // Check if user is Prompt Reviews team
            const { data: adminData } = await supabase
              .from('admins')
              .select('account_id')
              .eq('account_id', post.account_id)
              .limit(1)
              .single();

            const authorInfo = {
              id: profile.user_id,
              username: profile.username,
              display_name: profile.display_name_override || profile.username,
              business_name: business?.name || 'Unknown',
              logo_url: business?.logo_url,
              is_promptreviews_team: !!adminData,
            };

            // Get reaction counts
            const { data: reactionsData } = await supabase
              .from('post_reactions')
              .select('reaction, user_id')
              .eq('post_id', post.id);

            // Group reactions by emoji and count
            const reactionCounts = (reactionsData || []).reduce((acc: any[], r: any) => {
              const existing = acc.find(item => item.emoji === r.reaction);
              if (existing) {
                existing.count++;
                existing.users.push(r.user_id);
              } else {
                acc.push({ emoji: r.reaction, count: 1, users: [r.user_id] });
              }
              return acc;
            }, []);

            // Get current user's reactions
            const { data: { user } } = await supabase.auth.getUser();
            const userReactions = (reactionsData || [])
              .filter((r: any) => r.user_id === user?.id)
              .map((r: any) => r.reaction);

            // Get comment count
            const { count: commentCount } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .is('deleted_at', null);

            return {
              ...post,
              author: authorInfo,
              reaction_counts: reactionCounts,
              user_reactions: userReactions,
              comment_count: commentCount || 0
            };
          } catch (postError) {
            console.error('Error processing post author:', postError);
            return {
              ...post,
              author: null,
              reaction_counts: [],
              user_reactions: [],
              comment_count: 0
            };
          }
        })
      );

      setPosts(postsWithAuthors);
      setHasMore(data?.length === POSTS_PER_PAGE);
      setCursor(data && data.length > 0 ? data[data.length - 1].id : null);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err as Error);
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
        .lt('created_at', posts[posts.length - 1].created_at)
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_PAGE);

      if (fetchError) throw fetchError;

      // Transform the data to include proper author info
      const postsWithAuthors = await Promise.all(
        (data || []).map(async (post) => {
          // Get community profile for the author
          const { data: profile } = await supabase
            .from('community_profiles')
            .select('user_id, username, display_name_override')
            .eq('user_id', post.author_id)
            .single();

          if (!profile) {
            return { ...post, author: null };
          }

          // Get account info for the user
          // Get business info from the businesses table using the post's account_id
          const { data: business } = await supabase
            .from('businesses')
            .select('name, logo_url')
            .eq('account_id', post.account_id)
            .limit(1)
            .single();

          // Check if user is Prompt Reviews team
          const { data: adminData } = await supabase
            .from('admins')
            .select('account_id')
            .eq('account_id', post.account_id)
            .limit(1)
            .single();

          const authorInfo = {
            id: profile.user_id,
            username: profile.username,
            display_name: profile.display_name_override || profile.username,
            business_name: business?.name || 'Unknown',
            logo_url: business?.logo_url,
            is_promptreviews_team: !!adminData,
          };

          // Get reaction counts
          const { data: reactionsData } = await supabase
            .from('post_reactions')
            .select('reaction, user_id')
            .eq('post_id', post.id);

          // Group reactions by emoji and count
          const reactionCounts = (reactionsData || []).reduce((acc: any[], r: any) => {
            const existing = acc.find(item => item.emoji === r.reaction);
            if (existing) {
              existing.count++;
              existing.users.push(r.user_id);
            } else {
              acc.push({ emoji: r.reaction, count: 1, users: [r.user_id] });
            }
            return acc;
          }, []);

          // Get current user's reactions
          const { data: { user } } = await supabase.auth.getUser();
          const userReactions = (reactionsData || [])
            .filter((r: any) => r.user_id === user?.id)
            .map((r: any) => r.reaction);

          // Get comment count
          const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
            .is('deleted_at', null);

          return {
            ...post,
            author: authorInfo,
            reaction_counts: reactionCounts,
            user_reactions: userReactions,
            comment_count: commentCount || 0
          };
        })
      );

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

  // Delete post
  const deletePost = useCallback(
    async (postId: string) => {
      // Use API endpoint instead of direct Supabase call to bypass RLS issues
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      // Remove from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    },
    []
  );

  return {
    posts,
    isLoading,
    error,
    hasMore,
    fetchPosts,
    loadMore,
    createPost,
    deletePost,
  };
}
