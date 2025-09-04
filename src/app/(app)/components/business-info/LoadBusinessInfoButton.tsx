/**
 * Load Business Info Button Component
 * Handles loading current business information from Google Business Profile
 */

'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { BusinessLocation } from '@/types/business';
import { processGoogleServiceItem } from '@/utils/google-service-types';


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
    if (selectedLocationIds.length === 0) {
      onErrorChange('Please select at least one location');
      return;
    }
    
    // Use the first selected location as reference for multiple selections
    const referenceLocationId = selectedLocationIds[0];
    if (selectedLocationIds.length > 1) {
    }

    setIsLoading(true);
    onLoadingStateChange(true);
    onErrorChange(null);

    try {
      const selectedLocation = locations.find(loc => loc.id === referenceLocationId);

      const response = await fetch('/api/business-information/location-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId: referenceLocationId }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.location) {
        
        // Deep inspection of the location object to find categories
        
        
        // Check every possible field that might contain categories
        const possibleCategoryFields = [
          'categories',
          'category',
          'primaryCategory',
          'primary_category',
          'businessCategories',
          'business_categories',
          'categoryList',
          'category_list'
        ];
        
        possibleCategoryFields.forEach(field => {
          if (data.location[field]) {
          }
        });
        
        // Handle different possible category structures from Google
        let primaryCategory = null;
        let additionalCategories = [];
        
        // Google's API can return categories in different structures depending on the endpoint
        // Check multiple possible locations for the category data
        
        // Option 1: Nested under 'categories' object (most common)
        if (data.location.categories) {
          
          // Check for primaryCategory or primary_category (Google uses both)
          const primaryCat = data.location.categories.primaryCategory || 
                            data.location.categories.primary_category;
          
          if (primaryCat) {
            primaryCategory = {
              categoryId: primaryCat.name || primaryCat.categoryId,
              displayName: primaryCat.displayName
            };
          }
          
          // Check for additionalCategories or additional_categories
          const additionalCats = data.location.categories.additionalCategories || 
                                data.location.categories.additional_categories;
          
          if (additionalCats && Array.isArray(additionalCats)) {
            additionalCategories = additionalCats.map((cat: any) => ({
              categoryId: cat.name || cat.categoryId,
              displayName: cat.displayName
            }));
          }
        }
        
        // Option 2: Directly on location object (less common but sometimes used)
        if (!primaryCategory && data.location.primaryCategory) {
          primaryCategory = {
            categoryId: data.location.primaryCategory.name || data.location.primaryCategory.categoryId,
            displayName: data.location.primaryCategory.displayName
          };
        }
        
        if (additionalCategories.length === 0 && data.location.additionalCategories) {
          additionalCategories = data.location.additionalCategories.map((cat: any) => ({
            categoryId: cat.name || cat.categoryId,
            displayName: cat.displayName
          }));
        }
        
        
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
          data.location.regularHours.periods.forEach((period: any, index: number) => {
            
            if (period.openDay && period.openTime && period.closeTime) {
              // Convert Google's time format {hours: 9, minutes: 0} to HH:MM format
              const formatTime = (timeObj: any): string => {
                if (typeof timeObj === 'string') return timeObj; // Already in HH:MM format
                
                const hours = timeObj.hours || 0;
                const minutes = timeObj.minutes || 0;
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
              };
              
              parsedHours[period.openDay] = {
                open: formatTime(period.openTime),
                close: formatTime(period.closeTime),
                closed: false
              };
            }
          });
          
          loadedHours = parsedHours;
        } else {
        }

        // Process service items to ensure proper structure
        const rawServiceItems = data.location.serviceItems || [];
        
        // Process address if available
        let loadedAddress = undefined;
        if (data.location.storefrontAddress) {
          loadedAddress = {
            addressLines: data.location.storefrontAddress.addressLines || [],
            locality: data.location.storefrontAddress.locality,
            administrativeArea: data.location.storefrontAddress.administrativeArea,
            postalCode: data.location.storefrontAddress.postalCode,
            regionCode: data.location.storefrontAddress.regionCode
          };
        }

        // Process phone numbers
        let loadedPhoneNumbers = undefined;
        if (data.location.phoneNumbers) {
          loadedPhoneNumbers = {
            primaryPhone: data.location.phoneNumbers.primaryPhone,
            additionalPhones: data.location.phoneNumbers.additionalPhones || []
          };
        }

        // Process website
        const loadedWebsite = data.location.websiteUri || '';

        // Process coordinates
        let loadedCoordinates = undefined;
        if (data.location.latlng) {
          loadedCoordinates = {
            latitude: data.location.latlng.latitude,
            longitude: data.location.latlng.longitude
          };
        }

        const processedServiceItems = Array.isArray(rawServiceItems) 
          ? rawServiceItems.map((item: any, index: number) => {
              
              // Use the utility function to process Google service items
              const processed = processGoogleServiceItem(item);
              
              
              return {
                name: processed.name,
                description: processed.description
              };
            })
          : [];


        // Update business info with all available data
        const loadedBusinessInfo = {
          locationName: data.location.title || '',
          description: data.location.profile?.description || '',
          regularHours: loadedHours,
          primaryCategory: primaryCategory || undefined,
          additionalCategories,
          serviceItems: processedServiceItems,
          storefrontAddress: loadedAddress,
          phoneNumbers: loadedPhoneNumbers,
          websiteUri: loadedWebsite || undefined,
          latlng: loadedCoordinates
        };


        onBusinessInfoLoaded(loadedBusinessInfo);
        onDetailsLoadedChange(true);
      } else {
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
    <button
      onClick={loadCurrentBusinessInfo}
      disabled={isLoading || selectedLocationIds.length === 0 || detailsLoaded}
      className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-md border relative overflow-hidden transition-all duration-300 ${
        isLoading || selectedLocationIds.length === 0 || detailsLoaded
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          : `bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 ${!detailsLoaded && !isLoading ? 'shine-button' : ''}`
      }`}
      title={selectedLocationIds.length > 1 ? `Will load data from ${locations.find(l => l.id === selectedLocationIds[0])?.name || 'first selected location'} as reference` : undefined}
    >
      {isLoading ? (
        <>
          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : detailsLoaded ? (
        <>
          <Icon name="FaCheck" className="w-4 h-4" />
          <span>Loaded</span>
        </>
      ) : (
        <>
          <Icon name="FaStore" className="w-4 h-4" size={16} />
          <span>{selectedLocationIds.length > 1 ? 'Load reference info' : 'Load business info'}</span>
        </>
      )}
    </button>
  );
} 