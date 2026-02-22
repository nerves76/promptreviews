'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Icon from '@/components/Icon';
import { useKeywords } from '../hooks/useKeywords';

interface ConceptPickerProps {
  value: string | null;
  onChange: (conceptId: string | null, conceptName?: string) => void;
  placeholder?: string;
  excludeIds?: string[];
  className?: string;
}

/**
 * Searchable dropdown for selecting keyword concepts.
 * Uses useKeywords hook to fetch concepts for the current account.
 */
export function ConceptPicker({
  value,
  onChange,
  placeholder = 'Search concepts...',
  excludeIds = [],
  className = '',
}: ConceptPickerProps) {
  const { keywords, isLoading } = useKeywords();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter out excluded concepts and apply search
  const filteredConcepts = useMemo(() => {
    const excludeSet = new Set(excludeIds);
    let filtered = keywords.filter(k => !excludeSet.has(k.id));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(k =>
        k.phrase.toLowerCase().includes(query) ||
        k.name?.toLowerCase().includes(query) ||
        k.groupName?.toLowerCase().includes(query)
      );
    }

    return filtered.slice(0, 50); // Limit to 50 results for performance
  }, [keywords, excludeIds, searchQuery]);

  // Get selected concept name for display
  const selectedConcept = useMemo(() => {
    if (!value) return null;
    return keywords.find(k => k.id === value);
  }, [keywords, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selection
  const handleSelect = (conceptId: string, conceptName: string) => {
    onChange(conceptId, conceptName);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle clear
  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : (selectedConcept?.phrase || '')}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30"
          aria-label="Select a concept"
        />
        <Icon
          name="FaSearch"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
        />
        {selectedConcept && !isOpen && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-600"
            aria-label="Clear selection"
          >
            <Icon name="FaTimes" className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin mx-auto" />
              <span className="block mt-1 text-sm">Loading concepts...</span>
            </div>
          ) : filteredConcepts.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchQuery ? 'No concepts match your search' : 'No concepts available'}
            </div>
          ) : (
            <ul>
              {filteredConcepts.map((concept) => (
                <li key={concept.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(concept.id, concept.phrase)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                      value === concept.id ? 'bg-slate-blue/5' : ''
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {concept.phrase}
                    </div>
                    {concept.groupName && (
                      <div className="text-xs text-gray-500 truncate">
                        {concept.groupName}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
