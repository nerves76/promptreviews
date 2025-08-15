import React, { useEffect, useRef, useMemo } from 'react';
import { WidgetData, DesignState } from './index';
import { createReviewCardHTML } from '../../shared/card-generator';

// Remove the incorrect CSS import - we'll load it dynamically
// import '../../../../../../../public/widgets/multi/multi-widget.css';

interface MultiWidgetProps {
  data: any;
  design?: DesignState;
}

declare global {
  interface Window {
    PromptReviews?: {
      initializeWidget?: (
        containerId: string,
        reviews: any[],
        design: any,
        slug: string
      ) => void;
      // Add other PromptReviews properties if needed
    };
  }
}

const MultiWidget: React.FC<MultiWidgetProps> = ({ data, design }) => {
  // Transform the database widget data to the expected format
  const widgetData: WidgetData = useMemo(() => ({
    id: data.id,
    type: data.type as 'multi' | 'single' | 'photo',
    design: data.theme || {},
    reviews: data.reviews || [],
    slug: data.slug || 'example-business'
  }), [data.id, data.type, data.theme, data.reviews, data.slug]);

  const { reviews, slug } = widgetData;
  
  // Memoize currentDesign to prevent unnecessary re-renders
  const currentDesign = useMemo(() => {
    return design || data.theme || {};
  }, [design, data.theme]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 10;
  const initializedRef = useRef<boolean>(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    
    // Add a cleanup flag to prevent initialization after unmount
    let isMounted = true;
    
    // Load the CSS if not already loaded
    const loadWidgetCSS = (): Promise<void> => {
      if (document.querySelector('link[href="/widgets/multi/multi-widget.css"]')) {

        return Promise.resolve();
      }

      if (isDevelopment) console.log('📥 MultiWidget: Loading CSS from /widgets/multi/multi-widget.css...');
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/widgets/multi/multi-widget.css?v=${new Date().getTime()}`;
        link.onload = () => {

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

        return Promise.resolve();
      }

      if (isDevelopment) console.log('📥 MultiWidget: Loading widget script from /widgets/multi/widget-embed.js...');
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/widgets/multi/widget-embed.js?v=${new Date().getTime()}`;
        script.onload = () => {

          // Wait longer for the script to fully initialize and set up window.PromptReviews
          setTimeout(() => {
            // Check if PromptReviews was properly initialized
            if (window.PromptReviews && typeof window.PromptReviews.initializeWidget === 'function') {

              resolve();
            } else {
              console.error('❌ MultiWidget: PromptReviews not properly initialized');
              reject(new Error('PromptReviews not properly initialized'));
            }
          }, 500);
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
        
        // Prevent multiple initializations
        if (initializedRef.current) {
          console.log('🛑 MultiWidget: Already initialized, skipping');
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
        await new Promise(resolve => setTimeout(resolve, 300));
        
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

          initializedRef.current = true;
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

    if (reviews && reviews.length > 0 && currentDesign && !initializedRef.current) {
      retryCountRef.current = 0; // Reset retry count
      console.log('🚀 MultiWidget: Starting initialization with data:', {
        reviewsCount: reviews?.length,
        designKeys: Object.keys(currentDesign || {}),
        containerId: `promptreviews-widget-container-${data.id}`
      });
      initializeWidget();
    } else {
      console.log('⚠️ MultiWidget: Missing reviews or design data, or already initialized:', { 
        reviews: !!reviews, 
        reviewsCount: reviews?.length,
        design: !!currentDesign,
        designKeys: Object.keys(currentDesign || {}),
        initialized: initializedRef.current 
      });
    }

    // Cleanup function
    return () => {
      console.log('🧹 MultiWidget: Component unmounting, setting cleanup flag');
      isMounted = false;
      initializedRef.current = false;
    };
  }, [reviews?.length, slug, data.id, data.type]); // Removed currentDesign from deps to prevent re-initialization

  if (!reviews || !currentDesign) {
    return <div className="text-center p-4">Loading widget data...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div 
        className="flex items-center justify-center min-h-[200px] text-white text-lg w-full max-w-4xl mx-auto"
        style={{ maxWidth: '800px' }}
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>Add reviews to your widget</span>
          </div>
          <p className="text-sm opacity-80">Click talk bubble icon to add and manage reviews.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      id={`promptreviews-widget-container-${data.id}`}
      ref={containerRef}
      className="pr-widget-container pr-multi-widget w-full max-w-4xl mx-auto"
      style={{ minHeight: '200px', maxWidth: '800px' }}
      data-widget-id={data.id}
    />
  );
};

export default MultiWidget; 