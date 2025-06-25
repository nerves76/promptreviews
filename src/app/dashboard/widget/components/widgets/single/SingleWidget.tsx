import React, { useEffect, useRef, useMemo } from 'react';
import { WidgetData, DesignState } from './index';
import { createReviewCardHTML } from '../../shared/card-generator';

// Remove the incorrect CSS import - we'll load it dynamically
// import '../../../../../../../public/widgets/single/single-widget.css';

interface SingleWidgetProps {
  data: any;
  design?: DesignState;
}

const SingleWidget: React.FC<SingleWidgetProps> = ({ data, design }) => {
  // Transform the database widget data to the expected format
  const widgetData: WidgetData = {
    id: data.id,
    type: data.widget_type as 'multi' | 'single' | 'photo',
    design: data.theme || {},
    reviews: data.reviews || [],
    slug: data.slug || 'example-business'
  };

  const { reviews, slug } = widgetData;
  
  // Memoize the design to prevent unnecessary re-renders
  const currentDesign = useMemo(() => {
    return design || data.theme || {};
  }, [design, data.theme]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    console.log('🎯 SingleWidget: Component mounted with data:', { 
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
      if (document.querySelector('link[href="/widgets/single/single-widget.css"]')) {
        console.log('✅ SingleWidget: CSS already loaded');
        return Promise.resolve();
      }

      console.log('📥 SingleWidget: Loading CSS from /widgets/single/single-widget.css...');
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/widgets/single/single-widget.css?v=${new Date().getTime()}`;
        link.onload = () => {
          console.log('✅ SingleWidget: CSS loaded successfully');
          resolve();
        };
        link.onerror = (error) => {
          console.error('❌ SingleWidget: Failed to load CSS:', error);
          reject(error);
        };
        document.head.appendChild(link);
      });
    };
    
    // Load the widget script if not already loaded
    const loadWidgetScript = (): Promise<void> => {
      if (window.PromptReviewsSingle?.initializeWidget) {
        console.log('✅ SingleWidget: Widget script already loaded');
        return Promise.resolve();
      }

      console.log('📥 SingleWidget: Loading widget script from /widgets/single/widget-embed.js...');
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/widgets/single/widget-embed.js?v=${new Date().getTime()}`;
        script.onload = () => {
          console.log('✅ SingleWidget: Widget script loaded successfully');
          // Wait for the script to fully initialize and expose the function
          const checkFunction = () => {
            if (window.PromptReviewsSingle?.initializeWidget) {
              console.log('🔧 SingleWidget: initializeWidget function is available');
              resolve();
            } else {
              console.log('⏳ SingleWidget: Waiting for initializeWidget function...');
              setTimeout(checkFunction, 100);
            }
          };
          
          // Start checking after a short delay
          setTimeout(checkFunction, 100);
        };
        script.onerror = (error) => {
          console.error('❌ SingleWidget: Failed to load widget script:', error);
          reject(error);
        };
        document.head.appendChild(script);
      });
    };

    const initializeWidget = async () => {
      try {
        // Check if component is still mounted before proceeding
        if (!isMounted) {
          console.log('🛑 SingleWidget: Component unmounted, skipping initialization');
          return;
        }
        
        console.log('🚀 SingleWidget: Starting initialization...');
        await Promise.all([loadWidgetCSS(), loadWidgetScript()]);
        
        // Check again after loading dependencies
        if (!isMounted) {
          console.log('🛑 SingleWidget: Component unmounted after loading dependencies');
          return;
        }
        
        // Add a small delay to ensure the script is fully initialized
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Final check before initialization
        if (!isMounted) {
          console.log('🛑 SingleWidget: Component unmounted before initialization');
          return;
        }
        
        console.log('🔍 SingleWidget: Checking dependencies...');
        console.log('🔍 SingleWidget: Container ref:', !!containerRef.current);
        console.log('🔍 SingleWidget: Container ID:', containerRef.current?.id);
        console.log('🔍 SingleWidget: PromptReviewsSingle:', !!window.PromptReviewsSingle);
        console.log('🔍 SingleWidget: initializeWidget function:', !!window.PromptReviewsSingle?.initializeWidget);
        console.log('🔍 SingleWidget: Reviews:', reviews);
        console.log('🔍 SingleWidget: Design:', currentDesign);
        
        if (containerRef.current && window.PromptReviewsSingle?.initializeWidget) {
          console.log('🚀 SingleWidget: Using initializeWidget API');
          window.PromptReviewsSingle.initializeWidget(
            containerRef.current.id,
            reviews,
            currentDesign,
            slug || 'example-business'
          );
          console.log('✅ SingleWidget: Widget initialization completed');
        } else {
          console.error('❌ SingleWidget: Missing dependencies for initialization.');
          console.log('🔍 SingleWidget: Debug info:', {
            containerRef: !!containerRef.current,
            PromptReviewsSingle: !!window.PromptReviewsSingle,
            initializeWidget: !!window.PromptReviewsSingle?.initializeWidget,
            retryCount: retryCountRef.current
          });
          
          // Retry mechanism
          if (retryCountRef.current < maxRetries && isMounted) {
            retryCountRef.current++;
            console.log(`🔄 SingleWidget: Retrying initialization (${retryCountRef.current}/${maxRetries})...`);
            setTimeout(initializeWidget, 500);
          } else {
            console.error('❌ SingleWidget: Max retries reached, giving up');
          }
        }
      } catch (error) {
        console.error('❌ SingleWidget: Failed to initialize widget:', error);
        
        // Retry on error
        if (retryCountRef.current < maxRetries && isMounted) {
          retryCountRef.current++;
          console.log(`🔄 SingleWidget: Retrying after error (${retryCountRef.current}/${maxRetries})...`);
          setTimeout(initializeWidget, 1000);
        }
      }
    };

    if (reviews && currentDesign) {
      retryCountRef.current = 0; // Reset retry count
      initializeWidget();
    } else {
      console.log('⚠️ SingleWidget: Missing reviews or design data:', { reviews: !!reviews, design: !!currentDesign });
    }

    // Cleanup function
    return () => {
      console.log('🧹 SingleWidget: Component unmounting, setting cleanup flag');
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
      className="pr-widget-container pr-single-widget"
    />
  );
};

export default SingleWidget; 