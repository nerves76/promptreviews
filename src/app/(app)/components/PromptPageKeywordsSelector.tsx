'use client';

import { useState, KeyboardEvent } from 'react';
import Icon from '@/components/Icon';

interface PromptPageKeywordsSelectorProps {
  /** Current selected keywords for this prompt page */
  selectedKeywords: string[];
  /** Callback when keywords change */
  onChange: (keywords: string[]) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * PromptPageKeywordsSelector Component
 *
 * Allows users to add and manage keywords for a prompt page.
 * Keywords help with SEO and can guide reviewers to include specific terms.
 */
export default function PromptPageKeywordsSelector({
  selectedKeywords,
  onChange,
  disabled = false
}: PromptPageKeywordsSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const addCustomKeyword = () => {
    if (!customInput.trim()) return;

    // Split by comma and clean up each keyword
    const newKeywords = customInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .filter(k => !selectedKeywords.includes(k)); // Avoid duplicates

    if (newKeywords.length > 0) {
      onChange([...selectedKeywords, ...newKeywords]);
      setCustomInput('');
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCustomKeyword();
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    if (customInput.trim()) {
      addCustomKeyword();
    }
  };

  return (
    <div className="space-y-4">
      {/* Keywords Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Keywords for this prompt page
        </label>

        {/* Display all keywords */}
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200 mb-2">
            {selectedKeywords.map((keyword, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-800 bg-indigo-100 border border-indigo-300 rounded-full"
              >
                <span>{keyword}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(selectedKeywords.filter(k => k !== keyword))}
                    className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200 transition-colors"
                    aria-label={`Remove keyword: ${keyword}`}
                  >
                    <Icon name="FaTimes" className="w-3 h-3 text-indigo-700" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input for adding keywords */}
        <div className={`relative ${isFocused ? 'ring-2 ring-indigo-500 rounded-md' : ''}`}>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={handleInputBlur}
            placeholder="Enter keywords (e.g., best pizza Seattle, wood-fired oven, holiday special)"
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {customInput && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              Press Enter or comma to add
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">
          {selectedKeywords.length > 0
            ? `${selectedKeywords.length} keyword${selectedKeywords.length === 1 ? '' : 's'}`
            : 'No keywords yet'}
        </span>
        <span className="text-gray-400">
          Separate multiple keywords with commas
        </span>
      </div>

      {/* Help text */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Keywords help with SEO:</strong> Add keywords and phrases you want reviewers to include.
          These can help improve your visibility in search engines and AI tools like ChatGPT.
        </p>
      </div>
    </div>
  );
}
