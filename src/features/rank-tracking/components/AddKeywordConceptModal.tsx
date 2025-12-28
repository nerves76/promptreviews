'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

interface AddKeywordConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; keyword: string }) => Promise<void>;
}

/**
 * Simple modal for adding a keyword concept from the rank tracking page.
 * Just asks for concept name and the keyword to track.
 */
export function AddKeywordConceptModal({
  isOpen,
  onClose,
  onAdd,
}: AddKeywordConceptModalProps) {
  const [name, setName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a concept name');
      return;
    }
    if (!keyword.trim()) {
      setError('Please enter a keyword to track');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({ name: name.trim(), keyword: keyword.trim() });
      // Reset form
      setName('');
      setKeyword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add keyword');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setKeyword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add keyword concept</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="FaTimes" className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Concept name */}
          <div>
            <label htmlFor="concept-name" className="block text-sm font-medium text-gray-700 mb-1">
              Concept name
            </label>
            <input
              id="concept-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Portland marketing services"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/50 transition-all"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              A short name to identify this keyword concept
            </p>
          </div>

          {/* Keyword to track */}
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
              Keyword to track
            </label>
            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., marketing consultant portland"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/50 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              The search term you want to track rankings for
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Icon name="FaPlus" className="w-4 h-4" />
                  Add keyword
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddKeywordConceptModal;
