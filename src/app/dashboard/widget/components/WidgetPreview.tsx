"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';
import { DesignState } from './widgets/multi/index';

// Temporarily use direct import to debug the issue
import MultiWidget from './widgets/multi/MultiWidget';

// Dynamically import widget components
// const MultiWidget = dynamic(() => import('./widgets/multi/MultiWidget'), { 
//   loading: () => <FiveStarSpinner />,
//   ssr: false 
// });
const SingleWidget = dynamic(() => import('./widgets/single/SingleWidget'), {
  loading: () => <FiveStarSpinner />,
  ssr: false 
});
// Add other widget types here as they are created
// const PhotoWidget = dynamic(() => import('./widgets/photo/PhotoWidget'), { loading: () => <FiveStarSpinner /> });

const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  multi: MultiWidget,
  single: SingleWidget,
  // photo: PhotoWidget,
};

interface WidgetPreviewProps {
  widget: any;
  design?: DesignState;
}

export function WidgetPreview({ widget, design }: WidgetPreviewProps) {
  const [WidgetComponent, setWidgetComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    console.log('🔍 WidgetPreview: Received widget data:', widget);
    
    if (widget?.widget_type && WIDGET_COMPONENTS[widget.widget_type as string]) {
      console.log('✅ WidgetPreview: Found widget component for type:', widget.widget_type);
      setWidgetComponent(() => WIDGET_COMPONENTS[widget.widget_type as string]);
    } else {
      console.log('❌ WidgetPreview: No widget component found for type:', widget?.widget_type);
      setWidgetComponent(null);
    }
  }, [widget]);

  if (!widget || !WidgetComponent) {
    console.log('⚠️ WidgetPreview: No widget selected or component not available');
    // Return null when no widget is selected or the component is not available.
    return null;
  }

  console.log('🚀 WidgetPreview: Rendering widget component with data:', widget, 'and design:', design);
  
  // Pass both widget data and current design to the component
  return <WidgetComponent data={widget} design={design} />;
} 