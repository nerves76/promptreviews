'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

interface AddKeywordConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; keywords: string[] }) => Promise<void>;
}

/**
 * Modal for adding a keyword concept from the rank tracking page.
 * Supports adding multiple keywords/search terms to track.
 */
export function AddKeywordConceptModal({
  isOpen,
  onClose,
  onAdd,
}: AddKeywordConceptModalProps) {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  const handleAddKeyword = () => {
    if (keywords.length < 10) {
      setKeywords([...keywords, '']);
    }
  };

  const handleRemoveKeyword = (index: number) => {
    if (keywords.length > 1) {
      setKeywords(keywords.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a concept name');
      return;
    }

    const validKeywords = keywords.map(k => k.trim()).filter(k => k.length > 0);
    if (validKeywords.length === 0) {
      setError('Please enter at least one keyword to track');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({ name: name.trim(), keywords: validKeywords });
      // Reset form
      setName('');
      setKeywords(['']);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add keyword');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setKeywords(['']);
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
            className="text-gray-500 hover:text-gray-600 transition-colors"
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
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              placeholder="e.g., Portland marketing services"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/50 transition-all"
              maxLength={50}
              autoFocus
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">
                A short name to identify this keyword concept
              </p>
              <span className={`text-xs ${name.length >= 45 ? 'text-amber-600' : 'text-gray-400'}`}>
                {name.length}/50
              </span>
            </div>
          </div>

          {/* Keywords to track */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords to track
            </label>
            <div className="space-y-2">
              {keywords.map((keyword, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => handleKeywordChange(index, e.target.value)}
                    placeholder={index === 0 ? "e.g., marketing consultant portland" : "Add another keyword..."}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/50 transition-all"
                  />
                  {keywords.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove keyword"
                    >
                      <Icon name="FaTimes" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                Search terms you want to track rankings for
              </p>
              {keywords.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="text-xs text-slate-blue hover:text-slate-blue/80 flex items-center gap-1 transition-colors"
                >
                  <Icon name="FaPlus" className="w-3 h-3" />
                  Add another
                </button>
              )}
            </div>
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
                  Add concept
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
