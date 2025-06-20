import React, { useEffect, useRef } from 'react';
import { WidgetData } from '../../shared/types';
import { getDesignWithDefaults } from '../../shared/utils';

const SingleWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const design = getDesignWithDefaults(data.design, data.widget_type);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'promptreviews-widget';
    widgetContainer.className = 'widget-container';
    widgetContainer.style.fontFamily = design.font;
    containerRef.current.appendChild(widgetContainer);

    // Initialize the vanilla JS widget
    const script = document.createElement('script');
    script.src = '/widgets/single/widget-embed.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore - window.initializePromptReviewsWidget is defined in widget-embed.js
      window.initializePromptReviewsWidget(data.id);
    };
    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      document.head.removeChild(script);
    };
  }, [data.id, design.font]);

  return <div ref={containerRef} className="single-widget-container" />;
};

export default SingleWidget; 