"use client";

import React, { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useBusinessData, useAccountData } from "@/auth/hooks/granularAuthHooks";
import { useAuth } from "@/auth";
import { apiClient } from "@/utils/apiClient";

import { SidebarProps } from "./types";
import {
  TOP_NAV_ITEMS,
  NAV_SECTIONS,
  BOTTOM_NAV_ITEMS,
  isPathActive,
} from "./navConfig";
import { useSidebarState } from "./useSidebarState";
import { useSidebarFavorites } from "./useSidebarFavorites";

import SidebarNavItem from "./SidebarNavItem";
import SidebarSection from "./SidebarSection";
import SidebarFavorites from "./SidebarFavorites";
import SidebarToggle from "./SidebarToggle";
import SidebarTooltip from "./SidebarTooltip";

/**
 * Main sidebar navigation component
 * Desktop only - hidden on mobile (md: breakpoint)
 */
export function Sidebar({
  hasBusiness: hasBusinessProp,
  hasMultipleAccounts: hasMultipleAccountsProp,
  hasGbpAccess: hasGbpAccessProp,
  isAdmin: isAdminProp,
}: SidebarProps) {
  const pathname = usePathname();
  const { hasBusiness: authHasBusiness } = useBusinessData();
  const { accounts } = useAccountData();
  const { isAdminUser } = useAuth();

  // Use props if provided, otherwise use auth context
  const hasBusiness = hasBusinessProp ?? authHasBusiness;
  const hasMultipleAccounts = hasMultipleAccountsProp ?? (accounts?.length ?? 0) > 1;
  const isAdmin = isAdminProp ?? isAdminUser;
  // For now, assume GBP access if they have a business
  const hasGbpAccess = hasGbpAccessProp ?? hasBusiness;

  // Track if user has Work Manager boards (for single-account users)
  const [hasWorkManagerBoard, setHasWorkManagerBoard] = useState(false);

  // Fetch Work Manager boards for single-account users
  useEffect(() => {
    const checkWorkManagerBoards = async () => {
      if (!hasBusiness || hasMultipleAccounts) {
        setHasWorkManagerBoard(false);
        return;
      }
      try {
        const response = await apiClient.get<{ boards: unknown[] }>('/work-manager/boards');
        setHasWorkManagerBoard((response.boards || []).length > 0);
      } catch {
        // Silently fail - just don't show the link
        setHasWorkManagerBoard(false);
      }
    };
    checkWorkManagerBoards();
  }, [hasBusiness, hasMultipleAccounts]);

  // Sidebar state
  const {
    isCollapsed,
    toggleCollapsed,
    isSectionCollapsed,
    toggleSection,
    isHydrated,
  } = useSidebarState();

  // Favorites
  const {
    favorites,
    favoritePaths,
    isLoading: favoritesLoading,
    addFavorite,
    removeFavorite,
    isFavorited,
  } = useSidebarFavorites();

  // Calculate disabled items based on conditions
  const disabledItems = useMemo(() => {
    const disabled: string[] = [];

    // Check all nav items for business requirement
    const allItems = [
      ...TOP_NAV_ITEMS,
      ...NAV_SECTIONS.flatMap((s) => s.items),
      ...BOTTOM_NAV_ITEMS,
    ];

    allItems.forEach((item) => {
      if (item.requiresBusiness && !hasBusiness) {
        disabled.push(item.path);
      }
      if (item.conditional === "gbpAccess" && !hasGbpAccess) {
        disabled.push(item.path);
      }
      if (item.conditional === "adminOnly" && !isAdmin) {
        disabled.push(item.path);
      }
      // Note: workManager conditional is handled in visibleBottomItems filter
    });

    return disabled;
  }, [hasBusiness, hasGbpAccess, isAdmin]);

  // Filter bottom nav items based on conditions
  const visibleBottomItems = useMemo(() => {
    return BOTTOM_NAV_ITEMS.filter((item) => {
      // Work Manager: only show for single-account users who have a board
      if (item.conditional === "workManager") {
        return !hasMultipleAccounts && hasWorkManagerBoard;
      }
      if (item.conditional === "adminOnly" && !isAdmin) {
        return false;
      }
      return true;
    });
  }, [hasMultipleAccounts, hasWorkManagerBoard, isAdmin]);

  const handleToggleFavorite = async (path: string) => {
    try {
      if (isFavorited(path)) {
        await removeFavorite(path);
      } else {
        await addFavorite(path);
      }
    } catch (error) {
      console.error("[Sidebar] Error toggling favorite:", error);
    }
  };

  // Don't render until hydrated to prevent layout shift
  if (!isHydrated) {
    return (
      <aside
        className="hidden md:flex flex-col min-h-screen sticky top-0 w-64 bg-slate-800"
        style={{ backgroundColor: "#1e293b" }}
      />
    );
  }

  return (
    <aside
      className={`
        hidden md:flex flex-col min-h-screen sticky top-0
        border-r border-white/20
        transition-all duration-300 ease-in-out
        bg-slate-800
        ${isCollapsed ? "w-16" : "w-64"}
      `}
      style={{
        backgroundColor: "#1e293b",
      }}
    >
      {/* Header with toggle at top */}
      <div className="flex-shrink-0 border-b border-white/10 p-2">
        <SidebarToggle isCollapsed={isCollapsed} onToggle={toggleCollapsed} />
      </div>

      {/* Scrollable nav content */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.2) transparent',
        }}
      >
        {/* Favorites section */}
        <SidebarFavorites
          favorites={favorites}
          activePath={pathname}
          isCollapsed={isCollapsed}
          isLoading={favoritesLoading}
          onRemoveFavorite={removeFavorite}
        />

        {/* Top standalone links: Dashboard, Business Profile, Community */}
        <div className="mb-4 space-y-0.5">
          {TOP_NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.path}
              item={item}
              isActive={isPathActive(item.path, pathname)}
              isCollapsed={isCollapsed}
              isFavorited={isFavorited(item.path)}
              isDisabled={disabledItems.includes(item.path)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>

        {/* Navigation sections: Reviews, Google Business, SEO & AI Visibility */}
        {NAV_SECTIONS.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            activePath={pathname}
            isCollapsed={isCollapsed}
            isSectionCollapsed={isSectionCollapsed(section.id)}
            favorites={favoritePaths}
            disabledItems={disabledItems}
            onToggleSection={toggleSection}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}

        {/* Bottom nav items (Work Manager - conditional) */}
        {visibleBottomItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="space-y-0.5">
              {visibleBottomItems.map((item) => (
                <SidebarNavItem
                  key={item.path}
                  item={item}
                  isActive={isPathActive(item.path, pathname)}
                  isCollapsed={isCollapsed}
                  isFavorited={isFavorited(item.path)}
                  isDisabled={disabledItems.includes(item.path)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
