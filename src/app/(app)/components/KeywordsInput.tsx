'use client';

import { useState, KeyboardEvent } from 'react';
import Icon from '@/components/Icon';

interface KeywordsInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  maxKeywords?: number;
  disabled?: boolean;
}

/**
 * KeywordsInput Component
 *
 * A tag/chip-based input for managing keywords:
 * - Display keywords as individual chips with delete buttons
 * - Enter keywords via comma-separated input
 * - Compact wrapping layout for many keywords
 * - Future support for top-10 selection (data-attributes ready)
 */
export default function KeywordsInput({
  keywords,
  onChange,
  placeholder = "Enter keywords separated by commas...",
  maxKeywords,
  disabled = false
}: KeywordsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Ensure keywords is always a clean array
  const cleanKeywords = Array.isArray(keywords)
    ? keywords.filter(k => typeof k === 'string' && k.trim() !== '')
    : [];

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter or comma to add keyword
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeywordsFromInput();
    } else if (e.key === 'Backspace' && inputValue === '' && keywords.length > 0) {
      // Remove last keyword if backspace on empty input
      removeKeyword(keywords.length - 1);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Add any remaining input as a keyword when focus is lost
    if (inputValue.trim()) {
      addKeywordsFromInput();
    }
  };

  const addKeywordsFromInput = () => {
    if (!inputValue.trim()) return;

    // Split by comma and clean up each keyword
    const newKeywords = inputValue
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .filter(k => !cleanKeywords.includes(k)); // Avoid duplicates

    if (newKeywords.length > 0) {
      const updatedKeywords = [...cleanKeywords, ...newKeywords];

      // Apply max limit if specified
      if (maxKeywords && updatedKeywords.length > maxKeywords) {
        alert(`Maximum ${maxKeywords} keywords allowed`);
        return;
      }

      onChange(updatedKeywords);
      setInputValue('');
    }
  };

  const removeKeyword = (index: number) => {
    const updatedKeywords = cleanKeywords.filter((_, i) => i !== index);
    onChange(updatedKeywords);
  };

  return (
    <div className="space-y-2">
      {/* Keywords chips display */}
      {cleanKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {cleanKeywords.map((keyword, index) => (
            <div
              key={index}
              data-keyword-index={index}
              data-keyword={keyword}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors group"
            >
              <span>{keyword}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeKeyword(index)}
                  className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200 transition-colors"
                  aria-label={`Remove keyword: ${keyword}`}
                >
                  <Icon name="FaTimes" className="w-3 h-3 text-indigo-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className={`relative ${isFocused ? 'ring-2 ring-indigo-500 rounded-md' : ''}`}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {inputValue && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Press Enter or comma to add
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {cleanKeywords.length > 0 ? `${cleanKeywords.length} keyword${cleanKeywords.length === 1 ? '' : 's'}` : 'No keywords yet'}
          {maxKeywords && ` (max: ${maxKeywords})`}
        </span>
        <span className="text-gray-400">
          Tip: Separate multiple keywords with commas
        </span>
      </div>
    </div>
  );
}
