import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserClient } from '@supabase/ssr';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { WidgetData } from '../app/dashboard/widget/components/shared/types';
import { getDesignWithDefaults } from '../app/dashboard/widget/components/shared/utils';
import { injectWidgetResponsiveCSS, injectSwiperCSS, injectSwiperNavCSS, injectWidgetNavCSS } from '../app/dashboard/widget/components/shared/styles';
import SingleWidget from '../app/dashboard/widget/components/widgets/single/SingleWidget';
import MultiWidget from '../app/dashboard/widget/components/widgets/multi/MultiWidget';
import PhotoWidget from '../app/dashboard/widget/components/widgets/photo/PhotoWidget';

// Add type declaration for window
declare global {
  interface Window {
    initializePromptReviewsWidget: (widgetId: string) => Promise<void>;
  }
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

  return data as WidgetData;
}

// Main widget renderer component
const WidgetRenderer: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design, data.type);

  useEffect(() => {
    injectWidgetResponsiveCSS();
    injectSwiperCSS();
    injectSwiperNavCSS();
    injectWidgetNavCSS();
  }, []);

  const renderWidget = () => {
    switch (data.type) {
      case 'single':
        return <SingleWidget data={data} />;
      case 'multi':
        return <MultiWidget data={data} />;
      case 'photo':
        return <PhotoWidget data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="widget-container" style={{ fontFamily: design.typography.fontFamily }}>
      {renderWidget()}
    </div>
  );
};

// Initialize widget
async function initializeWidget(widgetId: string) {
  const data = await fetchWidgetData(widgetId);
  if (!data) {
    console.error('Failed to fetch widget data');
    return;
  }

  const container = document.getElementById('promptreviews-widget');
  if (!container) {
    console.error('Widget container not found');
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(<WidgetRenderer data={data} />);
}

// Export for external use
window.initializePromptReviewsWidget = initializeWidget;

export { MultiWidget, SingleWidget, PhotoWidget, injectWidgetNavCSS }; 