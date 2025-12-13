/**
 * GeoGridSetupWizard Component
 *
 * Multi-step wizard for initial geo grid configuration.
 * Guides users through connecting GBP location and setting grid parameters.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MapPinIcon, Cog6ToothIcon, CheckCircleIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useGeoGridConfig, SaveConfigData } from '../hooks/useGeoGridConfig';
import { apiClient } from '@/utils/apiClient';

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
  onComplete,
  onCancel,
}: GeoGridSetupWizardProps) {
  const { saveConfig } = useGeoGridConfig({ autoFetch: false });

  // For Maven accounts with multiple available locations
  const hasMultipleLocations = availableLocations && availableLocations.length > 1;
  const [pickedLocationId, setPickedLocationId] = useState<string | null>(
    googleBusinessLocation?.id || null
  );

  // Get the effective GBP location (picked from list or pre-selected)
  const effectiveGBPLocation = hasMultipleLocations
    ? availableLocations?.find((l) => l.id === pickedLocationId) || null
    : googleBusinessLocation;

  // Check if location has valid coordinates
  const hasValidCoordinates = effectiveGBPLocation &&
    effectiveGBPLocation.lat !== 0 && effectiveGBPLocation.lng !== 0;

  const [currentStep, setCurrentStep] = useState<WizardStep>('location');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [radiusMiles, setRadiusMiles] = useState(3);
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

    const configData: SaveConfigData = {
      configId, // Pass configId for editing existing configs
      googleBusinessLocationId: selectedLocation.id,
      centerLat: selectedLocation.lat,
      centerLng: selectedLocation.lng,
      radiusMiles,
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
                  {availableLocations?.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.address ? `- ${loc.address}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {effectiveGBPLocation ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{effectiveGBPLocation.name}</p>
                    {effectiveGBPLocation.address && (
                      <p className="text-sm text-gray-500">{effectiveGBPLocation.address}</p>
                    )}
                    <p className="text-xs text-gray-400">Connected via Google Business Profile</p>
                  </div>
                </div>
              </div>
            ) : hasMultipleLocations ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Select a business location above to continue.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No Google Business Profile connected.{' '}
                  <Link href="/dashboard/google-business" className="underline font-medium">
                    Connect one
                  </Link>{' '}
                  or enter coordinates manually below.
                </p>
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

            {/* Radius Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius (miles)
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
              <p className="mt-2 text-sm text-gray-500">
                Searches will be performed at the center and 4 cardinal points within this radius.
              </p>
            </div>

            {/* Grid Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Grid Points Preview</h4>
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
              </div>
              <p className="text-center text-sm text-gray-500 mt-3">
                5 check points within {radiusMiles} mile radius
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
                <span className="text-gray-600">Search Radius</span>
                <span className="font-medium text-gray-900">{radiusMiles} miles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check Points</span>
                <span className="font-medium text-gray-900">5 (center + N/S/E/W)</span>
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Set Up Local Ranking Grid</h2>

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
