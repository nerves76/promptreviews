/**
 * PostFeed Component
 *
 * Infinite scroll feed of posts with loading states
 */

'use client';

import { useEffect, useRef } from 'react';
import { Post, ReactionType } from '../../types/community';
import { PostCard } from './PostCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';

interface PostFeedProps {
  posts: Post[];
  currentUserId: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onPostEdit?: (postId: string) => void;
  onPostDelete?: (postId: string) => void;
  onPostReact: (postId: string, emoji: ReactionType) => void;
  onPostComment?: (postId: string) => void;
}

export function PostFeed({
  posts,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  onPostEdit,
  onPostDelete,
  onPostReact,
  onPostComment,
}: PostFeedProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    if (!observerTarget.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  // Initial loading state
  if (isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white/8 backdrop-blur-[10px] border border-white/18 rounded-xl p-4 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-white/20 rounded w-1/3 mb-2" />
                <div className="h-3 bg-white/20 rounded w-1/4" />
              </div>
            </div>
            <div className="h-6 bg-white/20 rounded w-3/4 mb-3" />
            <div className="h-4 bg-white/20 rounded w-full mb-2" />
            <div className="h-4 bg-white/20 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && posts.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon="📝"
          title="No posts yet"
          description="Be the first to start a conversation in this channel!"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4" role="feed">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onEdit={onPostEdit ? () => onPostEdit(post.id) : undefined}
          onDelete={onPostDelete ? () => onPostDelete(post.id) : undefined}
          onReact={(emoji) => onPostReact(post.id, emoji)}
          onComment={onPostComment ? () => onPostComment(post.id) : undefined}
        />
      ))}

      {/* Loading more indicator */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-4">
          {isLoading && <LoadingSpinner size="md" label="Loading more posts" />}
        </div>
      )}

      {/* End of feed message */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-4 text-white/50 text-sm">You've reached the end</div>
      )}
    </div>
  );
}
