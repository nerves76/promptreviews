/**
 * Geo Grid Point Calculator
 *
 * Calculates geographic check points around a center location.
 * Used to create a grid of points for rank checking.
 */

import {
  CheckPoint,
  GeoPoint,
  DEFAULT_CHECK_POINTS,
  LEGACY_CHECK_POINTS,
  LegacyCheckPoint,
  usesCartesianNotation,
  isCartesianPoint,
  getGridSizeOption,
} from '../utils/types';

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
 * Get the bearing (direction) for a legacy check point
 *
 * @param point - The check point identifier (legacy compass notation)
 * @returns Bearing in degrees (0-360), or null for center/unknown
 */
export function getBearingForPoint(point: CheckPoint): number | null {
  const bearings: Record<LegacyCheckPoint, number | null> = {
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

  // Only works for legacy points
  if (LEGACY_CHECK_POINTS.includes(point as LegacyCheckPoint)) {
    return bearings[point as LegacyCheckPoint];
  }
  return null;
}

/**
 * Get human-readable label for a check point
 */
export function getPointLabel(point: CheckPoint): string {
  const labels: Record<LegacyCheckPoint, string> = {
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

  // Legacy compass points
  if (LEGACY_CHECK_POINTS.includes(point as LegacyCheckPoint)) {
    return labels[point as LegacyCheckPoint];
  }

  // Cartesian notation (r0c0, r2c3, etc.)
  if (isCartesianPoint(point)) {
    const match = point.match(/^r(\d+)c(\d+)$/);
    if (match) {
      const row = parseInt(match[1], 10);
      const col = parseInt(match[2], 10);
      return `Row ${row + 1}, Col ${col + 1}`;
    }
  }

  return point.toUpperCase();
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
 * Calculate destination point given north/south and east/west offsets in miles
 */
function calculateDestinationWithOffset(
  lat: number,
  lng: number,
  northMiles: number,
  eastMiles: number
): { lat: number; lng: number } {
  let result = { lat, lng };

  // Apply north/south offset (bearing 0° for north, 180° for south)
  if (northMiles !== 0) {
    const bearing = northMiles >= 0 ? 0 : 180;
    result = calculateDestinationPoint(result.lat, result.lng, Math.abs(northMiles), bearing);
  }

  // Apply east/west offset (bearing 90° for east, 270° for west)
  if (eastMiles !== 0) {
    const bearing = eastMiles >= 0 ? 90 : 270;
    result = calculateDestinationPoint(result.lat, result.lng, Math.abs(eastMiles), bearing);
  }

  return result;
}

/**
 * Calculate grid points for a Cartesian (square) grid
 *
 * @param config - Grid configuration with center and radius
 * @param gridDimension - Number of points per side (3, 5, or 7)
 * @returns Array of GeoPoints with Cartesian labels (r0c0, r0c1, etc.)
 */
export function calculateCartesianGridPoints(
  config: Omit<GridConfig, 'points'>,
  gridDimension: number
): GeoPoint[] {
  const { centerLat, centerLng, radiusMiles } = config;
  const geoPoints: GeoPoint[] = [];

  // Grid spans from -radius to +radius, divided into (gridDimension - 1) steps
  const stepMiles = (2 * radiusMiles) / (gridDimension - 1);
  const halfGrid = Math.floor(gridDimension / 2);

  for (let row = 0; row < gridDimension; row++) {
    for (let col = 0; col < gridDimension; col++) {
      // Calculate offset from center
      // Row 0 is north (positive), row increases going south (negative)
      // Col 0 is west (negative), col increases going east (positive)
      const northOffsetMiles = (halfGrid - row) * stepMiles;
      const eastOffsetMiles = (col - halfGrid) * stepMiles;

      const dest = calculateDestinationWithOffset(
        centerLat,
        centerLng,
        northOffsetMiles,
        eastOffsetMiles
      );

      geoPoints.push({
        lat: dest.lat,
        lng: dest.lng,
        label: `r${row}c${col}`,
      });
    }
  }

  return geoPoints;
}

/**
 * Calculate grid points using legacy bearing-based approach
 *
 * @param config - Grid configuration with center, radius, and legacy points
 * @returns Array of GeoPoints with compass direction labels
 */
function calculateLegacyGridPoints(config: GridConfig): GeoPoint[] {
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
 * Calculate all geo points for a grid configuration
 *
 * Automatically detects whether to use Cartesian or legacy calculation
 * based on the check point notation.
 *
 * @param config - Grid configuration with center and radius
 * @returns Array of GeoPoints with coordinates and labels
 */
export function calculateGridPoints(config: GridConfig): GeoPoint[] {
  const { points = DEFAULT_CHECK_POINTS } = config;

  // Detect if using Cartesian notation (r0c0, r1c1, etc.)
  if (usesCartesianNotation(points)) {
    // Determine grid dimension from point count
    const gridDimension = Math.sqrt(points.length);

    // Validate it's a perfect square
    if (Number.isInteger(gridDimension)) {
      return calculateCartesianGridPoints(config, gridDimension);
    }

    // Fall back to matching a grid size option
    const gridOption = getGridSizeOption(points.length);
    if (gridOption) {
      return calculateCartesianGridPoints(config, gridOption.gridDimension);
    }

    console.warn(`Invalid Cartesian grid point count: ${points.length}. Using legacy calculation.`);
  }

  // Legacy bearing-based calculation
  return calculateLegacyGridPoints(config);
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

  // Check for valid point formats
  for (const point of points) {
    // Legacy compass notation
    if (LEGACY_CHECK_POINTS.includes(point as LegacyCheckPoint)) {
      continue;
    }

    // Cartesian notation (r0c0, r1c2, etc.)
    if (isCartesianPoint(point)) {
      continue;
    }

    return { valid: false, error: `Invalid check point: ${point}` };
  }

  // Check for duplicates
  const uniquePoints = new Set(points);
  if (uniquePoints.size !== points.length) {
    return { valid: false, error: 'Duplicate check points are not allowed' };
  }

  // Validate grid structure for Cartesian points
  if (usesCartesianNotation(points)) {
    const gridDimension = Math.sqrt(points.length);
    if (!Number.isInteger(gridDimension)) {
      return { valid: false, error: `Cartesian grid must have a square number of points (got ${points.length})` };
    }
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
  calculateCartesianGridPoints,
  calculateDistance,
  getBearingForPoint,
  getPointLabel,
  validateCoordinates,
  validateRadius,
  validateCheckPoints,
  validateGridConfig,
};

export default pointCalculator;
