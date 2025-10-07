/**
 * useReactions Hook
 *
 * Custom hook for managing reactions with optimistic updates
 */

'use client';

import { useCallback } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { ReactionType } from '../types/community';

export function useReactions() {
  const supabase = createClient();

  // Toggle reaction (add or remove)
  const toggleReaction = useCallback(
    async (targetId: string, targetType: 'post' | 'comment', emoji: ReactionType) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const tableName = targetType === 'post' ? 'post_reactions' : 'comment_reactions';
        const idColumn = targetType === 'post' ? 'post_id' : 'comment_id';

        // Check if user already reacted with this emoji
        const { data: existing, error: selectError } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', user.id)
          .eq(idColumn, targetId)
          .eq('reaction', emoji)
          .maybeSingle();

        if (selectError) {
          console.error('Error checking existing reaction:', selectError);
          throw selectError;
        }

        if (existing) {
          // Remove reaction
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('user_id', user.id)
            .eq(idColumn, targetId)
            .eq('reaction', emoji);

          if (deleteError) {
            console.error('Error deleting reaction:', deleteError);
            throw deleteError;
          }
        } else {
          // Add reaction
          const { error: insertError } = await supabase.from(tableName).insert({
            user_id: user.id,
            [idColumn]: targetId,
            reaction: emoji,
          });

          if (insertError) {
            console.error('Error inserting reaction:', insertError);
            throw insertError;
          }
        }
      } catch (err) {
        console.error('Error toggling reaction:', err);
        throw err;
      }
    },
    [supabase]
  );

  return { toggleReaction };
}
