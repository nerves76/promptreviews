"use client";
import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DesignState } from './widgets/multi/index';

// Temporarily use direct import to debug the issue
import MultiWidget from './widgets/multi/MultiWidget';

// Dynamically import widget components
// const MultiWidget = dynamic(() => import('./widgets/multi/MultiWidget'), { 
//   loading: () => <FiveStarSpinner />,
//   ssr: false 
// });
const SingleWidget = dynamic(() => import('./widgets/single/SingleWidget'), {
  ssr: false 
});
const PhotoWidget = dynamic(() => import('./widgets/photo/PhotoWidget'), {
  ssr: false 
});

const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  multi: MultiWidget,
  single: SingleWidget,
  photo: PhotoWidget,
};

// Only log in development
const isDevelopment = process.env.NODE_ENV === 'development';

// Debug: Log the available components only in development
if (isDevelopment) {
}

interface WidgetPreviewProps {
  widget: any;
  design: DesignState;
}

export const WidgetPreview = React.memo(function WidgetPreview({ widget, design }: WidgetPreviewProps) {
  // Memoize the widget component selection to prevent unnecessary re-renders
  const WidgetComponent = useMemo(() => {
    if (isDevelopment) {
    }
    
    if (widget?.type && WIDGET_COMPONENTS[widget.type as string]) {
      if (isDevelopment) {
      }
      return WIDGET_COMPONENTS[widget.type as string];
    } else {
      if (isDevelopment) {
      }
      return null;
    }
  }, [widget?.type]);

  // Memoize the widget data to prevent unnecessary re-renders
  // Only update if ID or type changes, not on every theme or review update
  const memoizedWidget = useMemo(() => widget, [widget?.id, widget?.type]);

  if (!memoizedWidget || !WidgetComponent) {
    if (isDevelopment) {
    }
    // Return null when no widget is selected or the component is not available.
    return null;
  }

  if (isDevelopment) {
  }
  
  return <WidgetComponent data={memoizedWidget} design={design} />;
}); 