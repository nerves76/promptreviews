/**
 * Shared TypeScript types for Business Information components
 * Ensures consistency across all business info modules
 */

export interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface BusinessCategory {
  categoryId: string;
  displayName: string;
}

export interface ServiceItem {
  name: string;
  description?: string;
}

export interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

export interface BusinessInfo {
  locationName: string; // Used only for display purposes, not editing
  description: string;
  regularHours: BusinessHours;
  primaryCategory?: BusinessCategory;
  additionalCategories: Array<BusinessCategory>;
  serviceItems: Array<ServiceItem>;
}

export interface CategorySearchResponse {
  success: boolean;
  categories: BusinessCategory[];
  total: number;
  filtered: number;
  error?: string;
  message?: string;
}

export interface LocationDetailsResponse {
  success: boolean;
  location?: {
    profile?: {
      description: string;
    };
    regularHours?: {
      periods: Array<{
        openDay: string;
        openTime: string;
        closeTime: string;
      }>;
    };
    categories?: {
      primaryCategory?: BusinessCategory;
      additionalCategories?: BusinessCategory[];
    };
    serviceItems?: Array<{
      freeFormServiceItem?: {
        label?: {
          displayName: string;
          description?: string;
        };
      };
      structuredServiceItem?: {
        description: string;
      };
    }>;
  };
  error?: string;
  message?: string;
} 