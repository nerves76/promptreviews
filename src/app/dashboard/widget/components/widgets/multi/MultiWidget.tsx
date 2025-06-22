import React, { useEffect, useRef } from 'react';
import { WidgetData } from './index';

// Remove the incorrect CSS import - we'll load it dynamically
// import '../../../../../../../public/widgets/multi/multi-widget.css';

const MultiWidget: React.FC<{ data: any }> = ({ data }) => {
  const { design, reviews, slug, widget_type, id } = data;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('🎯 MultiWidget: Component mounted with data:', { 
      widgetId: id,
      widgetType: widget_type,
      reviewsCount: reviews?.length, 
      design: design, 
      slug: slug 
    });
    
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
        const cssUrl = `/widgets/multi/multi-widget.css?v=${Date.now()}-${Math.random()}`;
        link.href = cssUrl;
        console.log('🔗 MultiWidget: Loading CSS from URL:', cssUrl);
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
      if (window.PromptReviews && (window.PromptReviews.initializeWidget || window.PromptReviews.renderMultiWidget)) {
        console.log('✅ MultiWidget: Widget script already loaded, available functions:', Object.keys(window.PromptReviews));
        return Promise.resolve();
      }

      console.log('📥 MultiWidget: Loading widget script from /widgets/multi/widget-embed.js...');
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/widgets/multi/widget-embed.js?v=${Date.now()}-${Math.random()}`;
        script.onload = () => {
          console.log('✅ MultiWidget: Widget script loaded successfully');
          console.log('🔧 MultiWidget: Available functions:', Object.keys(window.PromptReviews || {}));
          resolve();
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
        // Load both CSS and JS
        await Promise.all([loadWidgetCSS(), loadWidgetScript()]);
        
        if (containerRef.current && window.PromptReviews) {
          console.log('🎯 MultiWidget: Initializing widget in container:', containerRef.current.id);
          console.log('📊 MultiWidget: Reviews data:', reviews);
          console.log('🎨 MultiWidget: Design data:', design);
          
          // Try the new API first
          if (window.PromptReviews.initializeWidget) {
            console.log('🚀 MultiWidget: Using initializeWidget API');
            window.PromptReviews.initializeWidget(
              containerRef.current.id,
              reviews,
              design,
              slug || 'example-business'
            );
            console.log('✅ MultiWidget: Widget initialization completed');
          } 
          // Fallback to the old API
          else if (window.PromptReviews.renderMultiWidget) {
            console.log('🔄 MultiWidget: Using renderMultiWidget API (fallback)');
            window.PromptReviews.renderMultiWidget(
              containerRef.current,
              { reviews, design, businessSlug: slug || 'example-business' }
            );
            console.log('✅ MultiWidget: Widget initialization completed (fallback)');
          } else {
            console.error('❌ MultiWidget: No widget initialization function found in PromptReviews:', window.PromptReviews);
          }
        } else {
          console.error('❌ MultiWidget: Missing required elements for widget initialization:', {
            containerRef: !!containerRef.current,
            PromptReviews: !!window.PromptReviews
          });
        }
      } catch (error) {
        console.error('❌ MultiWidget: Failed to initialize widget:', error);
      }
    };

    if (reviews && design) {
      console.log('🎯 MultiWidget: Starting widget initialization...');
      initializeWidget();
    } else {
      console.log('⚠️ MultiWidget: Missing reviews or design data:', { reviews: !!reviews, design: !!design });
    }
  }, [reviews, design, slug, id, widget_type]);

  if (!reviews || !design) {
    return <div className="text-center p-4">Loading widget data...</div>;
  }

  if (reviews.length === 0) {
    return <div className="text-center p-4">No reviews to display.</div>;
  }

  return (
    <div 
      id="promptreviews-widget-container"
      ref={containerRef}
      className="pr-widget-container pr-multi-widget"
      style={{ minHeight: '200px' }}
    />
  );
};

export default MultiWidget; 