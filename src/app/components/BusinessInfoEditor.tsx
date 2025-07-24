/**
 * Business Information Editor Component (Refactored)
 * Main orchestrator for editing Google Business Profile information
 * Uses modular components to keep the code organized and maintainable
 */

'use client';

import { useState, useEffect } from 'react';
import { FaStore, FaSave, FaRedo, FaSpinner, FaCheck, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

// Import our modular components
import CategorySearch from './business-info/CategorySearch';
import ServiceItemsEditor from './business-info/ServiceItemsEditor';
import BusinessHoursEditor from './business-info/BusinessHoursEditor';
import LoadBusinessInfoButton from './business-info/LoadBusinessInfoButton';

interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
}

interface BusinessCategory {
  categoryId: string;
  displayName: string;
}

interface ServiceItem {
  name: string;
  description?: string;
}

interface BusinessInfo {
  locationName: string; // Used only for display purposes, not editing
  description: string;
  regularHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  primaryCategory?: BusinessCategory;
  additionalCategories: Array<BusinessCategory>;
  serviceItems: Array<ServiceItem>;
}

interface BusinessInfoEditorProps {
  locations: BusinessLocation[];
  isConnected: boolean;
}

export default function BusinessInfoEditor({ locations, isConnected }: BusinessInfoEditorProps) {
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    locationName: '',
    description: '',
    regularHours: {
      MONDAY: { open: '09:00', close: '17:00', closed: false },
      TUESDAY: { open: '09:00', close: '17:00', closed: false },
      WEDNESDAY: { open: '09:00', close: '17:00', closed: false },
      THURSDAY: { open: '09:00', close: '17:00', closed: false },
      FRIDAY: { open: '09:00', close: '17:00', closed: false },
      SATURDAY: { open: '10:00', close: '16:00', closed: false },
      SUNDAY: { open: '10:00', close: '16:00', closed: true }
    },
    primaryCategory: undefined,
    additionalCategories: [],
    serviceItems: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Auto-select first location
  useEffect(() => {
    if (locations.length > 0 && selectedLocationIds.length === 0) {
      setSelectedLocationIds([locations[0].id]);
    }
  }, [locations, selectedLocationIds]);

  // Reset details loaded state when selection changes
  useEffect(() => {
    setDetailsLoaded(false);
    setDetailsError(null);
  }, [selectedLocationIds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isLocationDropdownOpen && !target.closest('.location-dropdown')) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocationDropdownOpen]);

  const handleInputChange = (field: keyof BusinessInfo, value: any) => {
    setBusinessInfo(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    setSaveResult(null);
  };

  const handleBusinessInfoLoaded = (loadedInfo: Partial<BusinessInfo>) => {
    setBusinessInfo(prev => ({
      ...prev,
      ...loadedInfo
    }));
    setHasChanges(false); // Loaded data is not a "change"
  };

  const handleSave = async () => {
    // No longer show error - just let button be disabled when no locations selected
    setIsSaving(true);
    setSaveResult(null);

    try {
      console.log('💾 Saving business info for locations:', selectedLocationIds);
      
      // Save to each selected location
      const savePromises = selectedLocationIds.map(async (locationId) => {
        const response = await fetch('/api/business-information/update-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            locationId: locationId,
            updates: {
              description: businessInfo.description,
              regularHours: businessInfo.regularHours,
              serviceItems: businessInfo.serviceItems
              // Note: We don't include locationName since it shouldn't be changed
              // Note: Categories are read-only and managed through Google Business Profile
            }
          }),
        });

        const result = await response.json();
        const location = locations.find(loc => loc.id === locationId);
        
        return {
          locationId,
          locationName: location?.name || locationId,
          success: response.ok,
          result: result
        };
      });

      const saveResults = await Promise.all(savePromises);
      console.log('📊 All save responses:', saveResults);

      const successfulSaves = saveResults.filter(r => r.success);
      const failedSaves = saveResults.filter(r => !r.success);

      if (successfulSaves.length === selectedLocationIds.length) {
        setSaveResult({ 
          success: true, 
          message: `Business information updated successfully for ${successfulSaves.length} location${successfulSaves.length !== 1 ? 's' : ''}!` 
        });
        setHasChanges(false);
      } else if (successfulSaves.length > 0) {
        setSaveResult({ 
          success: false, 
          message: `Updated ${successfulSaves.length} of ${selectedLocationIds.length} locations. ${failedSaves.length} failed.` 
        });
      } else {
        setSaveResult({ 
          success: false, 
          message: 'Failed to update business information for any locations. Please try again.' 
        });
      }
    } catch (error) {
      console.error('❌ Error saving business info:', error);
      setSaveResult({ 
        success: false, 
        message: 'Error saving business information. Please check your connection.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (selectedLocationIds.length > 0) {
      setSaveResult(null);
      
      if (selectedLocationIds.length === 1) {
        // For single location, reset to defaults and allow reloading
        const location = locations.find(loc => loc.id === selectedLocationIds[0]);
        setBusinessInfo({
          locationName: location?.name || '',
          description: '',
          regularHours: {
            MONDAY: { open: '09:00', close: '17:00', closed: false },
            TUESDAY: { open: '09:00', close: '17:00', closed: false },
            WEDNESDAY: { open: '09:00', close: '17:00', closed: false },
            THURSDAY: { open: '09:00', close: '17:00', closed: false },
            FRIDAY: { open: '09:00', close: '17:00', closed: false },
            SATURDAY: { open: '10:00', close: '16:00', closed: false },
            SUNDAY: { open: '10:00', close: '16:00', closed: true }
          },
          primaryCategory: undefined,
          additionalCategories: [],
          serviceItems: []
        });
        setDetailsLoaded(false);
        setDetailsError(null);
        setHasChanges(false);
      } else {
        // For multiple locations, reset to defaults
        setBusinessInfo(prev => ({
          ...prev,
          locationName: `${selectedLocationIds.length} locations selected`,
          description: '',
          regularHours: {
            MONDAY: { open: '09:00', close: '17:00', closed: false },
            TUESDAY: { open: '09:00', close: '17:00', closed: false },
            WEDNESDAY: { open: '09:00', close: '17:00', closed: false },
            THURSDAY: { open: '09:00', close: '17:00', closed: false },
            FRIDAY: { open: '09:00', close: '17:00', closed: false },
            SATURDAY: { open: '10:00', close: '16:00', closed: false },
            SUNDAY: { open: '10:00', close: '16:00', closed: true }
          },
          primaryCategory: undefined,
          additionalCategories: [],
          serviceItems: []
        }));
        setHasChanges(false);
      }
    }
  };

  // Handle location selection
  const handleLocationToggle = (locationId: string) => {
    setSelectedLocationIds(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  const handleSelectAllLocations = () => {
    if (selectedLocationIds.length === locations.length) {
      setSelectedLocationIds([]);
    } else {
      setSelectedLocationIds(locations.map(loc => loc.id));
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <FaStore className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Connect Google Business Profile First
        </h3>
        <p className="text-gray-600 mb-4">
          You need to connect your Google Business Profile before you can edit business information.
        </p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <FaStore className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Business Locations Found
        </h3>
        <p className="text-gray-600 mb-4">
          No business locations are available for editing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {selectedLocationIds.length === 1 ? 'Business Info Editor' : 'Multi-Location Business Info Editor'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {selectedLocationIds.length === 1 
              ? (detailsLoaded 
                  ? 'Review and update your business information. Changes sync to Google Business Profile.'
                  : 'Load current information or enter new business details. Changes sync to Google Business Profile.'
                )
              : 'Update description and hours across multiple locations at once. Changes sync to Google Business Profile.'
            }
          </p>
        </div>
        {/* Load Business Info Button */}
        {selectedLocationIds.length > 0 && (
          <LoadBusinessInfoButton
            selectedLocationIds={selectedLocationIds}
            locations={locations}
            detailsLoaded={detailsLoaded}
            onBusinessInfoLoaded={handleBusinessInfoLoaded}
            onLoadingStateChange={setIsLoadingDetails}
            onDetailsLoadedChange={setDetailsLoaded}
            onErrorChange={setDetailsError}
          />
        )}
      </div>

      {/* Location Selector */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Locations to Update
        </label>
        
        {/* Multi-Select Dropdown */}
        <div className="relative location-dropdown">
          <button
            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
            className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          >
            <div className="flex items-center space-x-2">
              <FaStore className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {selectedLocationIds.length === 0 
                  ? 'Select locations to update...'
                  : selectedLocationIds.length === locations.length
                  ? `All locations selected (${locations.length})`
                  : `${selectedLocationIds.length} location${selectedLocationIds.length !== 1 ? 's' : ''} selected`
                }
              </span>
            </div>
            {isLocationDropdownOpen ? (
              <FaChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <FaChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {isLocationDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {/* Select All Option */}
              <div className="p-2 border-b border-gray-100">
                <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLocationIds.length === locations.length}
                    onChange={handleSelectAllLocations}
                    className="h-4 w-4 text-slate-blue focus:ring-slate-blue border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({locations.length} locations)
                  </span>
                </label>
              </div>

              {/* Individual Location Options */}
              {locations.map((location) => (
                <label
                  key={location.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedLocationIds.includes(location.id)}
                    onChange={() => handleLocationToggle(location.id)}
                    className="h-4 w-4 text-slate-blue focus:ring-slate-blue border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{location.name}</span>
                    {location.address && (
                      <span className="text-xs text-gray-500 block">{location.address}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Selected Locations Preview */}
        {selectedLocationIds.length > 0 && selectedLocationIds.length <= 3 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedLocationIds.map((locationId) => {
              const location = locations.find(loc => loc.id === locationId);
              return (
                <span
                  key={locationId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-blue text-white"
                >
                  {location?.name || locationId}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Save/Reset Actions */}
      <div className="flex items-center justify-end space-x-4 mb-6">
        <button
          onClick={handleSave}
          disabled={selectedLocationIds.length === 0 || isSaving}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
            selectedLocationIds.length > 0 && !isSaving
              ? 'bg-slate-blue text-white hover:bg-slate-blue/90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaSave className="w-4 h-4" />
          )}
          <span>
            {isSaving 
              ? (selectedLocationIds.length === 1 ? 'Publishing...' : `Publishing ${selectedLocationIds.length} locations...`)
              : 'Save & Publish'
            }
          </span>
        </button>
        
        <button
          onClick={handleReset}
          disabled={selectedLocationIds.length === 0 || isSaving}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium border ${
            selectedLocationIds.length > 0 && !isSaving
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <FaRedo className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {selectedLocationIds.length > 0 && (
        <div className="space-y-6">
          {/* Info Banner */}
          {selectedLocationIds.length === 1 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <FaStore className="w-3 h-3 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-900 mb-1">Single Location Edit</h4>
                  <p className="text-sm text-green-700">
                    Editing {locations.find(loc => loc.id === selectedLocationIds[0])?.name}. 
                    {detailsLoaded 
                      ? 'Current business information has been loaded from Google Business Profile.'
                      : 'Click "Load Business Info" to import your existing data, or enter new information below.'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <FaStore className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-bold text-orange-900">Bulk Update Mode</h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse">
                      PUSHING TO {selectedLocationIds.length} LOCATIONS
                    </span>
                  </div>
                  <p className="text-sm text-orange-800">
                    ⚠️ Changes will be applied to ALL {selectedLocationIds.length} selected locations simultaneously. 
                    Existing data will be overwritten. Use single location mode to preserve existing content.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FaSpinner className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Loading current business information...</p>
                  <p className="text-xs text-blue-700">Fetching description, hours, categories, and services from Google Business Profile</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {detailsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FaTimes className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-900">Unable to load business information</p>
                  <p className="text-xs text-red-700">{detailsError}</p>
                </div>
              </div>
            </div>
          )}



          {/* Save Result */}
          {saveResult && (
            <div className={`flex items-center space-x-2 p-3 rounded-md ${
              saveResult.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {saveResult.success ? (
                <FaCheck className="w-4 h-4" />
              ) : (
                <FaTimes className="w-4 h-4" />
              )}
              <span className="text-sm">{saveResult.message}</span>
            </div>
          )}

          {/* Business Info Form */}
          {!isLoadingDetails && (
            <div className="space-y-8">
              {/* Business Description */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Business Description
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={businessInfo.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={selectedLocationIds.length === 1 
                      ? (detailsLoaded 
                          ? "Update your business description as needed..." 
                          : "Describe your business: what you do, your specialties, what makes you unique..."
                        )
                      : "Enter a description that applies to all selected locations: services offered, specialties, what makes your business unique..."
                    }
                    rows={4}
                    maxLength={750}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {businessInfo.description.length}/750 characters. 
                    {selectedLocationIds.length === 1 
                      ? (detailsLoaded 
                          ? "Changes will update your Google Business Profile description."
                          : "This will become your Google Business Profile description."
                        )
                      : `This description will be applied to all ${selectedLocationIds.length} selected locations.`
                    }
                  </p>
                </div>
              </div>

              {/* Business Hours */}
              <BusinessHoursEditor
                businessHours={businessInfo.regularHours}
                onBusinessHoursChange={(hours) => handleInputChange('regularHours', hours)}
                selectedLocationCount={selectedLocationIds.length}
                detailsLoaded={detailsLoaded}
              />

              {/* Business Categories Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FaStore className="w-5 h-5 text-slate-blue" />
                  <h4 className="text-md font-medium text-gray-900">Business Categories</h4>
                </div>

                {!isLoadingDetails && !detailsError && (
                  <>
                    {selectedLocationIds.length > 1 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-yellow-800">Categories not available for multi-location editing.</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Select a single location to view and edit categories.
                        </p>
                      </div>
                    )}
                    
                    {selectedLocationIds.length === 1 && !detailsLoaded && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600">Business categories not yet loaded.</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Click "Load Business Info" to fetch your current categories, or search for new ones below.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Primary Category Display/Edit */}
                {selectedLocationIds.length === 1 && (
                  <div className="space-y-4">
                    {businessInfo.primaryCategory && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs font-medium text-blue-800 bg-blue-200 px-2 py-1 rounded-full">PRIMARY</span>
                          <span className="text-sm font-medium text-blue-900">{businessInfo.primaryCategory.displayName}</span>
                        </div>
                        <p className="text-xs text-blue-700">
                          Primary category: This is the main category that describes your business.
                        </p>
                      </div>
                    )}

                    {/* Category Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {businessInfo.primaryCategory ? 'Change Primary Category' : 'Set Primary Category'}
                      </label>
                      <CategorySearch
                        selectedCategory={businessInfo.primaryCategory}
                        onCategorySelect={(category) => handleInputChange('primaryCategory', category)}
                        placeholder="Search Google Business categories..."
                        disabled={isLoadingDetails}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Search from Google's 4,000+ business categories to ensure accuracy.
                      </p>
                    </div>

                    {/* Additional Categories */}
                    {businessInfo.additionalCategories.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Additional Categories</h5>
                        <div className="flex flex-wrap gap-2">
                          {businessInfo.additionalCategories.map((category, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border"
                            >
                              {category.displayName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Services & Products Section */}
              <ServiceItemsEditor
                serviceItems={businessInfo.serviceItems}
                onServiceItemsChange={(items) => {
                  handleInputChange('serviceItems', items);
                  setHasChanges(true);
                }}
                selectedLocationCount={selectedLocationIds.length}
                detailsLoaded={detailsLoaded}
                isLoadingDetails={isLoadingDetails}
                detailsError={detailsError}
              />
            </div>
          )}

          {/* Bottom Save/Reset Actions - Bottom Right */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={selectedLocationIds.length === 0 || isSaving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                selectedLocationIds.length > 0 && !isSaving
                  ? 'bg-slate-blue text-white hover:bg-slate-blue/90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaSave className="w-4 h-4" />
              )}
              <span>
                {isSaving 
                  ? (selectedLocationIds.length === 1 ? 'Publishing...' : `Publishing ${selectedLocationIds.length} locations...`)
                  : 'Save & Publish'
                }
              </span>
            </button>
            
            <button
              onClick={handleReset}
              disabled={selectedLocationIds.length === 0 || isSaving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium border ${
                selectedLocationIds.length > 0 && !isSaving
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FaRedo className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 