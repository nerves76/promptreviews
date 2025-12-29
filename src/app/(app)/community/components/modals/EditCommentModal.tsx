/**
 * EditCommentModal Component
 *
 * Modal for editing an existing comment
 */

'use client';

import { useState, useEffect } from 'react';
import { Comment } from '../../types/community';

interface EditCommentModalProps {
  isOpen: boolean;
  comment: Comment;
  onClose: () => void;
  onSubmit: (body: string) => Promise<void>;
}

export function EditCommentModal({ isOpen, comment, onClose, onSubmit }: EditCommentModalProps) {
  const [body, setBody] = useState(comment.body);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when comment changes
  useEffect(() => {
    setBody(comment.body);
    setError(null);
  }, [comment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(body.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Edit Comment</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white/70 hover:text-white transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Body */}
            <div>
              <label htmlFor="body" className="block text-sm font-medium text-white/90 mb-2">
                Comment *
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isSubmitting}
                placeholder="Share your thoughts..."
                rows={6}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none disabled:opacity-50"
                maxLength={2000}
              />
              <p className="text-xs text-white/70 mt-1">{body.length}/2000 characters</p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-white/70 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !body.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
