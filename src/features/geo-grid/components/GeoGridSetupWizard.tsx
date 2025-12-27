/**
 * GeoGridSetupWizard Component
 *
 * Multi-step wizard for initial geo grid configuration.
 * Guides users through connecting GBP location and setting grid parameters.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPinIcon, Cog6ToothIcon, CheckCircleIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useGeoGridConfig, SaveConfigData } from '../hooks/useGeoGridConfig';
import { CheckPoint } from '../utils/types';
import { apiClient } from '@/utils/apiClient';
import Icon from '@/components/Icon';

// ============================================
// Types
// ============================================

interface GoogleBusinessLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  placeId: string;
  address?: string;
}

interface GeoGridSetupWizardProps {
  /** Config ID when editing an existing config */
  configId?: string;
  /** Pre-selected Google Business location */
  googleBusinessLocation?: GoogleBusinessLocation;
  /** Available GBP locations for selection (Maven accounts) */
  availableLocations?: GoogleBusinessLocation[];
  /** Account ID for OAuth flow */
  accountId?: string;
  /** Callback when setup is complete */
  onComplete?: () => void;
  /** Callback to go back/cancel */
  onCancel?: () => void;
}

type WizardStep = 'location' | 'settings' | 'confirm';

// ============================================
// Component
// ============================================

export function GeoGridSetupWizard({
  configId,
  googleBusinessLocation,
  availableLocations,
  accountId,
  onComplete,
  onCancel,
}: GeoGridSetupWizardProps) {
  const { saveConfig } = useGeoGridConfig({ autoFetch: false });

  // Debug: Log accountId on mount and when it changes
  useEffect(() => {
    console.log('🔍 [GeoGridSetupWizard] accountId prop:', accountId);
  }, [accountId]);

  // OAuth connection state
  const [isConnecting, setIsConnecting] = useState(false);

  // GBP connection and location fetching state
  const [isGBPConnected, setIsGBPConnected] = useState<boolean | null>(null); // null = checking
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const [fetchedLocations, setFetchedLocations] = useState<GoogleBusinessLocation[]>([]);
  const [gbpError, setGbpError] = useState<string | null>(null);

  // Check GBP connection status on mount
  useEffect(() => {
    const checkGBPConnection = async () => {
      try {
        const response = await apiClient.get<{
          platforms?: Array<{ id: string; connected: boolean; locations?: any[] }>;
        }>('/social-posting/platforms');

        const gbpPlatform = response.platforms?.find(p => p.id === 'google-business-profile');
        const isConnected = gbpPlatform?.connected || false;
        setIsGBPConnected(isConnected);
        console.log('🔍 [GeoGrid] GBP connection status:', isConnected, 'locations:', gbpPlatform?.locations?.length || 0);

        // If connected and has locations, load them
        if (isConnected && gbpPlatform?.locations && gbpPlatform.locations.length > 0) {
          const locations = gbpPlatform.locations.map((loc: any) => ({
            id: loc.id || loc.location_id,
            name: loc.location_name || loc.name,
            lat: loc.lat || 0,
            lng: loc.lng || 0,
            placeId: loc.google_place_id || loc.location_id,
            address: loc.address,
          }));
          setFetchedLocations(locations);
          console.log('✅ [GeoGrid] Loaded', locations.length, 'locations from platforms API');

          // Auto-select if only one location
          if (locations.length === 1) {
            setPickedLocationId(locations[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to check GBP connection:', error);
        setIsGBPConnected(false);
      }
    };

    if (accountId) {
      checkGBPConnection();
    }
  }, [accountId]);

  // Fetch locations from Google
  const handleFetchLocations = useCallback(async () => {
    if (!accountId) return;

    setIsFetchingLocations(true);
    setGbpError(null);

    try {
      // First, trigger fetch from Google
      const fetchResponse = await apiClient.post<{
        success: boolean;
        message?: string;
        error?: string;
      }>('/social-posting/platforms/google-business-profile/fetch-locations', { force: true });

      if (!fetchResponse.success) {
        setGbpError(fetchResponse.error || 'Failed to fetch locations from Google');
        setIsFetchingLocations(false);
        return;
      }

      // Then load the locations
      const locationsResponse = await apiClient.get<{
        data: {
          locations: Array<{
            id: string;
            location_id: string;
            location_name: string;
            address?: string;
            google_place_id?: string;
            lat?: number;
            lng?: number;
          }>;
        };
      }>('/social-posting/platforms/google-business-profile/locations');

      if (locationsResponse.data?.locations && locationsResponse.data.locations.length > 0) {
        const locations = locationsResponse.data.locations.map(loc => ({
          id: loc.id,
          name: loc.location_name,
          lat: loc.lat || 0,
          lng: loc.lng || 0,
          placeId: loc.google_place_id || loc.location_id,
          address: loc.address,
        }));
        setFetchedLocations(locations);
        console.log('✅ [GeoGrid] Fetched', locations.length, 'locations');

        // Auto-select if only one location
        if (locations.length === 1) {
          setPickedLocationId(locations[0].id);
        }
      } else {
        setGbpError('No business locations found in your Google Business Profile');
      }
    } catch (error: any) {
      console.error('Failed to fetch locations:', error);
      setGbpError(error.message || 'Failed to fetch locations');
    } finally {
      setIsFetchingLocations(false);
    }
  }, [accountId]);

  // Handle initiating Google OAuth flow
  const handleConnectGBP = useCallback(() => {
    if (!accountId) {
      console.error('❌ Cannot connect GBP: No account ID provided. accountId prop value:', accountId);
      // Show user-friendly error instead of silently failing
      alert('Please wait for the page to fully load, then try again. If the problem persists, refresh the page.');
      return;
    }

    console.log('✅ [GeoGrid OAuth] accountId available:', accountId);
    setIsConnecting(true);

    // Store flag to preserve session during OAuth redirect
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('googleOAuthInProgress', 'true');
    }

    // Get Google OAuth credentials from environment
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '984479581786-8h619lvt0jvhakg7riaom9bs7mlo1lku.apps.googleusercontent.com';
    const redirectUriRaw = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

    // Validate required environment variables
    if (!redirectUriRaw) {
      console.error('❌ Missing NEXT_PUBLIC_GOOGLE_REDIRECT_URI');
      setIsConnecting(false);
      return;
    }

    const redirectUri = encodeURIComponent(redirectUriRaw);

    // OAuth scope for Google Business Profile API (match working implementation)
    const scope = 'https://www.googleapis.com/auth/business.manage email profile openid';
    const encodedScope = encodeURIComponent(scope);

    // Build state payload with accountId (CRITICAL for account isolation)
    // The OAuth callback will append 'connected=true' on success
    const statePayload = {
      platform: 'google-business-profile',
      returnUrl: '/dashboard/local-ranking-grids',
      accountId: accountId,
    };

    console.log('🔍 [GeoGrid OAuth] Starting OAuth flow with state:', statePayload);

    const state = encodeURIComponent(JSON.stringify(statePayload));

    // Construct Google OAuth URL (match working implementation)
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodedScope}&response_type=code&state=${state}&access_type=offline&prompt=select_account%20consent&include_granted_scopes=false`;

    console.log('🔍 [GeoGrid OAuth] Redirecting to:', googleAuthUrl.substring(0, 100) + '...');

    // Add a small delay to ensure session storage is set
    setTimeout(() => {
      window.location.href = googleAuthUrl;
    }, 100);
  }, [accountId]);

  // Combine available locations from props and fetched locations
  const allLocations = availableLocations?.length ? availableLocations : fetchedLocations;
  const hasMultipleLocations = allLocations.length > 1;
  const hasAnyLocations = allLocations.length > 0;

  const [pickedLocationId, setPickedLocationId] = useState<string | null>(
    googleBusinessLocation?.id || null
  );

  // Get the effective GBP location (picked from list, pre-selected, or fetched)
  const effectiveGBPLocation = hasMultipleLocations
    ? allLocations.find((l) => l.id === pickedLocationId) || null
    : hasAnyLocations
      ? allLocations[0]
      : googleBusinessLocation;

  // Check if location has valid coordinates
  const hasValidCoordinates = effectiveGBPLocation &&
    effectiveGBPLocation.lat !== 0 && effectiveGBPLocation.lng !== 0;

  const [currentStep, setCurrentStep] = useState<WizardStep>('location');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [radiusMiles, setRadiusMiles] = useState(3);
  const [gridSize, setGridSize] = useState<5 | 9>(5); // 5 = center + N/S/E/W, 9 = center + all 8 directions
  const [selectedLocation, setSelectedLocation] = useState(effectiveGBPLocation);
  const [manualLat, setManualLat] = useState(effectiveGBPLocation?.lat?.toString() || '');
  const [manualLng, setManualLng] = useState(effectiveGBPLocation?.lng?.toString() || '');
  // Google Place ID for rank tracking - prefer from GBP database, fall back to search
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(
    effectiveGBPLocation?.placeId?.startsWith('ChIJ') ? effectiveGBPLocation.placeId : null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Auto-geocode on mount if we have location but no coordinates
  const geocodeAddress = useCallback(async (address: string, businessName?: string) => {
    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      // Try with full address first, then business name
      const searchQuery = address || businessName;
      if (!searchQuery) {
        setGeocodeError('No address available to geocode');
        return;
      }

      const response = await apiClient.post<{
        success: boolean;
        coordinates?: { lat: number; lng: number };
        placeId?: string;
        error?: string;
        hint?: string;
      }>('/geo-grid/geocode', { address: searchQuery });

      if (response.success && response.coordinates) {
        setManualLat(response.coordinates.lat.toString());
        setManualLng(response.coordinates.lng.toString());
        if (response.placeId) {
          setGooglePlaceId(response.placeId);
        }
        setGeocodeError(null);
      } else {
        const errorMsg = response.hint
          ? `${response.error} ${response.hint}`
          : response.error || 'Failed to geocode address';
        setGeocodeError(errorMsg);
      }
    } catch (err) {
      console.error('Geocode error:', err);
      setGeocodeError('Failed to look up coordinates. Please enter manually.');
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Search for business Place ID using Places API
  const searchForBusiness = useCallback(async (businessName: string, lat?: number, lng?: number) => {
    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        businessName?: string;
        placeId?: string;
        coordinates?: { lat: number; lng: number };
        formattedAddress?: string;
        rating?: number;
        reviewCount?: number;
        error?: string;
        hint?: string;
        otherResults?: Array<{
          name: string;
          placeId: string;
          address: string;
          rating?: number;
          reviewCount?: number;
        }>;
      }>('/geo-grid/geocode', {
        searchBusiness: true,
        businessName,
        lat,
        lng,
      });

      if (response.success && response.placeId) {
        setGooglePlaceId(response.placeId);
        if (response.coordinates) {
          setManualLat(response.coordinates.lat.toString());
          setManualLng(response.coordinates.lng.toString());
        }
        setGeocodeError(null);
        return true;
      } else {
        const errorMsg = response.hint
          ? `${response.error} ${response.hint}`
          : response.error || 'Could not find business listing';
        setGeocodeError(errorMsg);
        return false;
      }
    } catch (err) {
      console.error('Business search error:', err);
      setGeocodeError('Failed to search for business. Please try again.');
      return false;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Fetch coordinates from a Place ID
  const fetchCoordsFromPlaceId = useCallback(async (placeId: string) => {
    console.log('Fetching coordinates for Place ID:', placeId);
    setIsGeocoding(true);
    try {
      const response = await apiClient.post<{
        success: boolean;
        coordinates?: { lat: number; lng: number };
        error?: string;
        hint?: string;
      }>('/geo-grid/geocode', { placeId });

      console.log('Geocode response for Place ID:', response);
      if (response.success && response.coordinates) {
        setManualLat(response.coordinates.lat.toString());
        setManualLng(response.coordinates.lng.toString());
      } else {
        // Service-area businesses don't expose coordinates via the API
        // Show a helpful message with link to Google Maps
        setGeocodeError(
          'Service-area businesses don\'t have a public location. Please enter the center of your service area manually. Go to [Google Maps](https://www.google.com/maps), right-click on your service area center, and click the coordinates to copy them.'
        );
      }
    } catch (err) {
      console.warn('Failed to fetch coordinates from Place ID:', err);
      setGeocodeError(
        'Could not fetch coordinates automatically. Please enter them manually.'
      );
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Auto-search for business when component mounts with a GBP location
  // But only if we don't already have a valid Place ID from the database
  useEffect(() => {
    console.log('GeoGridSetupWizard useEffect - effectiveGBPLocation:', effectiveGBPLocation);
    if (effectiveGBPLocation && effectiveGBPLocation.name) {
      // Update selectedLocation when effective location changes
      setSelectedLocation(effectiveGBPLocation);

      // If we already have a valid Place ID from the database, don't search
      if (effectiveGBPLocation.placeId?.startsWith('ChIJ')) {
        console.log('Using Place ID from database:', effectiveGBPLocation.placeId);
        setGooglePlaceId(effectiveGBPLocation.placeId);
        // Also use coordinates from database if available
        // Check for non-zero values since 0 is falsy but could be valid (unlikely for lat/lng)
        const hasValidLat = effectiveGBPLocation.lat !== 0 && effectiveGBPLocation.lat !== null && effectiveGBPLocation.lat !== undefined;
        const hasValidLng = effectiveGBPLocation.lng !== 0 && effectiveGBPLocation.lng !== null && effectiveGBPLocation.lng !== undefined;
        console.log('Has valid coordinates:', { hasValidLat, hasValidLng, lat: effectiveGBPLocation.lat, lng: effectiveGBPLocation.lng });
        if (hasValidLat && hasValidLng) {
          setManualLat(effectiveGBPLocation.lat.toString());
          setManualLng(effectiveGBPLocation.lng.toString());
        } else {
          // We have Place ID but no coordinates - fetch them from Google
          console.log('Calling fetchCoordsFromPlaceId...');
          fetchCoordsFromPlaceId(effectiveGBPLocation.placeId);
        }
        return;
      }
      // Otherwise, search for the business using the GBP name
      console.log('No valid Place ID, searching for business:', effectiveGBPLocation.name);
      searchForBusiness(effectiveGBPLocation.name);
    }
  }, [effectiveGBPLocation, searchForBusiness, fetchCoordsFromPlaceId]);

  // Steps configuration
  const steps: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
    { id: 'location', label: 'Location', icon: <MapPinIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Cog6ToothIcon className="w-5 h-5" /> },
    { id: 'confirm', label: 'Confirm', icon: <CheckCircleIcon className="w-5 h-5" /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = async () => {
    if (currentStep === 'location') {
      // Validate location selection for multi-location accounts
      if (hasMultipleLocations && !pickedLocationId) {
        setError('Please select a business location');
        return;
      }

      // Validate coordinates
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setError('Please enter valid coordinates (latitude: -90 to 90, longitude: -180 to 180)');
        return;
      }

      // Update selected location with coordinates
      setSelectedLocation(prev => prev ? {
        ...prev,
        lat,
        lng,
      } : {
        id: '',
        name: 'Manual Location',
        lat,
        lng,
        placeId: '',
      });

      // If we don't have a Google Place ID yet, try reverse geocoding
      if (!googlePlaceId) {
        setIsGeocoding(true);
        try {
          const response = await apiClient.post<{
            success: boolean;
            placeId?: string;
            error?: string;
          }>('/geo-grid/geocode', { lat, lng });

          if (response.success && response.placeId) {
            setGooglePlaceId(response.placeId);
          }
        } catch (err) {
          console.warn('Reverse geocoding failed:', err);
          // Continue anyway - user can still proceed without Place ID
        } finally {
          setIsGeocoding(false);
        }
      }

      setError(null);
      setCurrentStep('settings');
    } else if (currentStep === 'settings') {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'settings') {
      setCurrentStep('location');
    } else if (currentStep === 'confirm') {
      setCurrentStep('settings');
    }
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      setError('Please select a Google Business location');
      return;
    }

    // Require a Google Place ID for rank tracking to work
    if (!googlePlaceId) {
      setError('No Google Place ID found. Please use "Look up from address" to get the Place ID, or try a different address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Convert gridSize to checkPoints array
    const checkPoints: CheckPoint[] = gridSize === 9
      ? ['center', 'n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
      : ['center', 'n', 's', 'e', 'w'];

    const configData: SaveConfigData = {
      configId, // Pass configId for editing existing configs
      googleBusinessLocationId: selectedLocation.id,
      centerLat: selectedLocation.lat,
      centerLng: selectedLocation.lng,
      radiusMiles,
      checkPoints,
      targetPlaceId: googlePlaceId, // Use the Google Place ID from geocoding, not GBP location ID
      isEnabled: true,
      locationName: selectedLocation.name || effectiveGBPLocation?.name || undefined,
    };

    const result = await saveConfig(configData);

    if (result.success) {
      onComplete?.();
    } else {
      setError(result.error || 'Failed to save configuration');
    }

    setIsSubmitting(false);
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'location':
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              Set the center point for your geo grid tracking.
            </p>

            {/* Location picker for Maven accounts with multiple GBP locations */}
            {hasMultipleLocations && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Business Location
                </label>
                <select
                  value={pickedLocationId || ''}
                  onChange={(e) => {
                    setPickedLocationId(e.target.value || null);
                    // Reset form state when location changes
                    setGooglePlaceId(null);
                    setManualLat('');
                    setManualLng('');
                    setGeocodeError(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a location...</option>
                  {allLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.address ? `- ${loc.address}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* GBP Connection Flow */}
            {effectiveGBPLocation ? (
              // Location selected - show connected state
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{effectiveGBPLocation.name}</p>
                    {effectiveGBPLocation.address && (
                      <p className="text-sm text-gray-500">{effectiveGBPLocation.address}</p>
                    )}
                    <p className="text-xs text-gray-400">Connected via Google Business Profile</p>
                  </div>
                  {hasMultipleLocations && (
                    <button
                      type="button"
                      onClick={() => setPickedLocationId(null)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>
            ) : hasMultipleLocations && !pickedLocationId ? (
              // Multiple locations - need to pick one
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Select a business location above to continue.
                </p>
              </div>
            ) : isGBPConnected === null ? (
              // Checking connection status
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon name="FaSpinner" className="w-5 h-5 text-gray-400 animate-spin" size={20} />
                  <p className="text-sm text-gray-600">Checking Google Business connection...</p>
                </div>
              </div>
            ) : isGBPConnected && !hasAnyLocations ? (
              // Connected but no locations fetched yet
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Icon name="FaCheckCircle" className="w-5 h-5 text-green-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Google Business Profile connected!
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Now fetch your business locations from Google to continue.
                    </p>
                    {gbpError && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {gbpError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleFetchLocations}
                      disabled={isFetchingLocations}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isFetchingLocations ? (
                        <>
                          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                          <span>Fetching locations...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="FaRedo" className="w-4 h-4" size={16} />
                          <span>Fetch business locations</span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      This may take a minute due to Google API limits
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Not connected - show OAuth button
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon name="FaGoogle" className="w-5 h-5 text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Connect Google Business Profile
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Connect your Google Business Profile to automatically load your business location, or enter coordinates manually below.
                    </p>
                    <button
                      type="button"
                      onClick={handleConnectGBP}
                      disabled={isConnecting || !accountId}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isConnecting ? (
                        <>
                          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                          <span>Connecting...</span>
                        </>
                      ) : !accountId ? (
                        <>
                          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="FaGoogle" className="w-4 h-4" size={16} />
                          <span>Connect Google Business</span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Check ALL permission boxes when prompted by Google
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Business Lookup Status */}
            {isGeocoding && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-800">Searching for your business on Google...</p>
              </div>
            )}

            {/* Success - Found Business */}
            {googlePlaceId && !isGeocoding && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800 font-medium">Business listing found!</p>
                    <p className="text-xs text-green-700 mt-1 font-mono truncate" title={googlePlaceId}>Place ID: {googlePlaceId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGooglePlaceId(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {geocodeError && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {geocodeError.includes('Service-area') ? (
                    <>
                      Service-area businesses don't have a public location. Please enter the center of your service area manually.
                      {' '}Go to{' '}
                      <a
                        href="https://www.google.com/maps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        Google Maps
                      </a>
                      , right-click on your service area center, and click the coordinates to copy them.
                    </>
                  ) : (
                    geocodeError
                  )}
                </p>
              </div>
            )}

            {/* Find Business Button */}
            {effectiveGBPLocation && !googlePlaceId && !isGeocoding && (
              <button
                type="button"
                onClick={() => searchForBusiness(effectiveGBPLocation.name)}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Find My Business on Google
              </button>
            )}

            {/* Manual Place ID Input - for service-area businesses */}
            {!googlePlaceId && !isGeocoding && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Can't find your business automatically?
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Service-area businesses or new listings may not appear in search. Enter your Place ID manually.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Place ID
                  </label>
                  <input
                    type="text"
                    value={googlePlaceId || ''}
                    onChange={(e) => setGooglePlaceId(e.target.value || null)}
                    placeholder="e.g., ChIJVWeoCbOhlVQR_R5sLxdsrfw"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>

                <details className="text-xs text-gray-600">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                    How to find your Place ID
                  </summary>
                  <div className="mt-2 space-y-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="font-medium text-blue-800 mb-1">Easiest method:</p>
                      <ol className="space-y-1 pl-4 list-decimal text-blue-700">
                        <li>Go to <a href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Place ID Finder</a></li>
                        <li>Search for your business name</li>
                        <li>Click on your listing in the map</li>
                        <li>Copy the Place ID shown (starts with "ChIJ...")</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Alternative method:</p>
                      <ol className="space-y-1 pl-4 list-decimal">
                        <li>Search for your business on <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Maps</a></li>
                        <li>Click on your business listing</li>
                        <li>The URL will contain <code className="bg-gray-100 px-1 rounded">!1s0x...</code> - the Place ID is the part after "!1s"</li>
                      </ol>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Coordinate Inputs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Search center coordinates:
                </p>
                {effectiveGBPLocation && (
                  <button
                    type="button"
                    onClick={() => searchForBusiness(effectiveGBPLocation.name)}
                    disabled={isGeocoding}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                  >
                    <ArrowPathIcon className={`w-3 h-3 ${isGeocoding ? 'animate-spin' : ''}`} />
                    Search again
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                This is the center point for rank tracking. For service-area businesses, use the center of your service area.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="e.g., 37.7749"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="e.g., -122.4194"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                <strong>Tip:</strong> Right-click on Google Maps and click the coordinates to copy them.
              </p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <p className="text-gray-600">
              Configure how the geo grid tracks your visibility.
            </p>

            {/* Grid Size Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grid size
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGridSize(5)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    gridSize === 5
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block font-semibold text-gray-900">5 points</span>
                  <span className="text-sm text-gray-500">Center + N/S/E/W</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize(9)}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    gridSize === 9
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block font-semibold text-gray-900">9 points</span>
                  <span className="text-sm text-gray-500">+ diagonals (NE/SE/SW/NW)</span>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                More points = more comprehensive coverage but higher credit cost per check.
              </p>
            </div>

            {/* Radius Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search radius (miles)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={radiusMiles}
                  onChange={(e) => setRadiusMiles(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="w-16 text-center font-semibold text-gray-900">
                  {radiusMiles} mi
                </span>
              </div>
            </div>

            {/* Grid Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Grid preview</h4>
              <div className="relative w-48 h-48 mx-auto">
                {/* Circle outline */}
                <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-full" />
                {/* Center point */}
                <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2 bg-blue-600 rounded-full" />
                {/* North */}
                <div className="absolute top-0 left-1/2 w-3 h-3 -ml-1.5 bg-blue-400 rounded-full" />
                {/* South */}
                <div className="absolute bottom-0 left-1/2 w-3 h-3 -ml-1.5 bg-blue-400 rounded-full" />
                {/* East */}
                <div className="absolute top-1/2 right-0 w-3 h-3 -mt-1.5 bg-blue-400 rounded-full" />
                {/* West */}
                <div className="absolute top-1/2 left-0 w-3 h-3 -mt-1.5 bg-blue-400 rounded-full" />
                {/* Diagonal points - only show when gridSize is 9 */}
                {gridSize === 9 && (
                  <>
                    {/* Northeast */}
                    <div className="absolute top-[14.6%] right-[14.6%] w-3 h-3 -mt-1.5 -mr-1.5 bg-blue-400 rounded-full" />
                    {/* Southeast */}
                    <div className="absolute bottom-[14.6%] right-[14.6%] w-3 h-3 -mb-1.5 -mr-1.5 bg-blue-400 rounded-full" />
                    {/* Southwest */}
                    <div className="absolute bottom-[14.6%] left-[14.6%] w-3 h-3 -mb-1.5 -ml-1.5 bg-blue-400 rounded-full" />
                    {/* Northwest */}
                    <div className="absolute top-[14.6%] left-[14.6%] w-3 h-3 -mt-1.5 -ml-1.5 bg-blue-400 rounded-full" />
                  </>
                )}
              </div>
              <p className="text-center text-sm text-gray-500 mt-3">
                {gridSize} check points within {radiusMiles} mile radius
              </p>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              Review your configuration before saving.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Location</span>
                <span className="font-medium text-gray-900">{selectedLocation?.name || 'Manual Location'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Coordinates</span>
                <span className="font-medium text-gray-900 font-mono text-sm">
                  {selectedLocation?.lat.toFixed(6)}, {selectedLocation?.lng.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Google Place ID</span>
                <span className="font-medium text-gray-900 font-mono text-xs truncate max-w-[200px]" title={googlePlaceId || 'Not found'}>
                  {googlePlaceId || <span className="text-red-600">Not found - required</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Grid size</span>
                <span className="font-medium text-gray-900">
                  {gridSize} points {gridSize === 5 ? '(center + N/S/E/W)' : '(center + all directions)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Search radius</span>
                <span className="font-medium text-gray-900">{radiusMiles} miles</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can run rank checks manually or set up automated daily checks later.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Set up</h2>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full
                  ${index <= currentStepIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {step.icon}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 rounded ${
                  index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">{renderStepContent()}</div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={currentStep === 'location' ? onCancel : handleBack}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          {currentStep === 'location' ? 'Cancel' : 'Back'}
        </button>

        {currentStep === 'confirm' ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedLocation}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Complete Setup'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default GeoGridSetupWizard;
