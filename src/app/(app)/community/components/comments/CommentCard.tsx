/**
 * CommentCard Component
 *
 * Individual comment display with glassmorphic design and reactions
 */

'use client';

import { useState } from 'react';
import { Comment, ReactionType } from '../../types/community';
import { UserIdentity } from '../shared/UserIdentity';
import { RelativeTime } from '../shared/RelativeTime';
import { ReactionBar } from '../reactions/ReactionBar';
import { parseTextContent } from '../../utils/linkify';

interface CommentCardProps {
  comment: Comment;
  currentUserId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact: (emoji: ReactionType) => void;
}

export function CommentCard({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  onReact,
}: CommentCardProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const isAuthor = comment.author_id === currentUserId;

  // Render body with highlighted mentions and clickable links
  const renderBody = () => {
    if (!comment.body) return null;

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
      <div className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-lg p-3 opacity-50">
        <p className="text-white/50 italic text-sm">[Comment deleted]</p>
      </div>
    );
  }

  return (
    <article className="bg-white/5 backdrop-blur-[10px] border border-white/12 rounded-lg p-3 hover:bg-white/8 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <UserIdentity author={comment.author} showBadge={true} />
          <RelativeTime date={comment.created_at} className="text-xs mt-0.5" />
        </div>

        {/* Actions menu (only for author) */}
        {isAuthor && (
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Comment actions"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
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

      {/* Body */}
      <div className="mb-2">{renderBody()}</div>

      {/* Reactions bar */}
      <div className="pt-2">
        <ReactionBar
          targetId={comment.id}
          targetType="comment"
          reactions={comment.reaction_counts || []}
          userReactions={comment.user_reactions || []}
          onReact={onReact}
        />
      </div>
    </article>
  );
}
