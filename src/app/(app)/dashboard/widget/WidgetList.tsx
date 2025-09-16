"use client";
import React, { useState, useEffect } from "react";
import { getUserOrMock } from "@/auth/providers/supabase";
import { DraggableModal } from './components/DraggableModal';
import { WidgetEditorForm } from './components/WidgetEditorForm';
import { ReviewManagementModal } from './components/ReviewManagementModal';
import { WidgetTable } from './components/WidgetTable';
import { StyleModal } from './components/StyleModal';
import { DEFAULT_DESIGN, DesignState } from './components/widgets/multi';

export default function WidgetList({
  onSelectWidget,
  selectedWidgetId,
  onDesignChange,
  design,
  widgets,
  loading,
  error,
  createWidget,
  deleteWidget,
  saveWidgetName,
  saveWidgetDesign,
  fetchWidgets,
  onRefreshWidget,
  selectedAccount,
}: {
  onSelectWidget?: (widget: any) => void;
  selectedWidgetId?: string;
  onDesignChange?: (design: DesignState) => void;
  design: DesignState;
  widgets: any[];
  loading: boolean;
  error: string | null;
  createWidget: (name: string, widgetType: string, theme: any) => Promise<any>;
  deleteWidget: (widgetId: string) => Promise<void>;
  saveWidgetName: (id: string, name: string) => Promise<any>;
  saveWidgetDesign: (id: string, theme: any) => Promise<any>;
  fetchWidgets: () => Promise<void>;
  onRefreshWidget?: () => void;
  selectedAccount?: any;
}) {
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

  // Clear selected widget for reviews when widgets list changes (e.g., account switch)
  useEffect(() => {
    if (selectedWidgetForReviews && widgets.length > 0) {
      const widgetStillExists = widgets.some(w => w.id === selectedWidgetForReviews);
      if (!widgetStillExists) {
        setSelectedWidgetForReviews(null);
        if (showReviewModal) {
          setShowReviewModal(false);
        }
      }
    }
    // Also clear if widgets list is empty
    if (widgets.length === 0 && selectedWidgetForReviews) {
      setSelectedWidgetForReviews(null);
      if (showReviewModal) {
        setShowReviewModal(false);
      }
    }
  }, [widgets]);

  // Listen for account switch events and close any open modals
  useEffect(() => {
    const handleAccountSwitch = (event: CustomEvent) => {
      
      // Close all modals
      if (showReviewModal) {
        setShowReviewModal(false);
      }
      if (showStyleModal) {
        setShowStyleModal(false);
      }
      if (isEditorOpen) {
        setIsEditorOpen(false);
      }
      
      // Clear selected widgets
      setSelectedWidgetForReviews(null);
      setSelectedWidgetForStyle(null);
      setWidgetToEdit(null);
    };

    window.addEventListener('accountSwitched', handleAccountSwitch as EventListener);
    return () => {
      window.removeEventListener('accountSwitched', handleAccountSwitch as EventListener);
    };
  }, [showReviewModal, showStyleModal, isEditorOpen]);

  const handleCopyEmbed = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    // Use the correct widget-specific container ID for each widget type
    let containerId;
          switch (widget.type) {
      case 'multi':
        containerId = 'promptreviews-multi-widget';
        break;
      case 'single':
        containerId = 'promptreviews-single-widget';
        break;
      case 'photo':
        containerId = 'promptreviews-photo-widget';
        break;
      default:
        containerId = 'promptreviews-widget';
    }
    
          const embedCode = `<script src="${window.location.origin}/widgets/${widget.type}/widget-embed.min.js"></script>
<div id="${containerId}" data-widget-id="${widgetId}"></div>`;

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
      // Don't call fetchWidgets - deleteWidget already does it internally
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
      // Don't call fetchWidgets - saveWidgetDesign already does it internally
      setShowStyleModal(false);
    }
  };

  const handleResetDesign = () => {
    // Reset to default design
    if (onDesignChange) {
      onDesignChange(DEFAULT_DESIGN);
    }
  };

  const handleManageReviews = (widgetId: string) => {
    // Validate that the widget exists in the current widgets list
    const widgetExists = widgets.some(w => w.id === widgetId);
    if (!widgetExists) {
      alert('This widget is not available. Please refresh the page or select a different widget.');
      return;
    }
    
    setSelectedWidgetForReviews(widgetId);
    setShowReviewModal(true);
  };

  const handleSaveWidgetName = async (id: string, name: string) => {
    try {
      await saveWidgetName(id, name);
      // Don't call fetchWidgets - saveWidgetName already does it internally
    } catch (error) {
      console.error('Error saving widget name:', error);
      alert('Failed to save widget name. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="text-lg text-gray-600">Loading widgets...</div>
    </div>
  );
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <WidgetTable
        widgets={widgets}
        selectedWidgetId={selectedWidgetId}
        onSelect={(widget) => onSelectWidget?.(widget)}
        onCopyEmbed={handleCopyEmbed}
        onEditStyle={handleEditStyle}
        onManageReviews={handleManageReviews}
        onDelete={handleDeleteWidget}
        copiedWidgetId={copiedWidgetId}
      />

      <DraggableModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)}
        title={widgetToEdit ? 'Edit widget' : 'Create new widget'}
      >
        <WidgetEditorForm
          onSaveSuccess={async (newWidget?: any) => { 
            setIsEditorOpen(false); 
            
            // If a new widget was created and returned, select it
            if (newWidget && onSelectWidget) {
              onSelectWidget(newWidget);
            } else {
              // Otherwise just refresh the list
              await fetchWidgets();
            }
          }}
          onCancel={() => setIsEditorOpen(false)}
          widgetToEdit={widgetToEdit}
          design={design}
          createWidget={createWidget}
          saveWidgetName={saveWidgetName}
        />
      </DraggableModal>

      <ReviewManagementModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedWidgetForReviews(null);
        }}
        widgetId={selectedWidgetForReviews}
        accountId={selectedAccount?.account_id}
        design={design}
        onReviewsChange={() => {
          // If this widget is currently selected in preview, refresh its data
          if (selectedWidgetForReviews && selectedWidgetId === selectedWidgetForReviews) {
            // Use the dedicated refresh function which will fetch fresh data
            if (onRefreshWidget) {
              onRefreshWidget();
            }
          }
          // Optionally, auto-select the widget after editing reviews to show the changes
          else if (selectedWidgetForReviews && onSelectWidget) {
            const widget = widgets.find(w => w.id === selectedWidgetForReviews);
            if (widget) {
              onSelectWidget(widget);
            }
          }
        }}
      />

      {showStyleModal && selectedWidgetForStyle && (
        <StyleModal
          isOpen={showStyleModal}
          onClose={() => setShowStyleModal(false)}
          selectedWidget={selectedWidgetForStyle}
          design={design}
          onDesignChange={onDesignChange || (() => {})}
          onSaveDesign={handleSaveDesign}
          onResetDesign={handleResetDesign}
        />
      )}
    </div>
  );
}

