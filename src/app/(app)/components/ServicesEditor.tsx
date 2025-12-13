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
import { apiClient } from '@/utils/apiClient';

// Import our modular components
import CategorySearch from './business-info/CategorySearch';
import ServiceItemsEditor from './business-info/ServiceItemsEditor';
import LoadBusinessInfoButton from './business-info/LoadBusinessInfoButton';
import LocationPicker from '@/components/GoogleBusinessProfile/LocationPicker';

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

      // Use apiClient to ensure X-Selected-Account header is sent
      const data = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
        '/business-information/update-location',
        {
          locationIds: selectedLocationIds,
          updates
        }
      );

      if (data.success) {
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

  const hasSingleLocation = locations.length <= 1;
  const resolvedSingleLocation = hasSingleLocation ? locations[0] : undefined;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">Categories &amp; Services</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage the categories and services that appear on Google. Accurate details help customers understand what you offer.
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
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
            <button
              onClick={handleSave}
              disabled={selectedLocationIds.length === 0 || isSaving || !hasChanges}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                selectedLocationIds.length > 0 && !isSaving && hasChanges
                  ? 'bg-slate-blue text-white hover:bg-slate-blue/90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Locations:</p>
          {hasSingleLocation ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Google Business Profile: {resolvedSingleLocation?.name || 'No locations connected'}
            </div>
          ) : (
            <LocationPicker
              className="bg-gray-50 rounded-lg p-4"
              mode="multi"
              locations={locations}
              selectedIds={selectedLocationIds}
              onChange={(ids) => setSelectedLocationIds(ids)}
              includeSelectAll
              helperText="Updates will apply to every selected location."
            />
          )}
        </div>
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

        </div>
      )}
    </div>
  );
}
