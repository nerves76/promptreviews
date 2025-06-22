import React, { useEffect, useRef } from 'react';
import { WidgetData, DesignState } from './index';
import { createReviewCardHTML } from '../../shared/card-generator';

// Remove the incorrect CSS import - we'll load it dynamically
// import '../../../../../../../public/widgets/multi/multi-widget.css';

interface MultiWidgetProps {
  data: any;
  design?: DesignState;
}

const MultiWidget: React.FC<MultiWidgetProps> = ({ data, design }) => {
  // Transform the database widget data to the expected format
  const widgetData: WidgetData = {
    id: data.id,
    type: data.widget_type as 'multi' | 'single' | 'photo',
    design: data.theme || {},
    reviews: data.reviews || [],
    slug: data.slug || 'example-business'
  };

  const { reviews, slug } = widgetData;
  // Use the passed design prop if available, otherwise fall back to the widget's saved theme
  const currentDesign = design || data.theme || {};
  const containerRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 10;

  useEffect(() => {
    console.log('🎯 MultiWidget: Component mounted with data:', { 
      widgetId: data.id,
      widgetType: data.widget_type,
      reviewsCount: reviews?.length, 
      design: currentDesign, 
      slug: slug 
    });
    
    // Add a cleanup flag to prevent initialization after unmount
    let isMounted = true;
    
    // Load the CSS if not already loaded
    const loadWidgetCSS = (): Promise<void> => {
      if (document.querySelector('link[href="/widgets/multi/multi-widget.css"]')) {
        console.log('✅ MultiWidget: CSS already loaded');
        return Promise.resolve();
      }

      console.log('📥 MultiWidget: Loading CSS from /widgets/multi/multi-widget.css...');
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/widgets/multi/multi-widget.css?v=${new Date().getTime()}`;
        link.onload = () => {
          console.log('✅ MultiWidget: CSS loaded successfully');
          resolve();
        };
        link.onerror = (error) => {
          console.error('❌ MultiWidget: Failed to load CSS:', error);
          reject(error);
        };
        document.head.appendChild(link);
      });
    };
    
    // Load the widget script if not already loaded
    const loadWidgetScript = (): Promise<void> => {
      if (window.PromptReviews?.initializeWidget) {
        console.log('✅ MultiWidget: Widget script already loaded');
        return Promise.resolve();
      }

      console.log('📥 MultiWidget: Loading widget script from /widgets/multi/widget-embed.js...');
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/widgets/multi/widget-embed.js?v=${new Date().getTime()}`;
        script.onload = () => {
          console.log('✅ MultiWidget: Widget script loaded successfully');
          // Wait a bit for the script to initialize
          setTimeout(() => {
            console.log('🔧 MultiWidget: Available functions:', Object.keys(window.PromptReviews || {}));
            console.log('🔧 MultiWidget: initializeWidget function:', typeof window.PromptReviews?.initializeWidget);
            resolve();
          }, 100);
        };
        script.onerror = (error) => {
          console.error('❌ MultiWidget: Failed to load widget script:', error);
          reject(error);
        };
        document.head.appendChild(script);
      });
    };

    const initializeWidget = async () => {
      try {
        // Check if component is still mounted before proceeding
        if (!isMounted) {
          console.log('🛑 MultiWidget: Component unmounted, skipping initialization');
          return;
        }
        
        console.log('🚀 MultiWidget: Starting initialization...');
        await Promise.all([loadWidgetCSS(), loadWidgetScript()]);
        
        // Check again after loading dependencies
        if (!isMounted) {
          console.log('🛑 MultiWidget: Component unmounted after loading dependencies');
          return;
        }
        
        // Add a small delay to ensure the script is fully initialized
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Final check before initialization
        if (!isMounted) {
          console.log('🛑 MultiWidget: Component unmounted before initialization');
          return;
        }
        
        console.log('🔍 MultiWidget: Checking dependencies...');
        console.log('🔍 MultiWidget: Container ref:', !!containerRef.current);
        console.log('🔍 MultiWidget: Container ID:', containerRef.current?.id);
        console.log('🔍 MultiWidget: PromptReviews:', !!window.PromptReviews);
        console.log('🔍 MultiWidget: initializeWidget function:', !!window.PromptReviews?.initializeWidget);
        console.log('🔍 MultiWidget: Reviews:', reviews);
        console.log('🔍 MultiWidget: Design:', currentDesign);
        
        if (containerRef.current && window.PromptReviews?.initializeWidget) {
          console.log('🚀 MultiWidget: Using initializeWidget API');
          window.PromptReviews.initializeWidget(
            containerRef.current.id,
            reviews,
            currentDesign,
            slug || 'example-business'
          );
          console.log('✅ MultiWidget: Widget initialization completed');
        } else {
          console.error('❌ MultiWidget: Missing dependencies for initialization.');
          console.log('🔍 MultiWidget: Debug info:', {
            containerRef: !!containerRef.current,
            PromptReviews: !!window.PromptReviews,
            initializeWidget: !!window.PromptReviews?.initializeWidget,
            retryCount: retryCountRef.current
          });
          
          // Retry mechanism
          if (retryCountRef.current < maxRetries && isMounted) {
            retryCountRef.current++;
            console.log(`🔄 MultiWidget: Retrying initialization (${retryCountRef.current}/${maxRetries})...`);
            setTimeout(initializeWidget, 500);
          } else {
            console.error('❌ MultiWidget: Max retries reached, giving up');
          }
        }
      } catch (error) {
        console.error('❌ MultiWidget: Failed to initialize widget:', error);
        
        // Retry on error
        if (retryCountRef.current < maxRetries && isMounted) {
          retryCountRef.current++;
          console.log(`🔄 MultiWidget: Retrying after error (${retryCountRef.current}/${maxRetries})...`);
          setTimeout(initializeWidget, 1000);
        }
      }
    };

    if (reviews && currentDesign) {
      retryCountRef.current = 0; // Reset retry count
      initializeWidget();
    } else {
      console.log('⚠️ MultiWidget: Missing reviews or design data:', { reviews: !!reviews, design: !!currentDesign });
    }

    // Cleanup function
    return () => {
      console.log('🧹 MultiWidget: Component unmounting, setting cleanup flag');
      isMounted = false;
    };
  }, [reviews, currentDesign, slug, data.id, data.widget_type]);

  if (!reviews || !currentDesign) {
    return <div className="text-center p-4">Loading widget data...</div>;
  }

  if (reviews.length === 0) {
    return <div className="text-center p-4">No reviews to display.</div>;
  }

  return (
    <div 
      id={`promptreviews-widget-container-${data.id}`}
      ref={containerRef}
      className="pr-widget-container pr-multi-widget"
      style={{ minHeight: '200px' }}
    />
  );
};

export default MultiWidget; 