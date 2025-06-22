import React, { useEffect, useRef } from 'react';
import { WidgetData, DesignState } from './index';
import { createReviewCardHTML } from '../../shared/card-generator';

// Remove the incorrect CSS import - we'll load it dynamically
// import '../../../../../../../public/widgets/photo/photo-widget.css';

interface PhotoWidgetProps {
  data: any;
  design?: DesignState;
}

const PhotoWidget: React.FC<PhotoWidgetProps> = ({ data, design }) => {
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
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    console.log('🎯 PhotoWidget: Component mounted with data:', { 
      widgetId: data.id,
      widgetType: data.widget_type,
      reviewsCount: reviews?.length, 
      design: currentDesign, 
      slug: slug 
    });
    
    // Load the CSS if not already loaded
    const loadWidgetCSS = (): Promise<void> => {
      if (document.querySelector('link[href="/widgets/photo/photo-widget.css"]')) {
        console.log('✅ PhotoWidget: CSS already loaded');
        return Promise.resolve();
      }

      console.log('📥 PhotoWidget: Loading CSS from /widgets/photo/photo-widget.css...');
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/widgets/photo/photo-widget.css?v=${new Date().getTime()}`;
        link.onload = () => {
          console.log('✅ PhotoWidget: CSS loaded successfully');
          resolve();
        };
        link.onerror = (error) => {
          console.error('❌ PhotoWidget: Failed to load CSS:', error);
          reject(error);
        };
        document.head.appendChild(link);
      });
    };
    
    // Load the widget script if not already loaded
    const loadWidgetScript = (): Promise<void> => {
      if (window.PromptReviewsPhoto?.initializeWidget) {
        console.log('✅ PhotoWidget: Widget script already loaded');
        return Promise.resolve();
      }

      console.log('📥 PhotoWidget: Loading widget script from /widgets/photo/widget-embed.js...');
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/widgets/photo/widget-embed.js?v=${new Date().getTime()}`;
        script.onload = () => {
          console.log('✅ PhotoWidget: Widget script loaded successfully');
          // Wait a bit for the script to initialize
          setTimeout(() => {
            console.log('🔧 PhotoWidget: Available functions:', Object.keys(window.PromptReviewsPhoto || {}));
            console.log('🔧 PhotoWidget: initializeWidget function:', typeof window.PromptReviewsPhoto?.initializeWidget);
            resolve();
          }, 100);
        };
        script.onerror = (error) => {
          console.error('❌ PhotoWidget: Failed to load widget script:', error);
          reject(error);
        };
        document.head.appendChild(script);
      });
    };

    const initializeWidget = async () => {
      try {
        console.log('🚀 PhotoWidget: Starting initialization...');
        await Promise.all([loadWidgetCSS(), loadWidgetScript()]);
        
        // Add a small delay to ensure the script is fully initialized
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('🔍 PhotoWidget: Checking dependencies...');
        console.log('🔍 PhotoWidget: Container ref:', !!containerRef.current);
        console.log('🔍 PhotoWidget: Container ID:', containerRef.current?.id);
        console.log('🔍 PhotoWidget: PromptReviewsPhoto:', !!window.PromptReviewsPhoto);
        console.log('🔍 PhotoWidget: initializeWidget function:', !!window.PromptReviewsPhoto?.initializeWidget);
        console.log('🔍 PhotoWidget: Reviews:', reviews);
        console.log('🔍 PhotoWidget: Design:', currentDesign);
        
        if (containerRef.current && window.PromptReviewsPhoto?.initializeWidget) {
          console.log('🚀 PhotoWidget: Using initializeWidget API');
          window.PromptReviewsPhoto.initializeWidget(
            containerRef.current.id,
            reviews,
            currentDesign,
            slug || 'example-business'
          );
          console.log('✅ PhotoWidget: Widget initialization completed');
        } else {
          console.error('❌ PhotoWidget: Missing dependencies for initialization.');
          console.log('🔍 PhotoWidget: Debug info:', {
            containerRef: !!containerRef.current,
            PromptReviewsPhoto: !!window.PromptReviewsPhoto,
            initializeWidget: !!window.PromptReviewsPhoto?.initializeWidget,
            retryCount: retryCountRef.current
          });
          
          // Retry mechanism
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            console.log(`🔄 PhotoWidget: Retrying initialization (${retryCountRef.current}/${maxRetries})...`);
            setTimeout(initializeWidget, 500);
          } else {
            console.error('❌ PhotoWidget: Max retries reached, giving up');
          }
        }
      } catch (error) {
        console.error('❌ PhotoWidget: Failed to initialize widget:', error);
        
        // Retry on error
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`🔄 PhotoWidget: Retrying after error (${retryCountRef.current}/${maxRetries})...`);
          setTimeout(initializeWidget, 1000);
        }
      }
    };

    if (reviews && currentDesign) {
      retryCountRef.current = 0; // Reset retry count
      initializeWidget();
    } else {
      console.log('⚠️ PhotoWidget: Missing reviews or design data:', { reviews: !!reviews, design: !!currentDesign });
    }
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
      className="pr-widget-container pr-photo-widget"
    />
  );
};

export default PhotoWidget; 