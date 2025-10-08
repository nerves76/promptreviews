/**
 * Location Selection Modal Component
 * 
 * Shows after OAuth connection to let users select which GBP locations to manage.
 * Enforces plan-based limits: 5 for Builder, 10 for Maven.
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';

interface Location {
  id: string;
  name: string;
  address: string;
}

interface LocationSelectionModalProps {
  locations: Location[];
  planLimit: number;
  planName: string;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function LocationSelectionModal({
  locations,
  planLimit,
  planName,
  onConfirm,
  onCancel,
  isLoading = false
}: LocationSelectionModalProps) {
  // Force rebuild: v2 with null safety fixes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // Ensure locations is always an array
  const safeLocations = Array.isArray(locations) ? locations : [];

  // Filter locations based on search with null checks
  const filteredLocations = safeLocations.filter(loc => {
    if (!loc) return false;
    const name = (loc.name || '').toLowerCase();
    const address = (loc.address || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();
    return name.includes(search) || address.includes(search);
  });

  // Handle location selection
  const handleToggle = (locationId: string) => {
    setShowLimitWarning(false);
    
    if (selectedIds.includes(locationId)) {
      // Deselect
      setSelectedIds(selectedIds.filter(id => id !== locationId));
    } else {
      // Select - check limit
      if (selectedIds.length >= planLimit) {
        setShowLimitWarning(true);
        return;
      }
      setSelectedIds([...selectedIds, locationId]);
    }
  };

  // Select all (up to limit)
  const handleSelectAll = () => {
    const toSelect = filteredLocations.slice(0, planLimit).map(loc => loc.id);
    setSelectedIds(toSelect);
    if (filteredLocations.length > planLimit) {
      setShowLimitWarning(true);
    }
  };

  // Clear selection
  const handleClearAll = () => {
    setSelectedIds([]);
    setShowLimitWarning(false);
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      console.warn('No locations selected');
      return;
    }
    try {
      onConfirm(selectedIds);
    } catch (error) {
      console.error('Error in onConfirm callback:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Select business locations to manage
          </h2>
          <p className="text-sm text-gray-600">
            Choose which Google Business Profile locations you want to manage with Prompt Reviews.
            Your {planName} plan allows up to {planLimit} location{planLimit !== 1 ? 's' : ''}.
          </p>
        </div>

        {/* Search bar */}
        {locations.length > 10 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
              />
              <Icon 
                name="FaSearch" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
              />
            </div>
          </div>
        )}

        {/* Selection count and actions */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.length} of {planLimit} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-slate-blue hover:text-slate-700"
              >
                Select all (up to {planLimit})
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={handleClearAll}
                className="text-sm text-slate-blue hover:text-slate-700"
              >
                Clear all
              </button>
            </div>
          </div>
          {locations.length > planLimit && (
            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              {locations.length - planLimit} additional location{locations.length - planLimit !== 1 ? 's' : ''} available with upgrade
            </div>
          )}
        </div>

        {/* Limit warning */}
        {showLimitWarning && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start space-x-2">
              <Icon name="FaExclamationTriangle" className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Location limit reached</p>
                <p>Your {planName} plan allows up to {planLimit} locations. Upgrade to Maven to manage more locations.</p>
              </div>
            </div>
          </div>
        )}

        {/* Location list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {filteredLocations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No locations match your search' : 'No locations found'}
              </div>
            ) : (
              filteredLocations.map((location) => {
                const isSelected = selectedIds.includes(location.id);
                const isDisabled = !isSelected && selectedIds.length >= planLimit;
                
                return (
                  <div
                    key={location.id}
                    className={`
                      border rounded-lg p-4 cursor-pointer transition-colors
                      ${isSelected ? 'border-slate-blue bg-slate-50' : 'border-gray-200 hover:border-gray-300'}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => !isDisabled && handleToggle(location.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => !isDisabled && handleToggle(location.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {location.name || `Location ${location.id.slice(0, 8)}...`}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {location.address}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel connection
            </button>
            <div className="flex items-center space-x-3">
              {selectedIds.length === 0 && (
                <span className="text-sm text-red-600">
                  Please select at least one location
                </span>
              )}
              <button
                onClick={handleConfirm}
                disabled={selectedIds.length === 0 || isLoading}
                className={`
                  px-6 py-2 rounded-md font-medium transition-colors
                  ${selectedIds.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-slate-blue text-white hover:bg-slate-700'
                  }
                `}
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  `Confirm selection (${selectedIds.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}