'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import { useLocations } from '@/features/rank-tracking/hooks';

export interface LocationSettingProps {
  locationCode: number | null;
  locationName: string | null;
  onLocationChange: (location: { code: number; name: string } | null) => void;
  isEditing: boolean;
  isSaving?: boolean;
  onStartEditing: () => void;
  onSave?: () => Promise<void>;
  onCancel?: () => void;
  /** Whether section is initially collapsed (default: false) */
  defaultCollapsed?: boolean;
}

/**
 * LocationSettingSection Component
 *
 * Allows setting the default location for volume and rank checks on a keyword concept.
 * Follows the same edit pattern as ReviewsEditSection.
 */
export function LocationSettingSection({
  locationCode,
  locationName,
  onLocationChange,
  isEditing,
  isSaving = false,
  onStartEditing,
  onSave,
  onCancel,
  defaultCollapsed = true,
}: LocationSettingProps) {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { locations, isLoading, search } = useLocations();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        search(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset query when exiting edit mode
  useEffect(() => {
    if (!isEditing) {
      setQuery('');
      setIsDropdownOpen(false);
    }
  }, [isEditing]);

  const handleClear = () => {
    onLocationChange(null);
    setQuery('');
  };

  const handleSelect = (loc: { locationCode: number; locationName: string }) => {
    onLocationChange({ code: loc.locationCode, name: loc.locationName });
    setQuery('');
    setIsDropdownOpen(false);
  };

  const handleCancel = () => {
    setQuery('');
    setIsDropdownOpen(false);
    onCancel?.();
  };

  // Expand when editing starts
  useEffect(() => {
    if (isEditing) {
      setIsCollapsed(false);
    }
  }, [isEditing]);

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden">
      {/* Section header - clickable to collapse */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer select-none"
        onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon name="FaMapMarker" className="w-5 h-5 text-slate-blue flex-shrink-0" />
          <span className="text-lg font-semibold text-gray-800">Location</span>
          {/* Show location value in header when collapsed */}
          {isCollapsed && !isEditing && (
            <span className="text-sm text-gray-500 truncate ml-2">
              {locationCode && locationName ? locationName : '(not set)'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing();
                }}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit location"
                aria-label="Edit location"
              >
                <Icon name="FaEdit" className="w-4 h-4" />
              </button>
              <Icon
                name="FaChevronDown"
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isCollapsed ? '' : 'rotate-180'
                }`}
              />
            </>
          ) : (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleCancel}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-2.5 py-1 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-1"
              >
                {isSaving && <Icon name="FaSpinner" className="w-2.5 h-2.5 animate-spin" />}
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="px-5 py-5 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3">
            Set a default location for volume and rank checks on this keyword.
          </p>

          {/* Read-only display when not editing */}
          {!isEditing ? (
            <div className="text-sm text-gray-700 bg-white/80 px-3 py-2.5 rounded-lg border border-gray-100">
              {locationCode && locationName ? (
                <div className="flex items-center gap-2">
                  <Icon name="FaMapMarker" className="w-4 h-4 text-green-500" />
                  <span className="font-medium">{locationName}</span>
                </div>
              ) : (
                <span className="text-gray-500 italic">Not set (uses business location)</span>
              )}
            </div>
          ) : (
            /* Edit mode - show search input */
            <div ref={wrapperRef} className="relative">
              {/* Current value with clear button, or search input */}
              {locationCode && locationName && !isDropdownOpen ? (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Icon name="FaMapMarker" className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-800">{locationName}</span>
                  </div>
                  <button
                    onClick={handleClear}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Clear location"
                  >
                    <Icon name="FaTimes" className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Icon name="FaSearch" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search for a city, state, or country..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30 transition-all"
                  />
                </div>
              )}

              {/* Dropdown */}
              {isDropdownOpen && query.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                      Searching...
                    </div>
                  ) : locations.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No locations found</div>
                  ) : (
                    locations.map((loc) => (
                      <button
                        key={loc.locationCode}
                        onClick={() => handleSelect(loc)}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                      >
                        <Icon name="FaMapMarker" className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{loc.locationName}</span>
                        <span className="text-xs text-gray-400 ml-auto">{loc.locationType}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationSettingSection;
