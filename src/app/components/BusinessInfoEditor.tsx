/**
 * Business Information Editor Component (Refactored)
 * Main orchestrator for editing Google Business Profile information
 * Uses modular components to keep the code organized and maintainable
 */

'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/Icon';
import { createClient } from '@/utils/supabaseClient';

// Import our modular components
import CategorySearch from './business-info/CategorySearch';
import ServiceItemsEditor from './business-info/ServiceItemsEditor';
import BusinessHoursEditor from './business-info/BusinessHoursEditor';
import LoadBusinessInfoButton from './business-info/LoadBusinessInfoButton';
import ServiceDescriptionGenerator from './ServiceDescriptionGenerator';
import BusinessDescriptionAnalyzer from './BusinessDescriptionAnalyzer';

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
  const [showServiceGenerator, setShowServiceGenerator] = useState(false);
  const [showDescriptionAnalyzer, setShowDescriptionAnalyzer] = useState(false);
  const [businessContext, setBusinessContext] = useState<any>(null);

  // Note: Removed auto-selection to allow users to uncheck all locations

  // Fetch business context for AI analysis
  useEffect(() => {
    const fetchBusinessContext = async () => {
      try {
        const { data: { user } } = await createClient().auth.getUser();
        if (!user) return;

        // Get account ID
        const { data: accountUser } = await createClient()
          .from('account_users')
          .select('account_id')
          .eq('user_id', user.id)
          .single();

        if (!accountUser?.account_id) return;

        // Fetch business profile
        const { data: business } = await createClient()
          .from('businesses')
          .select('business_name, business_type, city, state, services, industry')
          .eq('account_id', accountUser.account_id)
          .single();

        if (business) {
          setBusinessContext({
            businessName: business.business_name,
            businessType: business.business_type,
            location: business.city && business.state ? `${business.city}, ${business.state}` : undefined,
            services: business.services ? business.services.split(',').map((s: string) => s.trim()) : [],
            industry: business.industry
          });
        }
      } catch (error) {
        console.log('Could not fetch business context:', error);
        // Non-critical, continue without context
      }
    };

    fetchBusinessContext();
  }, []);

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
    console.log('📥 BusinessInfoEditor received loaded info:', {
      hasDescription: !!loadedInfo.description,
      hasPrimaryCategory: !!loadedInfo.primaryCategory,
      primaryCategoryData: loadedInfo.primaryCategory,
      hasAdditionalCategories: !!loadedInfo.additionalCategories,
      additionalCategoriesCount: loadedInfo.additionalCategories?.length || 0,
      additionalCategoriesData: loadedInfo.additionalCategories,
      allKeys: Object.keys(loadedInfo)
    });
    
    setBusinessInfo(prev => {
      const updated = {
        ...prev,
        ...loadedInfo
      };
      console.log('📋 Updated businessInfo state:', {
        hasPrimaryCategory: !!updated.primaryCategory,
        primaryCategoryData: updated.primaryCategory,
        hasAdditionalCategories: !!updated.additionalCategories,
        additionalCategoriesCount: updated.additionalCategories?.length || 0,
        additionalCategoriesData: updated.additionalCategories
      });
      return updated;
    });
    setHasChanges(false); // Loaded data is not a "change"
  };

  const handleSave = async () => {
    // No longer show error - just let button be disabled when no locations selected
    setIsSaving(true);
    setSaveResult(null);

    try {
      console.log('💾 Saving business info for locations:', selectedLocationIds);
      
      // Make a single API call with all selected locations
      const response = await fetch('/api/business-information/update-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationIds: selectedLocationIds,  // Send as array
          updates: {
            description: businessInfo.description,
            regularHours: businessInfo.regularHours,
            serviceItems: businessInfo.serviceItems,
            primaryCategory: businessInfo.primaryCategory,
            additionalCategories: businessInfo.additionalCategories
            // Note: We don't include locationName since it shouldn't be changed
          }
        }),
      });

      const result = await response.json();
      console.log('📊 Save response:', result);

      if (response.ok && result.success) {
        setSaveResult({ 
          success: true, 
          message: result.message || `Business information updated successfully for ${selectedLocationIds.length} location${selectedLocationIds.length !== 1 ? 's' : ''}!` 
        });
        setHasChanges(false);
      } else {
        setSaveResult({ 
          success: false, 
          message: result.error || result.message || 'Failed to update business information. Please try again.' 
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

  const handleDescriptionAnalyzed = (analysis: any) => {
    console.log('📈 Analysis received in BusinessInfoEditor:', analysis);
    // Don't auto-apply the optimized description - let user choose to apply it
    // The BusinessDescriptionAnalyzer component will handle showing the preview and apply button
  };

  const handleApplyOptimizedDescription = (optimizedDescription: string) => {
    console.log('✅ User chose to apply optimized description');
    handleInputChange('description', optimizedDescription);
    setShowDescriptionAnalyzer(false); // Close analyzer after applying
  };

  const handleServiceDescriptionsGenerated = (descriptions: any) => {
    // Use the medium length description as a starting point
    if (descriptions.medium) {
      handleInputChange('description', descriptions.medium);
    }
    setShowServiceGenerator(false);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Icon name="FaStore" className="w-12 h-12 text-gray-400 mx-auto mb-4" size={48} />
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
        <Icon name="FaStore" className="w-12 h-12 text-gray-400 mx-auto mb-4" size={48} />
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
      {/* Header with Save & Publish button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedLocationIds.length === 1 ? 'Business info editor' : 'Multi-location business info editor'}
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
        
        {/* Save & Publish button - Stacked on mobile, parallel on desktop */}
        <div className="flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={selectedLocationIds.length === 0 || isSaving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium w-full sm:w-auto ${
              selectedLocationIds.length > 0 && !isSaving
                ? 'bg-slate-blue text-white hover:bg-slate-blue/90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
            ) : (
              <Icon name="FaSave" className="w-4 h-4" size={16} />
            )}
            <span>
              {isSaving 
                ? (selectedLocationIds.length === 1 ? 'Publishing...' : `Publishing ${selectedLocationIds.length} locations...`)
                : 'Save & publish'
              }
            </span>
          </button>
        </div>
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
              <Icon name="FaStore" className="w-4 h-4 text-gray-500" size={16} />
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
              <Icon name="FaChevronUp" className="w-4 h-4 text-gray-500" size={16} />
            ) : (
              <Icon name="FaChevronDown" className="w-4 h-4 text-gray-500" size={16} />
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

        {/* Load Business Info Button - Inside business selector box, aligned right */}
        {selectedLocationIds.length > 0 && (
          <div className="mt-4 flex justify-end">
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
        )}
      </div>



      {selectedLocationIds.length > 0 && (
        <div className="space-y-6">
          {/* Info Banner */}
          {selectedLocationIds.length === 1 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Icon name="FaStore" className="w-3 h-3 text-green-600" size={12} />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-900 mb-1">Single location edit</h4>
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
                    <Icon name="FaStore" className="w-4 h-4 text-white" size={16} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-bold text-orange-900">Bulk update mode</h4>
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
                <Icon name="FaSpinner" className="w-5 h-5 animate-spin text-blue-600" size={20} />
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
                <Icon name="FaTimes" className="w-5 h-5 text-red-600" size={20} />
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
                <Icon name="FaCheck" className="w-4 h-4" size={16} />
              ) : (
                <Icon name="FaTimes" className="w-4 h-4" size={16} />
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
                  Business description
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
                  
                  {/* AI Tools */}
                  <div className="mt-4 space-y-4">
                    {/* AI Action Buttons */}
                    {!showServiceGenerator && !showDescriptionAnalyzer && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowServiceGenerator(true)}
                          className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded px-3 py-1 hover:bg-purple-50"
                        >
                          <Icon name="FaRobot" className="w-3 h-3 text-slate-blue" size={12} />
                          <span>Generate Description</span>
                        </button>
                        {businessInfo.description.trim() && (
                          <button
                            onClick={() => setShowDescriptionAnalyzer(true)}
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-3 py-1 hover:bg-blue-50"
                          >
                            <Icon name="FaRobot" className="w-3 h-3 text-slate-blue" size={12} />
                            <span>AI Search Optimize</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Service Description Generator */}
                    {showServiceGenerator && (
                      <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-purple-900">AI Service Description Generator</h5>
                          <button
                            onClick={() => setShowServiceGenerator(false)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <ServiceDescriptionGenerator 
                          onDescriptionsGenerated={handleServiceDescriptionsGenerated}
                        />
                      </div>
                    )}

                    {/* Business Description Analyzer */}
                    {showDescriptionAnalyzer && (
                      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center justify-between mb-3">
                                                        <h5 className="font-medium text-blue-900">Optimize your business description</h5>
                          <button
                            onClick={() => setShowDescriptionAnalyzer(false)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                        <BusinessDescriptionAnalyzer 
                          currentDescription={businessInfo.description}
                          onAnalysisComplete={handleDescriptionAnalyzed}
                          onApplyOptimized={handleApplyOptimizedDescription}
                          autoAnalyze={true}
                          businessContext={businessContext}
                        />
                      </div>
                    )}
                  </div>
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
                  <Icon name="FaStore" className="w-5 h-5 text-slate-blue" size={20} />
                  <h4 className="text-md font-medium text-gray-900">Business categories</h4>
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-gray-700">Additional categories</h5>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...businessInfo.additionalCategories, { categoryId: '', displayName: '' }];
                            handleInputChange('additionalCategories', updated);
                          }}
                          className="text-sm text-slate-blue hover:text-slate-blue-dark font-medium"
                        >
                          + Add category
                        </button>
                      </div>
                      
                      {businessInfo.additionalCategories.length > 0 ? (
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
                                      updated[index] = { categoryId: '', displayName: '' };
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
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remove category"
                              >
                                <Icon name="FaTimes" className="w-4 h-4" size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No additional categories selected. Click "+ Add category" to add more business categories.
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Additional categories help customers find your business for different services you offer.
                      </p>
                    </div>
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
                googleBusinessContext={{
                  businessName: selectedLocationIds.length === 1 
                    ? locations.find(loc => loc.id === selectedLocationIds[0])?.name
                    : undefined,
                  address: selectedLocationIds.length === 1 
                    ? locations.find(loc => loc.id === selectedLocationIds[0])?.address
                    : undefined,
                  city: selectedLocationIds.length === 1 && locations.find(loc => loc.id === selectedLocationIds[0])?.address
                    ? locations.find(loc => loc.id === selectedLocationIds[0])?.address?.split(',')[1]?.trim()
                    : undefined,
                  primaryCategory: businessInfo.primaryCategory?.displayName,
                  description: businessInfo.description
                }}
              />
            </div>
          )}

          {/* Bottom Save/Reset Actions - Bottom Right */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            {/* Success/Error Message - Bottom */}
            {saveResult && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium ${
                saveResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {saveResult.success ? (
                  <Icon name="FaCheck" className="w-4 h-4 text-green-600" size={16} />
                ) : (
                  <Icon name="FaTimes" className="w-4 h-4 text-red-600" size={16} />
                )}
                <span>{saveResult.message}</span>
              </div>
            )}
            
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
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
              ) : (
                <Icon name="FaSave" className="w-4 h-4" size={16} />
              )}
              <span>
                {isSaving 
                  ? (selectedLocationIds.length === 1 ? 'Publishing...' : `Publishing ${selectedLocationIds.length} locations...`)
                  : 'Save & publish'
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
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 