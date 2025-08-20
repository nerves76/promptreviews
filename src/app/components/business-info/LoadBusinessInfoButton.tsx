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
        
        // Deep inspection of the location object to find categories
        console.log('🔍 FULL LOCATION OBJECT:', JSON.stringify(data.location, null, 2));
        
        console.log('🏷️ Raw categories data from Google:', {
          hasCategories: !!data.location.categories,
          categoriesStructure: JSON.stringify(data.location.categories, null, 2),
          primaryCategory: data.location.primaryCategory,
          additionalCategories: data.location.additionalCategories,
          hasPrimaryCategory: !!data.location.primaryCategory,
          hasAdditionalCategories: !!data.location.additionalCategories,
          additionalCategoriesCount: data.location.additionalCategories?.length || 0,
          fullLocationKeys: Object.keys(data.location || {}),
          locationName: data.location.name,
          locationTitle: data.location.title
        });
        
        // Check every possible field that might contain categories
        console.log('🔍 Searching for categories in all possible locations:');
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
            console.log(`  ✅ Found field "${field}":`, data.location[field]);
          }
        });
        
        // Handle different possible category structures from Google
        let primaryCategory = null;
        let additionalCategories = [];
        
        // Google's API can return categories in different structures depending on the endpoint
        // Check multiple possible locations for the category data
        
        // Option 1: Nested under 'categories' object (most common)
        if (data.location.categories) {
          console.log('📋 Found categories object:', data.location.categories);
          
          // Check for primaryCategory or primary_category (Google uses both)
          const primaryCat = data.location.categories.primaryCategory || 
                            data.location.categories.primary_category;
          
          if (primaryCat) {
            console.log('📋 Processing primary category from categories object:', primaryCat);
            primaryCategory = {
              categoryId: primaryCat.name || primaryCat.categoryId,
              displayName: primaryCat.displayName
            };
          }
          
          // Check for additionalCategories or additional_categories
          const additionalCats = data.location.categories.additionalCategories || 
                                data.location.categories.additional_categories;
          
          if (additionalCats && Array.isArray(additionalCats)) {
            console.log('📋 Processing additional categories from categories object:', additionalCats);
            additionalCategories = additionalCats.map((cat: any) => ({
              categoryId: cat.name || cat.categoryId,
              displayName: cat.displayName
            }));
          }
        }
        
        // Option 2: Directly on location object (less common but sometimes used)
        if (!primaryCategory && data.location.primaryCategory) {
          console.log('📋 Processing primary category from data.location.primaryCategory:', data.location.primaryCategory);
          primaryCategory = {
            categoryId: data.location.primaryCategory.name || data.location.primaryCategory.categoryId,
            displayName: data.location.primaryCategory.displayName
          };
        }
        
        if (additionalCategories.length === 0 && data.location.additionalCategories) {
          console.log('📋 Processing additional categories from data.location.additionalCategories:', data.location.additionalCategories);
          additionalCategories = data.location.additionalCategories.map((cat: any) => ({
            categoryId: cat.name || cat.categoryId,
            displayName: cat.displayName
          }));
        }
        
        console.log('🏷️ Final processed categories:', {
          primaryCategory,
          additionalCategories,
          additionalCategoriesCount: additionalCategories.length
        });
        
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
          console.log('🕒 Raw business hours from Google:', JSON.stringify(data.location.regularHours, null, 2));
          
          const parsedHours: any = {};
          
          // Initialize all days as closed
          ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].forEach(day => {
            parsedHours[day] = { open: '09:00', close: '17:00', closed: true };
          });
          
          // Parse the periods from Google's format
          data.location.regularHours.periods.forEach((period: any, index: number) => {
            console.log(`🕒 Processing period ${index}:`, JSON.stringify(period, null, 2));
            
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
          console.log('✅ Parsed business hours:', loadedHours);
        } else {
          console.log('⚠️ No regular hours found in location data');
        }

        // Process service items to ensure proper structure
        const rawServiceItems = data.location.serviceItems || [];
        console.log('🔍 Raw service items from Google:', rawServiceItems);
        
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
          console.log('📍 Loaded address:', loadedAddress);
        }

        // Process phone numbers
        let loadedPhoneNumbers = undefined;
        if (data.location.phoneNumbers) {
          loadedPhoneNumbers = {
            primaryPhone: data.location.phoneNumbers.primaryPhone,
            additionalPhones: data.location.phoneNumbers.additionalPhones || []
          };
          console.log('📞 Loaded phone numbers:', loadedPhoneNumbers);
        }

        // Process website
        const loadedWebsite = data.location.websiteUri || '';
        console.log('🌐 Loaded website:', loadedWebsite);

        // Process coordinates
        let loadedCoordinates = undefined;
        if (data.location.latlng) {
          loadedCoordinates = {
            latitude: data.location.latlng.latitude,
            longitude: data.location.latlng.longitude
          };
          console.log('📍 Loaded coordinates:', loadedCoordinates);
        }

        const processedServiceItems = Array.isArray(rawServiceItems) 
          ? rawServiceItems.map((item: any, index: number) => {
              console.log(`🔍 Processing service item ${index}:`, item);
              
              // Use the utility function to process Google service items
              const processed = processGoogleServiceItem(item);
              
              console.log(`✅ Processed service item ${index}:`, {
                original: item,
                processed: processed
              });
              
              return {
                name: processed.name,
                description: processed.description
              };
            })
          : [];

        console.log('✅ Processed service items:', processedServiceItems);

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

        console.log('📦 Final loadedBusinessInfo being passed to component:', {
          hasDescription: !!loadedBusinessInfo.description,
          hasPrimaryCategory: !!loadedBusinessInfo.primaryCategory,
          primaryCategoryData: loadedBusinessInfo.primaryCategory,
          hasAdditionalCategories: !!loadedBusinessInfo.additionalCategories,
          additionalCategoriesCount: loadedBusinessInfo.additionalCategories.length,
          additionalCategoriesData: loadedBusinessInfo.additionalCategories
        });

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
    <button
      onClick={loadCurrentBusinessInfo}
      disabled={isLoading || selectedLocationIds.length > 1 || detailsLoaded}
      className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-md border relative overflow-hidden transition-all duration-300 ${
        isLoading || selectedLocationIds.length > 1 || detailsLoaded
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          : `bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 ${!detailsLoaded && !isLoading ? 'shine-button' : ''}`
      }`}
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
          <span>Load business info</span>
        </>
      )}
    </button>
  );
} 