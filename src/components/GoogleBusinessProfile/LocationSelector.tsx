/**
 * LocationSelector Component
 * 
 * Reusable dropdown component for selecting a single Google Business Profile location.
 * Used across GMB overview and management pages for consistent location selection.
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';

interface Location {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
}

interface LocationSelectorProps {
  locations: Location[];
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
  isConnected: boolean;
  placeholder?: string;
  className?: string;
}

export default function LocationSelector({
  locations,
  selectedLocationId,
  onLocationChange,
  isConnected,
  placeholder = "Select a business location",
  className = ""
}: LocationSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDropdownOpen && !target.closest('.location-selector-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Get selected location details
  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

  // Handle location selection
  const handleLocationSelect = (locationId: string) => {
    onLocationChange(locationId);
    setIsDropdownOpen(false);
  };

  if (!isConnected) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 text-center ${className}`}>
        <Icon name="FaMapMarkerAlt" className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">Connect Google Business Profile to select locations</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center ${className}`}>
        <Icon name="FaExclamationTriangle" className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
        <p className="text-yellow-800 text-sm font-medium mb-1">No Business Locations Found</p>
        <p className="text-yellow-700 text-sm">Please fetch your business locations first</p>
      </div>
    );
  }

  return (
    <div className={`location-selector-dropdown relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Business Location
      </label>
      
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-slate-blue focus:border-slate-blue transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Icon name="FaMapMarkerAlt" className="w-4 h-4 text-gray-500" />
          <div className="text-left">
            {selectedLocation ? (
              <>
                <div className="font-medium text-gray-900">{selectedLocation.name}</div>
                {selectedLocation.address && (
                  <div className="text-sm text-gray-500 truncate">{selectedLocation.address}</div>
                )}
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {selectedLocation && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              selectedLocation.status === 'active' ? 'bg-green-100 text-green-800' :
              selectedLocation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {selectedLocation.status}
            </div>
          )}
          {isDropdownOpen ? (
            <Icon name="FaChevronUp" className="w-4 h-4 text-gray-500" />
          ) : (
            <Icon name="FaChevronDown" className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>
      
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {locations.map((location) => (
            <button
              key={location.id}
              onClick={() => handleLocationSelect(location.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-left ${
                selectedLocationId === location.id ? 'bg-slate-50 border-slate-200' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{location.name}</div>
                {location.address && (
                  <div className="text-sm text-gray-500 truncate">{location.address}</div>
                )}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                location.status === 'active' ? 'bg-green-100 text-green-800' :
                location.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {location.status}
              </div>
              {selectedLocationId === location.id && (
                <Icon name="FaCheck" className="w-4 h-4 text-slate-blue flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}