"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import WidgetList from "./WidgetList";
import PageCard from "@/app/(app)/components/PageCard";
import Icon from "@/components/Icon";
import { WidgetPreview } from "./components/WidgetPreview";
import { StyleModal } from "./components/StyleModal";
import { ReviewManagementModal } from "./components/ReviewManagementModal";
import { DEFAULT_DESIGN, DesignState } from "./components/widgets/multi";
import { useWidgets } from "./hooks/useWidgets";
// import { useStableWidgetManager } from "./hooks/useStableWidgetManager";
// import { useRefreshGuard } from "./hooks/useRefreshGuard";
// import { useRefreshPrevention } from "./hooks/useRefreshPrevention";

export default function WidgetPage() {
  
  // Enable refresh guard to monitor and prevent unwanted refreshes
  // useRefreshGuard('WidgetPage');
  
  const { widgets, loading, error, createWidget, deleteWidget, saveWidgetName, saveWidgetDesign, fetchWidgets, selectedAccount } = useWidgets();
  // const { protectedOperation } = useStableWidgetManager();
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [selectedWidgetFull, setSelectedWidgetFull] = useState<any>(null);
  
  // Debug logging for component lifecycle
  useEffect(() => {
    return () => {
    };
  }, []);
  
  // Track when selectedWidgetFull changes
  useEffect(() => {
  }, [selectedWidgetFull]);
  
  // Clear selected widget when widgets list changes (e.g., after account switch)
  useEffect(() => {
    // If widgets array is empty (e.g., during account switch), clear selection
    if (widgets.length === 0 && selectedWidget) {
      setSelectedWidget(null);
      setSelectedWidgetFull(null);
    } 
    // If we have widgets, check if selected widget still exists
    else if (selectedWidget && widgets.length > 0) {
      const widgetStillExists = widgets.some(w => w.id === selectedWidget.id);
      if (!widgetStillExists) {
        setSelectedWidget(null);
        setSelectedWidgetFull(null);
      }
    }
  }, [widgets]);

  // Listen for account switch events and clear widget selection
  useEffect(() => {
    const handleAccountSwitch = (event: CustomEvent) => {
      setSelectedWidget(null);
      setSelectedWidgetFull(null);
      
      // Also clear any widget-related localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('widget') || key.includes('review'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    };

    window.addEventListener('accountSwitched', handleAccountSwitch as EventListener);
    return () => {
      window.removeEventListener('accountSwitched', handleAccountSwitch as EventListener);
    };
  }, []);
  
  // Storage key for design state persistence
  const designStorageKey = `widgetDesign_${selectedWidget?.id || 'default'}`;
  
  const [design, setDesign] = useState<DesignState>(() => {
    // For demo widget, always use the default design
    if (selectedWidget?.id === 'fake-multi-widget') {
      return DEFAULT_DESIGN;
    }
    
    // Try to restore design from localStorage for real widgets
    if (typeof window !== 'undefined') {
      const savedDesign = localStorage.getItem(designStorageKey);
      if (savedDesign) {
        try {
          const parsed = JSON.parse(savedDesign);
          return parsed;
        } catch (e) {
          console.error('Failed to parse saved design:', e);
        }
      }
    }
    return DEFAULT_DESIGN;
  });
  
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);

  // Function to fetch full widget data including reviews
  const fetchFullWidgetData = useCallback(async (widgetId: string) => {
    try {
      
      // apiClient now automatically includes X-Selected-Account header
      const fullWidgetData = await apiClient.get(`/widgets/${widgetId}`);
      
      setSelectedWidgetFull(fullWidgetData);
    } catch (error: any) {
      console.error('❌ WidgetPage: Error fetching full widget data:', error);
      
      // If we get a 403, it means the widget doesn't belong to the current account
      if (error?.status === 403 || error?.message?.includes('403')) {
        setSelectedWidget(null);
        setSelectedWidgetFull(null);
      }
    }
  }, []);

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
    
    if (loading) {
      return;
    }
    
    // Check if we already have a selected widget to avoid unnecessary re-selection
    if (selectedWidget && selectedWidget.id !== "fake-multi-widget") {
      return;
    }
    
    if (widgets && widgets.length > 0) {
      // Clear any fake widget and select the first real widget
      setSelectedWidget(widgets[0]);
      setSelectedWidgetFull(null); // Clear fake widget data
      // Fetch full widget data for the selected widget
      fetchFullWidgetData(widgets[0].id);
    } else if (widgets && widgets.length === 0) {
      const fakeWidget = {
        id: "fake-multi-widget",
        name: "Demo Multi-Widget",
        type: "multi",
        theme: DEFAULT_DESIGN,
        reviews: fakeReviews,
      };
      setSelectedWidget(fakeWidget);
      setSelectedWidgetFull(fakeWidget);
      // Reset design to use the new DEFAULT_DESIGN for demo widget
      setDesign(DEFAULT_DESIGN);
    }
  }, [loading, widgets?.length]); // Removed fakeReviews from deps since it's memoized

  // Auto-save design state to localStorage (but not for demo widget)
  React.useEffect(() => {
    const saveTimeout = setTimeout(() => {
      // Don't save demo widget design to localStorage
      if (typeof window !== 'undefined' && design && selectedWidget?.id && selectedWidget.id !== 'fake-multi-widget') {
        localStorage.setItem(designStorageKey, JSON.stringify(design));
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(saveTimeout);
  }, [design, designStorageKey, selectedWidget?.id]);

  // Additional check: if selected widget is fake but real widgets exist, switch to real widget
  React.useEffect(() => {
    if (selectedWidget && selectedWidget.id === "fake-multi-widget" && widgets && widgets.length > 0) {
      setSelectedWidget(widgets[0]);
      setSelectedWidgetFull(null);
      fetchFullWidgetData(widgets[0].id);
    }
  }, [selectedWidget, widgets]);

  // Action handlers
  const handleCopyEmbedCode = async () => {
    if (!selectedWidget) return;

    // Use the correct widget-specific container ID for each widget type
    let containerId;
          switch (selectedWidget.type) {
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
    
          const embedCode = `<script src="${window.location.origin}/widgets/${selectedWidget.type}/widget-embed.min.js"></script>
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
    if (!selectedWidget?.id) {
    }
    setShowReviewModal(true);
  };

  const handleSaveDesign = useCallback(async () => {
    if (selectedWidget) {
      await saveWidgetDesign(selectedWidget.id, design);
      setShowStyleModal(false);
    }
  }, [selectedWidget, design, saveWidgetDesign]);

  const handleResetDesign = () => {
    // Reset to default design
    setDesign(DEFAULT_DESIGN);
  };

  // Handle widget selection from the list
  const handleWidgetSelect = (widget: any) => {
    setSelectedWidget(widget);
    // Always fetch fresh data, even if the same widget is selected
    // This ensures updates from review changes are reflected
    fetchFullWidgetData(widget.id);
  };
  
  // Function to refresh the currently selected widget's data
  const refreshSelectedWidget = useCallback(() => {
    if (selectedWidget?.id && selectedWidget.id !== 'fake-multi-widget') {
      fetchFullWidgetData(selectedWidget.id);
    }
  }, [selectedWidget?.id, fetchFullWidgetData]);

  const isCopied = copiedWidgetId === selectedWidget?.id;

  return (
    <div className="p-4 md:p-8 lg:p-12">
      {/* Top Section: Widget Preview */}
      <div className="mb-8">
        <div className="relative w-full max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-2">
              <h2 className="text-2xl font-bold text-white">Widget preview</h2>
              
              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleEditStyle}
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/20 transition-all duration-200 group border border-white/30"
                  title="Edit Style"
                >
                  <Icon name="FaPalette" className="w-4 h-4 text-white group-hover:text-white/90 transition-colors" size={16} />
                </button>
                
                <button
                  onClick={handleManageReviews}
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/20 transition-all duration-200 group border border-white/30"
                  title="Manage Reviews"
                >
                  <Icon name="FaCommentDots" className="w-4 h-4 text-white group-hover:text-white/90 transition-colors" size={16} />
                </button>
                
                <button
                  onClick={handleCopyEmbedCode}
                  className={`p-2 rounded-full shadow-sm transition-all duration-200 group border ${
                    isCopied 
                      ? 'bg-green-500/20 backdrop-blur-sm hover:bg-green-500/30 border-green-400/30' 
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/30'
                  }`}
                  title={isCopied ? "Copied!" : "Copy Embed Code"}
                >
                  {isCopied ? (
                    <Icon name="FaCheck" className="w-4 h-4 text-white" size={16} />
                  ) : (
                    <Icon name="FaCode" className="w-4 h-4 text-white group-hover:text-white/90 transition-colors" size={16} />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-2 text-white/80">
              {selectedWidget ? `Editing: ${selectedWidget.name}` : ''}
            </p>
          </div>
          <div className="w-full">
            <WidgetPreview widget={selectedWidgetFull} design={design} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Header and Widget List */}
      <div className="w-full max-w-6xl mx-auto">
        <PageCard
          icon={<Icon name="FaCode" className="w-9 h-9 text-slate-blue" size={36} />}
          topRightAction={
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openNewWidgetForm'))}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 flex items-center"
            >
                              <Icon name="FaPlus" className="mr-2" size={16} />
              Create widget
            </button>
          }
        >
          <div className="mb-6">
            <h2 className="text-4xl font-bold text-slate-blue mt-0 mb-2">Your widgets</h2>
            <p className="text-gray-600">Create up to three widgets and embed them on your site.</p>
          </div>
          <WidgetList
            onSelectWidget={handleWidgetSelect}
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
            onRefreshWidget={refreshSelectedWidget}
            selectedAccount={selectedAccount}
          />
        </PageCard>
      </div>

      {/* Modals */}
      <ReviewManagementModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        widgetId={selectedWidget?.id}
        accountId={selectedAccount?.account_id}
        design={design}
        onReviewsChange={useCallback(() => {
          // Only refresh the full widget data to update the preview
          // Don't call fetchWidgets as it's not needed for review changes
          if (selectedWidget?.id) {
            fetchFullWidgetData(selectedWidget.id);
          }
        }, [selectedWidget?.id, fetchFullWidgetData])}
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

