export interface BusinessProfile {
  id: string;
  name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  background_color: string;
  primary_font: string;
  secondary_font: string;
  review_platforms: string[];
  facebook_url?: string;
  instagram_url?: string;
  bluesky_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  pinterest_url?: string;
  default_offer_enabled?: boolean;
  default_offer_title?: string;
  default_offer_body?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
}

export interface BusinessLocation {
  id: string;
  account_id: string;
  name: string; // e.g., "Downtown Store"
  business_name?: string; // e.g., "Acme Corp - Downtown"
  
  // Address Information
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  
  // Location-Specific Business Details
  business_description?: string; // Location-specific description
  unique_aspects?: string; // What makes this location unique
  phone?: string;
  email?: string;
  website_url?: string;
  
  // AI Training Fields (location-specific)
  ai_dos?: string; // Location-specific AI dos
  ai_donts?: string; // Location-specific AI don'ts
  
  // Location-specific review platforms override
  review_platforms?: any[]; // JSONB - review platform configurations
  
  // Location-specific styling override (optional)
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  
  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessLocationInput {
  name: string;
  business_name?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  business_description?: string;
  unique_aspects?: string;
  phone?: string;
  email?: string;
  website_url?: string;
  ai_dos?: string;
  ai_donts?: string;
  review_platforms?: any[];
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface UpdateBusinessLocationInput extends Partial<CreateBusinessLocationInput> {
  id: string;
}

// Enhanced types for location-aware functionality
export interface LocationContext {
  locations: BusinessLocation[];
  currentLocation: BusinessLocation | null;
  canCreateLocation: boolean;
  locationLimit: number;
  locationCount: number;
}

// Enhanced prompt page types that include location context
export interface LocationPromptPage {
  id: string;
  account_id: string;
  business_location_id: string;
  is_universal: boolean;
  slug: string;
  
  // Standard prompt page fields
  offer_enabled: boolean;
  offer_title?: string;
  offer_body?: string;
  offer_url?: string;
  emoji_sentiment_enabled: boolean;
  emoji_sentiment_question?: string;
  emoji_feedback_message?: string;
  emoji_thank_you_message?: string;
  review_platforms?: any[];
  falling_icon?: string;
  ai_button_enabled: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Populated location data
  location?: BusinessLocation;
}

// Account with location information
export interface AccountWithLocations {
  id: string;
  plan: string;
  location_count: number;
  max_locations: number;
  locations?: BusinessLocation[];
}

// Location limits by tier
export const LOCATION_LIMITS: Record<string, number> = {
  grower: 0,
  builder: 0,
  maven: 10,
};

// Utility function type for checking location access
export type CanCreateLocationFn = (account: AccountWithLocations) => boolean;

// Enhanced business profile that includes location context
export interface BusinessProfileWithLocations extends BusinessProfile {
  locations?: BusinessLocation[];
  account?: AccountWithLocations;
}
