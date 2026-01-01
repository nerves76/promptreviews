'use client';

import { useState, useEffect } from 'react';
import type { GoogleBusinessTab } from '../types/google-business';

const VALID_TABS: GoogleBusinessTab[] = [
  'connect',
  'overview',
  'create-post',
  'photos',
  'business-info',
  'services',
  'more',
  'reviews',
  'protection',
];

interface UseTabRoutingOptions {
  isConnected: boolean;
  isLoading: boolean;
  hasLocations: boolean;
}

interface UseTabRoutingReturn {
  activeTab: GoogleBusinessTab;
  setActiveTab: (tab: GoogleBusinessTab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  changeTab: (newTab: GoogleBusinessTab) => void;
}

/**
 * Hook to manage tab routing with URL sync
 *
 * Handles:
 * - Tab state initialization from URL
 * - URL parameter sync when tab changes
 * - Mobile menu state
 * - Default tab selection based on connection status
 */
export function useTabRouting({
  isConnected,
  isLoading,
  hasLocations,
}: UseTabRoutingOptions): UseTabRoutingReturn {
  // Initialize activeTab from URL parameter if available
  const [activeTab, setActiveTab] = useState<GoogleBusinessTab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as GoogleBusinessTab;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        return tabParam;
      }
    }
    // Default to connect tab if not connected, otherwise overview
    return 'connect';
  });

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Set default tab based on connection status
  useEffect(() => {
    // Only set default tab if no URL parameter was provided and not loading
    if (!isLoading && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hasTabParam = urlParams.has('tab');

      if (!hasTabParam) {
        // If not connected or no locations, show connect tab
        // Otherwise show overview tab with stats
        const defaultTab = (!isConnected || !hasLocations) ? 'connect' : 'overview';
        setActiveTab(defaultTab);
      }
    }
  }, [isConnected, isLoading, hasLocations]);

  // Update URL when tab changes
  const changeTab = (newTab: GoogleBusinessTab) => {
    setActiveTab(newTab);
    setIsMobileMenuOpen(false); // Close mobile menu when tab changes

    // Update URL parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  return {
    activeTab,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    changeTab,
  };
}
