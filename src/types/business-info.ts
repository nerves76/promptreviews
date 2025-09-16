/**
 * Shared TypeScript types for Business Information components
 * Ensures consistency across all business info modules
 */


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

export interface Address {
  addressLines?: string[];
  locality?: string; // City
  administrativeArea?: string; // State/Province
  postalCode?: string;
  regionCode?: string; // Country code
}

export interface PhoneNumbers {
  primaryPhone?: string;
  additionalPhones?: string[];
}

export interface WebsiteInfo {
  websiteUri?: string;
}

export interface BusinessInfo {
  locationName: string; // Business name
  description: string;
  regularHours: BusinessHours;
  primaryCategory?: BusinessCategory;
  additionalCategories: Array<BusinessCategory>;
  serviceItems: Array<ServiceItem>;
  storefrontAddress?: Address;
  phoneNumbers?: PhoneNumbers;
  websiteUri?: string;
  latlng?: {
    latitude: number;
    longitude: number;
  };
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
    title?: string; // Business name
    profile?: {
      description: string;
    };
    storefrontAddress?: Address;
    phoneNumbers?: {
      primaryPhone?: string;
      additionalPhones?: string[];
    };
    websiteUri?: string;
    latlng?: {
      latitude: number;
      longitude: number;
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