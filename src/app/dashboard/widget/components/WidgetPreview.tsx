"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';
import { DesignState } from './widgets/multi/index';
import { FaEdit, FaUsers, FaCode, FaCheck } from 'react-icons/fa';

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
const PhotoWidget = dynamic(() => import('./widgets/photo/PhotoWidget'), {
  loading: () => <FiveStarSpinner />,
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
  onEditStyle?: () => void;
  onManageReviews?: () => void;
  onCopyEmbedCode?: () => void;
  copiedWidgetId?: string | null;
}

export function WidgetPreview({ 
  widget, 
  design, 
  onEditStyle, 
  onManageReviews, 
  onCopyEmbedCode,
  copiedWidgetId 
}: WidgetPreviewProps) {
  const [WidgetComponent, setWidgetComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    console.log('🔍 WidgetPreview: Received widget data:', widget);
    console.log('🔍 WidgetPreview: Widget type:', widget?.widget_type);
    console.log('🔍 WidgetPreview: Widget type type:', typeof widget?.widget_type);
    console.log('🔍 WidgetPreview: Available components:', Object.keys(WIDGET_COMPONENTS));
    console.log('🔍 WidgetPreview: Component for this type:', WIDGET_COMPONENTS[widget?.widget_type as string]);
    
    if (widget?.widget_type && WIDGET_COMPONENTS[widget.widget_type as string]) {
      console.log('✅ WidgetPreview: Found widget component for type:', widget.widget_type);
      console.log('✅ WidgetPreview: Selected component:', WIDGET_COMPONENTS[widget.widget_type as string].name);
      setWidgetComponent(() => WIDGET_COMPONENTS[widget.widget_type as string]);
    } else {
      console.log('❌ WidgetPreview: No widget component found for type:', widget?.widget_type);
      console.log('❌ WidgetPreview: Available types:', Object.keys(WIDGET_COMPONENTS));
      console.log('❌ WidgetPreview: Widget type exists:', !!widget?.widget_type);
      console.log('❌ WidgetPreview: Component exists for type:', !!WIDGET_COMPONENTS[widget?.widget_type as string]);
      setWidgetComponent(null);
    }
  }, [widget]);

  if (!widget || !WidgetComponent) {
    console.log('⚠️ WidgetPreview: No widget selected or component not available');
    // Return null when no widget is selected or the component is not available.
    return null;
  }

  console.log('🚀 WidgetPreview: Rendering widget component with data:', widget, 'and design:', design);
  console.log('🚀 WidgetPreview: Component being rendered:', WidgetComponent.name);
  
  const isCopied = copiedWidgetId === widget.id;
  
  return (
    <div className="relative">
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={onEditStyle}
          className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200 group"
          title="Edit Style"
        >
          <FaEdit className="w-5 h-5 text-gray-700 group-hover:text-slate-blue transition-colors" />
        </button>
        
        <button
          onClick={onManageReviews}
          className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-all duration-200 group"
          title="Manage Reviews"
        >
          <FaUsers className="w-5 h-5 text-gray-700 group-hover:text-slate-blue transition-colors" />
        </button>
        
        <button
          onClick={onCopyEmbedCode}
          className={`p-3 rounded-lg shadow-lg transition-all duration-200 group ${
            isCopied 
              ? 'bg-green-500/90 backdrop-blur-sm hover:bg-green-500' 
              : 'bg-white/90 backdrop-blur-sm hover:bg-white'
          }`}
          title={isCopied ? "Copied!" : "Copy Embed Code"}
        >
          {isCopied ? (
            <FaCheck className="w-5 h-5 text-white" />
          ) : (
            <FaCode className="w-5 h-5 text-gray-700 group-hover:text-slate-blue transition-colors" />
          )}
        </button>
      </div>
      
      {/* Widget Preview */}
      <div className="relative">
        <WidgetComponent data={widget} design={design} />
      </div>
    </div>
  );
} 