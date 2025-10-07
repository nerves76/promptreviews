/**
 * CommentList Component
 *
 * Displays list of comments under a post
 */

'use client';

import { Comment, ReactionType } from '../../types/community';
import { UserIdentity } from '../shared/UserIdentity';
import { RelativeTime } from '../shared/RelativeTime';
import { ReactionBar } from '../reactions/ReactionBar';
import { parseTextContent } from '../../utils/linkify';

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onReact: (commentId: string, emoji: ReactionType) => void;
}

export function CommentList({ comments, currentUserId, onEdit, onDelete, onReact }: CommentListProps) {
  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" aria-label="Comments">
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
        {comments.length} Comment{comments.length === 1 ? '' : 's'}
      </h3>

      {comments.map((comment) => {
        const isAuthor = comment.author_id === currentUserId;

        // Render body with highlighted mentions and clickable links
        const renderBody = () => {
          const segments = parseTextContent(comment.body);

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

        if (comment.deleted_at) {
          return (
            <div key={comment.id} className="pl-4 border-l-2 border-white/10 py-2 opacity-50">
              <p className="text-white/50 italic text-sm">[Comment deleted]</p>
            </div>
          );
        }

        return (
          <div key={comment.id} className="pl-4 border-l-2 border-white/20 py-2">
            <div className="flex items-start justify-between mb-2">
              <div>
                <UserIdentity author={comment.author} showBadge={true} className="text-sm" />
                <RelativeTime date={comment.created_at} className="text-xs" />
              </div>

              {isAuthor && (
                <div className="flex gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(comment.id)}
                      className="p-1 text-white/50 hover:text-white transition-colors text-xs"
                      aria-label="Edit comment"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors text-xs"
                      aria-label="Delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mb-2">{renderBody()}</div>

            <ReactionBar
              targetId={comment.id}
              targetType="comment"
              reactions={comment.reaction_counts || []}
              userReactions={comment.user_reactions || []}
              onReact={(emoji) => onReact(comment.id, emoji)}
            />
          </div>
        );
      })}
    </div>
  );
}
