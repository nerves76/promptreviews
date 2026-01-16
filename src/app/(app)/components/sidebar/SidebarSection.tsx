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

  // Always show items if sidebar is collapsed (icon-only mode), otherwise check section collapsed state
  const showItems = isCollapsed || !isSectionCollapsed;

  // Handle section toggle
  const handleToggle = () => {
    if (section.collapsible) {
      onToggleSection(section.id);
    }
  };

  return (
    <div className="mb-4 pt-4 border-t border-white/10">
      {/* Section header - only show when sidebar is expanded */}
      {!isCollapsed && (
        <button
          onClick={handleToggle}
          className={`
            w-full flex items-center justify-between px-3 pt-2 pb-3
            ${hasActiveItem ? "text-white" : "text-white/70"}
            ${section.collapsible ? "hover:text-white cursor-pointer" : "cursor-default"}
            transition-colors
          `}
          aria-expanded={showItems}
          aria-label={section.collapsible ? `${isSectionCollapsed ? 'Expand' : 'Collapse'} ${section.label}` : undefined}
        >
          <span className="text-sm font-semibold text-white uppercase tracking-wider">
            {section.label}
          </span>
          {section.collapsible && (
            <Icon
              name="FaChevronDown"
              size={12}
              className={`
                text-white/50 transition-transform duration-200
                ${isSectionCollapsed ? "-rotate-90" : ""}
              `}
            />
          )}
        </button>
      )}

      {/* Section items - with smooth collapse animation */}
      <div
        className={`
          space-y-0.5 overflow-hidden transition-all duration-200 ease-in-out
          ${showItems ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
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
