import React from 'react';
import ReactDOM from 'react-dom/client';
import { MultiWidget, SingleWidget, PhotoWidget, getDesignWithDefaults, hexToRgba, getRelativeTime, renderStars, lightenHex } from './index';
import { createBrowserClient } from '@supabase/ssr';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Helper to fetch widget data
async function fetchWidgetData(widgetId: string) {
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
  const { data: promptPage } = await supabase
    .from('prompt_pages')
    .select('slug')
    .eq('account_id', data.account_id)
    .eq('is_universal', true)
    .single();
  data.universalPromptSlug = promptPage?.slug || null;
  return {
    ...data,
    reviews: reviews || [],
  };
}

// Entry point for embedding
async function init() {
  const container = document.getElementById('promptreviews-widget');
  if (!container) {
    console.error('Widget container not found');
    return;
  }
  container.classList.add('pr-widget-root');
  container.style.width = '100%';
  container.style.maxWidth = '1200px';
  container.style.margin = '0 auto';
  container.style.position = 'relative';
  // Wait for CSS to load
  // (Assume CSS injection functions are available via import)
  // injectSwiperCSS();
  // injectSwiperNavCSS();
  // injectWidgetResponsiveCSS();
  // injectWidgetNavCSS();
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
  // Choose widget type
  let WidgetComponent = MultiWidget;
  if (data.widget_type === 'single') WidgetComponent = SingleWidget;
  if (data.widget_type === 'photo') WidgetComponent = PhotoWidget;
  ReactDOM.createRoot(container).render(<WidgetComponent data={data} />);
}

init(); 