"use client";
import React, { useState } from "react";
import WidgetList from "./WidgetList";
import PageCard from "@/app/components/PageCard";
import { FaPlus, FaEdit, FaRegComment, FaCode, FaCheck } from "react-icons/fa";
import { WidgetPreview } from "./components/WidgetPreview";
import { StyleModal } from "./components/StyleModal";
import { ReviewManagementModal } from "./components/ReviewManagementModal";
import { DEFAULT_DESIGN, DesignState } from "./components/widgets/multi";
import { useWidgets } from "./hooks/useWidgets";

export default function WidgetPage() {
  const { widgets, loading, error, createWidget, deleteWidget, saveWidgetName, saveWidgetDesign, fetchWidgets } = useWidgets();
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [design, setDesign] = useState<DesignState>(DEFAULT_DESIGN);
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);

  // Fake reviews for empty state
  const fakeReviews = [
    {
      review_content: "You are killing it. Keep going. Everything you do is amazing!",
      first_name: "Motivator",
      last_name: "McCheer",
      reviewer_role: "Hype Person",
      created_at: new Date().toISOString(),
      star_rating: 5,
    },
    {
      review_content: "If coffee can't fix it, you can!",
      first_name: "Java",
      last_name: "Joe",
      reviewer_role: "Barista Coach",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      star_rating: 5,
    },
    {
      review_content: "Your code is so clean, VSCode asks for tips!",
      first_name: "Code",
      last_name: "Guru",
      reviewer_role: "Senior Encourager",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      star_rating: 5,
    },
  ];

  // Auto-select logic
  React.useEffect(() => {
    console.log('🔍 WidgetPage: Auto-select effect triggered', { loading, widgetsCount: widgets?.length, widgets });
    
    if (loading) {
      console.log('⏳ WidgetPage: Still loading, skipping auto-select');
      return;
    }
    
    if (widgets && widgets.length > 0) {
      console.log('✅ WidgetPage: Found widgets, selecting first one:', widgets[0]);
      setSelectedWidget(widgets[0]);
    } else {
      console.log('📝 WidgetPage: No widgets found, creating fake widget');
      setSelectedWidget({
        id: "fake-multi-widget",
        name: "Demo Multi-Widget",
        widget_type: "multi",
        theme: DEFAULT_DESIGN,
        reviews: fakeReviews,
      });
    }
  }, [loading, widgets]);

  // Action handlers
  const handleCopyEmbedCode = async () => {
    if (!selectedWidget) return;

    // Generate a unique container ID based on widget ID
    const uniqueContainerId = `promptreviews-widget-${selectedWidget.id.replace(/-/g, '')}`;
    
    const embedCode = `<script src="${window.location.origin}/widgets/${selectedWidget.widget_type}/widget-embed.min.js"></script>
<div id="${uniqueContainerId}" data-widget-id="${selectedWidget.id}"></div>`;

    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedWidgetId(selectedWidget.id);
      setTimeout(() => setCopiedWidgetId(null), 2000);
    } catch (err) {
      console.error('Failed to copy embed code:', err);
    }
  };

  const handleEditStyle = () => {
    setShowStyleModal(true);
  };

  const handleManageReviews = () => {
    setShowReviewModal(true);
  };

  const handleSaveDesign = async () => {
    if (selectedWidget) {
      await saveWidgetDesign(selectedWidget.id, design);
      fetchWidgets();
      setShowStyleModal(false);
    }
  };

  const isCopied = copiedWidgetId === selectedWidget?.id;

  return (
    <div className="p-4 md:p-8 lg:p-12">
      {/* Top Section: Widget Preview */}
      <div className="mb-8">
        <div className="relative w-full max-w-4xl mx-auto" style={{ minHeight: '600px' }}>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-2">
              <h2 className="text-2xl font-bold text-white">Widget Preview</h2>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleEditStyle}
                  className="p-2 bg-white/40 backdrop-blur-sm rounded-full shadow-lg hover:bg-white/50 transition-all duration-200 group"
                  title="Edit Style"
                >
                  <FaEdit className="w-4 h-4 text-slate-blue group-hover:text-slate-blue/80 transition-colors" />
                </button>
                
                <button
                  onClick={handleManageReviews}
                  className="p-2 bg-white/40 backdrop-blur-sm rounded-full shadow-lg hover:bg-white/50 transition-all duration-200 group"
                  title="Manage Reviews"
                >
                  <FaRegComment className="w-4 h-4 text-slate-blue group-hover:text-slate-blue/80 transition-colors" />
                </button>
                
                <button
                  onClick={handleCopyEmbedCode}
                  className={`p-2 rounded-full shadow-lg transition-all duration-200 group ${
                    isCopied 
                      ? 'bg-green-500/40 backdrop-blur-sm hover:bg-green-500/50' 
                      : 'bg-white/40 backdrop-blur-sm hover:bg-white/50'
                  }`}
                  title={isCopied ? "Copied!" : "Copy Embed Code"}
                >
                  {isCopied ? (
                    <FaCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <FaCode className="w-4 h-4 text-slate-blue group-hover:text-slate-blue/80 transition-colors" />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-2 text-white/80">
              {selectedWidget ? `Editing: ${selectedWidget.name}` : ''}
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
          widgets={widgets}
          loading={loading}
          error={error}
          createWidget={createWidget}
          deleteWidget={deleteWidget}
          saveWidgetName={saveWidgetName}
          saveWidgetDesign={saveWidgetDesign}
          fetchWidgets={fetchWidgets}
        />
      </PageCard>

      {/* Modals */}
      <ReviewManagementModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        widgetId={selectedWidget?.id}
        onReviewsChange={fetchWidgets}
      />

      {showStyleModal && selectedWidget && (
        <StyleModal
          isOpen={showStyleModal}
          onClose={() => setShowStyleModal(false)}
          selectedWidget={selectedWidget}
          design={design}
          onDesignChange={setDesign}
          onSaveDesign={handleSaveDesign}
        />
      )}
    </div>
  );
}

