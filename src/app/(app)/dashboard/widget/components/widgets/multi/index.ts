// Flat design state type for widget preview and dashboard
export type DesignState = {
  bgType: "none" | "solid";
  bgColor: string;
  textColor: string;
  accentColor: string;
  nameTextColor: string;
  roleTextColor: string;
  attributionFontSize: number;
  borderRadius: number;
  shadow: boolean;
  bgOpacity: number;
  autoAdvance: boolean;
  slideshowSpeed: number;
  border: boolean;
  borderWidth: number;
  lineSpacing: number;
  showQuotes: boolean;
  quoteSize: number;
  showRelativeDate: boolean;
  showPlatform: boolean;
  showGrid: boolean;
  width: number;
  sectionBgType: "none" | "custom";
  sectionBgColor: string;
  shadowIntensity: number;
  shadowColor: string;
  borderColor: string;
  borderOpacity: number;
  font: string;
  showSubmitReviewButton: boolean;
  glassmorphism: boolean;
  backdropBlur: number;
  innerShadow: boolean;
  innerShadowColor: string;
  innerShadowOpacity: number;
};

export interface WidgetData {
  id: string;
  type: 'multi' | 'single' | 'photo';
  design: DesignState;
  reviews: Review[];
  slug?: string;
  universalPromptSlug?: string;
}

export interface Review {
  id: string;
  first_name?: string;
  last_name?: string;
  reviewer_role?: string;
  review_content: string;
  star_rating: number;
  photo_url?: string;
  created_at: string;
  platform?: string;
}

// Flat default design structure matching the rest of the dashboard
export const DEFAULT_DESIGN: DesignState = {
  bgType: 'solid',
  bgColor: '#FFFFFF',  // White background for glassmorphism
  textColor: '#FFFFFF',  // White text for better contrast on glassmorphic background
  accentColor: '#FFFFFF',  // White for maximum contrast on glassmorphic surfaces
  nameTextColor: '#FFFFFF',  // White for names
  roleTextColor: '#F0F0F0',  // Slightly dimmer white for roles
  attributionFontSize: 15,
  borderRadius: 16,
  shadow: false,  // Turn off shadow for cleaner glassmorphic look
  bgOpacity: 0.3,  // 30% opacity as suggested
  autoAdvance: false,
  slideshowSpeed: 4,
  border: true,
  borderWidth: 0.5,  // Thin border for glassmorphic effect
  lineSpacing: 1.4,
  showQuotes: false,
  quoteSize: 1.5,
  showRelativeDate: false,
  showPlatform: false,
  showGrid: false,
  width: 1000,
  sectionBgType: 'none',
  sectionBgColor: '#ffffff',
  shadowIntensity: 0.2,
  shadowColor: '#222222',
  borderColor: '#FFFFFF',  // White border
  borderOpacity: 0.3,  // Semi-transparent border for glassmorphic effect
  font: 'Inter',
  showSubmitReviewButton: true,
  glassmorphism: true,  // Enable glassmorphism by default
  backdropBlur: 10,  // Medium blur for glassmorphic effect
  innerShadow: true,  // Enable inner shadow for frosty effect
  innerShadowColor: '#FFFFFF',  // White inner shadow
  innerShadowOpacity: 0.5,  // 50% opacity for subtle frost
};

export const getDesignWithDefaults = (design: Partial<DesignState> = {}): DesignState => {
  return { ...DEFAULT_DESIGN, ...design };
}; 

// Export the MultiWidget component
export { default as MultiWidget } from './MultiWidget'; 