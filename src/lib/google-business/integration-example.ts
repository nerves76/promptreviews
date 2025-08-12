/**
 * Example of how to integrate the safe transformer into existing code
 * Replace the current transformation logic in page.tsx with this approach
 */

import { safeTransformLocations, validateTransformedLocations } from './safe-transformer';

// Example: Update the loadPlatforms function in page.tsx
export function exampleSafeLoadPlatforms() {
  // Instead of:
  /*
  const transformedLocations = locations.map((loc: any, index: number) => {
    const transformed = {
      id: loc.location_id || loc.id || `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: loc.location_name || loc.name || 'Unknown Location',
      address: loc.address || '',
      status: loc.status || 'active'
    };
    return transformed;
  });
  */
  
  // Use this safer approach:
  const transformedLocations = safeTransformLocations(locations);
  
  // Validate the transformation
  const validation = validateTransformedLocations(transformedLocations);
  if (!validation.valid) {
    console.error('Location data validation issues:', validation.issues);
    // Still proceed, but log issues for monitoring
  }
  
  return transformedLocations;
}

// Example: Wrap components with error boundary
export function exampleErrorBoundaryUsage() {
  return (
    <GoogleBusinessErrorBoundary>
      <GoogleBusinessDashboard />
    </GoogleBusinessErrorBoundary>
  );
}

// Example: Add retry logic to API calls
export async function exampleAPICallWithRetry() {
  const MAX_RETRIES = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('/api/social-posting/platforms', {
        cache: 'no-store',
        headers: {
          'X-Retry-Attempt': attempt.toString()
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Don't retry client errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      lastError = new Error(`Server error: ${response.status}`);
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError || new Error('Failed after retries');
}

// Example: Quick implementation for immediate safety
export function quickSafetyWrapper() {
  // Add this to the top of your component
  const safeLocationName = (location: any) => {
    try {
      return location?.name || 
             location?.location_name || 
             (location?.address ? `Business at ${location.address.split(',')[0]}` : null) ||
             'Unknown Business';
    } catch (e) {
      return 'Unknown Business';
    }
  };
  
  const safeLocationId = (location: any) => {
    try {
      return location?.id || 
             location?.location_id || 
             `fallback-${Date.now()}`;
    } catch (e) {
      return `error-${Date.now()}`;
    }
  };
  
  // Use in JSX:
  // {safeLocationName(location)}
  // key={safeLocationId(location)}
}