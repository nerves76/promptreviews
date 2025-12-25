'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

interface LocationOption {
  locationCode: number;
  locationName: string;
  locationType: string;
}

interface LocationPickerProps {
  value?: { locationCode: number | null; locationName: string | null };
  onChange: (location: { locationCode: number; locationName: string } | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Typeahead location picker that searches the rank_locations table.
 * Used for setting business location and keyword concept location.
 */
export default function LocationPicker({
  value,
  onChange,
  placeholder = 'Search for a location...',
  disabled = false,
  className = '',
}: LocationPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search locations with debounce
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setOptions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get<{ locations: LocationOption[] }>(
        `/rank-locations/search?q=${encodeURIComponent(searchQuery)}`
      );
      setOptions(response.locations || []);
      setHighlightedIndex(0);
    } catch (error) {
      console.error('Error searching locations:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(query);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchLocations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: LocationOption) => {
    onChange({ locationCode: option.locationCode, locationName: option.locationName });
    setQuery('');
    setIsOpen(false);
    setOptions([]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || options.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (options[highlightedIndex]) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const getLocationTypeIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'City':
        return <Icon name="FaMapMarker" className="w-3 h-3 text-blue-500" />;
      case 'State':
        return <Icon name="FaGlobe" className="w-3 h-3 text-green-500" />;
      case 'Country':
        return <Icon name="FaGlobe" className="w-3 h-3 text-purple-500" />;
      default:
        return <Icon name="FaMapMarker" className="w-3 h-3 text-gray-400" />;
    }
  };

  const hasValue = value?.locationCode && value?.locationName;

  return (
    <div className={`relative ${className}`}>
      {/* Display selected value or search input */}
      {hasValue ? (
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
          <Icon name="FaMapMarker" className="w-4 h-4 text-slate-blue" />
          <span className="flex-1 text-sm text-gray-900 truncate">{value.locationName}</span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              title="Clear location"
            >
              <Icon name="FaTimes" className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Icon name="FaSearch" className="w-4 h-4 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-slate-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <Icon name="FaSpinner" className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !hasValue && options.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {options.map((option, index) => (
            <button
              key={option.locationCode}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors ${
                index === highlightedIndex
                  ? 'bg-slate-blue/10 text-slate-blue'
                  : 'hover:bg-gray-50 text-gray-900'
              }`}
            >
              {getLocationTypeIcon(option.locationType)}
              <span className="flex-1 truncate">{option.locationName}</span>
              <span className="text-xs text-gray-400 capitalize">{option.locationType}</span>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !hasValue && query.length >= 2 && !isLoading && options.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm text-gray-500 text-center"
        >
          No locations found for "{query}"
        </div>
      )}
    </div>
  );
}
