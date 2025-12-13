/**
 * Business Information Editor Component (Refactored)
 * Main orchestrator for editing Google Business Profile information
 * Uses modular components to keep the code organized and maintainable
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { createClient } from '@/auth/providers/supabase';
import { useAuth } from "@/auth";
import { apiClient } from '@/utils/apiClient';

// Import our modular components
import BusinessHoursEditor from './business-info/BusinessHoursEditor';
import LoadBusinessInfoButton from './business-info/LoadBusinessInfoButton';
import BusinessDescriptionAnalyzer from './BusinessDescriptionAnalyzer';
import AddressEditor from './business-info/AddressEditor';
import ContactInfoEditor from './business-info/ContactInfoEditor';
import HelpModal from './help/HelpModal';
import LocationPicker from '@/components/GoogleBusinessProfile/LocationPicker';

// Import shared types
import { BusinessInfo, BusinessCategory, ServiceItem, Address, PhoneNumbers } from '@/types/business-info';

interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  status?: string; // Optional, not displayed
}

interface BusinessInfoEditorProps {
  locations: BusinessLocation[];
  isConnected: boolean;
}

export default function BusinessInfoEditor({ locations, isConnected }: BusinessInfoEditorProps) {
  const { account } = useAuth();
  const router = useRouter();
  const accountId = account?.id;

  // 🚨 DEBUG: Track component lifecycle

  // Storage keys for form data and selections, namespaced by account to avoid cross-account bleed
  const formStorageKey = accountId ? `businessInfoEditorForm_${accountId}` : 'businessInfoEditorForm_noacct';
  const selectedLocationsKey = accountId ? `business-info-selected-locations_${accountId}` : 'business-info-selected-locations_noacct';
  
  // Auto-select single location
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(() => {
    return locations.length === 1 ? [locations[0].id] : [];
  });
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => {
    // Try to restore from localStorage first
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed;
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
    }
    
    // Fall back to default values
    return {
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
    serviceItems: [],
    storefrontAddress: undefined,
    phoneNumbers: undefined,
    websiteUri: undefined,
    latlng: undefined
    };
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [showDescriptionAnalyzer, setShowDescriptionAnalyzer] = useState(false);
  const [businessContext, setBusinessContext] = useState<any>(null);
  const [formDataBackup, setFormDataBackup] = useState<BusinessInfo | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Debug: Log when component mounts/unmounts
  useEffect(() => {
    return () => {
    };
  }, []);

  // Auto-select single location when locations change
  useEffect(() => {
    if (locations.length === 1 && selectedLocationIds.length === 0) {
      setSelectedLocationIds([locations[0].id]);
    }
  }, [locations]);

  // Debug: Track selectedLocationIds changes
  useEffect(() => {
    // Persist selection to localStorage to survive component remounts
    if (selectedLocationIds.length > 0) {
      localStorage.setItem(selectedLocationsKey, JSON.stringify(selectedLocationIds));
    }
  }, [selectedLocationIds, selectedLocationsKey]);
  
  // Restore selected locations on mount
  useEffect(() => {
    const savedSelections = localStorage.getItem(selectedLocationsKey);
    if (savedSelections && selectedLocationIds.length === 0) {
      try {
        const parsed = JSON.parse(savedSelections);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedLocationIds(parsed);
        }
      } catch (error) {
        console.error('Failed to parse saved location selections:', error);
      }
    }
  }, [locations, selectedLocationsKey]); // Run when locations are available
  
  // Auto-save business info to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && businessInfo) {
        localStorage.setItem(formStorageKey, JSON.stringify(businessInfo));
      }
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(saveTimeout);
  }, [businessInfo, formStorageKey]);

  // Fetch business context for AI analysis
  useEffect(() => {
    // Only run if we have connection - prevent unnecessary queries
    if (!isConnected) {
      return;
    }

    const fetchBusinessContext = async () => {
      try {
        const { data: { user } } = await createClient().auth.getUser();
        if (!user) return;

        // Skip this check - using auth context for account switching
        // Business context is not critical for component functionality

        // DISABLED: Skip business profile query to prevent 400 errors until schema is confirmed
        // 
        // Note: The businesses table may be missing expected columns:
        // business_name, business_type, city, state, services, industry
        // 
        // This query will be re-enabled once the database schema is confirmed to have these columns
      } catch (error) {
        // Non-critical, continue without context
      }
    };

    fetchBusinessContext();
  }, [isConnected]); // Add isConnected as dependency

  // Reset details loaded state when selection changes (but preserve form data if user has been editing)
  useEffect(() => {
    // Only reset if user hasn't made changes to the form
    if (!hasChanges) {
      setDetailsLoaded(false);
      setDetailsError(null);
    } else {
      // If user has changes, just update the details loaded flag without clearing
    }
  }, [selectedLocationIds, hasChanges]);


  // Restore form data if it gets unexpectedly reset while user has changes
  useEffect(() => {
    if (hasChanges && formDataBackup && 
        businessInfo.description === '' && 
        formDataBackup.description !== '') {
      setBusinessInfo(formDataBackup);
    }
  }, [businessInfo, hasChanges, formDataBackup]);

  const handleInputChange = (field: keyof BusinessInfo, value: any) => {
    const newInfo = {
      ...businessInfo,
      [field]: value
    };
    
    setBusinessInfo(newInfo);
    setHasChanges(true);
    setSaveResult(null);
    
    // Backup form data while user is actively editing
    setFormDataBackup(newInfo);
  };

  const handleBusinessInfoLoaded = (loadedInfo: Partial<BusinessInfo>) => {
    
    setBusinessInfo(prev => {
      const updated = {
        ...prev,
        ...loadedInfo
      };
      return updated;
    });
    setHasChanges(false); // Loaded data is not a "change"
  };

  const handleSave = async () => {
    // No longer show error - just let button be disabled when no locations selected
    setIsSaving(true);
    setSaveResult(null);

    try {
      
      // Make a single API call with all selected locations
      // Use apiClient to ensure X-Selected-Account header is sent
      const result = await apiClient.post<{ success: boolean; message?: string; error?: string }>(
        '/business-information/update-location',
        {
          locationIds: selectedLocationIds,  // Send as array
          updates: {
            description: businessInfo.description,
            regularHours: businessInfo.regularHours,
            serviceItems: businessInfo.serviceItems,
            primaryCategory: businessInfo.primaryCategory,
            additionalCategories: businessInfo.additionalCategories
            // Note: We don't include locationName since it shouldn't be changed
          }
        }
      );

      if (result.success) {
        setSaveResult({ 
          success: true, 
          message: result.message || `Business information updated successfully for ${selectedLocationIds.length} location${selectedLocationIds.length !== 1 ? 's' : ''}!` 
        });
        setHasChanges(false);
        setFormDataBackup(null); // Clear backup after successful save
        
        // Clear saved form data after successful submission
        if (typeof window !== 'undefined') {
          localStorage.removeItem(formStorageKey);
        }
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
  const handleDescriptionAnalyzed = (analysis: any) => {
    // Don't auto-apply the optimized description - let user choose to apply it
    // The BusinessDescriptionAnalyzer component will handle showing the preview and apply button
  };

  const handleApplyOptimizedDescription = (optimizedDescription: string) => {
    handleInputChange('description', optimizedDescription);
    setShowDescriptionAnalyzer(false); // Close analyzer after applying
  };


  const handleImportBusinessDescription = async () => {
    try {
      // Get current user
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) return;

      // Use account ID from auth context
      if (!accountId) {
        console.error('No account ID available from auth context');
        alert('Unable to import business description. Please try refreshing the page.');
        return;
      }

      // Fetch business profile data
      const { data: businessProfile, error } = await createClient()
        .from('businesses')
        .select('about_us')
        .eq('account_id', accountId)
        .single();

      if (error) {
        console.error('Error fetching business profile:', error);
        return;
      }

      if (businessProfile?.about_us?.trim()) {
        const existingText = businessInfo.description.trim();
        if (existingText && existingText !== businessProfile.about_us) {
          // If there's existing text that's different, ask for confirmation
          const confirmOverwrite = window.confirm(
            'This will replace your current description. Continue?'
          );
          if (!confirmOverwrite) {
            return;
          }
        }
        handleInputChange('description', businessProfile.about_us);
      } else {
        alert('No business description found in Your Business profile. Please add one there first.');
      }
    } catch (error) {
      console.error('Error importing business description:', error);
      alert('Failed to import business description. Please try again.');
    }
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
      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <Icon name="FaExclamationTriangle" className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">You have unsaved changes</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Your edits will be lost if you navigate away or refresh the page without saving.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">Business Profile Information</h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedLocationIds.length <= 1 
                ? (detailsLoaded 
                    ? 'Review and update your business information. Changes sync to Google Business Profile.'
                    : 'Load current information or enter new business details. Changes sync to Google Business Profile.'
                  )
                : 'Update description and hours across multiple locations at once. Changes sync to Google Business Profile.'
              }
            </p>
          </div>
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

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Locations:</p>
          {locations.length <= 1 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Google Business Profile: {locations[0]?.name || 'No locations connected'}
            </div>
          ) : (
            <LocationPicker
              mode="multi"
              locations={locations}
              selectedIds={selectedLocationIds}
              onChange={(ids) => setSelectedLocationIds(ids)}
              includeSelectAll
              className="bg-gray-50 rounded-lg p-4"
              helperText="Changes apply to every selected location."
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
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Icon name="FaStore" className="w-3 h-3 text-green-600" size={12} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-900 mb-1">Single location edit</h4>
                      <p className="text-sm text-green-700">
                        Editing {locations.find(loc => loc.id === selectedLocationIds[0])?.name}. 
                        {detailsLoaded 
                          ? 'Current business information has been loaded from Google Business Profile.'
                          : 'Click the button to import your existing data, or enter new information below.'
                        }
                      </p>
                    </div>
                    <div className="ml-4">
                      <LoadBusinessInfoButton
                        selectedLocationIds={selectedLocationIds}
                        locations={locations as any}
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
                    Empty fields will be skipped and remain the same.{' '}
                    <button
                      type="button"
                      onClick={() => setShowHelpModal(true)}
                      className="text-orange-900 font-semibold underline hover:text-orange-700 transition-colors"
                    >
                      Learn more
                    </button>
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
              <div className="flex items-start space-x-3">
                <Icon name="FaTimes" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Unable to load business information</p>
                  <p className="text-xs text-red-700 mt-1">{detailsError}</p>
                  {detailsError.includes('was not found') && (
                    <div className="mt-3 p-3 bg-white rounded border border-red-200">
                      <p className="text-sm text-gray-700 mb-2">
                        The saved location no longer exists in your Google Business Profile. This can happen if:
                      </p>
                      <ul className="text-xs text-gray-600 list-disc list-inside mb-3 space-y-1">
                        <li>You connected a different Google account</li>
                        <li>The business location was deleted from Google</li>
                        <li>Access to the location was removed</li>
                      </ul>
                      <button
                        onClick={() => router.push('/dashboard/google-business?reselect=true')}
                        className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <Icon name="FaSync" className="w-4 h-4" size={16} />
                        <span>Re-select your business locations</span>
                      </button>
                    </div>
                  )}
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
                    {!showDescriptionAnalyzer && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleImportBusinessDescription}
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-3 py-1 hover:bg-blue-50"
                        >
                          <Icon name="MdDownload" className="w-3 h-3 text-slate-blue" size={12} />
                          <span>Import from Your Business</span>
                        </button>
                        {businessInfo.description.trim() && (
                          <button
                            onClick={() => setShowDescriptionAnalyzer(true)}
                            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <Icon name="prompty" className="w-3 h-3 text-blue-600" size={12} />
                            <span>Open Optimizer</span>
                          </button>
                        )}
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

              {/* Address Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Business Address
                </h4>
                <AddressEditor
                  address={businessInfo.storefrontAddress}
                  onChange={(address) => handleInputChange('storefrontAddress', address)}
                  disabled={isLoadingDetails}
                />
                <p className="mt-3 text-sm text-gray-500">
                  {selectedLocationIds.length === 1 
                    ? "Physical address for your business location."
                    : `This address will be applied to all ${selectedLocationIds.length} selected locations.`
                  }
                </p>
              </div>

              {/* Contact Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Contact Information
                </h4>
                <ContactInfoEditor
                  phoneNumbers={businessInfo.phoneNumbers}
                  websiteUri={businessInfo.websiteUri}
                  onPhoneChange={(phones) => handleInputChange('phoneNumbers', phones)}
                  onWebsiteChange={(website) => handleInputChange('websiteUri', website)}
                  disabled={isLoadingDetails}
                />
                <p className="mt-3 text-sm text-gray-500">
                  {selectedLocationIds.length === 1 
                    ? "Contact details for customers to reach your business."
                    : `These contact details will be applied to all ${selectedLocationIds.length} selected locations.`
                  }
                </p>
              </div>

              {/* Business Hours */}
              <BusinessHoursEditor
                businessHours={businessInfo.regularHours}
                onBusinessHoursChange={(hours) => handleInputChange('regularHours', hours)}
                selectedLocationCount={selectedLocationIds.length}
                detailsLoaded={detailsLoaded}
              />

              {/* Business Categories Section - Moved to Services tab */}

              {/* Services & Products Section - Moved to Services tab */}
              {/* <ServiceItemsEditor
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
              /> */}
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
      
      {/* Help Modal */}
      <HelpModal 
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        initialArticleId="bulk-update"
        initialKeywords={['bulk', 'update', 'multiple', 'locations', 'google', 'business-profile']}
        initialTab="tutorials"
      />
    </div>
  );
} 
