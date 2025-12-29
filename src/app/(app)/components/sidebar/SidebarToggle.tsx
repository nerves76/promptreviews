"use client";

import React from "react";
import Icon from "@/components/Icon";
import SidebarTooltip from "./SidebarTooltip";

interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * Toggle button at the top of the sidebar
 */
export function SidebarToggle({ isCollapsed, onToggle }: SidebarToggleProps) {
  const tooltipContent = isCollapsed ? "Expand sidebar" : "Collapse sidebar";

  const button = (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        text-white/70 hover:text-white hover:bg-white/10
        transition-all duration-200
        ${isCollapsed ? "w-full justify-center" : "ml-auto"}
      `}
      aria-label={tooltipContent}
      title={!isCollapsed ? tooltipContent : undefined}
    >
      {!isCollapsed && (
        <span className="text-sm font-medium">Collapse</span>
      )}
      <Icon
        name={isCollapsed ? "FaChevronRight" : "FaChevronLeft"}
        size={14}
        className="transition-transform duration-200"
      />
    </button>
  );

  if (isCollapsed) {
    return (
      <SidebarTooltip content={tooltipContent}>
        {button}
      </SidebarTooltip>
    );
  }

  return button;
}

export default SidebarToggle;
