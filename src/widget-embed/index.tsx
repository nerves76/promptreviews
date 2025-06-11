import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserClient } from '@supabase/ssr';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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

// Add star rating rendering helper
function renderStars(rating: number) {
  if (typeof rating !== 'number' || isNaN(rating)) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const full = i <= Math.floor(rating);
    const half = !full && i - 0.5 <= rating;
    const gradientId = `half-star-gradient-${i}-${Math.random()}`;
    stars.push(
      <svg
        key={i}
        width="16"
        height="16"
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
      .pr-widget-photo-img { display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; overflow: hidden; width: 100%; min-width: 200px; height: 192px; }
      .pr-widget-photo-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 16px; position: relative; }
      @media (min-width: 640px) {
        .pr-widget-photo-card { flex-direction: row; height: 320px; }
        .pr-widget-photo-img { width: 33.333333%; height: 100%; }
        .pr-widget-photo-content { padding: 32px; }
      }
      .pr-widget-stars { display: flex; align-items: center; justify-center; margin-bottom: 8px; margin-top: 4px; }
      .pr-widget-review-body { margin-bottom: 16px; padding: 0 8px; text-align: center; }
      .pr-widget-photo-body { margin-bottom: 16px; padding: 0 8px; text-align: left; }
      .pr-widget-author { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; margin-top: auto; }
      .pr-widget-photo-author { align-items: flex-start; }
      .pr-widget-pagination { display: flex; justify-content: center; margin-top: 1.5rem; }
      .pr-widget-pagination .swiper-pagination-bullet { width: 8px; height: 8px; background: #d1d5db; opacity: 1; }
      .pr-widget-pagination .swiper-pagination-bullet-active { background: #4F46E5; }
      .swiper-button-disabled { opacity: 0.5; cursor: not-allowed; }
      .swiper-button-disabled:hover { background: rgba(255, 255, 255, 0.6) !important; }
      .swiper-slide { height: auto !important; }
      .swiper-slide > div { height: 100% !important; }
      .swiper-slide article { height: 320px !important; }
      
      /* Additional styles for better responsiveness */
      @media (max-width: 640px) {
        .pr-widget-card,
        .swiper-slide article {
          min-height: 240px;
          height: auto !important;
          max-height: none !important;
          padding-bottom: 24px;
        }
        .pr-widget-nav-row,
        .flex-row.items-center.justify-center {
          flex-direction: column !important;
          gap: 0.5rem !important;
        }
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

// Helper to map font name to font-family CSS string
const FONT_FAMILIES: Record<string, string> = {
  'Inter': 'Inter, sans-serif',
  'Roboto': 'Roboto, sans-serif',
  'Open Sans': 'Open Sans, sans-serif',
  'Lato': 'Lato, sans-serif',
  'Montserrat': 'Montserrat, sans-serif',
  'Poppins': 'Poppins, sans-serif',
  'Source Sans 3': 'Source Sans 3, sans-serif',
  'Raleway': 'Raleway, sans-serif',
  'Nunito': 'Nunito, sans-serif',
  'Playfair Display': 'Playfair Display, serif',
  'Merriweather': 'Merriweather, serif',
  'Roboto Slab': 'Roboto Slab, serif',
  'PT Sans': 'PT Sans, sans-serif',
  'Oswald': 'Oswald, sans-serif',
  'Roboto Condensed': 'Roboto Condensed, sans-serif',
  'Source Serif 4': 'Source Serif 4, serif',
  'Noto Sans': 'Noto Sans, sans-serif',
  'Ubuntu': 'Ubuntu, sans-serif',
  'Work Sans': 'Work Sans, sans-serif',
  'Quicksand': 'Quicksand, sans-serif',
  'Josefin Sans': 'Josefin Sans, sans-serif',
  'Mukta': 'Mukta, sans-serif',
  'Rubik': 'Rubik, sans-serif',
  'IBM Plex Sans': 'IBM Plex Sans, sans-serif',
  'Barlow': 'Barlow, sans-serif',
  'Mulish': 'Mulish, sans-serif',
  'Comfortaa': 'Comfortaa, cursive',
  'Outfit': 'Outfit, sans-serif',
  'Plus Jakarta Sans': 'Plus Jakarta Sans, sans-serif',
  'Courier Prime': 'Courier Prime, monospace',
  'IBM Plex Mono': 'IBM Plex Mono, monospace',
  'Arial': 'Arial, sans-serif',
  'Helvetica': 'Helvetica, sans-serif',
  'Verdana': 'Verdana, sans-serif',
  'Tahoma': 'Tahoma, sans-serif',
  'Trebuchet MS': 'Trebuchet MS, sans-serif',
  'Times New Roman': 'Times New Roman, serif',
  'Georgia': 'Georgia, serif',
  'Courier New': 'Courier New, monospace',
  'Lucida Console': 'Lucida Console, monospace',
  'Palatino': 'Palatino, serif',
  'Garamond': 'Garamond, serif',
};

// MultiWidget implementation
const MultiWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  // Debug log
  console.log('MultiWidget data:', data);
  console.log('MultiWidget design:', design);
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

  const cardBg = design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1);
  const accent = design.accentColor;
  const navArrowBg = design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, 0.4);
  const navArrowBorder = navArrowBg;
  const buttonBg = submitHover
    ? (design.bgColor === 'transparent' ? 'rgba(255,255,255,0.2)' : hexToRgba(design.bgColor, 0.2))
    : navArrowBg;
  const buttonStyle = {
    display: 'inline-block',
    border: `2px solid ${navArrowBorder}`,
    background: buttonBg,
    color: accent,
    borderRadius: design.borderRadius,
    padding: '4px 16px',
    fontWeight: 500,
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    transform: 'translateX(7px)',
  };

  return (
    <>
      {/* Get more reviews! Widget by PromptReviews.app */}
      <div
        className="flex flex-col items-center"
        style={{ fontFamily: FONT_FAMILIES[design.font] || 'Inter, sans-serif' }}
        data-pr-identifier="PromptReviews.app"
      >
        <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-4 sm:gap-6 sm:gap-15 px-2 md:px-4 w-full max-w-4xl mx-auto">
          {/* Navigation and pagination, always rendered */}
          <button
            ref={prevRef}
            className="rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition z-10 mx-2 order-1 sm:order-none"
            aria-label="Previous"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              aspectRatio: '1 / 1',
              background: navArrowBg,
              backdropFilter: 'blur(2px)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="12.5,3 5.5,10 12.5,17" fill={design.accentColor || '#111'} />
            </svg>
          </button>
          <div className="flex-1 flex justify-center order-2 sm:order-none">
            <Swiper
              key={String(design.autoAdvance)}
              onSwiper={setSwiperInstance}
              modules={[
                Navigation,
                Pagination,
                A11y,
                ...(design.autoAdvance ? [Autoplay] : [])
              ]}
              spaceBetween={30}
              slidesPerView={3}
              breakpoints={{
                320: { slidesPerView: 1, spaceBetween: 20 },
                640: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 30 },
              }}
              navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
              pagination={{ clickable: true, el: '.pr-widget-pagination' }}
              {...(design.autoAdvance ? { autoplay: {
                delay: (design.slideshowSpeed ?? 4) * 1000,
                disableOnInteraction: false,
              }} : {})}
              className="max-w-5xl w-full"
            >
              {reviews.map((review, index) => (
                <SwiperSlide key={review.id || index}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <article
                      className="flex flex-col flex-1 items-center gap-4 py-6 relative bg-white rounded-3xl w-full px-4 md:px-[15px] justify-center"
                      style={{
                        background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                        color: design.textColor,
                        minHeight: 320,
                        maxHeight: 320,
                        height: 320,
                        border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                        borderRadius: design.borderRadius,
                        boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                        overflow: 'hidden',
                      }}
                      itemScope
                      itemType="https://schema.org/Review"
                    >
                      <div className="pr-widget-photo-content flex flex-col justify-between h-full items-center" style={{ position: 'relative', height: '100%', padding: '6px 16px' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                          {/* Opening quote, absolutely positioned to the left, aligned with top of text */}
                          {design.showQuotes && (
                            <span style={{
                              position: 'absolute',
                              left: -8,
                              top: -16,
                              fontSize: 68,
                              color: lightenHex(design.accentColor, 0.7),
                              opacity: 0.4,
                              fontFamily: 'Georgia, Times, \'Times New Roman\', serif',
                              lineHeight: 1,
                              zIndex: 1,
                            }}>“</span>
                          )}
                          {/* Closing quote, absolutely positioned to the right, aligned with bottom of text */}
                          {design.showQuotes && (
                            <span style={{
                              position: 'absolute',
                              right: 0,
                              bottom: -56,
                              fontSize: 68,
                              color: lightenHex(design.accentColor, 0.7),
                              opacity: 0.4,
                              fontFamily: 'Georgia, Times, \'Times New Roman\', serif',
                              lineHeight: 1,
                              zIndex: 1,
                            }}>”</span>
                          )}
                          <div className="flex flex-col items-center justify-center w-full px-4 md:px-8" style={{ paddingLeft: 16, paddingRight: 16 }}>
                            <div className="flex items-center justify-center mb-2 mt-1">
                              {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && renderStars(review.star_rating)}
                            </div>
                            <div className="w-full text-center" style={{ fontSize: 14, lineHeight: design.lineSpacing, color: design.bodyTextColor }}>
                              {review.review_content}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 w-full mt-auto">
                          <span
                            className="font-semibold"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                            style={{ fontSize: design.attributionFontSize * 0.85, color: design.nameTextColor }}
                          >
                            <span itemProp="name">
                              {review.first_name} {review.last_name}
                            </span>
                          </span>
                          <span
                            className="text-xs"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                            style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                          >
                            <span itemProp="jobTitle">
                              {review.reviewer_role}
                            </span>
                          </span>
                          {design.showRelativeDate && review.created_at && (
                            <span className="text-xs text-gray-400 mt-1">
                              {getRelativeTime(review.created_at)}
                              {review.platform && review.platform !== 'custom' ? ` via ${review.platform}` : ''}
                            </span>
                          )}
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
            className="rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition z-10 mx-2 order-3 sm:order-none"
            aria-label="Next"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              aspectRatio: '1 / 1',
              background: navArrowBg,
              backdropFilter: 'blur(2px)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="7.5,3 14.5,10 7.5,17" fill={design.accentColor || '#111'} />
            </svg>
          </button>
          <div className="pr-widget-pagination flex justify-center order-2 sm:order-none w-full mt-4 sm:mt-0" />
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

  const cardBg = design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1);
  const accent = design.accentColor;
  const navArrowBg = design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, 0.4);
  const navArrowBorder = navArrowBg;
  const buttonBg = submitHover
    ? (design.bgColor === 'transparent' ? 'rgba(255,255,255,0.2)' : hexToRgba(design.bgColor, 0.2))
    : navArrowBg;
  const buttonStyle = {
    display: 'inline-block',
    border: `2px solid ${navArrowBorder}`,
    background: buttonBg,
    borderRadius: design.borderRadius,
    padding: '4px 16px',
    fontWeight: 500,
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    transform: 'translateX(7px)',
  };

  return (
    <>
      {/* Get more reviews! Widget by PromptReviews.app */}
      <div
        className="flex flex-col items-center"
        style={{ fontFamily: FONT_FAMILIES[design.font] || 'Inter, sans-serif' }}
        data-pr-identifier="PromptReviews.app"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center w-full max-w-3xl mx-auto px-4 gap-4 relative">
          <button
            ref={prevRef}
            className="rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition order-1 sm:order-none sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 sm:-ml-16 z-10"
            aria-label="Previous"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              aspectRatio: '1 / 1',
              background: navArrowBg,
              backdropFilter: 'blur(2px)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="12.5,3 5.5,10 12.5,17" fill={design.accentColor || '#111'} />
            </svg>
          </button>
          <div className="flex-1 flex justify-center order-2 sm:order-none">
            <Swiper
              key={String(design.autoAdvance)}
              onSwiper={setSwiperInstance}
              modules={[
                Navigation,
                Pagination,
                A11y,
                ...(design.autoAdvance ? [Autoplay] : [])
              ]}
              spaceBetween={30}
              slidesPerView={1}
              navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
              pagination={{ clickable: true, el: '.pr-widget-pagination' }}
              {...(design.autoAdvance ? { autoplay: {
                delay: (design.slideshowSpeed ?? 4) * 1000,
                disableOnInteraction: false,
              }} : {})}
              className="max-w-3xl w-full"
            >
              {reviews.map((review, index) => (
                <SwiperSlide key={review.id || index}>
                  <div className="flex justify-center w-full">
                    <article
                      className="flex flex-col flex-1 items-center gap-4 py-6 relative bg-white rounded-3xl w-full max-w-2xl px-4 md:px-6 justify-center"
                      style={{
                        background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                        color: design.textColor,
                        minHeight: 320,
                        border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                        borderRadius: design.borderRadius,
                        boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                      }}
                      itemScope
                      itemType="https://schema.org/Review"
                    >
                      <div className="flex flex-col flex-1 w-full h-full" style={{ position: 'relative', padding: '0 16px' }}>
                        <div className="flex-1 flex flex-col items-center justify-center w-full" style={{ position: 'relative', width: '100%' }}>
                          {design.showQuotes && (
                            <span style={{
                              position: 'absolute',
                              left: 16,
                              top: 32,
                              fontSize: 68,
                              color: lightenHex(design.accentColor, 0.7),
                              opacity: 0.4,
                              fontFamily: 'Georgia, Times, \'Times New Roman\', serif',
                              lineHeight: 1,
                              zIndex: 1,
                            }}>“</span>
                          )}
                          {design.showQuotes && (
                            <span style={{
                              position: 'absolute',
                              right: 0,
                              bottom: -56,
                              fontSize: 68,
                              color: lightenHex(design.accentColor, 0.7),
                              opacity: 0.4,
                              fontFamily: 'Georgia, Times, \'Times New Roman\', serif',
                              lineHeight: 1,
                              zIndex: 1,
                            }}>”</span>
                          )}
                          <div className="flex flex-col items-center justify-center w-full min-h-[180px]">
                            <div className="flex items-center justify-center mb-2 mt-1">
                              {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && renderStars(review.star_rating)}
                            </div>
                            <div className="flex items-center justify-center w-full">
                              <div className="w-full text-center" style={{ fontSize: 16, lineHeight: design.lineSpacing, color: design.bodyTextColor }}>
                                {review.review_content}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 w-full mt-4">
                          <span
                            className="font-semibold"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                            style={{ fontSize: design.attributionFontSize * 0.85, color: design.nameTextColor }}
                          >
                            <span itemProp="name">
                              {review.first_name} {review.last_name}
                            </span>
                          </span>
                          <span
                            className="text-xs"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                            style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                          >
                            <span itemProp="jobTitle">
                              {review.reviewer_role}
                            </span>
                          </span>
                          {design.showRelativeDate && review.created_at && (
                            <span className="text-xs text-gray-400 mt-1">
                              {getRelativeTime(review.created_at)}
                              {review.platform && review.platform !== 'custom' ? ` via ${review.platform}` : ''}
                            </span>
                          )}
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
            className="rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition order-3 sm:order-none sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 sm:-mr-16 z-10"
            aria-label="Next"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              aspectRatio: '1 / 1',
              background: navArrowBg,
              backdropFilter: 'blur(2px)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="7.5,3 14.5,10 7.5,17" fill={design.accentColor || '#111'} />
            </svg>
          </button>
        </div>
        <div className="pr-widget-pagination flex justify-center mt-6" />
      </div>
    </>
  );
};

// PhotoWidget implementation
const PhotoWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  // Debug log
  console.log('PhotoWidget data:', data);
  console.log('PhotoWidget design:', design);
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

  const cardBg = design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1);
  const accent = design.accentColor;
  const navArrowBg = design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, 0.4);
  const navArrowBorder = navArrowBg;
  const buttonBg = submitHover
    ? (design.bgColor === 'transparent' ? 'rgba(255,255,255,0.2)' : hexToRgba(design.bgColor, 0.2))
    : navArrowBg;
  const buttonStyle = {
    display: 'inline-block',
    border: `2px solid ${navArrowBorder}`,
    background: buttonBg,
    color: accent,
    borderRadius: design.borderRadius,
    padding: '4px 16px',
    fontWeight: 500,
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    transform: 'translateX(7px)',
  };

  return (
    <>
      {/* Get more reviews! Widget by PromptReviews.app */}
      <div
        className="flex flex-col items-center"
        style={{ fontFamily: FONT_FAMILIES[design.font] || 'Inter, sans-serif' }}
        data-pr-identifier="PromptReviews.app"
      >
        <div className="flex flex-row items-center justify-center gap-6 sm:gap-15 px-8 md:px-16 w-full max-w-6xl mx-auto">
          <button
            ref={prevRef}
            className="rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition z-10"
            aria-label="Previous"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              aspectRatio: '1 / 1',
              background: navArrowBg,
              backdropFilter: 'blur(2px)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="12.5,3 5.5,10 12.5,17" fill={design.accentColor || '#111'} />
            </svg>
          </button>
          <div className="flex-1 flex justify-center">
            <Swiper
              key={String(design.autoAdvance)}
              onSwiper={setSwiperInstance}
              modules={[
                Navigation,
                Pagination,
                A11y,
                ...(design.autoAdvance ? [Autoplay] : [])
              ]}
              spaceBetween={30}
              slidesPerView={1}
              navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
              pagination={{ clickable: true, el: '.pr-widget-pagination' }}
              {...(design.autoAdvance ? { autoplay: {
                delay: (design.slideshowSpeed ?? 4) * 1000,
                disableOnInteraction: false,
              }} : {})}
              className="max-w-3xl w-full"
            >
              {reviews.map((review, index) => (
                <SwiperSlide key={review.id || index}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <article
                      className="flex flex-col sm:flex-row items-stretch h-auto sm:h-[320px] bg-white rounded-3xl w-full px-0 md:px-0 justify-center flex-1 shadow"
                      style={{
                        background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                        color: design.textColor,
                        minHeight: 320,
                        maxHeight: 320,
                        height: 320,
                        border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                        borderRadius: design.borderRadius,
                        boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                        overflow: 'hidden',
                      }}
                      itemScope
                      itemType="https://schema.org/Review"
                    >
                      <div className="pr-widget-photo-img flex items-center justify-center w-2/5 bg-gray-50 rounded-l-2xl overflow-hidden" style={{ minHeight: 180, minWidth: 120 }}>
                        {review.photo_url ? (
                          <img
                            src={review.photo_url}
                            alt={`${review.first_name} ${review.last_name}`}
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
                      <div className="pr-widget-photo-content flex flex-col justify-between h-full items-center" style={{ position: 'relative', height: '100%', paddingLeft: 32, paddingRight: 32, overflow: 'visible' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                          {/* Opening quote, absolutely positioned to the left, aligned with top of text */}
                          {design.showQuotes && (
                            <span style={{
                              position: 'absolute',
                              left: -8,
                              top: -16,
                              fontSize: 68,
                              color: lightenHex(design.accentColor, 0.7),
                              opacity: 0.4,
                              fontFamily: 'Georgia, Times, \'Times New Roman\', serif',
                              lineHeight: 1,
                              zIndex: 1,
                            }}>“</span>
                          )}
                          {/* Closing quote, absolutely positioned to the right, aligned with bottom of text */}
                          {design.showQuotes && (
                            <span style={{
                              position: 'absolute',
                              right: 0,
                              bottom: -56,
                              fontSize: 68,
                              color: lightenHex(design.accentColor, 0.7),
                              opacity: 0.4,
                              fontFamily: 'Georgia, Times, \'Times New Roman\', serif',
                              lineHeight: 1,
                              zIndex: 1,
                            }}>”</span>
                          )}
                          <div className="flex flex-col items-center justify-center w-full h-[180px] flex-1">
                            <div className="flex items-center justify-center mb-2 mt-1">
                              {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && renderStars(review.star_rating)}
                            </div>
                            <div className="flex items-center justify-center w-full">
                              <div className="w-full text-center" style={{ fontSize: 14, lineHeight: design.lineSpacing, color: design.bodyTextColor }}>
                                {review.review_content}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="pr-widget-photo-author" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto', gap: 0 }}>
                          <span
                            className="font-semibold"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                            style={{ fontSize: design.attributionFontSize * 0.85, color: design.nameTextColor, marginBottom: 2 }}
                          >
                            <span itemProp="name">
                              {review.first_name} {review.last_name}
                            </span>
                          </span>
                          <span
                            className="text-xs"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                            style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor, marginBottom: 2 }}
                          >
                            <span itemProp="jobTitle">
                              {review.reviewer_role}
                            </span>
                          </span>
                          {design.showRelativeDate && review.created_at && (
                            <span className="text-xs text-gray-400 mt-1" style={{ marginBottom: 0 }}>
                              {getRelativeTime(review.created_at)}
                              {review.platform && review.platform !== 'custom' ? ` via ${review.platform}` : ''}
                            </span>
                          )}
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
            className="rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition z-10"
            aria-label="Next"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              aspectRatio: '1 / 1',
              background: navArrowBg,
              backdropFilter: 'blur(2px)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="7.5,3 14.5,10 7.5,17" fill={design.accentColor || '#111'} />
            </svg>
          </button>
        </div>
      </div>
      <div className="pr-widget-pagination flex justify-center mt-6" />
    </>
  );
};

// Initialize widgets
document.addEventListener('DOMContentLoaded', () => {
  const widgetElements = document.querySelectorAll('.promptreviews-widget');
  widgetElements.forEach((element) => {
    const widgetId = element.getAttribute('data-widget');
    if (widgetId) {
      const root = ReactDOM.createRoot(element);
      root.render(<WidgetContainer widgetId={widgetId} />);
    }
  });
});

// Helper function to parse widget ID
function parseWidgetId(widgetId: string) {
  const [accountId, widgetType, timestamp] = widgetId.split('_');
  return {
    accountId,
    widgetType,
    timestamp: parseInt(timestamp)
  };
}

export { MultiWidget, SingleWidget, PhotoWidget, getDesignWithDefaults, hexToRgba, getRelativeTime, renderStars, lightenHex, injectWidgetResponsiveCSS, injectWidgetNavCSS }; 