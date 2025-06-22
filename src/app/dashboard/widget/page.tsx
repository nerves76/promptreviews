"use client";
import React, { useState } from "react";
import WidgetList from "./WidgetList";
import PageCard from "@/app/components/PageCard";
import { FaPlus, FaCopy, FaEdit, FaComments } from "react-icons/fa";
import { WidgetPreview } from "./components/WidgetPreview";
import { DEFAULT_DESIGN, DesignState } from "./components/widgets/multi";

export default function WidgetPage() {
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [design, setDesign] = useState<DesignState>(DEFAULT_DESIGN);

  const handleCopyEmbed = async () => {
    if (!selectedWidget) return;

    const embedCode = `<script src="${window.location.origin}/widgets/${selectedWidget.widget_type}/widget-embed.min.js"></script>
<div id="promptreviews-widget" data-widget-id="${selectedWidget.id}"></div>`;

    try {
      await navigator.clipboard.writeText(embedCode);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  const handleEditStyle = () => {
    if (selectedWidget) {
      window.dispatchEvent(new CustomEvent('openStyleModal'));
    }
  };

  const handleManageReviews = () => {
    if (selectedWidget) {
      window.dispatchEvent(new CustomEvent('openReviewModal'));
    }
  };

  const handleWidgetDeleted = (deletedWidgetId: string) => {
    if (selectedWidget?.id === deletedWidgetId) {
      setSelectedWidget(null);
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      {/* Top Section: Widget Preview */}
      <div className="mb-8">
        <div className="relative w-full max-w-4xl mx-auto" style={{ minHeight: '600px' }}>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              <h2 className="text-2xl font-bold text-white">Widget Preview</h2>
              {selectedWidget && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditStyle}
                    className="p-2 text-slate-blue bg-white/20 rounded-md hover:bg-white/30 transition-colors"
                    title="Edit Style"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleManageReviews}
                    className="p-2 text-slate-blue bg-white/20 rounded-md hover:bg-white/30 transition-colors"
                    title="Manage Reviews"
                  >
                    <FaComments className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopyEmbed}
                    className="p-2 text-slate-blue bg-white/20 rounded-md hover:bg-white/30 transition-colors"
                    title="Copy Embed Code"
                  >
                    <FaCopy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-white/80">
              {selectedWidget ? `Editing: ${selectedWidget.name}` : 'Select a widget to see its preview'}
            </p>
          </div>
          <WidgetPreview widget={selectedWidget} design={design} />
        </div>
      </div>

      {/* Bottom Section: Header and Widget List */}
      <PageCard>
        <div className="text-left mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">Your widgets</h1>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openNewWidgetForm'))}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 flex items-center"
            >
              <FaPlus className="mr-2" />
              New Widget
            </button>
          </div>
          <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
            Create and manage your review widgets. Customize their appearance and select which reviews to display.
          </p>
        </div>
        
        <WidgetList
          onSelectWidget={setSelectedWidget}
          selectedWidgetId={selectedWidget?.id}
          design={design}
          onDesignChange={setDesign}
          onWidgetDeleted={handleWidgetDeleted}
        />
      </PageCard>
    </div>
  );
}

