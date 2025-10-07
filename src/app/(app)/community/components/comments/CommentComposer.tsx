/**
 * CommentComposer Component
 *
 * Inline textarea for adding comments with @mention support
 */

'use client';

import { useState, useRef, FormEvent, KeyboardEvent } from 'react';
import { Button } from '@/app/(app)/components/ui/button';
import { getMentionQuery, insertMention } from '../../utils/mentionParser';
import { MentionAutocomplete } from '../mentions/MentionAutocomplete';
import { useMentionSearch } from '../../hooks/useMentions';

interface CommentComposerProps {
  postId: string;
  onSubmit: (body: string) => Promise<void>;
}

export function CommentComposer({ postId, onSubmit }: CommentComposerProps) {
  const [body, setBody] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { users: mentionUsers } = useMentionSearch(mentionQuery);

  // Handle body changes and detect mentions
  const handleBodyChange = (value: string) => {
    setBody(value);

    const cursor = textareaRef.current?.selectionStart || 0;
    setCursorPosition(cursor);

    const query = getMentionQuery(value, cursor);
    if (query !== null) {
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  // Handle mention selection
  const handleMentionSelect = (username: string) => {
    const result = insertMention(body, cursorPosition, username);
    setBody(result.text);
    setShowMentions(false);
    setMentionQuery('');

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(result.cursorPosition, result.cursorPosition);
      }
    }, 0);
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && (e.key === 'Escape' || e.key === 'Tab')) {
      setShowMentions(false);
      setMentionQuery('');
      e.preventDefault();
    }
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!body.trim() || body.length > 2000) return;

    setIsSubmitting(true);

    try {
      await onSubmit(body.trim());
      setBody('');
      setIsExpanded(false);
      setShowMentions(false);
      setMentionQuery('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setBody('');
    setIsExpanded(false);
    setShowMentions(false);
    setMentionQuery('');
  };

  const charCount = body.length;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full px-4 py-3 text-left text-white/50 bg-white/5 border border-white/10 rounded-lg hover:bg-white/8 hover:border-white/20 transition-colors"
      >
        Add a comment...
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 text-white bg-white/5 placeholder-white/50 rounded-lg focus:outline-none focus:border focus:border-white/50 resize-none"
          placeholder="Write a comment... Use @ to mention someone"
          rows={3}
          maxLength={2000}
          autoFocus
          aria-label="Write a comment"
        />

        {/* Mention autocomplete */}
        {showMentions && mentionUsers.length > 0 && (
          <div className="absolute z-10 mt-1 w-full">
            <MentionAutocomplete
              query={mentionQuery}
              users={mentionUsers}
              onSelect={(user) => handleMentionSelect(user.username)}
              position={{ top: 0, left: 0 }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className={`text-xs ${charCount > 1800 ? 'text-red-400' : 'text-white/50'}`} aria-live="polite">
          {charCount}/2000
        </span>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleCancel} disabled={isSubmitting} className="text-white hover:text-white">
            Cancel
          </Button>
          <Button type="submit" variant="default" size="sm" disabled={isSubmitting || !body.trim() || charCount > 2000}>
            {isSubmitting ? 'Posting...' : 'Comment'}
          </Button>
        </div>
      </div>
    </form>
  );
}
