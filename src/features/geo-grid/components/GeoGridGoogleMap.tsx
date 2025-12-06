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
  top10: '#eab308',   // yellow-500
  top20: '#f97316',   // orange-500
  none: '#ef4444',    // red-500
};

const BUCKET_LABELS: Record<PositionBucket, string> = {
  top3: 'Top 3',
  top10: 'Top 10',
  top20: 'Top 20',
  none: 'Not Found',
};

// Map check points to their position relative to center
// Offset in miles for each direction
const POINT_OFFSETS: Record<CheckPoint, { latOffset: number; lngOffset: number }> = {
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
  point: CheckPoint
): { lat: number; lng: number } {
  const offsets = POINT_OFFSETS[point];
  const degrees = milesToDegrees(radiusMiles, centerLat);

  return {
    lat: centerLat + (offsets.latOffset * degrees.lat),
    lng: centerLng + (offsets.lngOffset * degrees.lng),
  };
}

/**
 * Calculate point data from results
 */
function calculatePointData(
  results: GGCheckResult[],
  center: { lat: number; lng: number },
  radiusMiles: number,
  selectedKeywordId?: string
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

  const allPoints: CheckPoint[] = ['center', 'n', 's', 'e', 'w'];

  return allPoints.map((point) => {
    const pointResults = grouped.get(point) || [];
    const coords = getPointCoordinates(center.lat, center.lng, radiusMiles, point);

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

export function GeoGridGoogleMap({
  results,
  center,
  radiusMiles,
  selectedKeywordId,
  height = '400px',
  onMarkerClick,
}: GeoGridGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pointData = useMemo(
    () => calculatePointData(results, center, radiusMiles, selectedKeywordId),
    [results, center, radiusMiles, selectedKeywordId]
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

    // Load required libraries
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
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: 12,
        mapId: 'geo-grid-map',
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
      const color = hasData ? BUCKET_COLORS[data.bucket] : '#9ca3af';

      // Create custom marker content
      const markerContent = document.createElement('div');
      markerContent.className = 'geo-grid-marker';
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
        cursor: ${hasData ? 'pointer' : 'default'};
        font-weight: bold;
        font-size: 12px;
        color: white;
        transition: transform 0.2s;
      `;

      // Show position number if found
      if (data.position !== null) {
        markerContent.textContent = String(data.position);
      } else if (!hasData) {
        markerContent.textContent = '?';
        markerContent.style.opacity = '0.5';
      }

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
        title: hasData
          ? `${data.point.toUpperCase()}: ${BUCKET_LABELS[data.bucket]}${data.position ? ` (#${data.position})` : ''}`
          : `${data.point.toUpperCase()}: No data`,
      });

      // Add click handler
      if (hasData && data.result && onMarkerClick) {
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

  }, [isLoaded, center, radiusMiles, pointData, onMarkerClick]);

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

  if (loadError) {
    return (
      <div
        className="bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <p className="font-medium">{loadError}</p>
          <p className="text-sm mt-1">Please check your configuration</p>
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
        <p className="text-center text-xs text-gray-500 mt-2">
          {radiusMiles} mile radius from business location
        </p>
      </div>
    </div>
  );
}

export default GeoGridGoogleMap;
