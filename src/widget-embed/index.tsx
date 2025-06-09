import React from 'react';
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

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} days ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} years ago`;
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

// Replace MultiWidget, SingleWidget, and PhotoWidget with dashboard-matching markup
const MultiWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', position: 'relative' }}>
      <Swiper
        modules={[Navigation, Pagination, A11y, Autoplay]}
        spaceBetween={30}
        slidesPerView={3}
        navigation
        pagination={{ clickable: true }}
        autoplay={design.autoAdvance ? {
          delay: (design.slideshowSpeed ?? 4) * 1000,
          disableOnInteraction: false,
        } : false}
        breakpoints={{
          320: { slidesPerView: 1, spaceBetween: 20 },
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 30 },
        }}
        className="max-w-5xl w-full"
      >
        {reviews.map((review, index) => (
          <SwiperSlide key={review.id || index}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <article
                className="flex flex-col items-center gap-4 py-6 relative bg-white rounded-3xl w-full px-4 md:px-[15px] justify-center flex-1"
                style={{
                  background:
                    design.bgColor === 'transparent'
                      ? 'none'
                      : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
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
                <div className="flex items-center justify-center mb-2 mt-1">
                  {typeof review.star_rating === 'number' && renderStars(review.star_rating)}
                </div>
                <p
                  className="text-lg mb-2 md:mb-4 px-1 md:px-2 text-center"
                  itemProp="reviewBody"
                  style={{
                    lineHeight: design.lineSpacing,
                    fontSize: 14,
                    color: design.bodyTextColor,
                  }}
                >
                  {review.review_content}
                </p>
                <div className="flex flex-col items-center gap-1 w-full mt-auto">
                  <span
                    className="font-semibold text-indigo-700"
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
                    className="text-xs text-gray-500"
                    itemProp="author"
                    itemScope
                    itemType="https://schema.org/Person"
                    style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                  >
                    <span itemProp="jobTitle">
                      {review.reviewer_role}
                    </span>
                  </span>
                  {design.showRelativeDate && review.created_at && review.platform && (
                    <span className="text-xs text-gray-400 mt-1">
                      {getRelativeTime(review.created_at)} via {review.platform}
                    </span>
                  )}
                </div>
              </article>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const SingleWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', position: 'relative' }}>
      <Swiper
        modules={[Navigation, Pagination, A11y, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={design.autoAdvance ? {
          delay: (design.slideshowSpeed ?? 4) * 1000,
          disableOnInteraction: false,
        } : false}
        className="max-w-3xl w-full"
      >
        {reviews.map((review, index) => (
          <SwiperSlide key={review.id || index}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <article
                className="flex flex-col sm:flex-col items-center gap-4 py-6 relative bg-white rounded-3xl w-full px-4 sm:px-[15px] justify-center flex-1 h-auto sm:h-[320px] shadow"
                style={{
                  background:
                    design.bgColor === 'transparent'
                      ? 'none'
                      : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                  color: design.textColor,
                  minHeight: 320,
                  maxHeight: 320,
                  height: 'auto',
                  border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                  borderRadius: design.borderRadius,
                  boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                  overflow: 'hidden',
                }}
                itemScope
                itemType="https://schema.org/Review"
              >
                {design.showQuotes && (
                  <>
                    <span
                      className="absolute left-4 top-4 z-0 pointer-events-none"
                      style={{ width: 96, height: 96, opacity: 0.5 }}
                    >
                      <svg
                        width="96"
                        height="96"
                        viewBox="0 0 96 96"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ display: 'block' }}
                      >
                        <text
                          y="76"
                          fontSize="96"
                          fill={lightenHex(design.accentColor, 0.7)}
                          fontFamily="serif"
                        >
                          {'\u201C'}
                        </text>
                      </svg>
                    </span>
                    <span
                      className="absolute right-4 bottom-4 z-0 pointer-events-none"
                      style={{ width: 96, height: 96, opacity: 0.5 }}
                    >
                      <svg
                        width="96"
                        height="96"
                        viewBox="0 0 96 96"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ display: 'block' }}
                      >
                        <text
                          y="76"
                          fontSize="96"
                          fill={lightenHex(design.accentColor, 0.7)}
                          fontFamily="serif"
                        >
                          {'\u201D'}
                        </text>
                      </svg>
                    </span>
                  </>
                )}
                <div className="flex items-center justify-center mb-2 mt-1">
                  {typeof review.star_rating === 'number' && renderStars(review.star_rating)}
                </div>
                <p
                  className="text-lg mb-2 md:mb-4 px-1 md:px-2 text-center"
                  itemProp="reviewBody"
                  style={{
                    lineHeight: design.lineSpacing,
                    color: design.bodyTextColor,
                  }}
                >
                  {review.review_content}
                </p>
                <div className="flex flex-col items-center gap-1 w-full mt-auto">
                  <span
                    className="font-semibold text-indigo-700"
                    itemProp="author"
                    itemScope
                    itemType="https://schema.org/Person"
                    style={{ fontSize: design.attributionFontSize, color: design.nameTextColor }}
                  >
                    <span itemProp="name">
                      {review.first_name} {review.last_name}
                    </span>
                  </span>
                  <span
                    className="text-xs text-gray-500"
                    itemProp="author"
                    itemScope
                    itemType="https://schema.org/Person"
                    style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                  >
                    <span itemProp="jobTitle">
                      {review.reviewer_role}
                    </span>
                  </span>
                  {design.showRelativeDate && review.created_at && review.platform && (
                    <span className="text-xs text-gray-400 mt-1">
                      {getRelativeTime(review.created_at)} via {review.platform}
                    </span>
                  )}
                </div>
              </article>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

const PhotoWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', position: 'relative' }}>
      <Swiper
        modules={[Navigation, Pagination, A11y, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={design.autoAdvance ? {
          delay: (design.slideshowSpeed ?? 4) * 1000,
          disableOnInteraction: false,
        } : false}
        className="max-w-3xl w-full"
      >
        {reviews.map((review, index) => (
          <SwiperSlide key={review.id || index}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <article
                className="flex flex-col sm:flex-row items-stretch h-auto sm:h-[320px] bg-white rounded-3xl w-full px-0 md:px-0 justify-center flex-1 shadow"
                style={{
                  background:
                    design.bgColor === 'transparent'
                      ? 'none'
                      : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
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
                <div className="flex items-center justify-center bg-gray-100 overflow-hidden w-full sm:w-1/3 min-w-[200px] h-48 sm:h-full">
                  {review.photo_url ? (
                    <img
                      src={review.photo_url}
                      alt="Reviewer photo"
                      className="object-cover w-full h-full"
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400 bg-gray-100">
                      No Photo
                    </div>
                  )}
                </div>
                {/* Testimonial on right (or below on mobile) */}
                <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-4">
                  <p
                    className="text-base md:text-lg mb-2 md:mb-4 px-1 md:px-2 text-left"
                    itemProp="reviewBody"
                    style={{
                      lineHeight: design.lineSpacing,
                      color: design.bodyTextColor,
                    }}
                  >
                    {review.review_content}
                  </p>
                  <div className="flex flex-col items-start gap-1 w-full mt-auto">
                    <span
                      className="font-semibold text-indigo-700"
                      itemProp="author"
                      itemScope
                      itemType="https://schema.org/Person"
                      style={{ fontSize: design.attributionFontSize, color: design.nameTextColor }}
                    >
                      <span itemProp="name">
                        {review.first_name} {review.last_name}
                      </span>
                    </span>
                    <span
                      className="text-xs text-gray-500"
                      itemProp="author"
                      itemScope
                      itemType="https://schema.org/Person"
                      style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                    >
                      <span itemProp="jobTitle">
                        {review.reviewer_role}
                      </span>
                    </span>
                    {design.showRelativeDate && review.created_at && review.platform && (
                      <span className="text-xs text-gray-400 mt-1">
                        {getRelativeTime(review.created_at)} via {review.platform}
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
  );
};

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
function injectSwiperCSS() {
  const SWIPER_CSS_URL = 'https://cdn.jsdelivr.net/npm/swiper@11.1.0/swiper-bundle.min.css';
  if (!document.querySelector('link[data-pr-swiper]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = SWIPER_CSS_URL;
    link.setAttribute('data-pr-swiper', 'true');
    document.head.appendChild(link);
  }
}

// Entry point
async function init() {
  const container = document.getElementById('promptreviews-widget');
  if (!container) {
    console.error('Widget container not found');
    return;
  }

  injectSwiperCSS();

  const widgetId = container.getAttribute('data-widget');
  if (!widgetId) {
    console.error('Widget ID not found');
    return;
  }

  const data = await fetchWidgetData(widgetId);
  if (!data) {
    console.error('Failed to fetch widget data');
    return;
  }

  ReactDOM.createRoot(container).render(<WidgetRenderer data={data} />);
}

// Start the widget
init(); 