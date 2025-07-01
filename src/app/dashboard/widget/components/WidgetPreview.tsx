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

// Debug: Log the available components
console.log('🔧 WidgetPreview: Available widget components:', {
  multi: !!MultiWidget,
  single: !!SingleWidget,
  photo: !!PhotoWidget,
  components: Object.keys(WIDGET_COMPONENTS)
});

interface WidgetPreviewProps {
  widget: any;
  design?: DesignState;
}

export const WidgetPreview = React.memo(function WidgetPreview({ widget, design }: WidgetPreviewProps) {
  // Memoize the widget component selection to prevent unnecessary re-renders
  const WidgetComponent = useMemo(() => {
    console.log('🔍 WidgetPreview: Received widget data:', widget);
    console.log('🔍 WidgetPreview: Widget type:', widget?.type);
    console.log('🔍 WidgetPreview: Widget type type:', typeof widget?.type);
    console.log('🔍 WidgetPreview: Available components:', Object.keys(WIDGET_COMPONENTS));
    console.log('🔍 WidgetPreview: Component for this type:', WIDGET_COMPONENTS[widget?.type as string]);
    
    if (widget?.type && WIDGET_COMPONENTS[widget.type as string]) {
      console.log('✅ WidgetPreview: Found widget component for type:', widget.type);
      console.log('✅ WidgetPreview: Selected component:', WIDGET_COMPONENTS[widget.type as string].name);
      return WIDGET_COMPONENTS[widget.type as string];
    } else {
      console.log('❌ WidgetPreview: No widget component found for type:', widget?.type);
      console.log('❌ WidgetPreview: Available types:', Object.keys(WIDGET_COMPONENTS));
      console.log('❌ WidgetPreview: Widget type exists:', !!widget?.type);
      console.log('❌ WidgetPreview: Component exists for type:', !!WIDGET_COMPONENTS[widget?.type as string]);
      return null;
    }
  }, [widget?.type]);

  // Memoize the widget data to prevent unnecessary re-renders
  const memoizedWidget = useMemo(() => widget, [widget?.id, widget?.type, widget?.theme, widget?.reviews?.length]);

  if (!memoizedWidget || !WidgetComponent) {
    console.log('⚠️ WidgetPreview: No widget selected or component not available');
    // Return null when no widget is selected or the component is not available.
    return null;
  }

  console.log('🚀 WidgetPreview: Rendering widget component with data:', memoizedWidget, 'and design:', design);
  console.log('🚀 WidgetPreview: Component being rendered:', WidgetComponent.name);
  
  return <WidgetComponent data={memoizedWidget} design={design} />;
}); 