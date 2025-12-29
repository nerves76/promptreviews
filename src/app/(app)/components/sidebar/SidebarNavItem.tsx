"use client";

import React from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { SidebarNavItemProps } from "./types";
import SidebarTooltip from "./SidebarTooltip";

/**
 * Individual navigation item in the sidebar
 */
export function SidebarNavItem({
  item,
  isActive,
  isCollapsed,
  isFavorited,
  isDisabled = false,
  onToggleFavorite,
}: SidebarNavItemProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(item.path);
  };

  const content = (
    <div
      className={`
        group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${isActive ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isCollapsed ? "justify-center items-center" : ""}
      `}
    >
      {/* Icon - aligned with first line of text */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
        <Icon name={item.icon} size={18} className="text-white" />
      </div>

      {/* Label and description - hidden when collapsed */}
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium block">{item.label}</span>
            {item.description && (
              <span className="text-xs text-white/50 block">{item.description}</span>
            )}
          </div>

          {/* Favorite button - only visible on hover when expanded */}
          <button
            onClick={handleFavoriteClick}
            className={`
              flex-shrink-0 p-1 rounded transition-all duration-200
              ${isFavorited ? "text-yellow-400 opacity-100" : "text-white/50 opacity-0 group-hover:opacity-100 hover:text-yellow-400"}
            `}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Icon name={isFavorited ? "FaStar" : "FaRegStar"} size={14} />
          </button>
        </>
      )}
    </div>
  );

  // Wrap in tooltip when collapsed
  const wrappedContent = isCollapsed ? (
    <SidebarTooltip content={item.label} disabled={!isCollapsed}>
      {content}
    </SidebarTooltip>
  ) : (
    content
  );

  if (isDisabled) {
    return <div className="block">{wrappedContent}</div>;
  }

  if (item.external) {
    return (
      <a
        href={item.path}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {wrappedContent}
      </a>
    );
  }

  return (
    <Link href={item.path} className="block">
      {wrappedContent}
    </Link>
  );
}

export default SidebarNavItem;
