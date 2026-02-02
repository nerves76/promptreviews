"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import Icon from "@/components/Icon";

interface GbpLocation {
  locationId: string;
  locationName: string;
  address: string | null;
}

interface GbpStatusResponse {
  connected: boolean;
  googleEmail?: string;
  locations: GbpLocation[];
}

interface GbpLocationPickerProps {
  onFetchReviews: (locationId: string, locationName: string) => void;
  disabled?: boolean;
}

export default function GbpLocationPicker({ onFetchReviews, disabled }: GbpLocationPickerProps) {
  const { selectedAccountId } = useAccountData();
  const [status, setStatus] = useState<GbpStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const [fetchLocationsError, setFetchLocationsError] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await apiClient.get<GbpStatusResponse>("/review-import/gbp-status");
        setStatus(response);
        if (response.locations.length === 1) {
          setSelectedLocationId(response.locations[0].locationId);
        }
      } catch (err) {
        console.error("[GbpLocationPicker] Failed to check GBP status:", err);
        setError("Failed to check Google Business Profile status.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      setError("Missing Google OAuth configuration. Please contact support.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    const scope = "https://www.googleapis.com/auth/business.manage openid email profile";
    const statePayload = {
      platform: "google-business-profile",
      returnUrl: "/dashboard/review-import",
      accountId: selectedAccountId,
    };
    const state = encodeURIComponent(JSON.stringify(statePayload));
    const encodedScope = encodeURIComponent(scope);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodedScope}&response_type=code&state=${state}&access_type=offline&prompt=select_account%20consent&include_granted_scopes=false`;

    setTimeout(() => {
      window.location.href = googleAuthUrl;
    }, 100);
  };

  const handleFetchLocations = async () => {
    setIsFetchingLocations(true);
    setFetchLocationsError(null);

    try {
      const result = await apiClient.post<{
        success: boolean;
        locations: { location_id: string; location_name: string; address: string }[];
        message?: string;
        error?: string;
      }>("/social-posting/platforms/google-business-profile/fetch-locations", { force: true });

      if (!result.success) {
        setFetchLocationsError(result.message || result.error || "Failed to fetch locations.");
        return;
      }

      if (result.locations.length === 0) {
        setFetchLocationsError("No business locations found in your Google account. Make sure your Google account manages locations at business.google.com.");
        return;
      }

      // Update status with fetched locations
      const mappedLocations = result.locations.map((loc) => ({
        locationId: loc.location_id,
        locationName: loc.location_name,
        address: loc.address,
      }));

      setStatus((prev) => prev ? { ...prev, locations: mappedLocations } : prev);

      if (mappedLocations.length === 1) {
        setSelectedLocationId(mappedLocations[0].locationId);
      }
    } catch (err: any) {
      console.error("[GbpLocationPicker] Failed to fetch locations:", err);
      setFetchLocationsError(err.message || "Failed to fetch locations from Google.");
    } finally {
      setIsFetchingLocations(false);
    }
  };

  const handleFetchReviews = () => {
    if (!selectedLocationId || !status) return;
    const location = status.locations.find((l) => l.locationId === selectedLocationId);
    if (location) {
      onFetchReviews(location.locationId, location.locationName);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-3">
        <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
        <span className="text-sm">Checking Google Business Profile connection...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  // Not connected — match GoogleBusinessConnection design
  if (!status?.connected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#4285F4" }}
          >
            <Icon name="FaGoogle" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Google Business Profile</h3>
            <p className="text-sm text-gray-600">Import and manage your Google reviews</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
          <p className="text-sm text-gray-700 mb-3">
            Connect your Google Business Profile to access your reviews directly.
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-center space-x-2">
              <Icon name="FaCheck" className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span>Import reviews from Google for free</span>
            </li>
            <li className="flex items-center space-x-2">
              <Icon name="FaCheck" className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span>Respond to reviews directly</span>
            </li>
            <li className="flex items-center space-x-2">
              <Icon name="FaCheck" className="w-3 h-3 text-green-500 flex-shrink-0" />
              <span>Post updates to Google Search and Maps</span>
            </li>
          </ul>
        </div>

        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`px-4 py-2 text-white rounded-md transition-colors text-sm font-medium flex items-center space-x-2 whitespace-nowrap ${
            isConnecting ? "bg-blue-300 cursor-not-allowed" : "bg-[#4285F4] hover:bg-[#3367D6]"
          }`}
        >
          {isConnecting ? (
            <>
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Icon name="FaGoogle" className="w-4 h-4" />
              <span>Connect Google Business Profile</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Connected but no locations saved — offer to fetch them inline
  if (status.locations.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#4285F4" }}
            >
              <Icon name="FaGoogle" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Google Business Profile</h3>
              <p className="text-sm text-gray-600">Import and manage your Google reviews</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
            <Icon name="FaCheck" className="w-3 h-3 mr-1" />
            Connected
          </span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex items-center space-x-2 mb-1">
            <Icon name="FaCheck" className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-900">
              Connected{status.googleEmail ? ` as ${status.googleEmail}` : ""}
            </span>
          </div>
          <p className="text-sm text-blue-700">
            Fetch your business locations from Google to start importing reviews.
          </p>
        </div>

        {fetchLocationsError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 flex items-start space-x-2">
            <Icon name="FaExclamationTriangle" className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{fetchLocationsError}</p>
          </div>
        )}

        {isFetchingLocations && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center space-x-3">
              <Icon name="FaSpinner" className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Fetching business locations...</h4>
                <p className="text-xs text-blue-700 mt-1">
                  This may take a moment due to Google API rate limits.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleFetchLocations}
          disabled={isFetchingLocations}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 whitespace-nowrap ${
            isFetchingLocations
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-slate-blue text-white hover:bg-slate-blue/90"
          }`}
        >
          {isFetchingLocations ? (
            <>
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <span>Fetch business locations</span>
          )}
        </button>
      </div>
    );
  }

  // Connected with locations
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="gbp-location-select">
          Location
        </label>
        <select
          id="gbp-location-select"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-blue focus:outline-none"
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
          disabled={disabled}
        >
          {status.locations.length > 1 && <option value="">Select a location...</option>}
          {status.locations.map((loc) => (
            <option key={loc.locationId} value={loc.locationId}>
              {loc.locationName}
              {loc.address ? ` — ${loc.address}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleFetchReviews}
          disabled={!selectedLocationId || disabled}
          className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <Icon name="FaSearch" size={14} />
          Fetch reviews
        </button>
        <span className="text-sm text-green-700 font-medium">
          <Icon name="FaCheckCircle" size={12} className="inline mr-1" />
          Free — no credits needed
        </span>
      </div>
    </div>
  );
}
