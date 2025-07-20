/**
 * @fileoverview
 * TypeScript definitions for Google Business Profile API integration
 * Provides type safety for API requests, responses, and data structures
 */

// OAuth and Authentication Types
export interface GoogleBusinessProfileAuth {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string[];
}

export interface GoogleBusinessProfileCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Account and Location Types  
export interface BusinessAccount {
  name: string;
  accountName: string;
  type: 'PERSONAL' | 'LOCATION_GROUP' | 'USER_GROUP';
  role: 'OWNER' | 'CO_OWNER' | 'MANAGER' | 'SITE_MANAGER';
  state: {
    status: 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED' | 'DISABLED';
  };
  profilePhotoUrl?: string;
  accountNumber?: string;
}

export interface BusinessLocation {
  name: string;
  languageCode: string;
  storeCode?: string;
  locationName: string;
  primaryPhone?: string;
  additionalPhones?: string[];
  address: {
    regionCode: string;
    languageCode?: string;
    postalCode?: string;
    administrativeArea?: string;
    locality?: string;
    addressLines: string[];
  };
  primaryCategory: {
    categoryId: string;
    displayName: string;
  };
  additionalCategories?: Array<{
    categoryId: string;
    displayName: string;
  }>;
  websiteUri?: string;
  regularHours?: {
    periods: Array<{
      openDay: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
      openTime: string; // Format: HH:MM
      closeDay: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
      closeTime: string; // Format: HH:MM
    }>;
  };
  specialHours?: {
    specialHourPeriods: Array<{
      startDate: string; // Format: YYYY-MM-DD
      endDate: string;   // Format: YYYY-MM-DD
      openTime?: string; // Format: HH:MM
      closeTime?: string; // Format: HH:MM
      closed: boolean;
    }>;
  };
  serviceArea?: {
    businessType: 'CUSTOMER_LOCATION_ONLY' | 'CUSTOMER_AND_BUSINESS_LOCATION';
    regionCode: string;
    places?: {
      placeInfos: Array<{
        name: string;
        placeId: string;
      }>;
    };
  };
  labels?: string[];
  adWordsLocationExtensions?: {
    adPhone?: string;
  };
  latlng?: {
    latitude: number;
    longitude: number;
  };
  openInfo?: {
    status: 'OPEN' | 'CLOSED' | 'SPECIAL_HOURS';
    canReopen: boolean;
    openingDate?: string;
  };
  locationKey?: {
    placeId: string;
    plusPageId?: string;
    requestId?: string;
  };
  profile?: {
    description?: string;
  };
  relationshipData?: {
    parentLocation?: string;
  };
  metadata?: {
    duplicate?: {
      locationName: string;
    };
    mapsUri: string;
    newReviewUri: string;
  };
}

// Post Types
export type PostType = 'WHATS_NEW' | 'EVENT' | 'OFFER' | 'PRODUCT';

export type CallToActionType = 
  | 'BOOK' 
  | 'ORDER_ONLINE' 
  | 'BUY' 
  | 'LEARN_MORE' 
  | 'SIGN_UP' 
  | 'CALL'
  | 'RESERVE'
  | 'GET_OFFER'
  | 'VIEW_MENU';

export interface CallToAction {
  actionType: CallToActionType;
  url?: string;
}

export interface MediaItem {
  mediaFormat: 'PHOTO' | 'VIDEO';
  sourceUrl?: string;
  googleUrl?: string;
  name?: string;
  createTime?: string;
  dimensions?: {
    widthPixels: number;
    heightPixels: number;
  };
  thumbnailUrl?: string;
  attribution?: {
    profileName?: string;
    profilePhotoUrl?: string;
    profileUrl?: string;
    takedownUrl?: string;
  };
}

export interface LocalPost {
  name?: string;
  languageCode: string;
  summary: string;
  callToAction?: CallToAction;
  createTime?: string;
  updateTime?: string;
  event?: {
    title: string;
    schedule: {
      startDate: string; // Format: YYYY-MM-DD
      startTime?: string; // Format: HH:MM  
      endDate: string;   // Format: YYYY-MM-DD
      endTime?: string;  // Format: HH:MM
    };
  };
  offer?: {
    couponCode?: string;
    redeemOnlineUrl?: string;
    termsConditions?: string;
  };
  product?: {
    name: string;
    price?: {
      currencyCode: string;
      units?: string;
      nanos?: number;
    };
  };
  media?: MediaItem[];
  topicType: PostType;
  alertType?: 'WARNING' | 'INFO';
  state: 'LIVE' | 'REJECTED';
  searchUrl?: string;
}

export interface CreateLocalPostRequest {
  languageCode: string;
  summary: string;
  topicType: PostType;
  callToAction?: CallToAction;
  media?: MediaItem[];
  event?: LocalPost['event'];
  offer?: LocalPost['offer'];
  product?: LocalPost['product'];
}

// Analytics and Insights Types
export interface LocationInsights {
  locationMetrics: Array<{
    locationName: string;
    timeZone: string;
    metricValues: Array<{
      metric: string;
      totalValue: {
        value: string;
      };
      dimensionalValues?: Array<{
        dimension: string;
        value: string;
        metricValues: Array<{
          metric: string;
          value: string;
        }>;
      }>;
    }>;
  }>;
}

// API Response Types
export interface GoogleBusinessProfileApiResponse<T = any> {
  data?: T;
  status?: number;
  error?: {
    code: number;
    message: string;
    status: string;
    details?: any[];
  };
}

export interface ListAccountsResponse {
  accounts: BusinessAccount[];
  nextPageToken?: string;
}

export interface ListLocationsResponse {
  locations: BusinessLocation[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface ListLocalPostsResponse {
  localPosts: LocalPost[];
  nextPageToken?: string;
  totalSize?: number;
}

// Configuration and Settings Types
export interface GoogleBusinessProfileConfig {
  credentials: GoogleBusinessProfileCredentials;
  auth?: GoogleBusinessProfileAuth;
  accountId?: string;
  locationIds?: string[];
}

export interface GoogleBusinessProfileClientConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface PostSchedule {
  publishAt: Date;
  timezone: string;
}

export interface PostTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  postType: PostType;
  callToAction?: CallToAction;
  industry?: string;
  variables?: string[]; // Template variables like {businessName}, {location}
}

// Error Types
export interface GoogleBusinessProfileError extends Error {
  code: number;
  status: string;
  details?: any[];
  retryAfter?: number;
}

// Multi-Platform Support Types (for future expansion)
export interface SocialPlatformPost {
  platform: 'google_business_profile' | 'facebook' | 'instagram' | 'linkedin' | 'twitter';
  content: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    alt?: string;
  }>;
  callToAction?: {
    text: string;
    url?: string;
  };
  schedule?: PostSchedule;
  targetAudience?: {
    locations?: string[];
    demographics?: any;
  };
}

export interface CrossPlatformPostRequest {
  posts: SocialPlatformPost[];
  businessId: string;
  scheduledFor?: Date;
  publishNow?: boolean;
}

// Webhook and Event Types
export interface GoogleBusinessProfileWebhookEvent {
  eventType: 'NEW_REVIEW' | 'UPDATED_REVIEW' | 'NEW_LOCAL_POST' | 'LOCATION_UPDATED';
  account: string;
  location?: string;
  timestamp: string;
  data: any;
}

export interface WebhookSubscription {
  name: string;
  notificationTypes: string[];
  pubsubTopic: string;
} 