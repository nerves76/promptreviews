// Define the widget types
export type WidgetType = 'single' | 'multi' | 'photo';

// Define the design state type
export interface DesignState {
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
  };
  layout: {
    padding: string;
    borderRadius: string;
    spacing: string;
  };
  animation: {
    duration: string;
    easing: string;
  };
}

// Define the widget data structure
export interface WidgetData {
  id: string;
  type: 'multi' | 'single' | 'photo';
  design: DesignState;
  reviews: Array<{
    id: string;
    review_content: string;
    first_name: string;
    last_name: string;
    reviewer_role: string;
    platform: string;
    created_at: string;
    star_rating: number;
    photo_url?: string;
  }>;
  slug?: string;
  universalPromptSlug?: string;
}

export interface Review {
  id: string;
  author: string;
  content: string;
  star_rating: number;
  photo_url?: string;
  created_at: string;
} 