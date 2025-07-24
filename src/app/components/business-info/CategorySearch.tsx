/**
 * Category Search Component
 * Provides a searchable interface for selecting Google Business Categories
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaSpinner, FaTimes, FaCheck } from 'react-icons/fa';

interface BusinessCategory {
  categoryId: string;
  displayName: string;
}

interface CategorySearchProps {
  selectedCategory?: BusinessCategory;
  onCategorySelect: (category: BusinessCategory | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CategorySearch({ 
  selectedCategory, 
  onCategorySelect, 
  placeholder = "Search business categories...",
  disabled = false
}: CategorySearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize search term with selected category
  useEffect(() => {
    if (selectedCategory) {
      setSearchTerm(selectedCategory.displayName);
    } else {
      setSearchTerm('');
    }
  }, [selectedCategory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search categories with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        searchCategories(searchTerm);
      }, 300); // 300ms debounce
    } else {
      setCategories([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const searchCategories = async (search: string) => {
    if (!search.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/business-information/categories?search=${encodeURIComponent(search)}&limit=20`);
      
      if (!response.ok) {
        throw new Error(`Failed to search categories: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      } else {
        setError(data.message || 'Failed to load categories');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error searching categories:', error);
      setError('Failed to search categories. Please try again.');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm.trim().length > 0 && categories.length === 0 && !isLoading) {
      searchCategories(searchTerm);
    }
  };

  const handleCategorySelect = (category: BusinessCategory) => {
    onCategorySelect(category);
    setSearchTerm(category.displayName);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onCategorySelect(null);
    setSearchTerm('');
    setCategories([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent ${
            disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
          } ${selectedCategory ? 'text-green-700' : ''}`}
        />
        
        {/* Search Icon */}
        <FaSearch className={`absolute left-3 top-3 w-4 h-4 ${
          disabled ? 'text-gray-400' : 'text-gray-500'
        }`} />
        
        {/* Loading/Clear/Success Icon */}
        <div className="absolute right-3 top-3 flex items-center space-x-1">
          {isLoading ? (
            <FaSpinner className="w-4 h-4 animate-spin text-slate-blue" />
          ) : selectedCategory ? (
            <>
              <FaCheck className="w-4 h-4 text-green-600" title="Selected" />
              <button
                onClick={handleClearSelection}
                disabled={disabled}
                className="text-gray-400 hover:text-red-600 disabled:cursor-not-allowed ml-1"
                title="Clear selection"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            </>
          ) : searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              title="Clear search"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border-b">
              {error}
            </div>
          )}
          
          {isLoading && searchTerm && (
            <div className="p-3 text-sm text-gray-600 flex items-center space-x-2">
              <FaSpinner className="w-4 h-4 animate-spin" />
              <span>Searching categories...</span>
            </div>
          )}
          
          {!isLoading && !error && searchTerm.trim().length > 0 && categories.length === 0 && (
            <div className="p-3 text-sm text-gray-600">
              No categories found for "{searchTerm}". Try a different search term.
            </div>
          )}
          
          {!isLoading && !error && searchTerm.trim().length === 0 && (
            <div className="p-3 text-sm text-gray-600">
              Start typing to search Google Business categories...
            </div>
          )}
          
          {categories.map((category) => (
            <button
              key={category.categoryId}
              onClick={() => handleCategorySelect(category)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{category.displayName}</div>
              <div className="text-xs text-gray-500">{category.categoryId}</div>
            </button>
          ))}
        </div>
      )}
      
      {/* Helper Text */}
      {selectedCategory && (
        <p className="text-xs text-green-600 mt-1">
          ✓ Selected: {selectedCategory.displayName}
        </p>
      )}
    </div>
  );
} 