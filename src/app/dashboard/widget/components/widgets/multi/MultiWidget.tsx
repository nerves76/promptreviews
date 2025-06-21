import React, { useEffect, useRef } from 'react';
import { WidgetData, DesignState } from './index';

const MultiWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'promptreviews-widget';
    widgetContainer.className = 'widget-container';
    widgetContainer.style.fontFamily = data.design.font;
    containerRef.current.appendChild(widgetContainer);

    // Initialize the vanilla JS widget
    const script = document.createElement('script');
    script.src = '/widgets/multi/widget-embed.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore - window.initializePromptReviewsWidget is defined in widget-embed.js
      window.initializePromptReviewsWidget(data.id);
    };
    document.head.appendChild(script);
    scriptRef.current = script;

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      // Safely remove script element
      if (scriptRef.current && scriptRef.current.parentNode === document.head) {
        try {
          document.head.removeChild(scriptRef.current);
        } catch (error) {
          console.warn('Failed to remove script element:', error);
        }
      }
      scriptRef.current = null;
    };
  }, [data.id, data.design.font]);

  return <div ref={containerRef} className="multi-widget-container" />;
};

export default MultiWidget; 