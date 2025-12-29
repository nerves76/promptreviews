/**
 * InlinePostComposer Component
 *
 * Slack-like bottom posting bar with @mention autocomplete
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useMentionableUsers } from '../../hooks/useMentionableUsers';
import { MentionAutocomplete } from '../mentions/MentionAutocomplete';

interface InlinePostComposerProps {
  channelName: string;
  onSubmit: (data: { title: string; body?: string }) => Promise<void>;
}

export function InlinePostComposer({ channelName, onSubmit }: InlinePostComposerProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [showMentions, setShowMentions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const { users, searchUsers } = useMentionableUsers();

  // Search users when mention query changes
  useEffect(() => {
    if (mentionQuery) {
      searchUsers(mentionQuery);
    }
  }, [mentionQuery, searchUsers]);

  // Show/hide mentions dropdown based on users
  useEffect(() => {
    setShowMentions(users.length > 0 && mentionStartPos !== null);
    setSelectedMentionIndex(0);
  }, [users, mentionStartPos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // First line is title, rest is body
      const lines = message.trim().split('\n');
      const title = lines[0];
      const body = lines.slice(1).join('\n').trim() || undefined;

      await onSubmit({ title, body });
      setMessage('');
      setMentionStartPos(null);
      setMentionQuery('');
    } catch (error) {
      console.error('Error posting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const detectMention = (text: string, cursorPos: number) => {
    // Find the last @ before cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) {
      setMentionStartPos(null);
      setMentionQuery('');
      return;
    }

    // Check if there's a space between @ and cursor (means mention ended)
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    if (textAfterAt.includes(' ')) {
      setMentionStartPos(null);
      setMentionQuery('');
      return;
    }

    // Extract mention query
    setMentionStartPos(lastAtIndex);
    setMentionQuery(textAfterAt);

    // We'll use CSS positioning relative to the container instead of calculating position
    setDropdownPosition({ top: 0, left: 0 });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    const cursorPos = e.target.selectionStart;
    detectMention(newMessage, cursorPos);
  };

  const insertMention = (user: { user_id: string; username: string; display_name: string; business_name: string; logo_url?: string }) => {
    if (mentionStartPos === null) return;

    const before = message.substring(0, mentionStartPos);
    const after = message.substring(textareaRef.current?.selectionStart || mentionStartPos);
    const mentionText = `${user.display_name} @ ${user.business_name}`;
    const newMessage = `${before}${mentionText} ${after}`;

    setMessage(newMessage);
    setMentionStartPos(null);
    setMentionQuery('');
    setShowMentions(false);

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = mentionStartPos + mentionText.length + 1; // +1 for space
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle autocomplete navigation
    if (showMentions && users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % users.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + users.length) % users.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(users[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        setMentionStartPos(null);
        setMentionQuery('');
        return;
      }
    }

    // Submit on Enter (without Shift) - only if not showing mentions
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative">
      {/* Mention Autocomplete Dropdown */}
      {showMentions && (
        <MentionAutocomplete
          users={users}
          selectedIndex={selectedMentionIndex}
          onSelect={insertMention}
          position={dropdownPosition}
        />
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName.toLowerCase()}`}
          className="w-full bg-white/5 text-white placeholder-white/50 focus:outline-none resize-none px-4 py-3 rounded-lg"
          rows={3}
          disabled={isSubmitting}
        />
        <div className="mt-2 flex items-center gap-3">
          {message.trim() && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#452F9F] text-white rounded-lg hover:bg-[#5a3fbf] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Send'}
            </button>
          )}
          <p className="text-xs text-white/70">
            <kbd className="px-2 py-1 bg-white/10 rounded">Enter</kbd> to send, <kbd className="px-2 py-1 bg-white/10 rounded">Shift + Enter</kbd> for new line
          </p>
        </div>
      </form>
    </div>
  );
}
