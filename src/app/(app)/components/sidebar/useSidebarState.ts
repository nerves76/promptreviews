"use client";

import { useState, useEffect, useCallback } from "react";
import { NAV_SECTIONS } from "./navConfig";

const STORAGE_KEY = "promptreviews_sidebar_state";

interface SidebarStorageState {
  isCollapsed: boolean;
  collapsedSections: Record<string, boolean>;
}

/**
 * Hook to manage sidebar collapsed state with localStorage persistence
 */
export function useSidebarState() {
  // Initialize with defaults - will be updated from localStorage on mount
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    // Initialize all sections as expanded by default
    const initial: Record<string, boolean> = {};
    NAV_SECTIONS.forEach((section) => {
      initial[section.id] = section.defaultCollapsed ?? false;
    });
    return initial;
  });
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SidebarStorageState = JSON.parse(stored);
        setIsCollapsed(parsed.isCollapsed ?? false);
        if (parsed.collapsedSections) {
          setCollapsedSections((prev) => ({
            ...prev,
            ...parsed.collapsedSections,
          }));
        }
      }
    } catch (error) {
      console.error("[useSidebarState] Error loading from localStorage:", error);
    }
    setIsHydrated(true);
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const state: SidebarStorageState = {
        isCollapsed,
        collapsedSections,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("[useSidebarState] Error saving to localStorage:", error);
    }
  }, [isCollapsed, collapsedSections, isHydrated]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed: SidebarStorageState = JSON.parse(e.newValue);
          setIsCollapsed(parsed.isCollapsed ?? false);
          if (parsed.collapsedSections) {
            setCollapsedSections((prev) => ({
              ...prev,
              ...parsed.collapsedSections,
            }));
          }
        } catch (error) {
          console.error("[useSidebarState] Error parsing storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const setSectionCollapsed = useCallback((sectionId: string, collapsed: boolean) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: collapsed,
    }));
  }, []);

  const isSectionCollapsed = useCallback(
    (sectionId: string) => {
      return collapsedSections[sectionId] ?? false;
    },
    [collapsedSections]
  );

  return {
    isCollapsed,
    toggleCollapsed,
    setCollapsed,
    collapsedSections,
    toggleSection,
    setSectionCollapsed,
    isSectionCollapsed,
    isHydrated,
  };
}
