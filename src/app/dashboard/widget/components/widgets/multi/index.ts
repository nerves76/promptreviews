import { DesignState } from '../../shared/types';

export interface WidgetData {
  id: string;
  type: 'multi' | 'single' | 'photo';
  design: DesignState;
  reviews: Review[];
}

export interface Review {
  id: string;
  author: string;
  content: string;
  star_rating: number;
  photo_url?: string;
  created_at: string;
}

// Flat default design structure matching the rest of the dashboard
export const DEFAULT_DESIGN: DesignState = {
  bgType: 'solid',
  bgColor: '#FDFBF2',
  textColor: '#22223b',
  accentColor: 'slateblue',
  bodyTextColor: '#22223b',
  nameTextColor: '#1a237e',
  roleTextColor: '#6b7280',
  quoteFontSize: 18,
  attributionFontSize: 15,
  borderRadius: 16,
  shadow: true,
  bgOpacity: 1,
  autoAdvance: false,
  slideshowSpeed: 4,
  border: true,
  borderWidth: 2,
  lineSpacing: 1.4,
  showQuotes: false,
  showRelativeDate: false,
  showGrid: false,
  width: 1000,
  sectionBgType: 'none',
  sectionBgColor: '#ffffff',
  shadowIntensity: 0.2,
  shadowColor: '#222222',
  borderColor: '#cccccc',
  font: 'Inter',
  showSubmitReviewButton: true,
};

export const getDesignWithDefaults = (design: Partial<DesignState> = {}): DesignState => {
  return { ...DEFAULT_DESIGN, ...design };
};

export type { DesignState }; 