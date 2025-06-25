"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
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

  // Memoize fake reviews to prevent recreation on every render
  const fakeReviews = useMemo(() => [
    {
      review_content: "The tour was incredible. Ricardo was an amazing guide. I really just had a stomach bug. Tell Ricardo, I'm happy to pay for his dry cleaning bill. Hope to return soon when I'm feeling better!",
      first_name: "Jillian",
      last_name: "Fox",
      reviewer_role: "Art Teacher",
      created_at: new Date().toISOString(),
      star_rating: 5,
    },
    {
      review_content: "I opened the app and it worked right away. No 20-minute setup, no crying, no Googling 'how do I do the thing.' Honestly? Felt like a hug from the future.",
      first_name: "Raymond",
      last_name: "Ortiz",
      reviewer_role: "Barber",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      star_rating: 5,
    },
    {
      review_content: "I used to run everything through spreadsheets and pure willpower. This app made me feel like I know what I'm doing. And honestly? That's a miracle.",
      first_name: "Linda",
      last_name: "Zhao",
      reviewer_role: "Bookkeeper",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      star_rating: 5,
    },
    {
      review_content: "I walked in for socks and walked out emotionally repaired. The cashier said 'have a great day' and I actually believed them.",
      first_name: "DeShawn",
      last_name: "Ellis",
      reviewer_role: "HVAC Tech",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      star_rating: 5,
    },
    {
      review_content: "They had what I needed, what I didn't know I needed, and free samples. I left broke and fulfilled.",
      first_name: "Priya",
      last_name: "Nand",
      reviewer_role: "Nurse",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      star_rating: 5,
    },
    {
      review_content: "I don't usually enjoy shopping, but somehow this place made me feel like the main character. My receipt even looked poetic.",
      first_name: "Brian",
      last_name: "Lund",
      reviewer_role: "Carpenter",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      star_rating: 5,
    },
    {
      review_content: "This coffee tastes like ambition and second chances. I drank two cups and finally responded to that email from 2022.",
      first_name: "Melissa",
      last_name: "Grant",
      reviewer_role: "Park Ranger",
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      star_rating: 5,
    },
    {
      review_content: "These boots were made for walking—and for me to aggressively strut past my ex at the farmer's market. They delivered.",
      first_name: "Alex",
      last_name: "Rivera",
      reviewer_role: "Barista",
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      star_rating: 5,
    },
    {
      review_content: "This flashlight is so bright I used it to find my self-worth. Also great for camping.",
      first_name: "Tom",
      last_name: "Becker",
      reviewer_role: "Mechanic",
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      star_rating: 5,
    },
  ], []);

  // Auto-select logic
  React.useEffect(() => {
    console.log('🔍 WidgetPage: Auto-select effect triggered', { loading, widgetsCount: widgets?.length });
    
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
  }, [loading, widgets?.length]);

  // Action handlers
  const handleCopyEmbedCode = async () => {
    if (!selectedWidget) return;

    // Use the correct widget-specific container ID for each widget type
    let containerId;
    switch (selectedWidget.widget_type) {
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
    
    const embedCode = `<script src="${window.location.origin}/widgets/${selectedWidget.widget_type}/widget-embed.min.js"></script>
<div id="${containerId}" data-widget-id="${selectedWidget.id}"></div>`;

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

  const handleResetDesign = () => {
    // Reset to default design
    setDesign(DEFAULT_DESIGN);
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
      <div className="w-full max-w-6xl mx-auto">
        <PageCard
          title="Your Widgets"
          description="Create up to three widgets and embed them on your site."
          icon={FaCode}
          topRightAction={
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openNewWidgetForm'))}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 flex items-center"
            >
              <FaPlus className="mr-2" />
              Create Widget
            </button>
          }
        >
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
      </div>

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
          onResetDesign={handleResetDesign}
        />
      )}
    </div>
  );
}

