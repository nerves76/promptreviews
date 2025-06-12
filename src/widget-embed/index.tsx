import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserClient } from '@supabase/ssr';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { FONT_FAMILIES } from '../lib/constants';
import { Review } from '../types';
import { renderStars } from '../lib/renderStars';

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
    font: string;
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
  showQuotes: false,
  showRelativeDate: false,
  showGrid: false,
  width: 1000,
  sectionBgType: "none",
  sectionBgColor: "#ffffff",
  shadowIntensity: 0.2,
  shadowColor: "#222222",
  borderColor: "#cccccc",
  showSubmitReviewButton: true,
  font: 'Inter',
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

const getFilteredAndSortedReviews = (reviews: Review[]) => {
  return reviews.filter(review => review.review_content && review.review_content.trim().length > 0)
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
};

// MultiWidget implementation
const MultiWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design || {});
  const [activeIndex, setActiveIndex] = useState(0);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperType>(null);
  const reviews = getFilteredAndSortedReviews(data.reviews);
  const navArrowBg = 'rgba(255,255,255,0.6)';

  // Set CSS variables based on design
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--card-background', design.bgColor);
    root.style.setProperty('--card-border-radius', `${design.borderRadius}px`);
    root.style.setProperty('--card-border-color', design.borderColor);
    root.style.setProperty('--card-border-width', `${design.borderWidth}px`);
    root.style.setProperty('--text-color', design.textColor);
    root.style.setProperty('--heading-color', design.nameTextColor);
    root.style.setProperty('--accent-color', design.accentColor);
    root.style.setProperty('--section-background', design.sectionBgType === 'none' ? 'transparent' : design.sectionBgColor);
    root.style.setProperty('--card-shadow-intensity', design.shadowIntensity?.toString() || '0.2');
    root.style.setProperty('--card-shadow-color', design.shadowColor || '#222222');
  }, [design]);

  return (
    <>
      {/* Get more reviews! Widget by PromptReviews.app */}
      <div
        className="promptreviews-widget flex flex-col items-center"
        style={{ fontFamily: FONT_FAMILIES[design.font] || 'Inter, sans-serif' }}
        data-pr-identifier="PromptReviews.app"
        data-bg-type={design.sectionBgType}
        data-shadow={design.shadow}
        data-border={design.border}
      >
        <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-4 sm:gap-6 sm:gap-15 px-2 md:px-4 w-full max-w-4xl mx-auto">
          {/* Navigation and pagination, always rendered */}
          <button
            ref={prevRef}
            className="nav-button"
            aria-label="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="12.5,3 5.5,10 12.5,17" fill="currentColor" />
            </svg>
          </button>

          <div className="flex-1">
            <Swiper
              modules={[Navigation, Pagination, A11y, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              pagination={{ clickable: true }}
              onBeforeInit={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              autoplay={design.autoAdvance ? {
                delay: design.slideshowSpeed * 1000,
                disableOnInteraction: false,
              } : false}
              className="w-full"
            >
              {reviews.map((review, index) => (
                <SwiperSlide key={review.id || index}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <article
                      className="card"
                      itemScope
                      itemType="https://schema.org/Review"
                    >
                      <div className="pr-widget-photo-content flex flex-col justify-between h-full items-center">
                        <div style={{ position: 'relative', width: '100%' }}>
                          {/* Opening quote */}
                          {design.showQuotes && (
                            <span className="quote quote-open">"</span>
                          )}
                          {/* Closing quote */}
                          {design.showQuotes && (
                            <span className="quote quote-close">"</span>
                          )}
                          <div className="flex flex-col items-center justify-center w-full px-4 md:px-8">
                            <div className="flex items-center justify-center mb-2 mt-1">
                              {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && renderStars(review.star_rating)}
                            </div>
                            <div className="text">
                              {review.review_content}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 w-full mt-auto">
                          <span
                            className="heading"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                          >
                            <span itemProp="name">
                              {review.first_name} {review.last_name}
                            </span>
                          </span>
                          <span
                            className="text"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                          >
                            <span itemProp="jobTitle">
                              {review.reviewer_role}
                            </span>
                          </span>
                        </div>
                      </div>
                    </article>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <button
            ref={nextRef}
            className="nav-button"
            aria-label="Next"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="7.5,3 14.5,10 7.5,17" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

// SingleWidget implementation
const SingleWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  const prevRef = React.useRef(null);
  const nextRef = React.useRef(null);
  const [swiperInstance, setSwiperInstance] = React.useState<any>(null);
  const [submitHover, setSubmitHover] = useState(false);

  React.useEffect(() => {
    if (
      swiperInstance &&
      swiperInstance.params &&
      swiperInstance.params.navigation &&
      prevRef.current &&
      nextRef.current
    ) {
      swiperInstance.params.navigation.prevEl = prevRef.current;
      swiperInstance.params.navigation.nextEl = nextRef.current;
      swiperInstance.navigation.init();
      swiperInstance.navigation.update();
    }
  }, [swiperInstance, prevRef, nextRef]);

  useEffect(() => {
    if (swiperInstance && swiperInstance.pagination && typeof swiperInstance.pagination.render === 'function') {
      swiperInstance.pagination.render();
      swiperInstance.pagination.update();
    }
  }, [swiperInstance, reviews]);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto bg-white rounded-lg shadow p-6">
      {reviews && reviews.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center justify-center mb-2 mt-1">
            {typeof reviews[0].star_rating === 'number' && !isNaN(reviews[0].star_rating) && renderStars(reviews[0].star_rating)}
          </div>
          <div className="w-full text-center text-base text-gray-800 mb-4">
            {reviews[0].review_content}
          </div>
          <div className="flex flex-col items-center gap-1 w-full mt-2">
            <span className="font-semibold text-gray-900 text-lg">
              {reviews[0].first_name} {reviews[0].last_name}
            </span>
            <span className="text-xs text-gray-500">
              {reviews[0].reviewer_role}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// PhotoWidget implementation
const PhotoWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  const prevRef = React.useRef(null);
  const nextRef = React.useRef(null);
  const [swiperInstance, setSwiperInstance] = React.useState<any>(null);
  const [submitHover, setSubmitHover] = useState(false);

  React.useEffect(() => {
    if (
      swiperInstance &&
      swiperInstance.params &&
      swiperInstance.params.navigation &&
      prevRef.current &&
      nextRef.current
    ) {
      swiperInstance.params.navigation.prevEl = prevRef.current;
      swiperInstance.params.navigation.nextEl = nextRef.current;
      swiperInstance.navigation.init();
      swiperInstance.navigation.update();
    }
  }, [swiperInstance, prevRef, nextRef]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
      {reviews && reviews.length > 0 && (
        <div className="flex flex-row items-stretch w-full gap-6">
          <div className="flex items-center justify-center w-2/5 bg-gray-50 rounded-l-2xl overflow-hidden min-h-[180px] min-w-[120px]">
            {reviews[0].photo_url ? (
              <img
                src={reviews[0].photo_url}
                alt={`${reviews[0].first_name} ${reviews[0].last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between h-full items-center flex-1 px-8">
            <div className="flex flex-col items-center justify-center w-full min-h-[180px]">
              <div className="flex items-center justify-center mb-2 mt-1">
                {typeof reviews[0].star_rating === 'number' && !isNaN(reviews[0].star_rating) && renderStars(reviews[0].star_rating)}
              </div>
              <div className="w-full text-center text-base text-gray-800 mb-4">
                {reviews[0].review_content}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 w-full mt-2">
              <span className="font-semibold text-gray-900 text-lg">
                {reviews[0].first_name} {reviews[0].last_name}
              </span>
              <span className="text-xs text-gray-500">
                {reviews[0].reviewer_role}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Initialize widgets
function initPromptReviewsWidgets() {
  const widgetElements = document.querySelectorAll('.promptreviews-widget');
  widgetElements.forEach(async (element) => {
    const widgetId = element.getAttribute('data-widget');
    if (widgetId) {
      // Inject main widget CSS if not already present
      if (!document.querySelector('link[data-pr-widget-css]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://app.promptreviews.app/widget.css';
        link.setAttribute('data-pr-widget-css', 'true');
        document.head.appendChild(link);
      }
      // Inject all necessary widget styles before rendering
      injectWidgetNavCSS();
      const root = ReactDOM.createRoot(element);
      const data = await fetchWidgetData(widgetId);
      if (!data) return;
      let WidgetComponent = MultiWidget;
      if (data.widget_type === 'single') WidgetComponent = SingleWidget;
      if (data.widget_type === 'photo') WidgetComponent = PhotoWidget;
      root.render(<WidgetComponent data={data} />);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPromptReviewsWidgets);
} else {
  initPromptReviewsWidgets();
}

// Helper function to parse widget ID
function parseWidgetId(widgetId: string) {
  const [accountId, widgetType, timestamp] = widgetId.split('_');
  return {
    accountId,
    widgetType,
    timestamp: parseInt(timestamp)
  };
}

export { MultiWidget, SingleWidget, PhotoWidget, getDesignWithDefaults, hexToRgba, getRelativeTime, renderStars, lightenHex, injectWidgetNavCSS }; 