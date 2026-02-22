/**
 * GeoGridGoogleMap Component
 *
 * Google Maps overlay showing rank check results as markers.
 * Color-coded markers indicate ranking position at each grid point.
 */

'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { GGCheckResult, CheckPoint, PositionBucket } from '../utils/types';

// ============================================
// Types
// ============================================

export interface ViewAsBusiness {
  placeId: string;
  name: string;
  isOwnBusiness: boolean;
}

interface GeoGridGoogleMapProps {
  /** Check results to display */
  results: GGCheckResult[];
  /** Center point coordinates */
  center: {
    lat: number;
    lng: number;
  };
  /** Radius in miles */
  radiusMiles: number;
  /** Selected keyword ID to filter by */
  selectedKeywordId?: string;
  /** Height of the map container */
  height?: string;
  /** Callback when a marker is clicked */
  onMarkerClick?: (point: CheckPoint, result: GGCheckResult) => void;
  /** View the grid from a specific business's perspective */
  viewAs?: ViewAsBusiness | null;
  /** Show as preview (neutral blue markers, no rank data) */
  isPreview?: boolean;
}

interface PointData {
  point: CheckPoint;
  lat: number;
  lng: number;
  bucket: PositionBucket;
  position: number | null;
  result: GGCheckResult | null;
}

// ============================================
// Constants
// ============================================

const BUCKET_COLORS: Record<PositionBucket, string> = {
  top3: '#22c55e',    // green-500
  top10: '#2E4A7D',   // slate-blue (brand primary)
  top20: '#f97316',   // orange-500
  none: '#ef4444',    // red-500
};

const BUCKET_LABELS: Record<PositionBucket, string> = {
  top3: 'Top 3',
  top10: 'Top 10',
  top20: 'Top 20',
  none: 'Not Found',
};

// Map legacy check points to their position relative to center
// Offset in miles for each direction (as multiplier of radius)
const LEGACY_POINT_OFFSETS: Record<string, { latOffset: number; lngOffset: number }> = {
  center: { latOffset: 0, lngOffset: 0 },
  n: { latOffset: 1, lngOffset: 0 },
  s: { latOffset: -1, lngOffset: 0 },
  e: { latOffset: 0, lngOffset: 1 },
  w: { latOffset: 0, lngOffset: -1 },
  ne: { latOffset: 0.707, lngOffset: 0.707 },
  nw: { latOffset: 0.707, lngOffset: -0.707 },
  se: { latOffset: -0.707, lngOffset: 0.707 },
  sw: { latOffset: -0.707, lngOffset: -0.707 },
};

/**
 * Get offsets for a Cartesian point (r{row}c{col})
 * Returns offsets normalized to -1 to 1 range
 */
function getCartesianOffsets(
  point: CheckPoint,
  gridDimension: number
): { latOffset: number; lngOffset: number } | null {
  const match = point.match(/^r(\d+)c(\d+)$/);
  if (!match) return null;

  const row = parseInt(match[1], 10);
  const col = parseInt(match[2], 10);
  const halfGrid = (gridDimension - 1) / 2;

  // Row 0 is north (positive lat), increases going south
  // Col 0 is west (negative lng), increases going east
  return {
    latOffset: (halfGrid - row) / halfGrid, // Normalized to -1 to 1
    lngOffset: (col - halfGrid) / halfGrid, // Normalized to -1 to 1
  };
}

// Approximate conversion: 1 degree latitude ≈ 69 miles
const MILES_PER_LAT_DEGREE = 69;

// ============================================
// Helper Functions
// ============================================

/**
 * Convert miles to degrees at a given latitude
 */
function milesToDegrees(miles: number, latitude: number): { lat: number; lng: number } {
  const latDegrees = miles / MILES_PER_LAT_DEGREE;
  // Longitude degrees vary by latitude
  const lngDegrees = miles / (MILES_PER_LAT_DEGREE * Math.cos(latitude * (Math.PI / 180)));
  return { lat: latDegrees, lng: lngDegrees };
}

/**
 * Calculate actual lat/lng for a check point based on center and radius
 */
function getPointCoordinates(
  centerLat: number,
  centerLng: number,
  radiusMiles: number,
  point: CheckPoint,
  gridDimension: number = 3
): { lat: number; lng: number } {
  // Try legacy offsets first
  const legacyOffsets = LEGACY_POINT_OFFSETS[point];
  if (legacyOffsets) {
    const degrees = milesToDegrees(radiusMiles, centerLat);
    return {
      lat: centerLat + (legacyOffsets.latOffset * degrees.lat),
      lng: centerLng + (legacyOffsets.lngOffset * degrees.lng),
    };
  }

  // Try Cartesian offsets
  const cartesianOffsets = getCartesianOffsets(point, gridDimension);
  if (cartesianOffsets) {
    const degrees = milesToDegrees(radiusMiles, centerLat);
    return {
      lat: centerLat + (cartesianOffsets.latOffset * degrees.lat),
      lng: centerLng + (cartesianOffsets.lngOffset * degrees.lng),
    };
  }

  // Fallback to center if point type not recognized
  return { lat: centerLat, lng: centerLng };
}

/**
 * Convert position to bucket
 */
function positionToBucketLocal(position: number | null): PositionBucket {
  if (position === null || position <= 0) return 'none';
  if (position <= 3) return 'top3';
  if (position <= 10) return 'top10';
  if (position <= 20) return 'top20';
  return 'none';
}

/**
 * Calculate point data from results
 */
function calculatePointData(
  results: GGCheckResult[],
  center: { lat: number; lng: number },
  radiusMiles: number,
  selectedKeywordId?: string,
  viewAs?: ViewAsBusiness | null
): PointData[] {
  const filteredResults = selectedKeywordId
    ? results.filter((r) => r.keywordId === selectedKeywordId)
    : results;

  // Group by check point
  const grouped = new Map<CheckPoint, GGCheckResult[]>();
  for (const result of filteredResults) {
    const existing = grouped.get(result.checkPoint) || [];
    existing.push(result);
    grouped.set(result.checkPoint, existing);
  }

  // Determine which points to show based on results
  // Get unique checkPoints from results, fall back to 5-point grid if no results
  const uniquePoints = new Set<CheckPoint>();
  for (const result of results) {
    uniquePoints.add(result.checkPoint);
  }

  // If we have results, use points from results; otherwise default to 5-point
  const allPoints: CheckPoint[] = uniquePoints.size > 0
    ? Array.from(uniquePoints)
    : ['center', 'n', 's', 'e', 'w'];

  // Determine grid dimension for Cartesian calculations
  const gridDimension = Math.sqrt(allPoints.length);

  return allPoints.map((point) => {
    const pointResults = grouped.get(point) || [];

    // Use coordinates from results if available, otherwise calculate
    let coords: { lat: number; lng: number };
    if (pointResults.length > 0 && pointResults[0].pointLat && pointResults[0].pointLng) {
      coords = { lat: pointResults[0].pointLat, lng: pointResults[0].pointLng };
    } else {
      coords = getPointCoordinates(center.lat, center.lng, radiusMiles, point, gridDimension);
    }

    // If viewing as a competitor (not own business), find their position in topCompetitors
    // Match by placeId first, then fall back to name match for chains with multiple locations
    if (viewAs && !viewAs.isOwnBusiness) {
      let competitorPosition: number | null = null;
      let competitorResult: GGCheckResult | null = null;
      let hasCheckData = pointResults.length > 0; // We have check data for this point
      const viewAsNameLower = viewAs.name.toLowerCase();

      for (const result of pointResults) {
        // First try exact placeId match
        let competitor = result.topCompetitors.find(
          (c) => c.placeId === viewAs.placeId
        );
        // Fall back to name match for chains with multiple locations
        if (!competitor) {
          competitor = result.topCompetitors.find(
            (c) => c.name.toLowerCase() === viewAsNameLower
          );
        }
        if (competitor) {
          // Use best (lowest) position if multiple results
          if (competitorPosition === null || competitor.position < competitorPosition) {
            competitorPosition = competitor.position;
            competitorResult = result;
          }
        }
        // Even if not found in competitors, we still have check data
        if (!competitorResult) {
          competitorResult = result;
        }
      }

      // If we have check data but competitor not found, show as "none" (red)
      return {
        point,
        lat: coords.lat,
        lng: coords.lng,
        bucket: competitorPosition !== null ? positionToBucketLocal(competitorPosition) : 'none',
        position: competitorPosition, // null means not found in top 20 results
        result: competitorResult, // Set to indicate we have check data
      };
    }

    // Default: show own business rankings
    // Get best result for this point (if multiple keywords, use the best ranking)
    let bestBucket: PositionBucket = 'none';
    let bestPosition: number | null = null;
    let bestResult: GGCheckResult | null = null;

    for (const result of pointResults) {
      if (
        (bestBucket === 'none' && result.positionBucket !== 'none') ||
        (result.positionBucket === 'top3' && bestBucket !== 'top3') ||
        (result.positionBucket === 'top10' && bestBucket === 'top20') ||
        (result.positionBucket === 'top10' && bestBucket === 'none')
      ) {
        bestBucket = result.positionBucket;
        bestPosition = result.position;
        bestResult = result;
      }
    }

    // If showing single keyword, use exact values
    if (selectedKeywordId && pointResults.length === 1) {
      bestBucket = pointResults[0].positionBucket;
      bestPosition = pointResults[0].position;
      bestResult = pointResults[0];
    }

    return {
      point,
      lat: coords.lat,
      lng: coords.lng,
      bucket: bestBucket,
      position: bestPosition,
      result: bestResult,
    };
  });
}

// ============================================
// Component
// ============================================

// Helper to check if coordinates are valid (not 0,0 or NaN)
function isValidCoordinates(lat: number, lng: number): boolean {
  // Check for NaN, undefined, or null
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  // Check for default/invalid (0, 0) - this is in the ocean
  if (lat === 0 && lng === 0) {
    return false;
  }
  // Check for valid lat/lng ranges
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return false;
  }
  return true;
}

export function GeoGridGoogleMap({
  results,
  center,
  radiusMiles,
  selectedKeywordId,
  height = '400px',
  onMarkerClick,
  viewAs,
  isPreview = false,
}: GeoGridGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Validate coordinates early
  const hasValidCoordinates = isValidCoordinates(center.lat, center.lng);

  const pointData = useMemo(
    () => calculatePointData(results, center, radiusMiles, selectedKeywordId, viewAs),
    [results, center, radiusMiles, selectedKeywordId, viewAs]
  );

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadError('Google Maps API key not configured');
      return;
    }

    // Set API options
    setOptions({
      key: apiKey,
      v: 'weekly',
    });

    // Load maps and marker libraries (AdvancedMarkerElement replaces deprecated Marker)
    Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
    ])
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err: Error) => {
        console.error('Google Maps load error:', err);
        setLoadError('Failed to load Google Maps');
      });
  }, []);

  // Create/update map and markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    // Create map if not exists
    if (!mapInstanceRef.current) {
      // Try to use Map ID from env, fall back to basic map if not available
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: 12,
        ...(mapId ? { mapId } : {}),
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Wait for map tiles to load, then mark as ready
      google.maps.event.addListenerOnce(mapInstanceRef.current, 'tilesloaded', () => {
        setIsMapReady(true);
      });
    } else {
      // Update center
      mapInstanceRef.current.setCenter({ lat: center.lat, lng: center.lng });
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    // Clear existing circle
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // Add radius circle
    circleRef.current = new google.maps.Circle({
      map,
      center: { lat: center.lat, lng: center.lng },
      radius: radiusMiles * 1609.34, // Convert miles to meters
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.3,
      strokeWeight: 2,
    });

    // Add markers for each point
    pointData.forEach((data) => {
      const hasData = data.result !== null;

      // For preview mode, use blue neutral color; otherwise use bucket colors
      let color: string;
      if (isPreview) {
        color = '#3b82f6'; // blue-500 - neutral preview color
      } else if (hasData) {
        color = BUCKET_COLORS[data.bucket];
      } else {
        color = '#9ca3af'; // gray
      }

      // Build title/tooltip
      let markerTitle: string;
      if (isPreview) {
        markerTitle = `${data.point.toUpperCase()}: Check point`;
      } else if (hasData) {
        if (data.position !== null) {
          markerTitle = `${data.point.toUpperCase()}: ${BUCKET_LABELS[data.bucket]} (#${data.position})`;
        } else if (viewAs && !viewAs.isOwnBusiness) {
          markerTitle = `${data.point.toUpperCase()}: Not in top 10 stored competitors`;
        } else {
          markerTitle = `${data.point.toUpperCase()}: ${BUCKET_LABELS[data.bucket]}`;
        }
      } else {
        markerTitle = `${data.point.toUpperCase()}: No data`;
      }

      // Build label text
      let labelText: string;
      if (isPreview) {
        // For preview, show the point label (N, S, E, W, NE, etc.)
        labelText = data.point === 'center' ? '●' : data.point.toUpperCase();
      } else if (data.position !== null) {
        labelText = String(data.position);
      } else if (hasData && viewAs && !viewAs.isOwnBusiness) {
        labelText = '>20';
      } else {
        labelText = '?';
      }

      // Use AdvancedMarkerElement (replaces deprecated google.maps.Marker)
      const markerContent = document.createElement('div');
      markerContent.className = 'geo-grid-marker';
      const showOpacity = !hasData && !isPreview; // Don't dim preview markers
      markerContent.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: ${hasData && !isPreview ? 'pointer' : 'default'};
        font-weight: bold;
        font-size: ${labelText === '>20' ? '10px' : (labelText.length > 1 ? '10px' : '12px')};
        color: white;
        transition: transform 0.2s;
        ${showOpacity ? 'opacity: 0.5;' : ''}
      `;
      markerContent.textContent = labelText;

      // Add hover effect
      markerContent.addEventListener('mouseenter', () => {
        markerContent.style.transform = 'scale(1.2)';
      });
      markerContent.addEventListener('mouseleave', () => {
        markerContent.style.transform = 'scale(1)';
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: data.lat, lng: data.lng },
        content: markerContent,
        title: markerTitle,
      });

      // Add click handler
      if (hasData && data.result && onMarkerClick && !isPreview) {
        marker.addListener('click', () => {
          onMarkerClick(data.point, data.result!);
        });
      }

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers with padding
    const bounds = new google.maps.LatLngBounds();
    pointData.forEach((data) => {
      bounds.extend({ lat: data.lat, lng: data.lng });
    });
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

  }, [isLoaded, center, radiusMiles, pointData, onMarkerClick, viewAs, isPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, []);

  // Error state for invalid coordinates
  if (!hasValidCoordinates) {
    return (
      <div className="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
        <div className="p-6 text-center" style={{ minHeight: height }}>
          <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Location coordinates missing
            </h3>
            <p className="text-gray-600 mb-4 max-w-md">
              Your business location doesn&apos;t have valid coordinates. This usually happens when the Google Business Profile connection didn&apos;t include location data.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md">
              <p className="text-sm text-amber-800">
                <strong>To fix this:</strong> Go to Settings and use the &quot;Search for business&quot; feature to find your business and set up proper coordinates.
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Current coordinates: ({center.lat}, {center.lng})
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback grid view when Google Maps API isn't available
  if (loadError) {
    // Create a simple 3x3 grid layout for the results
    const gridLayout: (CheckPoint | null)[][] = [
      ['nw', 'n', 'ne'],
      ['w', 'center', 'e'],
      ['sw', 's', 'se'],
    ];

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="p-4" style={{ minHeight: height }}>
          {/* Simple grid visualization */}
          <div className="max-w-md mx-auto">
            <div className="grid grid-cols-3 gap-2">
              {gridLayout.flat().map((point) => {
                if (!point) return <div key="empty" />;
                const data = pointData.find(p => p.point === point);
                const hasData = data?.result !== null;
                const color = hasData ? BUCKET_COLORS[data?.bucket || 'none'] : '#d1d5db';
                const position = data?.position;

                return (
                  <div
                    key={point}
                    className="aspect-square rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (data?.result && onMarkerClick) {
                        onMarkerClick(point, data.result);
                      }
                    }}
                    title={`${point.toUpperCase()}: ${position !== null ? `#${position}` : 'No data'}`}
                  >
                    {position !== null && position !== undefined ? (position > 20 ? '>20' : position) : '—'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {viewAs && !viewAs.isOwnBusiness && (
            <div className="text-center mb-2">
              <p className="text-sm font-medium text-blue-600">
                Viewing as: {viewAs.name}
              </p>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-4">
            {(Object.entries(BUCKET_COLORS) as [PositionBucket, string][]).map(([bucket, color]) => (
              <div key={bucket} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">{BUCKET_LABELS[bucket]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Map Container - always rendered at full size */}
      <div className="relative" style={{ height }}>
        {/* Actual map div - always present but hidden until ready */}
        <div
          ref={mapRef}
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: isMapReady ? 1 : 0 }}
        />
        {/* Loading overlay - show until map tiles are loaded */}
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        {isPreview ? (
          <p className="text-center text-xs text-gray-500">
            Blue markers show where rank checks will be performed
          </p>
        ) : (
          <>
            {viewAs && !viewAs.isOwnBusiness && (
              <div className="text-center mb-2">
                <p className="text-sm font-medium text-blue-600">
                  Viewing as: {viewAs.name}
                </p>
                <p className="text-xs text-gray-500">
                  &quot;&gt;20&quot; = not found in top 20 results at that point
                </p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              {(Object.entries(BUCKET_COLORS) as [PositionBucket, string][]).map(([bucket, color]) => (
                <div key={bucket} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-600">{BUCKET_LABELS[bucket]}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="text-center text-xs text-gray-500 mt-2">
          {radiusMiles} mile radius from business location
        </p>
      </div>
    </div>
  );
}

export default GeoGridGoogleMap;
