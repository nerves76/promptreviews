"use client";
import React, { useState, useEffect } from "react";
import { getUserOrMock } from "@/utils/supabase";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import { smartMergeDesign } from '../utils/smartMergeDesign';
import { DraggableModal } from './components/DraggableModal';
import { WidgetEditorForm } from './components/WidgetEditorForm';
import { ReviewManagementModal } from './components/ReviewManagementModal';
import { WidgetCard } from './components/WidgetCard';
import { useWidgets } from './hooks/useWidgets';
import { StyleModal } from './components/StyleModal';

// Add type for design state
export type DesignState = {
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

export default function WidgetList({
  onSelectWidget,
  selectedWidgetId,
  onDesignChange,
  design: parentDesign,
  onWidgetReviewsChange,
}: {
  onSelectWidget?: (widget: any) => void;
  selectedWidgetId?: string;
  onDesignChange?: (design: DesignState) => void;
  design: DesignState;
  onWidgetReviewsChange?: () => void;
}) {
  // Use the custom hook for widget management
  const {
    widgets,
    loading,
    error,
    createWidget,
    deleteWidget,
    saveWidgetName,
    saveWidgetDesign,
  } = useWidgets();

  // Local state
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);
  const [widgetToEdit, setWidgetToEdit] = useState<any>(null);
  const [isNewWidget, setIsNewWidget] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedWidgetForReviews, setSelectedWidgetForReviews] = useState<string | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [selectedWidgetForStyle, setSelectedWidgetForStyle] = useState<string | null>(null);

  // Remove local design state and use parentDesign directly
  const design = parentDesign;

  // Update this effect to only depend on isEditorOpen:
  useEffect(() => {
    if (onDesignChange) onDesignChange(design);
  }, [design, onDesignChange]);

  // Add effect to update design when selected widget changes
  useEffect(() => {
    if (selectedWidgetId) {
      const widget = widgets.find(w => w.id === selectedWidgetId);
      console.log("Selected widget:", widget);
      console.log("Widget theme:", widget?.theme);
      if (widget?.theme && onDesignChange) {
        console.log("Updating design with theme:", widget.theme);
        onDesignChange(widget.theme);
      }
    }
  }, [selectedWidgetId, widgets, onDesignChange]);

  // Add effect to ensure showSubmitReviewButton is preserved when saving
  useEffect(() => {
    if (design && typeof design.showSubmitReviewButton === 'undefined' && onDesignChange) {
      onDesignChange({
        ...design,
        showSubmitReviewButton: true
      });
    }
  }, [design, onDesignChange]);

  // Listen for openNewWidgetForm event from parent
  useEffect(() => {
    const handler = () => {
      setWidgetToEdit(null);
      setIsEditorOpen(true);
    };
    window.addEventListener("openNewWidgetForm", handler);
    return () => window.removeEventListener("openNewWidgetForm", handler);
  }, []);

  const handleCopyEmbed = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const embedCode = `<script src="${window.location.origin}/widgets/${widget.widget_type}/widget-embed.min.js"></script>
<div id="promptreviews-widget" data-widget-id="${widgetId}"></div>`;

    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedWidgetId(widgetId);
      setTimeout(() => setCopiedWidgetId(null), 2000);
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return;
    
    try {
      await deleteWidget(widgetId);
      if (onWidgetReviewsChange) onWidgetReviewsChange();
    } catch (error) {
      console.error('Error deleting widget:', error);
      alert('Failed to delete widget. Please try again.');
    }
  };

  const handleEditStyle = (widgetId: string) => {
    setSelectedWidgetForStyle(widgetId);
    setShowStyleModal(true);
  };

  const handleSaveDesign = (widgetId: string) => async (newDesign: DesignState) => {
    try {
      await saveWidgetDesign(widgetId, newDesign);
      if (onWidgetReviewsChange) onWidgetReviewsChange();
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design. Please try again.');
    }
  };

  const handleManageReviews = (widgetId: string) => {
    setSelectedWidgetForReviews(widgetId);
    setShowReviewModal(true);
  };

  const handleSaveWidgetName = async (id: string, name: string) => {
    try {
      await saveWidgetName(id, name);
      if (onWidgetReviewsChange) onWidgetReviewsChange();
    } catch (error) {
      console.error('Error saving widget name:', error);
      alert('Failed to save widget name. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiveStarSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading widgets: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Widget List */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => {
            const isSelected = selectedWidgetId === widget.id;

            return (
              <WidgetCard
                key={widget.id}
                widget={widget}
                isSelected={isSelected}
                onSelect={() => onSelectWidget?.(widget)}
                onCopyEmbed={() => handleCopyEmbed(widget.id)}
                onEditStyle={() => handleEditStyle(widget.id)}
                onManageReviews={() => handleManageReviews(widget.id)}
                onDelete={() => handleDeleteWidget(widget.id)}
                copiedWidgetId={copiedWidgetId}
              />
            );
          })}
        </div>

        {widgets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No widgets created yet</div>
            <button
              onClick={() => {
                setWidgetToEdit(null);
                setIsEditorOpen(true);
              }}
              className="px-4 py-2 bg-slateblue text-white rounded hover:bg-slateblue/90"
            >
              Create Your First Widget
            </button>
          </div>
        )}
      </div>

      {/* Widget Editor Modal */}
      {isEditorOpen && (
        <DraggableModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setWidgetToEdit(null);
          }}
          title={widgetToEdit ? "Edit Widget" : "Create New Widget"}
        >
          <WidgetEditorForm
            onSaveSuccess={() => {
              setIsEditorOpen(false);
              setWidgetToEdit(null);
              if (onWidgetReviewsChange) onWidgetReviewsChange();
            }}
            onCancel={() => {
              setIsEditorOpen(false);
              setWidgetToEdit(null);
            }}
            widgetToEdit={widgetToEdit}
            design={design}
          />
        </DraggableModal>
      )}

      {/* Review Management Modal */}
      <ReviewManagementModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedWidgetForReviews(null);
        }}
        widgetId={selectedWidgetForReviews}
        onReviewsChange={onWidgetReviewsChange}
      />

      {/* Style Modal */}
      <StyleModal
        isOpen={showStyleModal}
        onClose={() => {
          setShowStyleModal(false);
          setSelectedWidgetForStyle(null);
        }}
        selectedWidget={selectedWidgetForStyle}
        design={design}
        onDesignChange={onDesignChange || (() => {})}
        onSaveDesign={async () => {
          if (selectedWidgetForStyle && onDesignChange) {
            try {
              await saveWidgetDesign(selectedWidgetForStyle, design);
              setShowStyleModal(false);
              setSelectedWidgetForStyle(null);
              if (onWidgetReviewsChange) onWidgetReviewsChange();
            } catch (error) {
              console.error('Error saving design:', error);
              alert('Failed to save design. Please try again.');
            }
          }
        }}
      />
    </div>
  );
}

