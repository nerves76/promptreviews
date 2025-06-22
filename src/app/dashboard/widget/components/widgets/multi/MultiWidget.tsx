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

  useEffect(() => {
    let isMounted = true;
    
    // Load the CSS if not already loaded
    const loadWidgetCSS = (): Promise<void> => {
      if (document.querySelector('link[href="/widgets/multi/multi-widget.css"]')) {
        return Promise.resolve();
      }

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
      if (window.PromptReviews && (window.PromptReviews.initializeWidget || window.PromptReviews.renderMultiWidget)) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/widgets/multi/widget-embed.js?v=${new Date().getTime()}`;
        script.onload = () => {
          // Add a small delay to ensure the script has executed and exposed the function
          setTimeout(() => {
            resolve();
          }, 200);
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
        await Promise.all([loadWidgetCSS(), loadWidgetScript()]);
        // Add a small delay to ensure the script has executed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry mechanism for initializeWidget function
        let retryCount = 0;
        const maxRetries = 10;
        
        while ((!window.PromptReviews?.initializeWidget || !containerRef.current) && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retryCount++;
        }
        
        if (isMounted && containerRef.current && window.PromptReviews && window.PromptReviews.initializeWidget) {
          window.PromptReviews.initializeWidget(
            containerRef.current.id,
            reviews,
            currentDesign,
            slug || 'example-business'
          );
        } else {
          console.error('❌ MultiWidget: Missing dependencies for initialization.');
        }
      } catch (error) {
        console.error('❌ MultiWidget: Failed to initialize widget:', error);
      }
    };

    if (reviews && currentDesign) {
      initializeWidget();
    }
    return () => {
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