import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserClient } from '@supabase/ssr';

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

// Widget component for single card
const SingleWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const { design, reviews } = data;
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
      </div>
    </div>
  );
};

// Widget component for multi card
const MultiWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const { design, reviews } = data;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
      {reviews.map((review) => (
        <div
          key={review.id}
          style={{
            background: design.bgColor,
            color: design.textColor,
            borderRadius: design.borderRadius,
            boxShadow: design.shadow ? `0 4px 6px rgba(0, 0, 0, 0.1)` : 'none',
            padding: '20px',
            width: '300px',
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
          </div>
        </div>
      ))}
    </div>
  );
};

// Widget component for photo card
const PhotoWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const { design, reviews } = data;
  const review = reviews[0]; // Photo widget shows only the first review

  return (
    <div
      style={{
        display: 'flex',
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
        </div>
      </div>
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

// Entry point
async function init() {
  const container = document.getElementById('promptreviews-widget');
  if (!container) {
    console.error('Widget container not found');
    return;
  }

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