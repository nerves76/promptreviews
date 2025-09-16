/**
 * Data Filtering Utilities
 * 
 * Helper functions for filtering out empty/meaningless values before 
 * sending data to external APIs to prevent overwriting existing content.
 */

/**
 * Checks if a value is meaningful (not empty, null, undefined, or whitespace-only)
 * @param value - The value to check
 * @returns true if the value has meaningful content, false otherwise
 */
export function hasValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Filters an object to only include properties with meaningful values
 * @param obj - The object to filter
 * @param trimStrings - Whether to trim string values (default: true)
 * @returns A new object with only meaningful values
 */
export function filterMeaningfulValues<T extends Record<string, any>>(
  obj: T, 
  trimStrings: boolean = true
): Partial<T> {
  const filtered: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (hasValue(value)) {
      if (typeof value === 'string' && trimStrings) {
        filtered[key as keyof T] = value.trim() as T[keyof T];
      } else {
        filtered[key as keyof T] = value;
      }
    }
  }
  
  return filtered;
}

/**
 * Safely updates an object with new values, only overwriting with meaningful data
 * @param target - The target object to update
 * @param updates - The updates to apply
 * @param trimStrings - Whether to trim string values (default: true)
 * @returns The updated target object
 */
export function safeUpdate<T extends Record<string, any>>(
  target: T,
  updates: Partial<T>,
  trimStrings: boolean = true
): T {
  const meaningfulUpdates = filterMeaningfulValues(updates, trimStrings);
  return { ...target, ...meaningfulUpdates };
}

/**
 * Creates an update payload for external APIs that only includes meaningful changes
 * @param originalData - The original data object
 * @param formData - The form data with potential updates
 * @param allowedFields - Array of field names that are allowed to be updated
 * @returns An object with only the meaningful changes
 */
export function createUpdatePayload<T extends Record<string, any>>(
  originalData: T,
  formData: Partial<T>,
  allowedFields?: (keyof T)[]
): Partial<T> {
  const updates: Partial<T> = {};
  
  const fieldsToCheck = allowedFields || Object.keys(formData) as (keyof T)[];
  
  for (const field of fieldsToCheck) {
    const newValue = formData[field];
    const originalValue = originalData[field];
    
    // Only include if the new value is meaningful and different from original
    if (hasValue(newValue) && newValue !== originalValue) {
      if (typeof newValue === 'string') {
        updates[field] = newValue.trim() as T[keyof T];
      } else {
        updates[field] = newValue;
      }
    }
  }
  
  return updates;
} 