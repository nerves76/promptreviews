/**
 * PostComposer Component
 *
 * Modal form for creating/editing posts with @mention support
 */

'use client';

import { useState, useRef, FormEvent, KeyboardEvent } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/app/(app)/components/ui/button';
import { PostFormData } from '../../types/community';
import { getMentionQuery, insertMention } from '../../utils/mentionParser';
import { validateAndSanitizeUrl } from '../../utils/urlValidator';
import { MentionAutocomplete } from '../mentions/MentionAutocomplete';
import { useMentionSearch } from '../../hooks/useMentions';

interface PostComposerProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: Partial<PostFormData>;
  channelName: string;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
}

export function PostComposer({ isOpen, mode, initialValues, channelName, onSubmit, onCancel }: PostComposerProps) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [body, setBody] = useState(initialValues?.body || '');
  const [externalUrl, setExternalUrl] = useState(initialValues?.external_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { users: mentionUsers, isLoading: mentionsLoading } = useMentionSearch(mentionQuery);

  // Handle body changes and detect mentions
  const handleBodyChange = (value: string) => {
    setBody(value);
    setIsDirty(true);

    // Get cursor position
    const cursor = bodyRef.current?.selectionStart || 0;
    setCursorPosition(cursor);

    // Check for mention query
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

    // Set cursor position after insertion
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.focus();
        bodyRef.current.setSelectionRange(result.cursorPosition, result.cursorPosition);
      }
    }, 0);
  };

  // Keyboard navigation for mentions
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && (e.key === 'Escape' || e.key === 'Tab')) {
      setShowMentions(false);
      setMentionQuery('');
      e.preventDefault();
    }
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (body.length > 5000) {
      newErrors.body = 'Body must be 5000 characters or less';
    }

    if (externalUrl) {
      const urlValidation = validateAndSanitizeUrl(externalUrl);
      if (!urlValidation.isValid) {
        newErrors.externalUrl = urlValidation.error || 'Invalid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const urlValidation = externalUrl ? validateAndSanitizeUrl(externalUrl) : null;

      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        external_url: urlValidation?.sanitized || undefined,
      });

      // Reset form
      setTitle('');
      setBody('');
      setExternalUrl('');
      setIsDirty(false);
      setErrors({});
    } catch (error) {
      console.error('Error submitting post:', error);
      setErrors({ submit: 'Failed to submit post. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close with confirmation if dirty
  const handleClose = () => {
    if (isDirty) {
      if (confirm('Are you sure you want to discard your changes?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const titleCount = title.length;
  const bodyCount = body.length;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-white max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? `New Post in #${channelName}` : 'Edit Post'}
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-1">
                Title <span className="text-red-600">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#452F9F] ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter title..."
                maxLength={200}
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.title && <span className="text-xs text-red-600">{errors.title}</span>}
                <span className={`text-xs ml-auto ${titleCount > 180 ? 'text-red-600' : 'text-gray-500'}`}>
                  {titleCount}/200
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="relative">
              <label htmlFor="body" className="block text-sm font-medium text-gray-900 mb-1">
                Body
              </label>
              <textarea
                id="body"
                ref={bodyRef}
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#452F9F] resize-none ${
                  errors.body ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Share your thoughts... Use @ to mention someone"
                rows={6}
                maxLength={5000}
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

              <div className="flex justify-between items-center mt-1">
                {errors.body && <span className="text-xs text-red-600">{errors.body}</span>}
                <span className={`text-xs ml-auto ${bodyCount > 4500 ? 'text-red-600' : 'text-gray-500'}`}>
                  {bodyCount}/5000
                </span>
              </div>
            </div>

            {/* External URL */}
            <div>
              <label htmlFor="externalUrl" className="block text-sm font-medium text-gray-900 mb-1">
                Link (optional)
              </label>
              <input
                id="externalUrl"
                type="url"
                value={externalUrl}
                onChange={(e) => {
                  setExternalUrl(e.target.value);
                  setIsDirty(true);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#452F9F] ${
                  errors.externalUrl ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://..."
              />
              {errors.externalUrl && <span className="text-xs text-red-600 mt-1 block">{errors.externalUrl}</span>}
            </div>

            {/* Submit error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={isSubmitting || !title.trim()}>
                {isSubmitting ? 'Posting...' : mode === 'create' ? 'Create Post' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
