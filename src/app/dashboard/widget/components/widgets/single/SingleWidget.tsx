import React, { useEffect, useRef } from 'react';
import { WidgetData } from '../../shared/types';

// Use the same DesignState type as the widget page
type DesignState = {
  bgType: "none" | "solid";
  bgColor: string;
  textColor: string;
  accentColor: string;
  bodyTextColor: string;
  nameTextColor: string;
  roleTextColor: string;
  attributionFontSize: number;
  borderRadius: number;
  shadow: boolean;
  bgOpacity: number;
  autoAdvance: boolean;
  slideshowSpeed: number;
  border: boolean;
  borderWidth: number;
  lineSpacing: number;
  showQuotes: boolean;
  showRelativeDate: boolean;
  showGrid: boolean;
  width: number;
  sectionBgType: "none" | "custom";
  sectionBgColor: string;
  shadowIntensity: number;
  shadowColor: string;
  borderColor: string;
  font: string;
  showSubmitReviewButton: boolean;
};

const SingleWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  
  // Convert the design to the expected format
  const design: DesignState = {
    bgType: "solid",
    bgColor: data.design.colors.background,
    textColor: data.design.colors.text,
    accentColor: data.design.colors.accent,
    bodyTextColor: data.design.colors.text,
    nameTextColor: data.design.colors.primary,
    roleTextColor: data.design.colors.secondary,
    attributionFontSize: parseInt(data.design.typography.fontSize) || 15,
    borderRadius: parseInt(data.design.layout.borderRadius) || 16,
    shadow: true,
    bgOpacity: 1,
    autoAdvance: false,
    slideshowSpeed: 4,
    border: true,
    borderWidth: 2,
    lineSpacing: 1.4,
    showQuotes: true,
    showRelativeDate: false,
    showGrid: false,
    width: 800,
    sectionBgType: "none",
    sectionBgColor: data.design.colors.background,
    shadowIntensity: 0.2,
    shadowColor: "#222222",
    borderColor: "#cccccc",
    font: data.design.typography.fontFamily,
    showSubmitReviewButton: true,
  };

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
  }, [data.id, design.font]);

  return <div ref={containerRef} className="single-widget-container" />;
};

export default SingleWidget; 