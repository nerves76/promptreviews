/**
 * Load Business Info Button Component
 * Handles loading current business information from Google Business Profile
 */

'use client';

import { useState } from 'react';
import { FaStore, FaSpinner, FaCheck } from 'react-icons/fa';

interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
}

interface BusinessInfo {
  description: string;
  regularHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  primaryCategory?: {
    categoryId: string;
    displayName: string;
  };
  additionalCategories: Array<{
    categoryId: string;
    displayName: string;
  }>;
  serviceItems: Array<{
    name: string;
    description?: string;
  }>;
}

interface LoadBusinessInfoButtonProps {
  selectedLocationIds: string[];
  locations: BusinessLocation[];
  detailsLoaded: boolean;
  onBusinessInfoLoaded: (businessInfo: Partial<BusinessInfo>) => void;
  onLoadingStateChange: (isLoading: boolean) => void;
  onDetailsLoadedChange: (loaded: boolean) => void;
  onErrorChange: (error: string | null) => void;
}

export default function LoadBusinessInfoButton({
  selectedLocationIds,
  locations,
  detailsLoaded,
  onBusinessInfoLoaded,
  onLoadingStateChange,
  onDetailsLoadedChange,
  onErrorChange
}: LoadBusinessInfoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Loads business information from Google Business Profile
   * including description, hours, categories, and services
   */
  const loadCurrentBusinessInfo = async () => {
    if (selectedLocationIds.length !== 1) {
      onErrorChange('Business information loading only available for single locations');
      return;
    }

    setIsLoading(true);
    onLoadingStateChange(true);
    onErrorChange(null);

    try {
      const locationId = selectedLocationIds[0];
      const selectedLocation = locations.find(loc => loc.id === locationId);
      console.log('🔍 Loading current business information for location:', {
        requestedId: locationId,
        selectedLocation: selectedLocation,
        allLocations: locations.map(loc => ({ id: loc.id, name: loc.name }))
      });

      const response = await fetch('/api/business-information/location-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId }),
      });

      const data = await response.json();
      console.log('📦 API Response:', { status: response.status, ok: response.ok, success: data.success, hasLocation: !!data.location });

      if (response.ok && data.success && data.location) {
        console.log('✅ Loaded current business information:', data.location);
        
        // Parse business hours from API response
        let loadedHours: any = {
          MONDAY: { open: '09:00', close: '17:00', closed: false },
          TUESDAY: { open: '09:00', close: '17:00', closed: false },
          WEDNESDAY: { open: '09:00', close: '17:00', closed: false },
          THURSDAY: { open: '09:00', close: '17:00', closed: false },
          FRIDAY: { open: '09:00', close: '17:00', closed: false },
          SATURDAY: { open: '10:00', close: '16:00', closed: false },
          SUNDAY: { open: '10:00', close: '16:00', closed: true }
        };
        
        if (data.location.regularHours?.periods) {
          const parsedHours: any = {};
          
          // Initialize all days as closed
          ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].forEach(day => {
            parsedHours[day] = { open: '09:00', close: '17:00', closed: true };
          });
          
          // Parse the periods from Google's format
          data.location.regularHours.periods.forEach((period: any) => {
            if (period.openDay && period.openTime && period.closeTime) {
              parsedHours[period.openDay] = {
                open: period.openTime,
                close: period.closeTime,
                closed: false
              };
            }
          });
          
          loadedHours = parsedHours;
          console.log('✅ Parsed business hours:', loadedHours);
        }

        // Update business info with all available data
        const loadedBusinessInfo = {
          description: data.location.profile?.description || '',
          regularHours: loadedHours,
          primaryCategory: data.location.categories?.primaryCategory,
          additionalCategories: data.location.categories?.additionalCategories || [],
          serviceItems: data.location.serviceItems?.map((item: any) => ({
            name: item.freeFormServiceItem?.label?.displayName || 
                  item.structuredServiceItem?.description || 
                  'Unnamed Service',
            description: item.freeFormServiceItem?.label?.description || 
                        item.structuredServiceItem?.description || ''
          })) || []
        };

        onBusinessInfoLoaded(loadedBusinessInfo);
        onDetailsLoadedChange(true);
        console.log('✅ Business information loaded successfully');
      } else {
        console.log('⚠️ No business information available or API error:', data);
        const errorMessage = data.message || data.error || 'Unable to load current business information';
        onErrorChange(errorMessage);
        onDetailsLoadedChange(true); // Still mark as "attempted" so we don't keep showing the button
      }

    } catch (error) {
      console.error('❌ Error loading business information:', error);
      onErrorChange('Failed to load business information. Please check your connection.');
    } finally {
      setIsLoading(false);
      onLoadingStateChange(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            Load Current Business Information
          </h4>
          {selectedLocationIds.length === 1 && !detailsLoaded ? (
            <p className="text-xs text-gray-600">
              Import your current description, hours, categories, and services from Google Business Profile.
            </p>
          ) : selectedLocationIds.length > 1 ? (
            <p className="text-xs text-gray-500">
              Cannot load info for more than one business at a time.
            </p>
          ) : (
            <p className="text-xs text-green-600">
              ✓ Business information has been loaded.
            </p>
          )}
        </div>
        
        <button
          onClick={loadCurrentBusinessInfo}
          disabled={isLoading || selectedLocationIds.length > 1 || detailsLoaded}
          className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-md border ml-4 ${
            isLoading || selectedLocationIds.length > 1 || detailsLoaded
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
        >
          {isLoading ? (
            <>
              <FaSpinner className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : detailsLoaded ? (
            <>
              <FaCheck className="w-4 h-4" />
              <span>Loaded</span>
            </>
          ) : (
            <>
              <FaStore className="w-4 h-4" />
              <span>Load Business Info</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 