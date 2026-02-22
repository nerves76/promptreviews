/**
 * useComments Hook
 *
 * Custom hook for fetching and managing comments with full author info and reactions.
 *
 * Performance: Uses batch queries to avoid N+1 problem.
 * Instead of 5 queries per comment, this uses 5 total batch queries
 * regardless of the number of comments.
 */

'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { Comment, ReactionCount } from '../types/community';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Batch-enrich raw comments with author info and reactions.
 * Reduces N+1 queries (5 per comment) to 5 total batch queries.
 */
async function enrichCommentsBatch(
  rawComments: any[],
  supabase: SupabaseClient
): Promise<Comment[]> {
  if (rawComments.length === 0) return [];

  // Collect unique IDs for batch queries
  const commentIds = rawComments.map((c) => c.id);
  const authorIds = [...new Set(rawComments.map((c) => c.author_id))];
  const accountIds = [...new Set(rawComments.map((c) => c.account_id))];

  // Run all batch queries in parallel (5 queries total instead of 5 * N)
  const [
    { data: { user: currentUser } },
    { data: profiles },
    { data: businesses },
    { data: adminData },
    { data: allReactions },
  ] = await Promise.all([
    // 1. Get current user (once, not per-comment)
    supabase.auth.getUser(),
    // 2. Batch fetch all community profiles
    supabase
      .from('community_profiles')
      .select('user_id, username, display_name_override, profile_photo_url')
      .in('user_id', authorIds),
    // 3. Batch fetch all businesses
    supabase
      .from('businesses')
      .select('account_id, name, logo_url')
      .in('account_id', accountIds),
    // 4. Batch fetch admin status via admins table
    supabase
      .from('admins')
      .select('account_id')
      .in('account_id', accountIds),
    // 5. Batch fetch all comment reactions
    supabase
      .from('comment_reactions')
      .select('comment_id, reaction, user_id')
      .in('comment_id', commentIds),
  ]);

  // Build lookup maps for O(1) access
  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, p])
  );

  const businessMap = new Map<string, { name: string; logo_url: string | null }>();
  for (const b of businesses || []) {
    if (!businessMap.has(b.account_id)) {
      businessMap.set(b.account_id, { name: b.name, logo_url: b.logo_url });
    }
  }

  const adminAccountIds = new Set(
    (adminData || []).map((a) => a.account_id)
  );

  // Group reactions by comment_id
  const reactionsByComment = new Map<string, any[]>();
  for (const r of allReactions || []) {
    const list = reactionsByComment.get(r.comment_id) || [];
    list.push(r);
    reactionsByComment.set(r.comment_id, list);
  }

  // Assemble enriched comments
  return rawComments.map((comment) => {
    const profile = profileMap.get(comment.author_id);
    const business = businessMap.get(comment.account_id);
    const isAdmin = adminAccountIds.has(comment.account_id);

    const author = profile
      ? {
          id: profile.user_id,
          username: profile.username,
          display_name: profile.display_name_override || profile.username,
          business_name: business?.name || 'Unknown',
          logo_url: business?.logo_url ?? undefined,
          profile_photo_url: profile.profile_photo_url ?? undefined,
          is_promptreviews_team: isAdmin,
        }
      : null;

    // Build reaction counts from batch data
    const commentReactions = reactionsByComment.get(comment.id) || [];
    const reactionCounts: ReactionCount[] = [];
    for (const r of commentReactions) {
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
      ? commentReactions
          .filter((r: any) => r.user_id === currentUser.id)
          .map((r: any) => r.reaction)
      : [];

    return {
      ...comment,
      author,
      reaction_counts: reactionCounts,
      user_reactions: userReactions,
    };
  });
}

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

      const commentsWithAuthors = await enrichCommentsBatch(data || [], supabase);

      setComments(commentsWithAuthors);
    } catch (err: unknown) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err : new Error('An unexpected error occurred'));
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
