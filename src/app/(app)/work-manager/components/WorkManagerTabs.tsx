"use client";

import React from "react";
import Icon, { IconName } from "@/components/Icon";
import { WMViewTab } from "@/types/workManager";

interface Tab {
  id: WMViewTab;
  label: string;
  icon: IconName;
}

const TABS: Tab[] = [
  { id: "board", label: "Board", icon: "FaColumns" },
  { id: "resources", label: "Resources", icon: "FaBookmark" },
];

interface WorkManagerTabsProps {
  activeTab: WMViewTab;
  onTabChange: (tab: WMViewTab) => void;
}

export default function WorkManagerTabs({
  activeTab,
  onTabChange,
}: WorkManagerTabsProps) {
  return (
    <div className="flex items-end">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-5 py-2.5 font-semibold text-sm
              transition-all duration-200 ease-out
              ${isActive
                ? "bg-white/20 text-white border-t border-l border-r border-white/30 rounded-t-lg -mb-px z-10"
                : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-t border-l border-r border-transparent rounded-t-lg"
              }
            `}
            aria-selected={isActive}
            role="tab"
          >
            <Icon name={tab.icon} size={14} />
            <span>{tab.label}</span>
          </button>
        );
      })}
      {/* Spacer that extends the bottom border */}
      <div className="flex-1 border-b border-white/30 -mb-px" />
    </div>
  );
}
