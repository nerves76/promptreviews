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

// Widget component for single card
const SingleWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  const review = reviews[0]; // Single widget shows only the first review

  return (
    <div
      style={{
        background: design.bgColor,
        color: design.textColor,
        borderRadius: design.borderRadius,
        boxShadow: design.shadow ? `0 4px 6px rgba(0, 0, 0, 0.1)` : 'none',
        padding: '20px',
        maxWidth: design.width,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {design.showQuotes && (
        <>
          <span style={{ position: 'absolute', left: '10px', top: '10px', fontSize: '48px', color: design.accentColor, opacity: 0.5 }}>
            "
          </span>
          <span style={{ position: 'absolute', right: '10px', bottom: '10px', fontSize: '48px', color: design.accentColor, opacity: 0.5 }}>
            "
          </span>
        </>
      )}
      <p style={{ fontSize: design.quoteFontSize, lineHeight: design.lineSpacing }}>
        {review.review_content}
      </p>
      <div style={{ marginTop: '10px' }}>
        {typeof review.star_rating === 'number' && renderStars(review.star_rating)}
        <span style={{ fontWeight: 'bold', color: design.nameTextColor }}>
          {review.first_name} {review.last_name}
        </span>
        <span style={{ color: design.roleTextColor, marginLeft: '5px' }}>
          {review.reviewer_role}
        </span>
        {design.showRelativeDate && review.created_at && (
          <span style={{ color: design.roleTextColor, marginLeft: '5px' }}>
            {getRelativeTime(review.created_at)}
          </span>
        )}
        {review.platform && (
          <span style={{ color: '#888', marginLeft: '5px', fontSize: 12 }}>
            {review.platform}
          </span>
        )}
      </div>
    </div>
  );
};

// Widget component for multi card
const MultiWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  return (
    <div style={{ maxWidth: design.width, margin: '0 auto', position: 'relative' }}>
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
        className="promptreviews-swiper"
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.id}>
            <div
              style={{
                background: design.bgColor,
                color: design.textColor,
                borderRadius: design.borderRadius,
                boxShadow: design.shadow ? `0 4px 6px rgba(0, 0, 0, 0.1)` : 'none',
                padding: '20px',
                width: '100%',
                position: 'relative',
                minHeight: 320,
                border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                overflow: 'hidden',
              }}
            >
              {design.showQuotes && (
                <>
                  <span style={{ position: 'absolute', left: '10px', top: '10px', fontSize: '48px', color: design.accentColor, opacity: 0.5 }}>
                    "
                  </span>
                  <span style={{ position: 'absolute', right: '10px', bottom: '10px', fontSize: '48px', color: design.accentColor, opacity: 0.5 }}>
                    "
                  </span>
                </>
              )}
              <p style={{ fontSize: design.quoteFontSize, lineHeight: design.lineSpacing }}>
                {review.review_content}
              </p>
              <div style={{ marginTop: '10px' }}>
                {typeof review.star_rating === 'number' && renderStars(review.star_rating)}
                <span style={{ fontWeight: 'bold', color: design.nameTextColor }}>
                  {review.first_name} {review.last_name}
                </span>
                <span style={{ color: design.roleTextColor, marginLeft: '5px' }}>
                  {review.reviewer_role}
                </span>
                {design.showRelativeDate && review.created_at && (
                  <span style={{ color: design.roleTextColor, marginLeft: '5px' }}>
                    {getRelativeTime(review.created_at)}
                  </span>
                )}
                {review.platform && (
                  <span style={{ color: '#888', marginLeft: '5px', fontSize: 12 }}>
                    {review.platform}
                  </span>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

// Widget component for photo card
const PhotoWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  return (
    <div style={{ maxWidth: design.width, margin: '0 auto', position: 'relative' }}>
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
        className="promptreviews-swiper"
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.id}>
            <div
              style={{
                display: 'flex',
                background: design.bgColor,
                color: design.textColor,
                borderRadius: design.borderRadius,
                boxShadow: design.shadow ? `0 4px 6px rgba(0, 0, 0, 0.1)` : 'none',
                padding: '20px',
                width: '100%',
                minHeight: 320,
                border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                overflow: 'hidden',
              }}
            >
              {review.photo_url && (
                <img
                  src={review.photo_url}
                  alt={`${review.first_name} ${review.last_name}`}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    marginRight: '20px',
                  }}
                />
              )}
              <div>
                {design.showQuotes && (
                  <>
                    <span style={{ position: 'absolute', left: '10px', top: '10px', fontSize: '48px', color: design.accentColor, opacity: 0.5 }}>
                      "
                    </span>
                    <span style={{ position: 'absolute', right: '10px', bottom: '10px', fontSize: '48px', color: design.accentColor, opacity: 0.5 }}>
                      "
                    </span>
                  </>
                )}
                <p style={{ fontSize: design.quoteFontSize, lineHeight: design.lineSpacing }}>
                  {review.review_content}
                </p>
                <div style={{ marginTop: '10px' }}>
                  {typeof review.star_rating === 'number' && renderStars(review.star_rating)}
                  <span style={{ fontWeight: 'bold', color: design.nameTextColor }}>
                    {review.first_name} {review.last_name}
                  </span>
                  <span style={{ color: design.roleTextColor, marginLeft: '5px' }}>
                    {review.reviewer_role}
                  </span>
                  {design.showRelativeDate && review.created_at && (
                    <span style={{ color: design.roleTextColor, marginLeft: '5px' }}>
                      {getRelativeTime(review.created_at)}
                    </span>
                  )}
                  {review.platform && (
                    <span style={{ color: '#888', marginLeft: '5px', fontSize: 12 }}>
                      {review.platform}
                    </span>
                  )}
                </div>
              </div>
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