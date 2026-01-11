"use client";

import React from "react";
import Icon from "@/components/Icon";
import { SidebarSectionProps } from "./types";
import { isPathActive } from "./navConfig";
import SidebarNavItem from "./SidebarNavItem";
import SidebarTooltip from "./SidebarTooltip";

/**
 * Section in the sidebar containing nav items
 */
export function SidebarSection({
  section,
  activePath,
  isCollapsed,
  isSectionCollapsed,
  favorites,
  disabledItems = [],
  onToggleSection,
  onToggleFavorite,
}: SidebarSectionProps) {
  // Check if any item in this section is active
  const hasActiveItem = section.items.some((item) =>
    isPathActive(item.path, activePath)
  );

  // Always show items if not collapsible, otherwise check collapsed state
  const showItems = !section.collapsible || isCollapsed || !isSectionCollapsed;

  // Section header - simple label, not a button unless collapsible
  const headerContent = (
    <div
      className={`
        flex items-center gap-2 px-3 pt-2 pb-3
        ${hasActiveItem ? "text-white" : "text-white/70"}
        ${isCollapsed ? "justify-center" : ""}
      `}
    >
      {/* Section label - hidden when sidebar collapsed */}
      {!isCollapsed && (
        <span className="text-sm font-semibold text-white uppercase tracking-wider">
          {section.label}
        </span>
      )}
    </div>
  );

  return (
    <div className="mb-4 pt-4 border-t border-white/10">
      {/* Section header - only show when expanded */}
      {!isCollapsed && headerContent}

      {/* Section items */}
      <div className={`space-y-0.5 ${isCollapsed ? "" : ""}`}>
        {section.items.map((item) => (
          <SidebarNavItem
            key={item.path}
            item={item}
            isActive={isPathActive(item.path, activePath)}
            isCollapsed={isCollapsed}
            isFavorited={favorites.includes(item.path)}
            isDisabled={disabledItems.includes(item.path)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}

export default SidebarSection;
