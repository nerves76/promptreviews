/**
 * ReactionBar Component
 *
 * Slack-style reactions with sprite icons - only shows reactions that have been used
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { ReactionType, ReactionCount } from '../../types/community';
import Icon from '@/components/Icon';

interface ReactionBarProps {
  targetId: string;
  targetType: 'post' | 'comment';
  reactions: ReactionCount[];
  userReactions: ReactionType[];
  onReact: (emoji: ReactionType) => void;
}

// Map reaction types to sprite icon names
const REACTION_ICONS: Record<ReactionType, { icon: 'FaThumbsUp' | 'FaHeart' | 'FaStar' | 'FaSmile' | 'FaUnhappy', label: string }> = {
  thumbs_up: { icon: 'FaThumbsUp', label: 'Like' },
  star: { icon: 'FaStar', label: 'Star' },
  celebrate: { icon: 'FaUnhappy', label: 'Unhappy' },
  clap: { icon: 'FaHeart', label: 'Clap' },
  laugh: { icon: 'FaSmile', label: 'Laugh' },
};

const AVAILABLE_REACTIONS: ReactionType[] = ['thumbs_up', 'star', 'celebrate', 'clap', 'laugh'];

export function ReactionBar({ reactions, userReactions, onReact }: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  // Only show reactions that have been used (count > 0)
  const usedReactions = reactions.filter((r) => r.count > 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Existing reactions */}
      {usedReactions.map((reaction) => {
        const reacted = userReactions.includes(reaction.emoji);
        const iconConfig = REACTION_ICONS[reaction.emoji];

        if (!iconConfig) return null;

        return (
          <button
            key={reaction.emoji}
            onClick={() => onReact(reaction.emoji)}
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm transition-all
              ${
                reacted
                  ? 'bg-[#452F9F]/20 text-white border border-[#452F9F]/40'
                  : 'bg-white/8 text-white/90 hover:bg-white/12 border border-transparent'
              }
            `}
            aria-label={`${iconConfig.label} (${reaction.count})`}
            aria-pressed={reacted}
          >
            <Icon
              name={iconConfig.icon}
              size={14}
              color="#ffffff"
            />
            <span className="font-medium text-xs">{reaction.count}</span>
          </button>
        );
      })}

      {/* Add reaction button (+) - Slack style */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors border border-white/20"
          aria-label="Add reaction"
        >
          <Icon name="FaPlus" size={12} />
        </button>

        {/* Reaction picker dropdown */}
        {showPicker && (
          <div className="absolute left-0 bottom-full mb-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 p-2 flex gap-1">
            {AVAILABLE_REACTIONS.map((emoji) => {
              const iconConfig = REACTION_ICONS[emoji];
              const reacted = userReactions.includes(emoji);

              return (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(emoji);
                    setShowPicker(false);
                  }}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${reacted ? 'bg-[#452F9F]/20' : 'hover:bg-gray-100'}
                  `}
                  aria-label={iconConfig.label}
                  title={iconConfig.label}
                >
                  <Icon
                    name={iconConfig.icon}
                    size={18}
                    color="#452F9F"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
