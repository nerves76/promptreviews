/**
 * Services Editor Component
 * Manages categories and service items for Google Business Profile
 * Separated from BusinessInfoEditor for better organization
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { createClient } from '@/auth/providers/supabase';
import { getAccountIdForUser } from '@/auth/utils/accounts';

// Import our modular components
import CategorySearch from './business-info/CategorySearch';
import ServiceItemsEditor from './business-info/ServiceItemsEditor';
import LoadBusinessInfoButton from './business-info/LoadBusinessInfoButton';

// Import shared types
import { BusinessInfo, BusinessCategory, ServiceItem } from '@/types/business-info';

interface ServicesEditorProps {
  locations: any[];
  isConnected: boolean;
}

export default function ServicesEditor({ locations, isConnected }: ServicesEditorProps) {
  // Form storage key
  const formStorageKey = 'business-services-form-data';
  
  // Component state - auto-select if only one location
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(() => {
    return locations.length === 1 ? [locations[0].id] : [];
  });
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  
  // Initialize business info with stored data or defaults
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(formStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed;
        } catch (error) {
          console.error('Failed to parse saved services form data:', error);
        }
      }
    }
    
    return {
      locationName: '',
      description: '',
      regularHours: {},
      primaryCategory: undefined,
      additionalCategories: [],
      serviceItems: [],
      storefrontAddress: undefined,
      phoneNumbers: undefined,
      websiteUri: undefined,
      latlng: undefined
    };
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [businessContext, setBusinessContext] = useState<any>(null);
  const [formDataBackup, setFormDataBackup] = useState<BusinessInfo | null>(null);

  // Auto-select single location when locations change
  useEffect(() => {
    if (locations.length === 1 && selectedLocationIds.length === 0) {
      setSelectedLocationIds([locations[0].id]);
    }
  }, [locations]);

  // Auto-save form data
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && businessInfo) {
        localStorage.setItem(formStorageKey, JSON.stringify(businessInfo));
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [businessInfo, formStorageKey]);

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
    const newInfo = {
      ...businessInfo,
      [field]: value
    };
    
    setBusinessInfo(newInfo);
    setHasChanges(true);
    setSaveResult(null);
    setFormDataBackup(newInfo);
  };

  const handleBusinessInfoLoaded = (loadedInfo: Partial<BusinessInfo>) => {
    
    setBusinessInfo(prev => {
      const updated = {
        ...prev,
        primaryCategory: loadedInfo.primaryCategory || prev.primaryCategory,
        additionalCategories: loadedInfo.additionalCategories || prev.additionalCategories,
        serviceItems: loadedInfo.serviceItems || prev.serviceItems
      };
      return updated;
    });
    
    // Set business context for AI generation
    const referenceLocation = locations.find(loc => loc.id === selectedLocationIds[0]);
    if (referenceLocation && loadedInfo) {
      setBusinessContext({
        businessName: referenceLocation.name || loadedInfo.locationName,
        address: referenceLocation.address,
        city: loadedInfo.storefrontAddress?.locality || '',
        primaryCategory: loadedInfo.primaryCategory?.displayName || '',
        description: loadedInfo.description || ''
      });
    }
    
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (selectedLocationIds.length === 0) {
      setSaveResult({
        success: false,
        message: 'Please select at least one location to update'
      });
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      // Only send categories and services data
      const updates = {
        primaryCategory: businessInfo.primaryCategory,
        additionalCategories: businessInfo.additionalCategories,
        serviceItems: businessInfo.serviceItems
      };

      const response = await fetch('/api/business-information/update-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationIds: selectedLocationIds,
          updates
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveResult({
          success: true,
          message: data.message || 'Services published to Google successfully'
        });
        setHasChanges(false);
        
        // Clear backup after successful save
        setFormDataBackup(null);
      } else {
        setSaveResult({
          success: false,
          message: data.error || 'Failed to update services'
        });
      }
    } catch (error) {
      console.error('Error saving services:', error);
      setSaveResult({
        success: false,
        message: 'Failed to update services. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setBusinessInfo({
      locationName: '',
      description: '',
      regularHours: {},
      primaryCategory: undefined,
      additionalCategories: [],
      serviceItems: [],
      storefrontAddress: undefined,
      phoneNumbers: undefined,
      websiteUri: undefined,
      latlng: undefined
    });
    setHasChanges(false);
    setSaveResult(null);
    setDetailsLoaded(false);
    setDetailsError(null);
    localStorage.removeItem(formStorageKey);
  };

  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocationIds(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  const selectAllLocations = () => {
    setSelectedLocationIds(locations.map(loc => loc.id));
  };

  const deselectAllLocations = () => {
    setSelectedLocationIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Categories & Services
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Manage your business categories and services. These help customers find and understand your offerings.
        </p>

        {/* Location Selector */}
        {locations.length === 1 ? (
          // Single location - show as static text, auto-select it
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Business Profile
            </label>
            <div className="px-4 py-3 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center space-x-2">
                <Icon name="FaGoogle" className="w-4 h-4 text-gray-600" size={16} />
                <span className="text-gray-800 font-medium">{locations[0].name}</span>
              </div>
            </div>
          </div>
        ) : (
          // Multiple locations - show dropdown
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select locations to update
            </label>
            <div className="relative location-dropdown">
              <button
                type="button"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white text-left focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">
                    {selectedLocationIds.length === 0
                      ? 'Select locations...'
                      : selectedLocationIds.length === 1
                      ? locations.find(loc => loc.id === selectedLocationIds[0])?.name || 'Selected location'
                      : `${selectedLocationIds.length} locations selected`}
                  </span>
                  <Icon name="FaChevronDown" className="w-4 h-4 text-gray-400" size={16} />
                </div>
              </button>

              {isLocationDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={selectAllLocations}
                        className="text-xs text-slate-blue hover:text-slate-blue-dark"
                      >
                        Select all
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={deselectAllLocations}
                        className="text-xs text-slate-blue hover:text-slate-blue-dark"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                  {locations.map(location => (
                    <label
                      key={location.id}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLocationIds.includes(location.id)}
                        onChange={() => toggleLocationSelection(location.id)}
                        className="mr-3 h-4 w-4 text-slate-blue focus:ring-slate-blue border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{location.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedLocationIds.length > 0 && (
        <div className="space-y-6">
          {/* Info Banner */}
          {selectedLocationIds.length === 1 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Icon name="FaCheck" className="w-5 h-5 text-green-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-900">Single location mode</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Editing categories and services for {locations.find(loc => loc.id === selectedLocationIds[0])?.name}.
                        {detailsLoaded 
                          ? ' Current categories and services have been loaded.'
                          : ' Click the button to import your existing data.'}
                      </p>
                    </div>
                    <div className="ml-4">
                      <LoadBusinessInfoButton
                        selectedLocationIds={selectedLocationIds}
                        locations={locations}
                        detailsLoaded={detailsLoaded}
                        onBusinessInfoLoaded={handleBusinessInfoLoaded}
                        onLoadingStateChange={setIsLoadingDetails}
                        onDetailsLoadedChange={setDetailsLoaded}
                        onErrorChange={setDetailsError}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Icon name="FaExclamationTriangle" className="w-5 h-5 text-orange-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-orange-900">Bulk update mode</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Changes will be applied to {selectedLocationIds.length} locations. Services will replace existing ones.
                        {detailsLoaded && (
                          <span className="block mt-1">
                            Using <strong>{locations.find(loc => loc.id === selectedLocationIds[0])?.name}</strong> as reference for AI generation.
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="ml-4">
                      <LoadBusinessInfoButton
                        selectedLocationIds={selectedLocationIds}
                        locations={locations}
                        detailsLoaded={detailsLoaded}
                        onBusinessInfoLoaded={handleBusinessInfoLoaded}
                        onLoadingStateChange={setIsLoadingDetails}
                        onDetailsLoadedChange={setDetailsLoaded}
                        onErrorChange={setDetailsError}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading/Error States */}
          {isLoadingDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Icon name="FaSpinner" className="w-5 h-5 animate-spin text-blue-600" size={20} />
                <p className="text-sm text-blue-900">Loading categories and services...</p>
              </div>
            </div>
          )}

          {detailsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Icon name="FaTimes" className="w-5 h-5 text-red-600" size={20} />
                <p className="text-sm text-red-900">{detailsError}</p>
              </div>
            </div>
          )}

          {/* Save Result */}
          {saveResult && (
            <div className={`rounded-lg p-4 ${
              saveResult.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {saveResult.success ? (
                  <Icon name="FaCheck" className="w-5 h-5" size={20} />
                ) : (
                  <Icon name="FaTimes" className="w-5 h-5" size={20} />
                )}
                <span className="text-sm font-medium">{saveResult.message}</span>
              </div>
            </div>
          )}

          {/* Categories Section */}
          {!isLoadingDetails && (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Categories</h3>
                
                {/* Primary Category */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {businessInfo.primaryCategory ? 'Change primary category' : 'Set primary category'}
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
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Additional categories (optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newCategories = [...businessInfo.additionalCategories, { categoryId: '', displayName: '' }];
                        handleInputChange('additionalCategories', newCategories);
                      }}
                      disabled={businessInfo.additionalCategories.length >= 9}
                      className={`text-sm flex items-center space-x-1 ${
                        businessInfo.additionalCategories.length >= 9
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-slate-blue hover:text-slate-blue-dark'
                      }`}
                    >
                      <Icon name="FaPlus" className="w-3 h-3" size={12} />
                      <span>Add category</span>
                    </button>
                  </div>
                  
                  {businessInfo.additionalCategories.length > 0 && (
                    <div className="space-y-3">
                      {businessInfo.additionalCategories.map((category, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="flex-1">
                            <CategorySearch
                              selectedCategory={category.categoryId ? category : undefined}
                              onCategorySelect={(selectedCategory) => {
                                const updated = [...businessInfo.additionalCategories];
                                if (selectedCategory) {
                                  updated[index] = selectedCategory;
                                } else {
                                  updated.splice(index, 1);
                                }
                                handleInputChange('additionalCategories', updated);
                              }}
                              placeholder="Search for additional category..."
                              disabled={isLoadingDetails}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = businessInfo.additionalCategories.filter((_, i) => i !== index);
                              handleInputChange('additionalCategories', updated);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                            title="Remove category"
                          >
                            <Icon name="FaTimes" className="w-4 h-4" size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    You can add up to 9 additional categories to help customers find your business.
                  </p>
                </div>
              </div>

              {/* Services Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ServiceItemsEditor
                  serviceItems={businessInfo.serviceItems}
                  onServiceItemsChange={(items) => handleInputChange('serviceItems', items)}
                  selectedLocationCount={selectedLocationIds.length}
                  detailsLoaded={detailsLoaded}
                  isLoadingDetails={isLoadingDetails}
                  detailsError={detailsError}
                  googleBusinessContext={businessContext}
                />
              </div>
            </>
          )}

          {/* Publish/Clear Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleSave}
              disabled={selectedLocationIds.length === 0 || isSaving || !hasChanges}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                selectedLocationIds.length > 0 && !isSaving && hasChanges
                  ? 'bg-slate-blue text-white hover:bg-slate-blue-dark'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Icon name="FaUpload" className="w-4 h-4" size={16} />
                  <span>Publish to Google</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleReset}
              disabled={selectedLocationIds.length === 0 || isSaving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium border ${
                selectedLocationIds.length > 0 && !isSaving
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title="Clear all form data and start over"
            >
              <Icon name="FaUndo" className="w-4 h-4" size={16} />
              <span>Clear form</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}