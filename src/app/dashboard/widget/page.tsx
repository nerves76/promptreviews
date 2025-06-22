"use client";
import React, { useState } from "react";
import WidgetList from "./WidgetList";
import PageCard from "@/app/components/PageCard";
import { FaPlus } from "react-icons/fa";
import { WidgetPreview } from "./components/WidgetPreview";
import { DEFAULT_DESIGN, DesignState } from "./components/widgets/multi";

export default function WidgetPage() {
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [design, setDesign] = useState<DesignState>(DEFAULT_DESIGN);

  return (
    <div className="p-4 md:p-8 lg:p-12">
      {/* Top Section: Widget Preview */}
      <div className="mb-8">
        <div className="relative w-full max-w-4xl mx-auto" style={{ minHeight: '600px' }}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Widget Preview</h2>
            <p className="mt-2 text-white/80">
              {selectedWidget ? `Editing: ${selectedWidget.name}` : 'Select a widget to see its preview'}
            </p>
          </div>
          <WidgetPreview widget={selectedWidget} />
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
        />
      </PageCard>
    </div>
  );
}

