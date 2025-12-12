'use client';

import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useLocations } from '../hooks';

interface LocationPickerProps {
  value: { code: number; name: string } | null;
  onChange: (location: { code: number; name: string } | null) => void;
  placeholder?: string;
}

export default function LocationPicker({ value, onChange, placeholder }: LocationPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { locations, isLoading, search } = useLocations();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        search(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={value ? value.name : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || 'Search locations...'}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent"
        />
        {value && (
          <button
            onClick={() => {
              onChange(null);
              setQuery('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : locations.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No locations found</div>
          ) : (
            locations.map((loc) => (
              <button
                key={loc.locationCode}
                onClick={() => {
                  onChange({ code: loc.locationCode, name: loc.locationName });
                  setQuery('');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <MapPinIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{loc.locationName}</span>
                <span className="text-xs text-gray-400 ml-auto">{loc.locationType}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
