"use client";

import React from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { SidebarFavoritesProps } from "./types";
import { findNavItemByPath, isPathActive } from "./navConfig";

/**
 * Favorites section at the top of the sidebar
 * Always shows labels even when sidebar is collapsed
 */
export function SidebarFavorites({
  favorites,
  activePath,
  isCollapsed,
  isLoading = false,
  onRemoveFavorite,
}: SidebarFavoritesProps) {
  if (isLoading) {
    return (
      <div className="mb-4 px-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="FaStar" size={14} className="text-yellow-400" />
          {!isCollapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Favorites
            </span>
          )}
        </div>
        {/* Loading skeleton */}
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-9 bg-white/10 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    if (isCollapsed) return null;

    return (
      <div className="mb-4 px-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="FaRegStar" size={14} className="text-white/50" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Favorites
          </span>
        </div>
        <p className="text-xs text-white/40 px-3 py-2">
          Pin items by clicking the star icon
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Section header */}
      <div className={`flex items-center gap-2 mb-2 ${isCollapsed ? "justify-center" : "px-3"}`}>
        <Icon name="FaStar" size={14} className="text-yellow-400" />
        {!isCollapsed && (
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Favorites
          </span>
        )}
      </div>

      {/* Favorite items - always show labels */}
      <div className="space-y-0.5">
        {favorites.map((favorite) => {
          const navItem = findNavItemByPath(favorite.nav_item_path);
          if (!navItem) return null;

          const isActive = isPathActive(navItem.path, activePath);

          return (
            <Link
              key={favorite.id}
              href={navItem.path}
              className={`
                group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                ${isActive ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"}
              `}
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <Icon name={navItem.icon} size={18} className="text-white" />
              </div>

              {/* Label - always shown for favorites */}
              <span className={`text-sm font-medium truncate ${isCollapsed ? "text-xs" : ""}`}>
                {navItem.label}
              </span>

              {/* Remove button - visible on hover */}
              {!isCollapsed && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemoveFavorite(navItem.path);
                  }}
                  className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-400 transition-all duration-200"
                  title="Remove from favorites"
                  aria-label="Remove from favorites"
                >
                  <Icon name="FaTimes" size={12} />
                </button>
              )}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className={`mt-3 mb-2 border-t border-white/10 ${isCollapsed ? "mx-2" : "mx-3"}`} />
    </div>
  );
}

export default SidebarFavorites;
