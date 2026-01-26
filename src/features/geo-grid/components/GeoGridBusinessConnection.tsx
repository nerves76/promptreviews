/**
 * GeoGridBusinessConnection Component
 *
 * Displays current target business info and allows reconnecting/updating
 * the Google Place ID if the business has changed.
 */

'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/utils/apiClient';
import { GGConfig } from '../utils/types';
import {
  BuildingStorefrontIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface GeoGridBusinessConnectionProps {
  config: GGConfig;
  onUpdated?: () => void;
}

interface SearchResult {
  name: string;
  placeId: string;
  address: string;
  rating?: number;
  reviewCount?: number;
}

export function GeoGridBusinessConnection({
  config,
  onUpdated,
}: GeoGridBusinessConnectionProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search for businesses
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await apiClient.post<{
        success: boolean;
        businessName?: string;
        placeId?: string;
        coordinates?: { lat: number; lng: number };
        formattedAddress?: string;
        rating?: number;
        reviewCount?: number;
        otherResults?: SearchResult[];
        error?: string;
      }>('/geo-grid/search-business', {
        businessName: searchQuery,
        lat: config.centerLat,
        lng: config.centerLng,
      });

      if (response.success) {
        const results: SearchResult[] = [];

        // Add primary result
        if (response.placeId) {
          results.push({
            name: response.businessName || searchQuery,
            placeId: response.placeId,
            address: response.formattedAddress || '',
            rating: response.rating,
            reviewCount: response.reviewCount,
          });
        }

        // Add other results
        if (response.otherResults) {
          results.push(...response.otherResults);
        }

        setSearchResults(results);

        if (results.length === 0) {
          setError('No businesses found. Try a different search term.');
        }
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, config.centerLat, config.centerLng]);

  // Update the config with a new Place ID
  const handleSelectBusiness = useCallback(async (result: SearchResult) => {
    setIsUpdating(true);
    setError(null);

    try {
      await apiClient.post('/geo-grid/config', {
        configId: config.id,
        targetPlaceId: result.placeId,
      });

      setSuccessMessage(`Connected to "${result.name}"`);
      setShowSearch(false);
      setSearchResults([]);
      setSearchQuery('');
      onUpdated?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsUpdating(false);
    }
  }, [config.id, onUpdated]);

  const hasPlaceId = !!config.targetPlaceId;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BuildingStorefrontIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Target business</h3>
      </div>

      {/* Current Status */}
      <div className={`p-4 rounded-lg mb-4 ${hasPlaceId ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-start gap-3">
          {hasPlaceId ? (
            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            {hasPlaceId ? (
              <>
                <p className="text-sm font-medium text-green-800">Business connected</p>
                <p className="text-xs text-green-700 mt-1 font-mono truncate" title={config.targetPlaceId || ''}>
                  Place ID: {config.targetPlaceId}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-amber-800">No business connected</p>
                <p className="text-xs text-amber-700 mt-1">
                  Search for your business below to enable rank tracking.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" />
            {successMessage}
          </p>
        </div>
      )}

      {/* Search Toggle */}
      {!showSearch ? (
        <button
          onClick={() => setShowSearch(true)}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <ArrowPathIcon className="w-4 h-4" />
          {hasPlaceId ? 'Reconnect business' : 'Search for business'}
        </button>
      ) : (
        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for your business
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter business name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4" />
                )}
                Search
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Search near your grid center ({config.centerLat.toFixed(4)}, {config.centerLng.toFixed(4)})
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Select your business:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={result.placeId || index}
                    onClick={() => handleSelectBusiness(result)}
                    disabled={isUpdating}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${
                      result.placeId === config.targetPlaceId
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                    } disabled:opacity-50`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{result.name}</p>
                        <p className="text-sm text-gray-500 truncate">{result.address}</p>
                        {result.rating && (
                          <p className="text-xs text-gray-500 mt-1">
                            ★ {result.rating.toFixed(1)}
                            {result.reviewCount && ` (${result.reviewCount} reviews)`}
                          </p>
                        )}
                      </div>
                      {result.placeId === config.targetPlaceId && (
                        <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded whitespace-nowrap ml-2">
                          Current
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchResults([]);
              setSearchQuery('');
              setError(null);
            }}
            className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Help Text */}
      {hasPlaceId && !showSearch && (
        <p className="mt-3 text-xs text-gray-500">
          If your business name changed in Google, click "Reconnect business" to search for and update your Google Place ID.
        </p>
      )}
    </div>
  );
}

export default GeoGridBusinessConnection;
