/**
 * Google Business Profile Location Picker
 *
 * Provides a consistent UI for displaying and selecting Google Business locations
 * across single- and multi-select use cases. Replaces the various bespoke
 * dropdowns and cards scattered through the dashboard.
 */

'use client';

import { useEffect, useMemo, useState, ReactNode } from 'react';
import Icon from '@/components/Icon';

interface LocationOption {
  id: string;
  name: string;
  address?: string;
}

interface BaseProps {
  locations: LocationOption[];
  label?: string;
  helperText?: string;
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
  emptyState?: ReactNode;
  placeholder?: string;
}

interface SingleSelectProps extends BaseProps {
  mode: 'single';
  selectedId?: string;
  onSelect: (id: string) => void;
}

interface MultiSelectProps extends BaseProps {
  mode: 'multi';
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
  onMaxSelection?: () => void;
  includeSelectAll?: boolean;
}

type LocationPickerProps = SingleSelectProps | MultiSelectProps;

const fallbackName = (id: string) => {
  const trimmed = id?.replace('locations/', '') ?? '';
  return trimmed ? `Business ${trimmed.substring(0, 8)}…` : 'Unnamed Business';
};

export default function LocationPicker(props: LocationPickerProps) {
  const {
    locations,
    label,
    helperText,
    className = '',
    isLoading = false,
    disabled = false,
    emptyState,
    placeholder,
  } = props;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.gbp-location-picker')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  const resolvedLabel = label ?? 'Google Business Profile';
  const hasLocations = locations.length > 0;
  const isSingleMode = props.mode === 'single';
  const singleSelectedId = isSingleMode ? props.selectedId : undefined;
  const emptySelectedIds = useMemo(() => [] as string[], []);
  const multiSelectedIds = !isSingleMode ? props.selectedIds : emptySelectedIds;
  const multiOnChange = !isSingleMode ? props.onChange : () => {};
  const multiMaxSelections = !isSingleMode ? props.maxSelections : undefined;
  const multiOnMaxSelection = !isSingleMode ? props.onMaxSelection : undefined;
  const multiIncludeSelectAll = !isSingleMode ? props.includeSelectAll ?? true : true;

  const summaryLabel = useMemo(() => {
    if (isSingleMode) {
      if (singleSelectedId) {
        const selectedLocation = locations.find((loc) => loc.id === singleSelectedId);
        return selectedLocation?.name || fallbackName(singleSelectedId);
      }
      return placeholder || 'Select business';
    }

    if (multiSelectedIds.length === 0) {
      return placeholder || 'Select business locations';
    }

    if (multiSelectedIds.length === locations.length) {
      return `All locations selected (${locations.length})`;
    }

    if (multiSelectedIds.length === 1) {
      const match = locations.find((loc) => loc.id === multiSelectedIds[0]);
      return match?.name || fallbackName(multiSelectedIds[0]);
    }

    return `${multiSelectedIds.length} locations selected`;
  }, [isSingleMode, singleSelectedId, locations, multiSelectedIds, placeholder]);

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">{resolvedLabel}</label>
        <div className="h-12 rounded-md bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!hasLocations) {
    if (emptyState) {
      return <div className={className}>{emptyState}</div>;
    }

    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">{resolvedLabel}</label>
        <div className="px-4 py-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 bg-gray-50">
          No Google Business locations found. Fetch your locations to get started.
        </div>
      </div>
    );
  }

  if (isSingleMode) {
    const { selectedId, onSelect } = props;

    if (locations.length === 1) {
      const only = locations[0];
      return (
        <div className={`space-y-2 ${className}`}>
          <label className="block text-sm font-medium text-gray-700">{resolvedLabel}</label>
          <div className="px-4 py-3 border border-gray-200 rounded-md bg-gray-50 text-gray-800">
            <div className="flex items-center space-x-2">
              <Icon name="FaGoogle" className="w-4 h-4 text-gray-600" />
              <span className="font-medium">{only.name || fallbackName(only.id)}</span>
            </div>
          </div>
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        </div>
      );
    }

    return (
      <div className={`space-y-2 gbp-location-picker ${className}`}>
        <label className="block text-sm font-medium text-gray-700">{resolvedLabel}</label>
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDropdownOpen((open) => !open)}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-slate-blue focus:border-slate-blue disabled:bg-gray-100 disabled:text-gray-400"
          >
            <span className="text-gray-800 truncate">{summaryLabel}</span>
            <Icon name={isDropdownOpen ? 'FaChevronUp' : 'FaChevronDown'} className="w-4 h-4 text-gray-500" />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {locations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => {
                    onSelect(location.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                    singleSelectedId === location.id ? 'bg-slate-50' : ''
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-900">
                    {location.name || fallbackName(location.id)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }

  const maxReached = multiMaxSelections !== undefined && multiSelectedIds.length >= multiMaxSelections;

  const toggleSelection = (locationId: string) => {
    const alreadySelected = multiSelectedIds.includes(locationId);

    if (alreadySelected) {
      multiOnChange(multiSelectedIds.filter((id) => id !== locationId));
      return;
    }

    if (multiMaxSelections !== undefined && multiSelectedIds.length >= multiMaxSelections) {
      multiOnMaxSelection?.();
      return;
    }

    multiOnChange([...multiSelectedIds, locationId]);
  };

  const handleSelectAll = () => {
    if (multiMaxSelections !== undefined && locations.length > multiMaxSelections) {
      multiOnMaxSelection?.();
      return;
    }

    multiOnChange(locations.map((loc) => loc.id));
  };

  const handleClear = () => multiOnChange([]);

  return (
    <div className={`space-y-2 gbp-location-picker ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{resolvedLabel}</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsDropdownOpen((open) => !open)}
          className={`w-full flex items-center justify-between px-4 py-3 border rounded-md bg-white focus:ring-2 focus:ring-slate-blue focus:border-slate-blue ${
            maxReached ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'
          } disabled:bg-gray-100 disabled:text-gray-400`}
        >
          <span className="text-gray-800 truncate">{summaryLabel}</span>
          <Icon name={isDropdownOpen ? 'FaChevronUp' : 'FaChevronDown'} className="w-4 h-4 text-gray-500" />
        </button>
        {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}

        {isDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {multiIncludeSelectAll && (
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Clear all
                </button>
              </div>
            )}

            {locations.map((location) => {
              const checked = multiSelectedIds.includes(location.id);
              return (
                <label
                  key={location.id}
                  className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                    checked={checked}
                    onChange={() => toggleSelection(location.id)}
                  />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {location.name || fallbackName(location.id)}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
