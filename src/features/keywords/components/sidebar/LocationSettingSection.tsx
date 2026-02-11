'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import LocationPicker from '@/components/LocationPicker';

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
 * Uses the shared LocationPicker component for consistent location search across the app.
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
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Expand when editing starts
  useEffect(() => {
    if (isEditing) {
      setIsCollapsed(false);
    }
  }, [isEditing]);

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="relative z-10 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl">
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
            <span className="text-sm text-gray-600 truncate ml-2">
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
                className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
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
          <p className="text-xs text-gray-600 mb-3">
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
                <span className="text-gray-600 italic">Not set (uses business location)</span>
              )}
            </div>
          ) : (
            /* Edit mode - use shared LocationPicker */
            <LocationPicker
              value={{ locationCode: locationCode ?? null, locationName: locationName ?? null }}
              onChange={(location) => {
                if (location) {
                  onLocationChange({ code: location.locationCode, name: location.locationName });
                } else {
                  onLocationChange(null);
                }
              }}
              placeholder="Search for a city, state, or country..."
            />
          )}
        </div>
      )}
    </div>
  );
}

export default LocationSettingSection;
