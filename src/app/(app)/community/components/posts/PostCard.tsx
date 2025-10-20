/**
 * PostCard Component
 *
 * Individual post display with glassmorphic design, reactions, and comments
 */

'use client';

import { useState, useEffect } from 'react';
import { Post, ReactionType, Comment } from '../../types/community';
import { UserIdentity } from '../shared/UserIdentity';
import { RelativeTime } from '../shared/RelativeTime';
import { ReactionBar } from '../reactions/ReactionBar';
import { CommentList } from '../comments/CommentList';
import { CommentComposer } from '../comments/CommentComposer';
import { EditCommentModal } from '../modals/EditCommentModal';
import { extractDomain } from '../../utils/urlValidator';
import { parseTextContent } from '../../utils/linkify';
import { useComments } from '../../hooks/useComments';
import { useReactions } from '../../hooks/useReactions';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  accountId: string;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact: (emoji: ReactionType) => void;
  onComment?: () => void;
  showComments?: boolean;
}

export function PostCard({
  post,
  currentUserId,
  accountId,
  isAdmin = false,
  onEdit,
  onDelete,
  onReact,
  onComment,
  showComments = true,
}: PostCardProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count || 0);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const isAuthor = post.author_id === currentUserId;
  const canModify = isAuthor || isAdmin;

  // Initialize comment hooks
  const { comments, isLoading: commentsLoading, fetchComments, createComment, updateComment, deleteComment } = useComments(post.id);
  const { toggleReaction } = useReactions();

  // Update local comment count when post prop changes
  useEffect(() => {
    setLocalCommentCount(post.comment_count || 0);
  }, [post.comment_count]);

  // Update local comment count when comments are loaded
  useEffect(() => {
    if (hasLoadedComments) {
      setLocalCommentCount(comments.length);
    }
  }, [comments.length, hasLoadedComments]);

  const handleCommentClick = () => {
    const newShowState = !showCommentsSection;
    setShowCommentsSection(newShowState);

    // Load comments on first toggle
    if (newShowState && !hasLoadedComments) {
      fetchComments();
      setHasLoadedComments(true);
    }

    if (onComment) {
      onComment();
    }
  };

  // Handle comment creation
  const handleCommentSubmit = async (body: string) => {
    try {
      await createComment(body, accountId);
      setLocalCommentCount((prev) => prev + 1);
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  };

  // Handle comment editing
  const handleCommentEdit = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(comment);
    }
  };

  // Handle comment update
  const handleCommentUpdate = async (body: string) => {
    if (!editingComment) return;

    try {
      await updateComment(editingComment.id, body);
      setEditingComment(null);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  };

  // Handle comment deletion
  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(commentId);
      setLocalCommentCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Handle comment reactions
  const handleCommentReact = async (commentId: string, emoji: ReactionType) => {
    try {
      await toggleReaction(commentId, 'comment', emoji);
      // Refresh comments to get updated reactions
      await fetchComments();
    } catch (error) {
      console.error('Error toggling comment reaction:', error);
    }
  };

  // Render body with highlighted mentions and clickable links
  const renderBody = () => {
    if (!post.body) return null;

    const segments = parseTextContent(post.body);

    return (
      <div className="text-white/90 whitespace-pre-wrap break-words">
        {segments.map((segment, index) => {
          if (typeof segment === 'string') {
            return <span key={index}>{segment}</span>;
          }

          // Mention
          if (segment.type === 'mention') {
            return (
              <span key={index} className="text-[#452F9F] font-semibold">
                @{segment.username}
              </span>
            );
          }

          // Link
          if (segment.type === 'link') {
            return (
              <a
                key={index}
                href={segment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#452F9F] hover:text-[#5a3fbf] underline transition-colors"
              >
                {segment.displayUrl}
              </a>
            );
          }

          return null;
        })}
      </div>
    );
  };

  if (post.deleted_at) {
    return (
      <article className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-6 opacity-50">
        <p className="text-white/50 italic">[Post deleted]</p>
      </article>
    );
  }

  return (
    <article className="bg-white/8 backdrop-blur-[10px] border border-white/18 rounded-xl p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <UserIdentity author={post.author} showBadge={true} />
          <RelativeTime date={post.created_at} className="text-sm mt-0.5" />
        </div>

        {/* Actions menu (for author or admin) */}
        {canModify && (
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Post actions"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showActionsMenu && (
              <div
                className="absolute right-0 mt-2 w-32 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 overflow-hidden z-10"
                role="menu"
              >
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit();
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    role="menuitem"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold text-white mb-2">
        {parseTextContent(post.title).map((segment, index) => {
          if (typeof segment === 'string') {
            return <span key={index}>{segment}</span>;
          }

          // Mention in title
          if (segment.type === 'mention') {
            return (
              <span key={index} className="text-[#452F9F]">
                @{segment.username}
              </span>
            );
          }

          // Link in title
          if (segment.type === 'link') {
            return (
              <a
                key={index}
                href={segment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#452F9F] hover:text-[#5a3fbf] underline transition-colors"
              >
                {segment.displayUrl}
              </a>
            );
          }

          return null;
        })}
      </h2>

      {/* Body */}
      {post.body && <div className="mb-3">{renderBody()}</div>}

      {/* External link */}
      {post.external_url && (
        <a
          href={post.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#452F9F] hover:text-[#452F9F]/80 transition-colors mb-3"
          aria-label={`Visit ${extractDomain(post.external_url)}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          <span className="underline">{extractDomain(post.external_url)}</span>
        </a>
      )}

      {/* Reactions and actions bar - Slack style */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        {/* Reactions on the left */}
        <ReactionBar
          targetId={post.id}
          targetType="post"
          reactions={post.reaction_counts || []}
          userReactions={post.user_reactions || []}
          onReact={onReact}
        />

        {/* Comment button on the right */}
        {showComments && (
          <button
            onClick={handleCommentClick}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/20"
            aria-label={`${localCommentCount} comments`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {localCommentCount > 0 && <span className="font-medium text-xs">{localCommentCount}</span>}
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showCommentsSection && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          {/* Comment Composer */}
          <CommentComposer postId={post.id} onSubmit={handleCommentSubmit} />

          {/* Loading State */}
          {commentsLoading && !hasLoadedComments && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/70" />
            </div>
          )}

          {/* Comment List */}
          {hasLoadedComments && (
            <CommentList
              comments={comments}
              currentUserId={currentUserId}
              onEdit={handleCommentEdit}
              onDelete={handleCommentDelete}
              onReact={handleCommentReact}
            />
          )}

          {/* Empty State */}
          {hasLoadedComments && !commentsLoading && comments.length === 0 && (
            <div className="text-center py-4">
              <p className="text-white/50 text-sm">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Comment Modal */}
      {editingComment && (
        <EditCommentModal
          isOpen={true}
          comment={editingComment}
          onClose={() => setEditingComment(null)}
          onSubmit={handleCommentUpdate}
        />
      )}
    </article>
  );
}
