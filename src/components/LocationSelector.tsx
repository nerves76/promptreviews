/**
 * LocationSelector Component
 *
 * Reusable dropdown for selecting between business locations.
 * Follows Google Business tab pattern for multi-location selection.
 *
 * Can be used by:
 * - Local Ranking Grids (geo-grid configs)
 * - Future multi-location features
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/Icon';

// ============================================
// Types
// ============================================

export interface LocationOption {
  id: string;
  name: string;
  address?: string | null;
}

export interface LocationSelectorProps {
  /** Available locations to select from */
  locations: LocationOption[];
  /** Currently selected location ID */
  selectedId: string | null;
  /** Callback when selection changes */
  onSelect: (locationId: string) => void;
  /** Whether to show "Add Location" button */
  showAddButton?: boolean;
  /** Callback when "Add Location" is clicked */
  onAdd?: () => void;
  /** Label for the add button */
  addButtonLabel?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================
// Component
// ============================================

export function LocationSelector({
  locations,
  selectedId,
  onSelect,
  showAddButton = false,
  onAdd,
  addButtonLabel = 'Add Location',
  disabled = false,
  placeholder = 'Select a location',
  className = '',
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected location
  const selectedLocation = locations.find(loc => loc.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (locationId: string) => {
    onSelect(locationId);
    setIsOpen(false);
  };

  // Don't render if only one location and no add button
  if (locations.length <= 1 && !showAddButton) {
    return null;
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-3 py-2
          bg-white border border-gray-300 rounded-lg
          text-left text-gray-900
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex-1 min-w-0">
          {selectedLocation ? (
            <>
              <div className="font-medium truncate text-gray-900">
                {selectedLocation.name}
              </div>
              {selectedLocation.address && (
                <div className="text-sm text-gray-500 truncate">
                  {selectedLocation.address}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400">{placeholder}</div>
          )}
        </div>
        <Icon
          name="FaChevronDown"
          className={`w-4 h-4 ml-2 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {locations.map(location => (
              <button
                key={location.id}
                type="button"
                onClick={() => handleSelect(location.id)}
                className={`
                  w-full px-4 py-3 text-left
                  transition-colors duration-150
                  ${location.id === selectedId
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="font-medium truncate">
                  {location.name}
                </div>
                {location.address && (
                  <div className="text-sm text-gray-500 truncate">
                    {location.address}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Add Location Button */}
          {showAddButton && onAdd && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  onAdd();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 transition-colors duration-150 flex items-center gap-2"
              >
                <Icon name="FaPlus" className="w-4 h-4" />
                {addButtonLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationSelector;
