import { DesignState, WidgetType } from './types';

// Default design settings for each widget type
export const DEFAULT_DESIGN: Record<WidgetType, DesignState> = {
  multi: {
    bgType: "solid" as const,
    bgColor: "#ffffff",
    textColor: "#22223b",
    accentColor: "slateblue",
    bodyTextColor: "#22223b",
    nameTextColor: "#1a237e",
    roleTextColor: "#6b7280",
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
    showQuotes: true,
    showRelativeDate: false,
    showGrid: false,
    width: 1000,
    sectionBgType: "none" as "none" | "custom",
    sectionBgColor: "#ffffff",
    shadowIntensity: 0.2,
    shadowColor: "#222222",
    borderColor: "#cccccc",
    font: "Inter",
    showSubmitReviewButton: true,
  },
  single: {
    bgType: "solid" as const,
    bgColor: "#ffffff",
    textColor: "#22223b",
    accentColor: "slateblue",
    bodyTextColor: "#22223b",
    nameTextColor: "#1a237e",
    roleTextColor: "#6b7280",
    quoteFontSize: 20,
    attributionFontSize: 16,
    borderRadius: 16,
    shadow: true,
    bgOpacity: 1,
    autoAdvance: false,
    slideshowSpeed: 4,
    border: true,
    borderWidth: 2,
    lineSpacing: 1.6,
    showQuotes: true,
    showRelativeDate: false,
    showGrid: false,
    width: 800,
    sectionBgType: "none" as "none" | "custom",
    sectionBgColor: "#ffffff",
    shadowIntensity: 0.2,
    shadowColor: "#222222",
    borderColor: "#cccccc",
    font: "Inter",
    showSubmitReviewButton: true,
  },
  photo: {
    bgType: "solid" as const,
    bgColor: "#ffffff",
    textColor: "#22223b",
    accentColor: "slateblue",
    bodyTextColor: "#22223b",
    nameTextColor: "#1a237e",
    roleTextColor: "#6b7280",
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
    showQuotes: true,
    showRelativeDate: false,
    showGrid: false,
    width: 1000,
    sectionBgType: "none" as "none" | "custom",
    sectionBgColor: "#ffffff",
    shadowIntensity: 0.2,
    shadowColor: "#222222",
    borderColor: "#cccccc",
    font: "Inter",
    showSubmitReviewButton: true,
  }
};

export function getDesignWithDefaults(design: Partial<DesignState> = {}, widgetType: WidgetType = 'multi'): DesignState {
  return { ...DEFAULT_DESIGN[widgetType], ...design };
}

export function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

export const hexToRgba = (hex: string, alpha: number = 1): string => {
  if (!hex) return 'rgba(0, 0, 0, 0)';
  
  // Remove the hash if it exists
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Return the rgba string
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function lightenHex(hex: string, amount: number = 0.7) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
} 