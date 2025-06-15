import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserClient } from '@supabase/ssr';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import SingleWidget from './SingleWidget';
import MultiWidget from './MultiWidget';
import PhotoWidget from './PhotoWidget';


// Define the widget types
type WidgetType = 'single' | 'multi' | 'photo';

// Define the widget data structure
interface WidgetData {
  id: string;
  name: string;
  widget_type: WidgetType;
  design: {
    bgColor: string;
    textColor: string;
    accentColor: string;
    bodyTextColor: string;
    nameTextColor: string;
    roleTextColor: string;
    quoteFontSize: number;
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
    showRelativeDate: boolean;
    showGrid: boolean;
    width: number;
    sectionBgType?: 'none' | 'custom';
    sectionBgColor?: string;
    shadowIntensity?: number;
    shadowColor?: string;
    borderColor: string;
    showSubmitReviewButton: boolean;
  };
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

// Add this helper function after the WidgetData interface
const DEFAULT_DESIGN = {
  bgType: "solid",
  bgColor: "#ffffff",
  textColor: "#22223b",
  accentColor: "#6A5ACD",
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
  sectionBgType: "none",
  sectionBgColor: "#ffffff",
  shadowIntensity: 0.2,
  shadowColor: "#222222",
  borderColor: "#cccccc",
  showSubmitReviewButton: true,
};

function getDesignWithDefaults(design: Partial<typeof DEFAULT_DESIGN> = {}) {
  return { ...DEFAULT_DESIGN, ...design };
}

// Function to fetch widget data from Supabase
async function fetchWidgetData(widgetId: string): Promise<WidgetData | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', widgetId)
    .single();

  if (error || !data) {
    console.error('Error fetching widget data:', error);
    return null;
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('widget_reviews')
    .select('*')
    .eq('widget_id', widgetId)
    .order('order_index', { ascending: true });

  if (reviewsError) {
    console.error('Error fetching widget reviews:', reviewsError);
    return null;
  }

  return {
    ...data,
    reviews: reviews || [],
  };
}

// Helper to get relative time string (dashboard logic)
function getRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

// Add star rating rendering helper
function renderStars(rating: number, size: number = 16) {
  if (typeof rating !== 'number' || isNaN(rating)) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const full = i <= Math.floor(rating);
    const half = !full && i - 0.5 <= rating;
    const gradientId = `half-star-gradient-${i}-${Math.random()}`;
    stars.push(
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill={full ? '#FBBF24' : half ? `url(#${gradientId})` : '#E5E7EB'}
        stroke="#FBBF24"
        style={{ display: 'inline-block', marginRight: 2 }}
      >
        {half && (
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
        )}
        <polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" />
      </svg>
    );
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 4 }}>{stars}</span>;
}

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Helper to lighten a hex color
function lightenHex(hex: string, amount: number = 0.7) {
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Helper to inject widget responsive CSS at runtime
function injectWidgetResponsiveCSS() {
  if (!document.getElementById('pr-widget-responsive-css')) {
    const style = document.createElement('style');
    style.id = 'pr-widget-responsive-css';
    style.innerHTML = `
      .pr-widget-root { max-width: 100%; margin: 0 auto; position: relative; }
      .pr-widget-card { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px 16px; position: relative; min-height: 320px; max-height: 320px; height: 320px; overflow: hidden; }
      .pr-widget-photo-card { display: flex; flex-direction: column; align-items: stretch; min-height: 320px; max-height: 320px; height: 320px; overflow: hidden; }
      .pr-widget-photo-img { display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; overflow: hidden; width: 100%; min-width: 200px; height: 220px; }
      .pr-widget-photo-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 16px; position: relative; }
      @media (min-width: 640px) {
        .pr-widget-photo-card { flex-direction: row; height: 440px; }
        .pr-widget-photo-img { width: 33.333333%; height: 100%; }
        .pr-widget-photo-content { padding: 32px; }
      }
      .pr-widget-stars { display: flex; align-items: center; justify-center; margin-bottom: 8px; margin-top: 4px; }
      .pr-widget-review-body { margin-bottom: 16px; padding: 0 8px; text-align: center; }
      .pr-widget-photo-body { margin-bottom: 16px; padding: 0 8px; text-align: left; }
      .pr-widget-author { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; margin-top: auto; }
      .pr-widget-photo-author { align-items: flex-start; }
      .pr-widget-pagination { display: flex; justify-content: center; margin-top: 1.5rem; }
      .pr-widget-pagination .swiper-pagination-bullet { 
        width: 8px; 
        height: 8px; 
        background: #d1d5db; 
        opacity: 1;
        transition: all 0.3s ease;
        margin: 0 4px;
      }
      .pr-widget-pagination .swiper-pagination-bullet-active { 
        background: var(--pr-accent-color, #4F46E5);
        transform: scale(1.2);
      }
      .swiper-button-disabled { 
        opacity: 0.5; 
        cursor: not-allowed;
        pointer-events: none;
      }
      .swiper-button-disabled:hover { 
        background: rgba(255, 255, 255, 0.6) !important; 
      }
      .swiper-slide { 
        height: auto !important; 
        transition: transform 0.3s ease;
      }
      .swiper-slide > div { 
        height: 100% !important; 
      }
      .swiper-slide article { 
        height: 440px !important;
        transition: all 0.3s ease;
      }
      
      /* Additional styles for better responsiveness */
      @media (max-width: 640px) {
        /* .gap-8 { gap: 1rem; } */
        .px-8 { padding-left: 1rem; padding-right: 1rem; }
      }
    `;
    document.head.appendChild(style);
  }
}

// Main widget renderer
const WidgetRenderer: React.FC<{ data: WidgetData }> = ({ data }) => {
  switch (data.widget_type) {
    case 'single':
      return <SingleWidget data={data} />;
    case 'multi':
      return <MultiWidget data={data} />;
    case 'photo':
      return <PhotoWidget data={data} />;
    default:
      return <div>Unknown widget type</div>;
  }
};

// Helper to inject Swiper CSS at runtime
function injectSwiperCSS(): Promise<void> {
  return new Promise<void>((resolve) => {
    const SWIPER_CSS_URL = 'https://cdn.jsdelivr.net/npm/swiper@11.1.0/swiper-bundle.min.css';
    if (!document.querySelector('link[data-pr-swiper]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = SWIPER_CSS_URL;
      link.setAttribute('data-pr-swiper', 'true');
      link.onload = () => resolve();
      document.head.appendChild(link);
    } else {
      resolve();
    }
  });
}

// Helper to inject Swiper navigation CSS for embed
function injectSwiperNavCSS() {
  if (!document.getElementById('pr-swiper-nav-css')) {
    const style = document.createElement('style');
    style.id = 'pr-swiper-nav-css';
    style.innerHTML = `
      .swiper-button-next,
      .swiper-button-prev {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        background: rgba(255,255,255,0.85);
        border: 1px solid #e5e7eb;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        cursor: pointer;
        transition: background 0.2s;
      }
      .swiper-button-next:hover,
      .swiper-button-prev:hover {
        background: #f3f4f6;
      }
      .swiper-button-prev { left: -24px; }
      .swiper-button-next { right: -24px; }
      @media (max-width: 600px) {
        .swiper-button-prev { left: 4px; }
        .swiper-button-next { right: 4px; }
      }
      .swiper-pagination {
        position: relative;
        margin-top: 16px;
      }
      .swiper-pagination-bullet {
        width: 8px;
        height: 8px;
        background: #e5e7eb;
        opacity: 1;
      }
      .swiper-pagination-bullet-active {
        background: #4f46e5;
      }
    `;
    document.head.appendChild(style);
  }
}

// Inject dashboard-style navigation button CSS
function injectWidgetNavCSS() {
  if (!document.getElementById('pr-widget-nav-css')) {
    const style = document.createElement('style');
    style.id = 'pr-widget-nav-css';
    style.innerHTML = `
      .pr-widget-nav-btn {
        border-radius: 9999px;
        background: rgba(255,255,255,0.6);
        backdrop-filter: blur(2px);
        border: 1px solid #e5e7eb;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        z-index: 10;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      .pr-widget-nav-btn.left {
        padding: 10px 14px 10px 10px;
      }
      .pr-widget-nav-btn.right {
        padding: 10px 10px 10px 14px;
      }
      .pr-widget-nav-btn:hover {
        background: #fff;
      }
      .pr-widget-nav-btn svg {
        width: 20px;
        height: 20px;
        display: block;
        margin: 0;
        padding: 0;
      }
      .pr-widget-nav-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 32px;
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 16px;
      }
      .pr-widget-nav-center {
        flex: 1;
        display: flex;
        justify-content: center;
      }
      .pr-widget-pagination {
        display: flex;
        justify-content: center;
        margin-top: 24px;
      }
      .pr-widget-triangle-left, .pr-widget-triangle-right {
        display: block;
        width: 0;
        height: 0;
      }
      .pr-widget-triangle-left {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-right: 14px solid #222;
      }
      .pr-widget-triangle-right {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-left: 14px solid #222;
      }
      @media (max-width: 600px) {
        .pr-widget-nav-row {
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }
        .pr-widget-nav-center {
          order: 1;
        }
        .pr-widget-nav-btn {
          order: 2;
          margin: 0 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Update the styles for pagination
const styles = `
  .swiper-pagination {
    position: relative !important;
    bottom: auto !important;
    display: flex !important;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    width: auto !important;
  }
  .swiper-pagination-bullet {
    width: 8px !important;
    height: 8px !important;
    background: #d1d5db !important;
    opacity: 1 !important;
    transition: all 0.3s ease;
    margin: 0 4px !important;
  }
  .swiper-pagination-bullet-active {
    background: var(--pr-accent-color, #4F46E5) !important;
    transform: scale(1.2);
  }
  @media (max-width: 640px) {
    /* reverted custom mobile pagination margin for photo widget */
  }
`;

export { MultiWidget, SingleWidget, PhotoWidget, getDesignWithDefaults, hexToRgba, getRelativeTime, renderStars, lightenHex, injectWidgetResponsiveCSS, injectWidgetNavCSS }; 