/**
 * GeoGridSetupWizard Component
 *
 * Multi-step wizard for initial geo grid configuration.
 * Guides users through connecting GBP location and setting grid parameters.
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPinIcon, Cog6ToothIcon, CheckCircleIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useGeoGridConfig, SaveConfigData } from '../hooks/useGeoGridConfig';
import { CheckPoint, GGCheckResult, GRID_SIZE_OPTIONS, GridSize } from '../utils/types';
import { calculateGridPoints } from '../services/point-calculator';
import { apiClient } from '@/utils/apiClient';
import Icon from '@/components/Icon';
import { GeoGridGoogleMap } from './GeoGridGoogleMap';

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

  // Track if we've done the initial auto-search (to avoid re-running after user interaction)
  const hasAutoSearchedRef = React.useRef(false);

  // Track if user has manually updated location (via Place ID lookup) to prevent overwriting
  const hasManuallyUpdatedLocationRef = React.useRef(false);

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
          const locations = gbpPlatform.locations.map((loc: any) => {
            // Only use google_place_id if it's a valid Place ID (starts with ChIJ)
            const validPlaceId = loc.google_place_id?.startsWith('ChIJ') ? loc.google_place_id : null;
            console.log('🔍 [GeoGrid] Location:', loc.location_name, 'google_place_id:', loc.google_place_id, 'valid:', !!validPlaceId);
            return {
              id: loc.id || loc.location_id,
              name: loc.location_name || loc.name,
              lat: loc.lat || 0,
              lng: loc.lng || 0,
              placeId: validPlaceId, // Only use valid Place IDs, null otherwise
              address: loc.address,
            };
          });
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
  const [gridSize, setGridSize] = useState<GridSize>(5); // Grid size: 5, 9, 25, or 49 points
  const [selectedLocation, setSelectedLocation] = useState(effectiveGBPLocation);
  const [manualLat, setManualLat] = useState(effectiveGBPLocation?.lat?.toString() || '');
  const [manualLng, setManualLng] = useState(effectiveGBPLocation?.lng?.toString() || '');
  // Google Place ID for rank tracking - prefer from GBP database, fall back to search
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(
    effectiveGBPLocation?.placeId?.startsWith('ChIJ') ? effectiveGBPLocation.placeId : null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocodeStatus, setGeocodeStatus] = useState<string | null>(null); // Status message during operations
  // Google Maps URL input for service-area businesses
  const [mapsUrlInput, setMapsUrlInput] = useState('');
  // Editable search name - allows users to update if their business name changed on Google
  const [searchBusinessName, setSearchBusinessName] = useState(effectiveGBPLocation?.name || '');
  // Google-verified business name (only set when we get a name from Google's API)
  const [verifiedBusinessName, setVerifiedBusinessName] = useState<string | null>(null);
  // Business search results for user to pick from
  const [businessSearchResults, setBusinessSearchResults] = useState<Array<{
    name: string;
    placeId: string;
    address: string;
    rating?: number;
    reviewCount?: number;
    coordinates?: { lat: number; lng: number };
  }>>([]);

  // Track if we've loaded existing config data
  const hasLoadedConfigRef = React.useRef(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(!!configId);

  // Load existing config data when editing (configId is provided)
  useEffect(() => {
    if (!configId || hasLoadedConfigRef.current) return;

    const loadExistingConfig = async () => {
      try {
        console.log('🔍 [GeoGridSetupWizard] Loading existing config:', configId);
        const response = await apiClient.get<{
          config: {
            id: string;
            centerLat: number;
            centerLng: number;
            radiusMiles: number;
            targetPlaceId: string | null;
            locationName: string | null;
            checkPoints: string[];
          } | null;
        }>(`/geo-grid/config?configId=${configId}`);

        if (response.config) {
          const cfg = response.config;
          console.log('✅ [GeoGridSetupWizard] Loaded config:', cfg);

          // Pre-populate form with existing values
          if (cfg.centerLat && cfg.centerLng && cfg.centerLat !== 0 && cfg.centerLng !== 0) {
            setManualLat(cfg.centerLat.toString());
            setManualLng(cfg.centerLng.toString());
          }
          if (cfg.targetPlaceId) {
            setGooglePlaceId(cfg.targetPlaceId);
          }
          if (cfg.radiusMiles) {
            setRadiusMiles(cfg.radiusMiles);
          }
          // Detect grid size from existing checkPoints
          if (cfg.checkPoints?.length) {
            const matchingOption = GRID_SIZE_OPTIONS.find(opt => opt.value === cfg.checkPoints.length);
            if (matchingOption) {
              setGridSize(matchingOption.value);
            }
          }

          // Set initial location name from stored data (will be refreshed from Google below)
          if (cfg.locationName) {
            setSearchBusinessName(cfg.locationName);
            setSelectedLocation(prev => prev ? {
              ...prev,
              name: cfg.locationName!,
            } : {
              id: '',
              name: cfg.locationName!,
              lat: cfg.centerLat || 0,
              lng: cfg.centerLng || 0,
              placeId: cfg.targetPlaceId || '',
            });
            hasManuallyUpdatedLocationRef.current = true; // Prevent useEffect from overwriting
          }

          hasLoadedConfigRef.current = true;

          // Get verified business name from Google if we have a Place ID
          // This ensures we have a Google-verified name for saving
          if (cfg.targetPlaceId) {
            try {
              const refreshResponse = await apiClient.post<{
                success: boolean;
                businessName?: string;
              }>('/geo-grid/geocode', { placeId: cfg.targetPlaceId });

              if (refreshResponse.success && refreshResponse.businessName) {
                console.log('✅ [GeoGridSetupWizard] Got verified business name from Google:', refreshResponse.businessName);
                setSearchBusinessName(refreshResponse.businessName);
                setVerifiedBusinessName(refreshResponse.businessName);
                setSelectedLocation(prev => prev ? {
                  ...prev,
                  name: refreshResponse.businessName!,
                } : {
                  id: '',
                  name: refreshResponse.businessName!,
                  lat: cfg.centerLat || 0,
                  lng: cfg.centerLng || 0,
                  placeId: cfg.targetPlaceId || '',
                });
              }
            } catch (refreshErr) {
              console.warn('Could not get business name from Google:', refreshErr);
              // User will need to search for their business to get a verified name
            } finally {
              setIsLoadingConfig(false);
            }
          } else {
            setIsLoadingConfig(false);
          }
        } else {
          setIsLoadingConfig(false);
        }
      } catch (err) {
        console.error('Failed to load existing config:', err);
        setIsLoadingConfig(false);
      }
    };

    loadExistingConfig();
  }, [configId]);

  // Search for business Place ID using Places API
  const searchForBusiness = useCallback(async (businessName: string, lat?: number, lng?: number, preciseCoords?: boolean) => {
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
        debugInfo?: { textSearchStatus?: string; findPlaceStatus?: string; placesNewStatus?: string };
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
        preciseCoords,
      });

      console.log('Business search response:', response);

      if (response.success && response.placeId) {
        // Build list of all results for user to choose from
        const allResults = [
          {
            name: response.businessName || businessName,
            placeId: response.placeId,
            address: response.formattedAddress || '',
            rating: response.rating,
            reviewCount: response.reviewCount,
            coordinates: response.coordinates,
          },
          ...(response.otherResults || []).map(r => ({
            ...r,
            coordinates: undefined, // Other results don't include coordinates
          })),
        ];

        setBusinessSearchResults(allResults);
        setGeocodeError(null);

        // If only one result, auto-select it
        if (allResults.length === 1) {
          selectBusinessResult(allResults[0]);
        }
        return true;
      } else {
        // Show API status codes for debugging (console only)
        if (response.debugInfo) {
          const { textSearchStatus, findPlaceStatus, placesNewStatus } = response.debugInfo as any;
          console.log('API status codes:', { placesNewStatus, textSearchStatus, findPlaceStatus });

          // Check if ALL legacy APIs failed with permission issues (API not enabled)
          const allLegacyAccessDenied = [textSearchStatus, findPlaceStatus].every(
            s => s === 'REQUEST_DENIED' || s === 'PERMISSION_DENIED'
          );

          // Check if Places API (New) also has permission issues
          const placesNewAccessDenied = placesNewStatus === 'PERMISSION_DENIED' || placesNewStatus === 'REQUEST_DENIED';

          // Only show API connection error if ALL APIs have permission issues
          if (allLegacyAccessDenied && (placesNewAccessDenied || placesNewStatus === 'NOT_TRIED')) {
            console.log('All APIs have permission issues - showing API error');
            setGeocodeError('API_CONNECTION_ERROR');
            return false;
          }

          // Otherwise, the APIs worked but business wasn't found
          console.log('APIs worked but business not found');
          setGeocodeError('BUSINESS_NOT_FOUND');
          return false;
        }

        // No debugInfo - assume business not found (most common case)
        console.log('No debugInfo in response, assuming business not found');
        setGeocodeError('BUSINESS_NOT_FOUND');
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
  const [coordsNote, setCoordsNote] = useState<string | null>(null);
  const fetchCoordsFromPlaceId = useCallback(async (placeId: string, fallbackAddress?: string): Promise<boolean> => {
    console.log('Fetching coordinates for Place ID:', placeId, 'with fallback address:', fallbackAddress);
    // Mark as manually updated BEFORE API call to prevent useEffect from overwriting
    hasManuallyUpdatedLocationRef.current = true;
    setIsGeocoding(true);
    setCoordsNote(null);
    try {
      const response = await apiClient.post<{
        success: boolean;
        coordinates?: { lat: number; lng: number };
        businessName?: string;
        formattedAddress?: string;
        error?: string;
        hint?: string;
        note?: string;
        source?: string;
      }>('/geo-grid/geocode', { placeId, fallbackAddress });

      console.log('Geocode response for Place ID:', response);
      if (response.success && response.coordinates) {
        setManualLat(response.coordinates.lat.toString());
        setManualLng(response.coordinates.lng.toString());
        // Update business name if returned from Google (reflects current name)
        if (response.businessName) {
          setSearchBusinessName(response.businessName);
          setVerifiedBusinessName(response.businessName); // Store Google-verified name
          // Also update the selected location name for display
          setSelectedLocation(prev => prev ? {
            ...prev,
            name: response.businessName!,
          } : {
            id: '',
            name: response.businessName!,
            lat: response.coordinates!.lat,
            lng: response.coordinates!.lng,
            placeId: placeId,
          });
        }
        // Show note if coordinates came from fallback geocoding
        if (response.note) {
          setCoordsNote(response.note);
        }
        return true;
      } else {
        // Service-area businesses don't expose coordinates via the API
        // Show a helpful message with link to Google Maps
        setGeocodeError(
          response.hint || 'Service-area businesses don\'t have a public location. Please enter the center of your service area manually.'
        );
        return false;
      }
    } catch (err) {
      console.warn('Failed to fetch coordinates from Place ID:', err);
      setGeocodeError(
        'Could not fetch coordinates automatically. Please enter them manually.'
      );
      return false;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Handle user selecting a business from search results
  const selectBusinessResult = useCallback((result: {
    name: string;
    placeId: string;
    address: string;
    rating?: number;
    reviewCount?: number;
    coordinates?: { lat: number; lng: number };
  }) => {
    setGooglePlaceId(result.placeId);
    setSearchBusinessName(result.name);
    setVerifiedBusinessName(result.name); // Store Google-verified name
    setBusinessSearchResults([]); // Clear results after selection

    // Update selected location with the business name
    setSelectedLocation(prev => prev ? {
      ...prev,
      name: result.name,
    } : {
      id: '',
      name: result.name,
      lat: result.coordinates?.lat || 0,
      lng: result.coordinates?.lng || 0,
      placeId: result.placeId,
    });
    hasManuallyUpdatedLocationRef.current = true;

    if (result.coordinates) {
      setManualLat(result.coordinates.lat.toString());
      setManualLng(result.coordinates.lng.toString());
    } else {
      // Need to fetch coordinates from the Place ID
      fetchCoordsFromPlaceId(result.placeId);
    }
  }, [fetchCoordsFromPlaceId]);

  // Auto-search for business when component mounts with a GBP location
  // But only if we don't already have a valid Place ID from the database
  // Only runs ONCE on initial load - user's manual searches won't be overwritten
  useEffect(() => {
    console.log('GeoGridSetupWizard useEffect - effectiveGBPLocation:', effectiveGBPLocation);
    if (effectiveGBPLocation && effectiveGBPLocation.name) {
      // Only update selectedLocation if user hasn't manually updated it via Place ID lookup
      if (!hasManuallyUpdatedLocationRef.current) {
        setSelectedLocation(effectiveGBPLocation);
      }
      // Update search name (user can edit this if their business name changed)
      if (!hasAutoSearchedRef.current) {
        setSearchBusinessName(effectiveGBPLocation.name);
      }

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
          fetchCoordsFromPlaceId(effectiveGBPLocation.placeId, effectiveGBPLocation.address);
        }
        hasAutoSearchedRef.current = true;
        return;
      }

      // Don't auto-search - let user click "Find My Business on Google" button
      // Auto-search was confusing because it showed "Business not found" error
      // before the user did anything
      hasAutoSearchedRef.current = true;
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

    // Require valid coordinates for the map to work
    const hasValidCoords = selectedLocation.lat !== 0 && selectedLocation.lng !== 0 &&
                           selectedLocation.lat != null && selectedLocation.lng != null &&
                           !isNaN(selectedLocation.lat) && !isNaN(selectedLocation.lng);
    if (!hasValidCoords) {
      setError('Missing coordinates. Please use "Search for your business" below to find your business and get valid coordinates.');
      return;
    }

    // Require a Google Place ID for rank tracking to work
    if (!googlePlaceId) {
      setError('No Google Place ID found. Please use "Search for your business" to get the Place ID, or try a different address.');
      return;
    }

    // Require a verified business name from Google (prevents storing addresses as names)
    if (!verifiedBusinessName) {
      setError('Business name not verified. Please search for your business to get the correct name from Google.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Get checkPoints from the selected grid size option
    const selectedOption = GRID_SIZE_OPTIONS.find(opt => opt.value === gridSize);
    const checkPoints: CheckPoint[] = selectedOption?.checkPoints || ['center', 'n', 's', 'e', 'w'];

    const configData: SaveConfigData = {
      configId, // Pass configId for editing existing configs
      googleBusinessLocationId: selectedLocation.id,
      centerLat: selectedLocation.lat,
      centerLng: selectedLocation.lng,
      radiusMiles,
      checkPoints,
      targetPlaceId: googlePlaceId, // Use the Google Place ID from geocoding, not GBP location ID
      isEnabled: true,
      locationName: verifiedBusinessName, // Only use Google-verified business name
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

            {/* Loading state while fetching existing config */}
            {isLoadingConfig && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
                <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                <p className="text-sm text-gray-600">Loading your configuration...</p>
              </div>
            )}

            {/* GBP Connection Flow */}
            {!isLoadingConfig && effectiveGBPLocation ? (
              // Location selected - check if data is complete using CURRENT form state
              (() => {
                // Check current form state, not just original location data
                const currentLat = parseFloat(manualLat);
                const currentLng = parseFloat(manualLng);
                const hasValidCoords = !isNaN(currentLat) && !isNaN(currentLng) &&
                                       currentLat !== 0 && currentLng !== 0;
                const hasValidPlaceId = googlePlaceId?.startsWith('ChIJ');
                const hasVerifiedName = !!verifiedBusinessName;
                const isComplete = hasValidCoords && hasValidPlaceId && hasVerifiedName;
                const needsSetup = !hasValidCoords || !hasValidPlaceId || !hasVerifiedName;

                // Use verified name if available, then user's search input, then fall back to selected/GBP location
                const displayName = verifiedBusinessName || searchBusinessName || selectedLocation?.name || effectiveGBPLocation.name;

                return (
                  <div className={`p-4 rounded-lg ${needsSetup ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-start gap-3">
                      <MapPinIcon className={`w-6 h-6 ${needsSetup ? 'text-amber-600' : 'text-green-600'}`} />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{displayName}</p>
                        {effectiveGBPLocation.address && (
                          <p className="text-sm text-gray-500">{effectiveGBPLocation.address}</p>
                        )}

                        {/* Show status based on data completeness */}
                        {isComplete ? (
                          <p className="text-xs text-green-600 mt-1">✓ Location data complete</p>
                        ) : hasValidPlaceId && hasValidCoords && !hasVerifiedName ? (
                          <p className="text-xs text-amber-600 mt-1">⚠️ Business name not verified - click &quot;Get coordinates&quot; below</p>
                        ) : hasValidPlaceId && !hasValidCoords ? (
                          <p className="text-xs text-amber-600 mt-1">⚠️ Coordinates needed - see below</p>
                        ) : (
                          <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-200">
                            <p className="text-sm font-medium text-amber-800 mb-1">
                              ⚠️ Location data incomplete
                            </p>
                            <ul className="text-xs text-amber-700 space-y-1">
                              {!hasValidPlaceId && (
                                <li>• Missing Google Place ID (required for rank tracking)</li>
                              )}
                              {!hasValidCoords && (
                                <li>• Missing coordinates (required for map display)</li>
                              )}
                              {!hasVerifiedName && hasValidPlaceId && (
                                <li>• Business name not verified from Google</li>
                              )}
                            </ul>
                            <p className="text-xs text-amber-800 mt-2">
                              <strong>Fix:</strong> Use &quot;Search for your business&quot; below to find your business and get the required data.
                            </p>
                          </div>
                        )}
                      </div>
                      {hasMultipleLocations && (
                        <button
                          type="button"
                          onClick={() => setPickedLocationId(null)}
                          className="text-xs text-slate-blue hover:text-slate-blue/80 underline"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : !isLoadingConfig && hasMultipleLocations && !pickedLocationId ? (
              // Multiple locations - need to pick one
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Select a business location above to continue.
                </p>
              </div>
            ) : !isLoadingConfig && isGBPConnected === null ? (
              // Checking connection status
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon name="FaSpinner" className="w-5 h-5 text-gray-500 animate-spin" size={20} />
                  <p className="text-sm text-gray-600">Checking Google Business connection...</p>
                </div>
              </div>
            ) : !isLoadingConfig && isGBPConnected && !hasAnyLocations ? (
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
            ) : !isLoadingConfig ? (
              // Not connected - show OAuth button
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon name="FaGoogle" className="w-5 h-5 text-slate-blue" size={20} />
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white text-sm font-medium rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            ) : null}

            {/* Business Lookup Status */}
            {isGeocoding && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 text-slate-blue animate-spin" />
                <p className="text-sm text-blue-800">Searching for your business on Google...</p>
              </div>
            )}

            {/* Success - Found Business */}
            {googlePlaceId && !isGeocoding && (() => {
              const hasCoords = manualLat && manualLng &&
                               parseFloat(manualLat) !== 0 && parseFloat(manualLng) !== 0;
              const hasVerifiedName = !!verifiedBusinessName;
              const isComplete = hasCoords && hasVerifiedName;
              const needsData = !hasCoords || !hasVerifiedName;
              return (
                <div className={`p-3 rounded-lg ${isComplete ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isComplete ? 'text-green-800' : 'text-amber-800'}`}>
                        {isComplete ? '✓ Business verified!' : !hasCoords ? '⚠️ Place ID found, but coordinates needed' : '⚠️ Click below to verify business name'}
                      </p>
                      {(verifiedBusinessName || searchBusinessName) && (
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {verifiedBusinessName || searchBusinessName}
                          {hasVerifiedName && <span className="ml-2 text-xs text-green-600">✓ verified</span>}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5 font-mono truncate" title={googlePlaceId}>
                        Place ID: {googlePlaceId}
                      </p>
                      {needsData && (
                        <div className="mt-3 space-y-3">
                          {/* Try auto-fetch button */}
                          <button
                            type="button"
                            onClick={() => {
                              setGeocodeError(null);
                              // Pass address as fallback in case Place ID lookup fails
                              fetchCoordsFromPlaceId(googlePlaceId, effectiveGBPLocation?.address);
                            }}
                            disabled={isGeocoding}
                            className="w-full px-4 py-2 bg-slate-blue text-white text-sm font-medium rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isGeocoding ? (
                              <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                Fetching from Google...
                              </>
                            ) : (
                              <>
                                <MapPinIcon className="w-4 h-4" />
                                Get coordinates & verify name from Google
                              </>
                            )}
                          </button>

                          {/* Show SAB-friendly message when auto-fetch fails - no duplicate instructions */}
                          {geocodeError && !hasCoords && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">📍 Service-area business:</span> Your business doesn&apos;t have public coordinates on Google (this is normal for SABs).
                                Enter the center of your service area in the <strong>Search center coordinates</strong> section below.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGooglePlaceId(null);
                        setVerifiedBusinessName(null);
                      }}
                      className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-slate-blue border border-slate-blue rounded-lg hover:bg-slate-blue hover:text-white transition-colors whitespace-nowrap"
                    >
                      Change
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Only show geocodeError if we don't have a Place ID - otherwise the Place ID box handles it */}
            {geocodeError && !googlePlaceId && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {geocodeError === 'API_CONNECTION_ERROR' ? (
                    <>
                      <strong>Contact support</strong> — there is an issue with the API connection.
                      <br />
                      <a
                        href="mailto:support@promptreviews.app"
                        className="text-slate-blue underline hover:text-blue-800"
                      >
                        support@promptreviews.app
                      </a>
                    </>
                  ) : geocodeError === 'SEARCH_FAILED_WITH_COORDS' ? (
                    <>
                      <strong>Couldn&apos;t find &quot;{searchBusinessName}&quot;</strong> in Google&apos;s database, but we extracted the coordinates from the URL.
                      <br /><br />
                      The coordinates have been filled in below. You can try searching with a different business name, or proceed with just the coordinates (you&apos;ll need to search for your business later to enable rank tracking).
                    </>
                  ) : geocodeError === 'BUSINESS_NOT_FOUND' ? (
                    <>
                      <strong>Business not found</strong>
                      {searchBusinessName && (
                        <> — searched for &quot;{searchBusinessName}&quot;</>
                      )}
                      <br /><br />
                      Try typing your exact business name as it appears on Google Maps in the search field below.
                      <br /><br />
                      <strong>Tip:</strong> Go to{' '}
                      <a
                        href="https://www.google.com/maps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-blue underline hover:text-blue-800"
                      >
                        Google Maps
                      </a>
                      {' '}and search for your business to see the exact name Google uses.
                    </>
                  ) : geocodeError.includes('Service-area') ? (
                    <>
                      Service-area businesses don't have a public location. Please enter the center of your service area manually.
                      {' '}Go to{' '}
                      <a
                        href="https://www.google.com/maps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-blue underline hover:text-blue-800"
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

            {/* Find Business Section */}
            {effectiveGBPLocation && !googlePlaceId && !isGeocoding && (
              <div className="space-y-3">
                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-2">
                    Business name to search
                  </label>
                  <input
                    type="text"
                    value={searchBusinessName}
                    onChange={(e) => setSearchBusinessName(e.target.value)}
                    placeholder="Enter your business name as it appears on Google"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Changed your business name on Google? Update it here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => searchForBusiness(searchBusinessName)}
                  disabled={!searchBusinessName.trim() || isGeocoding}
                  className="w-full px-4 py-3 bg-slate-blue text-white font-medium rounded-lg hover:bg-slate-blue/90 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeocoding ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="w-5 h-5" />
                      Find My Business on Google
                    </>
                  )}
                </button>

                {/* Search Results List */}
                {businessSearchResults.length > 0 && (
                  <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-700">
                        Select your business ({businessSearchResults.length} found)
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {businessSearchResults.map((result, index) => (
                        <button
                          key={result.placeId || index}
                          type="button"
                          onClick={() => selectBusinessResult(result)}
                          className="w-full px-3 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{result.name}</p>
                              <p className="text-sm text-gray-500 truncate">{result.address}</p>
                              {result.rating && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  ★ {result.rating.toFixed(1)}
                                  {result.reviewCount && ` (${result.reviewCount} reviews)`}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-slate-blue font-medium whitespace-nowrap">Select</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Not listed? Use the{' '}
                        <button
                          type="button"
                          onClick={() => setBusinessSearchResults([])}
                          className="text-slate-blue hover:text-slate-blue/80 underline"
                        >
                          manual Place ID option
                        </button>
                        {' '}below.
                      </p>
                      <button
                        type="button"
                        onClick={() => setBusinessSearchResults([])}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paste Google Maps Link - for service-area businesses */}
            {!googlePlaceId && !isGeocoding && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div>
                  <p className="text-base font-semibold text-gray-800">
                    Service-area business not showing up?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Paste your Google Maps business link and we&apos;ll find it automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Maps link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mapsUrlInput}
                      onChange={(e) => setMapsUrlInput(e.target.value)}
                      placeholder="Paste your Google Maps business URL here..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const url = mapsUrlInput.trim();
                          console.log('Processing Google Maps URL:', url);

                          if (!url) {
                            setGeocodeError('Please paste a Google Maps URL first.');
                            return;
                          }

                          setIsGeocoding(true);
                          setGeocodeError(null);
                          setGeocodeStatus('Parsing URL...');

                          // Try to extract ChIJ format Place ID first
                          const chijMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/) ||
                                            url.match(/place_id[=:](ChIJ[A-Za-z0-9_-]+)/) ||
                                            url.match(/^(ChIJ[A-Za-z0-9_-]+)$/);

                          if (chijMatch?.[1]) {
                            console.log('Found ChIJ Place ID:', chijMatch[1]);
                            setGeocodeStatus('Found Place ID, fetching details...');
                            setGooglePlaceId(chijMatch[1]);
                            await fetchCoordsFromPlaceId(chijMatch[1]);
                            setMapsUrlInput('');
                            setGeocodeStatus(null);
                            return;
                          }

                          // Try hex format Place ID (ftid) - format: 0x...:0x...
                          const hexMatch = url.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i);
                          if (hexMatch?.[1]) {
                            console.log('Found hex Place ID (ftid):', hexMatch[1]);
                            setGeocodeStatus('Found hex Place ID, trying lookup...');
                            // Try using it directly - some Google APIs accept this format
                            const hexSuccess = await fetchCoordsFromPlaceId(hexMatch[1]);
                            if (hexSuccess) {
                              setGooglePlaceId(hexMatch[1]);
                              setMapsUrlInput('');
                              setGeocodeStatus(null);
                              return;
                            }
                            // If hex format failed, clear error and continue to name-based search
                            console.log('Hex Place ID lookup failed, trying name-based search...');
                            setGeocodeStatus('Hex ID not recognized, trying business search...');
                            setGeocodeError(null);
                          }

                          // Extract precise coordinates from data params (!3d=lat, !4d=lng) or fallback to @ format
                          const preciseMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
                          const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                          const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);

                          // Use precise coords if available, otherwise fallback
                          const lat = preciseMatch?.[1] ? parseFloat(preciseMatch[1]) :
                                     atMatch?.[1] ? parseFloat(atMatch[1]) :
                                     llMatch?.[1] ? parseFloat(llMatch[1]) : undefined;
                          const lng = preciseMatch?.[2] ? parseFloat(preciseMatch[2]) :
                                     atMatch?.[2] ? parseFloat(atMatch[2]) :
                                     llMatch?.[2] ? parseFloat(llMatch[2]) : undefined;
                          console.log('Extracted coordinates:', { lat, lng, source: preciseMatch ? 'precise' : atMatch ? '@' : 'other' });

                          // Try multiple URL patterns for business name
                          // Format 1: /place/Business+Name/@...
                          // Format 2: /search/Business+Name/@...
                          // Format 3: ?q=Business+Name&...
                          const nameMatch = url.match(/\/place\/([^/@]+)/) ||
                                            url.match(/\/search\/([^/@]+)/) ||
                                            url.match(/[?&]q=([^&]+)/);

                          if (nameMatch?.[1]) {
                            const businessName = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
                            console.log('Extracted business name:', businessName);
                            console.log('Has precise coordinates:', !!preciseMatch);

                            // Search for business using extracted name and coordinates
                            // Pass preciseCoords=true when we have exact coordinates from URL data params
                            setGeocodeStatus(`Searching for "${businessName}"...`);
                            setSearchBusinessName(businessName);
                            const found = await searchForBusiness(businessName, lat, lng, !!preciseMatch);

                            // If search failed but we have coords and name, offer to use them directly
                            if (!found && lat && lng) {
                              // Set the coordinates and name from URL even though search failed
                              setManualLat(lat.toString());
                              setManualLng(lng.toString());
                              setGeocodeError(`SEARCH_FAILED_WITH_COORDS`);
                              // Store extracted name for potential use
                              setSearchBusinessName(businessName);
                            }
                            setMapsUrlInput('');
                            setGeocodeStatus(null);
                          } else if (lat && lng) {
                            // Have coordinates but no business name - tell user to search manually
                            setManualLat(lat.toString());
                            setManualLng(lng.toString());
                            setGeocodeError(`Found coordinates but couldn't extract business name. Coordinates filled in below - please search for your business name.`);
                            setMapsUrlInput('');
                            setIsGeocoding(false);
                            setGeocodeStatus(null);
                          } else {
                            setGeocodeError('Could not find business info in that URL. Make sure you copied the full URL from Google Maps (should include the business name or location).');
                            setIsGeocoding(false);
                            setGeocodeStatus(null);
                          }
                        } catch (err) {
                          console.error('Error processing Maps URL:', err);
                          setGeocodeError(`Error processing URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
                          setIsGeocoding(false);
                          setGeocodeStatus(null);
                        }
                      }}
                      disabled={!mapsUrlInput.trim() || isGeocoding}
                      className="px-4 py-2 bg-slate-blue text-white text-sm font-medium rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isGeocoding ? (geocodeStatus || 'Loading...') : 'Find business'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-slate-blue underline">Open Google Maps</a>
                    {' → '}search for your business{' → '}click on it{' → '}copy the URL from your browser
                  </p>
                </div>
              </div>
            )}

            {/* Coordinate Inputs */}
            <div className="space-y-4">
              <p className="text-lg font-semibold text-gray-800">
                Search center coordinates
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This is the center point for rank tracking. For service-area businesses, use the center of your service area.
              </p>

              {/* How to get coordinates - helpful for service-area businesses */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">
                  How to get coordinates:
                </p>
                <ol className="text-xs text-green-700 space-y-1 pl-4 list-decimal">
                  <li>Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google Maps</a></li>
                  <li>Navigate to the center of your service area</li>
                  <li>Right-click on that spot</li>
                  <li>Click the coordinates (e.g., &quot;45.5231, -122.6765&quot;) to copy them</li>
                  <li>Paste the first number into Latitude, second into Longitude</li>
                </ol>
              </div>
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
              {coordsNote && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> {coordsNote}
                  </p>
                </div>
              )}
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
                {GRID_SIZE_OPTIONS.map((option) => {
                  const baseCost = 10 + option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGridSize(option.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        gridSize === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="block font-semibold text-gray-900">{option.label}</span>
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {baseCost}+ credits
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{option.description}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Cost per check: 10 base + grid points + (2 × keywords). More points = better coverage.
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

            {/* Grid Preview - Show map if we have coordinates */}
            {(() => {
              const lat = parseFloat(manualLat);
              const lng = parseFloat(manualLng);
              const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

              if (hasValidCoords) {
                // Get the selected grid option's check points
                const selectedOption = GRID_SIZE_OPTIONS.find(opt => opt.value === gridSize);
                const checkPoints: CheckPoint[] = selectedOption?.checkPoints || ['center', 'n', 's', 'e', 'w'];

                const gridPoints = calculateGridPoints({
                  centerLat: lat,
                  centerLng: lng,
                  radiusMiles,
                  points: checkPoints,
                });

                // Create mock results for preview (no actual rank data)
                const previewResults: GGCheckResult[] = gridPoints.map((geoPoint) => ({
                  id: `preview-${geoPoint.label}`,
                  accountId: 'preview',
                  configId: 'preview',
                  keywordId: 'preview',
                  keywordPhrase: 'Preview',
                  checkPoint: geoPoint.label,
                  pointLat: geoPoint.lat,
                  pointLng: geoPoint.lng,
                  position: null,
                  positionBucket: 'none' as const,
                  businessFound: false,
                  topCompetitors: [],
                  ourRating: null,
                  ourReviewCount: null,
                  ourPlaceId: null,
                  checkedAt: new Date().toISOString(),
                  apiCostUsd: null,
                  createdAt: new Date().toISOString(),
                }));

                return (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Grid preview</h4>
                    <GeoGridGoogleMap
                      results={previewResults}
                      center={{ lat, lng }}
                      radiusMiles={radiusMiles}
                      height="300px"
                      isPreview={true}
                    />
                    <p className="text-center text-sm text-gray-500 mt-3">
                      {gridSize} check points within {radiusMiles} mile radius
                    </p>
                  </div>
                );
              }

              // Fallback diagram when no coordinates
              return (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Grid preview</h4>
                  <div className="relative w-48 h-48 mx-auto">
                    {/* Circle outline */}
                    <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-full" />
                    {/* Center point */}
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2 bg-slate-blue rounded-full" />
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
                  <p className="text-center text-xs text-amber-600 mt-2">
                    Enter coordinates in the Location step to see map preview
                  </p>
                </div>
              );
            })()}
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
                <span className="text-gray-600">Business</span>
                <span className="font-medium text-gray-900">{verifiedBusinessName || selectedLocation?.name || 'Unknown'}</span>
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
      <h2 className="text-2xl font-bold text-slate-blue mb-6">Set up</h2>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full
                  ${index <= currentStepIndex
                    ? 'bg-slate-blue text-white'
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
                  index < currentStepIndex ? 'bg-slate-blue' : 'bg-gray-200'
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
            className="px-6 py-2 bg-slate-blue text-white font-medium rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Complete Setup'}
          </button>
        ) : (() => {
          // Validate before allowing Next on location step
          const lat = parseFloat(manualLat);
          const lng = parseFloat(manualLng);
          const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          const hasValidPlaceId = googlePlaceId?.startsWith('ChIJ');
          const hasVerifiedName = !!verifiedBusinessName;
          const canProceed = currentStep !== 'location' || (hasValidCoords && hasValidPlaceId && hasVerifiedName);

          return (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="px-6 py-2 bg-slate-blue text-white font-medium rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!canProceed ? 'Please search for your business to get verified coordinates and name from Google' : undefined}
            >
              Next
            </button>
          );
        })()}
      </div>
    </div>
  );
}

export default GeoGridSetupWizard;
