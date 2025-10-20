/**
 * useComments Hook
 *
 * Custom hook for fetching and managing comments with full author info and reactions
 */

'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { Comment } from '../types/community';

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  // Fetch comments with full author info and reactions
  const fetchComments = useCallback(async () => {
    if (!postId) {
      console.log('No postId provided, skipping fetch');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching comments for post:', postId);
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      console.log('Comments query result:', { data, error: fetchError });

      if (fetchError) {
        console.error('Supabase fetch error:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        });
        throw fetchError;
      }

      // Transform the data to include proper author info and reactions
      const commentsWithAuthors = await Promise.all(
        (data || []).map(async (comment) => {
          try {
            // Get community profile for the author
            const { data: profile, error: profileError } = await supabase
              .from('community_profiles')
              .select('user_id, username, display_name_override')
              .eq('user_id', comment.author_id)
              .single();

            if (profileError) {
              console.error('Profile fetch error for user', comment.author_id, profileError);
              return { ...comment, author: null };
            }

            if (!profile) {
              return { ...comment, author: null };
            }

            // Get business info from the businesses table using the comment's account_id
            const { data: business } = await supabase
              .from('businesses')
              .select('name, logo_url')
              .eq('account_id', comment.account_id)
              .limit(1)
              .single();

            // Check if user is Prompt Reviews team
            const { data: adminData } = await supabase
              .from('admins')
              .select('account_id')
              .eq('account_id', comment.account_id)
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
              .from('comment_reactions')
              .select('reaction, user_id')
              .eq('comment_id', comment.id);

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

            return {
              ...comment,
              author: authorInfo,
              reaction_counts: reactionCounts,
              user_reactions: userReactions,
            };
          } catch (commentError) {
            console.error('Error processing comment author:', commentError);
            return {
              ...comment,
              author: null,
              reaction_counts: [],
              user_reactions: [],
            };
          }
        })
      );

      setComments(commentsWithAuthors);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [postId, supabase]);

  // Create comment
  const createComment = useCallback(
    async (body: string, account_id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: user.id,
        account_id,
        body,
      });

      if (insertError) throw insertError;

      // Refresh comments
      await fetchComments();
    },
    [postId, fetchComments, supabase]
  );

  // Update comment
  const updateComment = useCallback(
    async (commentId: string, body: string) => {
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Use API endpoint
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
      }

      // Update local state
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, body, updated_at: new Date().toISOString() }
            : c
        )
      );
    },
    [supabase]
  );

  // Delete comment (soft delete)
  const deleteComment = useCallback(
    async (commentId: string) => {
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Use API endpoint instead of direct Supabase call to bypass RLS issues
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete comment');
      }

      // Remove from local state
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    },
    [supabase]
  );

  return {
    comments,
    isLoading,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
  };
}
