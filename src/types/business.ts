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
