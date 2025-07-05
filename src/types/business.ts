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
  review_platforms: any[];
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
  name: string; // e.g., "Downtown Seattle Location"
  business_name?: string; // e.g., "Acme Dental - Downtown"
  
  // Address Information
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  
  // Location-Specific Business Details
  business_description?: string;
  unique_aspects?: string;
  phone?: string;
  email?: string;
  website_url?: string;
  
  // AI Training Fields
  ai_dos?: string;
  ai_donts?: string;
  
  // Location-specific overrides
  review_platforms?: any[];
  logo_url?: string;
  
  // Operational fields
  hours?: string;
  manager_name?: string;
  manager_email?: string;
  parking_info?: string;
  accessibility_info?: string;
  
  // Custom styling
  primary_color?: string;
  secondary_color?: string;
  custom_css?: string;
  
  // Module fields
  falling_enabled?: boolean;
  falling_icon?: string;
  emoji_sentiment_enabled?: boolean;
  emoji_sentiment_question?: string;
  emoji_feedback_message?: string;
  emoji_thank_you_message?: string;
  emoji_labels?: string[];
  offer_enabled?: boolean;
  offer_title?: string;
  offer_body?: string;
  offer_url?: string;
  ai_review_enabled?: boolean;
  
  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationWithPromptPage extends BusinessLocation {
  prompt_page_id?: string;
  prompt_page_slug?: string;
}

// Location tier limits configuration
export const LOCATION_LIMITS_BY_PLAN = {
  maven: 10,
  builder: 0,
  grower: 0,
  starter: 0,
  free: 0,
} as const;

export type AccountPlan = keyof typeof LOCATION_LIMITS_BY_PLAN;
