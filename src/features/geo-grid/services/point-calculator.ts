/**
 * Geo Grid Point Calculator
 *
 * Calculates geographic check points around a center location.
 * Used to create a grid of points for rank checking.
 */

import { CheckPoint, GeoPoint, DEFAULT_CHECK_POINTS } from '../utils/types';

// ============================================
// Constants
// ============================================

// Earth's radius in miles
const EARTH_RADIUS_MILES = 3958.8;

// Degrees to radians conversion
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculate a destination point given a starting point, bearing, and distance
 *
 * Uses the Haversine formula to calculate the destination point.
 *
 * @param lat - Starting latitude in degrees
 * @param lng - Starting longitude in degrees
 * @param distanceMiles - Distance to travel in miles
 * @param bearingDegrees - Bearing in degrees (0 = North, 90 = East, 180 = South, 270 = West)
 * @returns Destination point {lat, lng}
 */
export function calculateDestinationPoint(
  lat: number,
  lng: number,
  distanceMiles: number,
  bearingDegrees: number
): { lat: number; lng: number } {
  const latRad = lat * DEG_TO_RAD;
  const lngRad = lng * DEG_TO_RAD;
  const bearingRad = bearingDegrees * DEG_TO_RAD;
  const angularDistance = distanceMiles / EARTH_RADIUS_MILES;

  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const destLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(destLatRad)
    );

  return {
    lat: destLatRad * RAD_TO_DEG,
    lng: destLngRad * RAD_TO_DEG,
  };
}

/**
 * Get the bearing (direction) for a check point
 *
 * @param point - The check point identifier
 * @returns Bearing in degrees (0-360)
 */
export function getBearingForPoint(point: CheckPoint): number | null {
  const bearings: Record<CheckPoint, number | null> = {
    center: null, // No bearing needed for center
    n: 0,
    ne: 45,
    e: 90,
    se: 135,
    s: 180,
    sw: 225,
    w: 270,
    nw: 315,
  };

  return bearings[point];
}

/**
 * Get human-readable label for a check point
 */
export function getPointLabel(point: CheckPoint): string {
  const labels: Record<CheckPoint, string> = {
    center: 'Center',
    n: 'North',
    ne: 'Northeast',
    e: 'East',
    se: 'Southeast',
    s: 'South',
    sw: 'Southwest',
    w: 'West',
    nw: 'Northwest',
  };

  return labels[point];
}

// ============================================
// Grid Generation
// ============================================

export interface GridConfig {
  centerLat: number;
  centerLng: number;
  radiusMiles: number;
  points?: CheckPoint[];
}

/**
 * Calculate all geo points for a grid configuration
 *
 * @param config - Grid configuration with center and radius
 * @returns Array of GeoPoints with coordinates and labels
 */
export function calculateGridPoints(config: GridConfig): GeoPoint[] {
  const { centerLat, centerLng, radiusMiles, points = DEFAULT_CHECK_POINTS } = config;

  const geoPoints: GeoPoint[] = [];

  for (const point of points) {
    if (point === 'center') {
      geoPoints.push({
        lat: centerLat,
        lng: centerLng,
        label: 'center',
      });
    } else {
      const bearing = getBearingForPoint(point);
      if (bearing !== null) {
        const dest = calculateDestinationPoint(centerLat, centerLng, radiusMiles, bearing);
        geoPoints.push({
          lat: dest.lat,
          lng: dest.lng,
          label: point,
        });
      }
    }
  }

  return geoPoints;
}

/**
 * Calculate distance between two points using Haversine formula
 *
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const lat1Rad = lat1 * DEG_TO_RAD;
  const lat2Rad = lat2 * DEG_TO_RAD;
  const deltaLatRad = (lat2 - lat1) * DEG_TO_RAD;
  const deltaLngRad = (lng2 - lng1) * DEG_TO_RAD;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

// ============================================
// Validation
// ============================================

/**
 * Validate that coordinates are within valid ranges
 */
export function validateCoordinates(lat: number, lng: number): { valid: boolean; error?: string } {
  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90 degrees' };
  }

  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180 degrees' };
  }

  return { valid: true };
}

/**
 * Validate radius is reasonable
 */
export function validateRadius(radiusMiles: number): { valid: boolean; error?: string } {
  if (radiusMiles <= 0) {
    return { valid: false, error: 'Radius must be greater than 0' };
  }

  if (radiusMiles > 50) {
    return { valid: false, error: 'Radius cannot exceed 50 miles' };
  }

  return { valid: true };
}

/**
 * Validate check points array
 */
export function validateCheckPoints(points: CheckPoint[]): { valid: boolean; error?: string } {
  if (!points || points.length === 0) {
    return { valid: false, error: 'At least one check point is required' };
  }

  const validPoints: CheckPoint[] = ['center', 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  for (const point of points) {
    if (!validPoints.includes(point)) {
      return { valid: false, error: `Invalid check point: ${point}` };
    }
  }

  // Check for duplicates
  const uniquePoints = new Set(points);
  if (uniquePoints.size !== points.length) {
    return { valid: false, error: 'Duplicate check points are not allowed' };
  }

  return { valid: true };
}

/**
 * Validate entire grid configuration
 */
export function validateGridConfig(config: GridConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const coordValidation = validateCoordinates(config.centerLat, config.centerLng);
  if (!coordValidation.valid) {
    errors.push(coordValidation.error!);
  }

  const radiusValidation = validateRadius(config.radiusMiles);
  if (!radiusValidation.valid) {
    errors.push(radiusValidation.error!);
  }

  if (config.points) {
    const pointsValidation = validateCheckPoints(config.points);
    if (!pointsValidation.valid) {
      errors.push(pointsValidation.error!);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// Exports
// ============================================

export const pointCalculator = {
  calculateDestinationPoint,
  calculateGridPoints,
  calculateDistance,
  getBearingForPoint,
  getPointLabel,
  validateCoordinates,
  validateRadius,
  validateCheckPoints,
  validateGridConfig,
};

export default pointCalculator;
