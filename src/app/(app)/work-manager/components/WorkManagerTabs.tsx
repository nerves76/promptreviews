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
  { id: "board", label: "Tasks", icon: "FaCheckCircle" },
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
    <div className="flex items-center gap-1">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-lg
              transition-all duration-200 ease-out
              ${isActive
                ? "bg-transparent text-white"
                : "bg-white/10 text-white/70 hover:text-white hover:bg-white/15"
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
    </div>
  );
}
