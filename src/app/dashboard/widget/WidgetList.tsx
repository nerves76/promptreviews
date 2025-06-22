"use client";
import React, { useState, useEffect } from "react";
import { getUserOrMock } from "@/utils/supabase";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import { DraggableModal } from './components/DraggableModal';
import { WidgetEditorForm } from './components/WidgetEditorForm';
import { ReviewManagementModal } from './components/ReviewManagementModal';
import { WidgetCard } from './components/WidgetCard';
import { useWidgets } from './hooks/useWidgets';
import { StyleModal } from './components/StyleModal';
import { DesignState, DEFAULT_DESIGN } from './components/widgets/multi';

export default function WidgetList({
  onSelectWidget,
  selectedWidgetId,
  onDesignChange,
  design,
  onWidgetReviewsChange,
}: {
  onSelectWidget?: (widget: any) => void;
  selectedWidgetId?: string;
  onDesignChange?: (design: DesignState) => void;
  design: DesignState;
  onWidgetReviewsChange?: () => void;
}) {
  const { widgets, loading, error, createWidget, deleteWidget, saveWidgetName, saveWidgetDesign } = useWidgets();
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);
  const [widgetToEdit, setWidgetToEdit] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedWidgetForReviews, setSelectedWidgetForReviews] = useState<string | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [selectedWidgetForStyle, setSelectedWidgetForStyle] = useState<any>(null);

  useEffect(() => {
    const handler = () => {
      setWidgetToEdit(null);
      setIsEditorOpen(true);
    };
    window.addEventListener("openNewWidgetForm", handler);
    return () => window.removeEventListener("openNewWidgetForm", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      if (selectedWidgetId) {
        handleEditStyle(selectedWidgetId);
      }
    };
    window.addEventListener("openStyleModal", handler);
    return () => window.removeEventListener("openStyleModal", handler);
  }, [selectedWidgetId]);

  useEffect(() => {
    const handler = () => {
      if (selectedWidgetId) {
        handleManageReviews(selectedWidgetId);
      }
    };
    window.addEventListener("openReviewModal", handler);
    return () => window.removeEventListener("openReviewModal", handler);
  }, [selectedWidgetId]);

  useEffect(() => {
    if (selectedWidgetId) {
      const widget = widgets.find(w => w.id === selectedWidgetId);
      if (widget?.theme && onDesignChange) {
        onDesignChange(widget.theme);
      }
    }
  }, [selectedWidgetId, widgets, onDesignChange]);

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

  const handleEditStyle = (widget: any) => {
    setSelectedWidgetForStyle(widget);
    setShowStyleModal(true);
  };

  const handleSaveDesign = async () => {
    if (selectedWidgetForStyle) {
      await saveWidgetDesign(selectedWidgetForStyle.id, design);
      onWidgetReviewsChange?.();
      setShowStyleModal(false);
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

  if (loading) return <FiveStarSpinner />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            isSelected={selectedWidgetId === widget.id}
            onSelect={() => onSelectWidget?.(widget)}
            onCopyEmbed={() => handleCopyEmbed(widget.id)}
            onEditStyle={() => handleEditStyle(widget)}
            onManageReviews={() => handleManageReviews(widget.id)}
            onDelete={() => handleDeleteWidget(widget.id)}
            copiedWidgetId={copiedWidgetId}
          />
        ))}
      </div>

      <DraggableModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)}
        title={widgetToEdit ? 'Edit Widget' : 'Create New Widget'}
      >
        <WidgetEditorForm
          onSaveSuccess={() => { setIsEditorOpen(false); onWidgetReviewsChange?.(); }}
          onCancel={() => setIsEditorOpen(false)}
          widgetToEdit={widgetToEdit}
          design={design}
        />
      </DraggableModal>

      <ReviewManagementModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedWidgetForReviews(null);
        }}
        widgetId={selectedWidgetForReviews}
        onReviewsChange={onWidgetReviewsChange}
      />

      {showStyleModal && selectedWidgetForStyle && (
        <StyleModal
          isOpen={showStyleModal}
          onClose={() => setShowStyleModal(false)}
          selectedWidget={selectedWidgetForStyle}
          design={design}
          onDesignChange={onDesignChange || (() => {})}
          onSaveDesign={handleSaveDesign}
        />
      )}
    </div>
  );
}

