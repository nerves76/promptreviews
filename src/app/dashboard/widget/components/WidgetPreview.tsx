"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';

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

const WIDGET_COMPONENTS = {
  multi: MultiWidget,
  single: SingleWidget,
  // photo: PhotoWidget,
};

export function WidgetPreview({ widget, design }) {
  const [WidgetComponent, setWidgetComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    console.log('🔍 WidgetPreview: Received widget data:', widget);
    
    if (widget?.widget_type && WIDGET_COMPONENTS[widget.widget_type]) {
      console.log('✅ WidgetPreview: Found widget component for type:', widget.widget_type);
      setWidgetComponent(() => WIDGET_COMPONENTS[widget.widget_type]);
    } else {
      console.log('❌ WidgetPreview: No widget component found for type:', widget?.widget_type);
      setWidgetComponent(null);
    }
  }, [widget]);

  if (!widget || !WidgetComponent) {
    console.log('⚠️ WidgetPreview: No widget selected or component not available');
    // Return null (or a placeholder) when no widget is selected
    // or the component is not available.
    return (
      <div className="text-center p-8 text-white/60">
        <p>Select a widget to see its preview</p>
      </div>
    );
  }

  console.log('🚀 WidgetPreview: Rendering widget component with data:', widget, 'and design:', design);
  return <WidgetComponent data={{ ...widget, design }} />;
} 