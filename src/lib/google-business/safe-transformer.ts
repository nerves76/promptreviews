/**
 * Safe data transformer for Google Business Profile locations
 * Prevents TypeErrors and provides multiple fallback strategies
 */

export interface SafeLocation {
  id: string;
  name: string;
  address: string;
  status?: string;
  _debug?: {
    raw: any;
    transformedAt: string;
    fallbacksUsed: string[];
    warnings: string[];
  };
}

/**
 * Safely extracts a string value with multiple fallback strategies
 */
function safeString(
  obj: any,
  ...paths: string[]
): { value: string | null; path?: string } {
  for (const path of paths) {
    try {
      const value = path.split('.').reduce((curr, key) => curr?.[key], obj);
      if (typeof value === 'string' && value.trim()) {
        return { value: value.trim(), path };
      }
    } catch (e) {
      continue;
    }
  }
  return { value: null };
}

/**
 * Generates a deterministic ID from available data
 */
function generateFallbackId(data: any, index: number): string {
  const components = [
    data?.location_name,
    data?.name,
    data?.address?.split(',')[0],
    data?.phone,
    index.toString()
  ].filter(Boolean);
  
  if (components.length > 0) {
    // Create a somewhat stable ID from available data
    const hash = components.join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    return `loc-${hash}`;
  }
  
  // Last resort: timestamp-based ID
  return `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safely transforms a location object with comprehensive fallbacks
 */
export function safeTransformLocation(
  rawLocation: unknown,
  index: number = 0
): SafeLocation {
  const warnings: string[] = [];
  const fallbacksUsed: string[] = [];
  
  try {
    const loc = rawLocation as any;
    
    // Debug logging to see what data we're receiving
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Transformer receiving location ${index}:`, {
        hasLocationName: 'location_name' in loc,
        locationName: loc?.location_name,
        hasName: 'name' in loc,
        name: loc?.name,
        hasTitle: 'title' in loc,
        title: loc?.title,
        keys: Object.keys(loc || {})
      });
    }
    
    // Extract ID with multiple strategies
    const idResult = safeString(loc, 'location_id', 'id', 'locationId', 'place_id');
    let id = idResult.value;
    
    if (!id) {
      id = generateFallbackId(loc, index);
      fallbacksUsed.push('generated-id');
      warnings.push('No ID found, generated fallback');
    } else if (idResult.path !== 'location_id') {
      fallbacksUsed.push(`id-from-${idResult.path}`);
    }
    
    // Extract name with multiple strategies
    const nameResult = safeString(
      loc,
      'location_name',
      'name',
      'business_name',
      'title',
      'displayName',
      'storeName'
    );
    let name = nameResult.value;
    
    if (!name) {
      // Try to create name from address
      const addressParts = safeString(loc, 'address', 'formatted_address');
      if (addressParts.value) {
        name = `Business at ${addressParts.value.split(',')[0]}`;
        fallbacksUsed.push('name-from-address');
      } else {
        name = `Location ${index + 1}`;
        fallbacksUsed.push('indexed-name');
      }
      warnings.push('No name found, using fallback');
    } else if (nameResult.path !== 'location_name') {
      fallbacksUsed.push(`name-from-${nameResult.path}`);
    }
    
    // Extract address
    const addressResult = safeString(
      loc,
      'address',
      'formatted_address',
      'full_address',
      'street_address'
    );
    const address = addressResult.value || '';
    if (!address) {
      warnings.push('No address found');
    }
    
    // Build safe location object
    const safeLocation: SafeLocation = {
      id,
      name,
      address
    };
    
    // Only include debug info in development
    if (process.env.NODE_ENV === 'development') {
      safeLocation._debug = {
        raw: loc,
        transformedAt: new Date().toISOString(),
        fallbacksUsed,
        warnings
      };
      
      if (warnings.length > 0) {
        console.warn(`Location transformation warnings for index ${index}:`, warnings);
      }
    }
    
    return safeLocation;
    
  } catch (error) {
    console.error(`Critical error transforming location at index ${index}:`, error);
    
    // Return absolute minimum viable location
    return {
      id: `error-location-${index}-${Date.now()}`,
      name: `Location ${index + 1} (Error)`,
      address: '',
      _debug: process.env.NODE_ENV === 'development' ? {
        raw: rawLocation,
        transformedAt: new Date().toISOString(),
        fallbacksUsed: ['error-recovery'],
        warnings: [`Transformation failed: ${error}`]
      } : undefined
    };
  }
}

/**
 * Transforms an array of locations safely
 */
export function safeTransformLocations(
  rawLocations: unknown
): SafeLocation[] {
  if (!Array.isArray(rawLocations)) {
    console.error('Expected array of locations, got:', typeof rawLocations);
    return [];
  }
  
  return rawLocations.map((loc, index) => safeTransformLocation(loc, index));
}

/**
 * Validates transformed locations for consistency
 */
export function validateTransformedLocations(
  locations: SafeLocation[]
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const seenIds = new Set<string>();
  
  locations.forEach((loc, index) => {
    // Check for duplicate IDs
    if (seenIds.has(loc.id)) {
      issues.push(`Duplicate ID: ${loc.id} at index ${index}`);
    }
    seenIds.add(loc.id);
    
    // Check for suspicious IDs
    if (loc.id.includes('undefined') || loc.id.includes('null')) {
      issues.push(`Suspicious ID at index ${index}: ${loc.id}`);
    }
    
    // Check for missing critical data
    if (!loc.name || loc.name === `Location ${index + 1}`) {
      issues.push(`Generic or missing name at index ${index}`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}