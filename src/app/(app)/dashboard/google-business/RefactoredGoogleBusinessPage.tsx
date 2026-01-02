/**
 * REFACTORED Google Business Page
 * This is the new implementation being built incrementally.
 * Feature flag NEXT_PUBLIC_USE_REFACTORED_GBP=true enables this version.
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import PageCard from '@/app/(app)/components/PageCard';
import PageLoader from '@/app/(app)/components/PageLoader';
import { createClient } from '@/auth/providers/supabase';
import { apiClient } from '@/utils/apiClient';
import { useBusinessData, useAuthUser, useAccountData, useSubscriptionData } from '@/auth/hooks/granularAuthHooks';
import { safeTransformLocations, validateTransformedLocations } from '@/lib/google-business/safe-transformer';
import { getMaxLocationsForPlan, getPlanDisplayName } from '@/auth/utils/planUtils';
import LocationSelectionModal from '@/components/GoogleBusinessProfile/LocationSelectionModalV2';
import HelpModal from '@/app/(app)/components/help/HelpModal';
import ButtonSpinner from '@/components/ButtonSpinner';
import LocationPicker from '@/components/GoogleBusinessProfile/LocationPicker';
import ProtectionTab from '@/components/GoogleBusinessProfile/ProtectionTab';
import { exportOverviewToPDF } from '@/utils/googleBusinessProfile/pdfExport';

// Extracted types
import type { GoogleBusinessLocation, GoogleBusinessTab } from './types/google-business';

// Extracted hooks
import { useTabRouting } from './hooks/useTabRouting';

// Extracted components - Tabs
import { PhotosTab } from './components/tabs/PhotosTab';
import { BusinessInfoTab } from './components/tabs/BusinessInfoTab';
import { ServicesTab } from './components/tabs/ServicesTab';
import { ReviewsTab } from './components/tabs/ReviewsTab';
import { MoreTab } from './components/tabs/MoreTab';
import { OverviewTab } from './components/tabs/OverviewTab';
import { ConnectTab } from './components/tabs/ConnectTab';

// Extracted components - Navigation
import { TabNavigation } from './components/TabNavigation';
import { MobileTabMenu } from './components/MobileTabMenu';

// Extracted components - Modals
import { DisconnectConfirmModal } from './components/modals/DisconnectConfirmModal';
import { FetchLocationsModal } from './components/modals/FetchLocationsModal';
import { ImportReviewsModal } from './components/modals/ImportReviewsModal';

export function RefactoredGoogleBusinessPage() {
  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                         AUTH & ACCOUNT CONTEXT                           ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  // Use granular auth hooks to prevent refresh issues
  const { plan: currentPlan = 'free' } = useSubscriptionData();
  const { user } = useAuthUser();
  const { business } = useBusinessData();
  const { account, selectedAccountId } = useAccountData();
  const searchParams = useSearchParams();

  // Track the latest account context so async callbacks always send the correct header
  const accountIdRef = useRef<string | null>(selectedAccountId || account?.id || null);
  useEffect(() => {
    accountIdRef.current = selectedAccountId || account?.id || null;
  }, [selectedAccountId, account?.id]);


  /**
   * GOOGLE BUSINESS PROFILE STATE DOCUMENTATION
   * 
   * CRITICAL LOCATION SELECTION ISSUES & FIXES:
   * 
   * 1. BUSINESS NAMES NOT SHOWING:
   *    - Problem: location_name field may be undefined/empty from API
   *    - Solution: Added fallback display using location ID
   *    - Implementation: {location.name || `Business ${location.id}...`}
   * 
   * 2. SELECTING ONE CHECKBOX SELECTS ALL:
   *    - Problem: Label click propagates to all checkboxes
   *    - Solution: Added e.stopPropagation() on checkbox events
   *    - Implementation: Both onChange and onClick handlers stop propagation
   * 
   * 3. DATA FLOW:
   *    - Platforms API → returns raw DB data with location_name, location_id
   *    - Transform → maps to {id, name, address, status}
   *    - Display → shows name with fallback if empty
   * 
   * 4. STATE MANAGEMENT:
   *    - selectedLocations: Array of location IDs (not names)
   *    - Must create new array on change for React to detect updates
   *    - Uses localStorage for persistence across page refreshes
   */

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                         CONNECTION STATE                                 ║
  // ║  OAuth connection status, email, loading states                         ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const [isLoading, setIsLoading] = useState(true);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google-business-connected');
      return stored === 'true';
    }
    return false;
  });

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                       LOCATION MANAGEMENT STATE                          ║
  // ║  Locations list, selection, fetching, plan limits                       ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const [locations, setLocations] = useState<GoogleBusinessLocation[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google-business-locations');
      try {
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Track whether user has attempted to fetch locations before
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google-business-fetch-attempted');
      return stored === 'true';
    }
    return false;
  });
  
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google-business-selected-locations');
      try {
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  // Track maxLocations from API response
  const [maxGBPLocations, setMaxGBPLocations] = useState<number | null>(null);

  useEffect(() => {
    if (selectedLocations.length === 0) {
      return;
    }

    const validLocationIds = new Set(locations.map(loc => loc.id));
    const filteredSelection = selectedLocations.filter(id => validLocationIds.has(id));

    if (filteredSelection.length !== selectedLocations.length) {
      setSelectedLocations(filteredSelection);
    }
  }, [locations, selectedLocations]);

  const scopedSelectedLocations = useMemo(() => {
    if (selectedLocations.length === 0) {
      return [] as GoogleBusinessLocation[];
    }

    const locationMap = new Map(locations.map(loc => [loc.id, loc]));

    return selectedLocations
      .map(id => locationMap.get(id))
      .filter((loc): loc is GoogleBusinessLocation => Boolean(loc));
  }, [locations, selectedLocations]);

  const scopedLocations = scopedSelectedLocations.length > 0 ? scopedSelectedLocations : locations;
  const resolvedSelectedLocation = (() => {
    if (!selectedLocationId) {
      return scopedLocations[0];
    }

    const match = scopedLocations.find(loc => loc.id === selectedLocationId);
    return match || scopedLocations[0];
  })();
  
  // Enforce location selection rules based on actual account limits
  useEffect(() => {
    // If there's exactly one location, force select it
    if (locations.length === 1) {
      const only = locations[0].id;
      if (selectedLocations.length !== 1 || selectedLocations[0] !== only) {
        setSelectedLocations([only]);
      }
      return;
    }

    // Enforce maxGBPLocations limit if available (respects database overrides)
    if (maxGBPLocations !== null && maxGBPLocations > 0 && selectedLocations.length > maxGBPLocations) {
      console.log(`⚠️ Location selection exceeds limit (${selectedLocations.length} > ${maxGBPLocations}). Trimming to limit.`);
      setSelectedLocations(selectedLocations.slice(0, maxGBPLocations));
    }
  }, [locations, maxGBPLocations, selectedLocations]);

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                        POST CREATION STATE                               ║
  // ║  Post content, images, CTA, posting status, AI improvement              ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const [postContent, setPostContent] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedContent = localStorage.getItem('googleBusinessPostContent');
      if (savedContent) {
        return savedContent;
      }
    }
    return '';
  });
  const [postType, setPostType] = useState<'WHATS_NEW' | 'EVENT' | 'OFFER' | 'PRODUCT'>('WHATS_NEW');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Auto-save post content to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && postContent) {
        localStorage.setItem('googleBusinessPostContent', postContent);
      }
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(saveTimeout);
  }, [postContent]);
  const [showCTA, setShowCTA] = useState(false);
  const [ctaType, setCTAType] = useState<'LEARN_MORE' | 'CALL' | 'ORDER_ONLINE' | 'BOOK' | 'SIGN_UP' | 'BUY'>('LEARN_MORE');
  const [ctaUrl, setCTAUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);
  const [improvingWithAI, setImprovingWithAI] = useState(false);
  const [hasRateLimitError, setHasRateLimitError] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [fetchingLocations, setFetchingLocations] = useState<string | null>(null);
  const [isPostOAuthConnecting, setIsPostOAuthConnecting] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                        CROSS-POSTING STATE                               ║
  // ║  Bluesky, LinkedIn connections and posting toggles                      ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const [blueskyConnection, setBlueskyConnection] = useState<{ id: string; handle: string } | null>(null);
  const [linkedinConnection, setLinkedinConnection] = useState<{ id: string; handle: string; organizations?: Array<{ id: string; name: string; logoUrl?: string }> } | null>(null);
  const [postToBluesky, setPostToBluesky] = useState(false);
  // LinkedIn targets - supports personal profile + organization pages
  const [linkedInTargets, setLinkedInTargets] = useState<Array<{ type: 'personal' | 'organization'; id: string; name: string }>>([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                           UI & MODAL STATE                               ║
  // ║  Modal visibility, help modals, import state                            ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImportingReviews, setIsImportingReviews] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number; errors?: string[]; totalErrorCount?: number } | null>(null);
  const [selectedImportType, setSelectedImportType] = useState<'all' | 'new'>('all');
  const [showFetchConfirmModal, setShowFetchConfirmModal] = useState(false);
  const [showProductsHelpModal, setShowProductsHelpModal] = useState(false);
  const [showPostTypesHelpModal, setShowPostTypesHelpModal] = useState(false);
  const [showLocationSelectionModal, setShowLocationSelectionModal] = useState(false);
  const [pendingLocations, setPendingLocations] = useState<GoogleBusinessLocation[]>([]);

  // Handle ?reselect=true query param to auto-open location selection modal
  useEffect(() => {
    if (searchParams.get('reselect') === 'true' && isConnected && !isLoading) {
      setShowLocationSelectionModal(true);
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('reselect');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, isConnected, isLoading]);

  const planLocationLimit = useMemo(() => getMaxLocationsForPlan(currentPlan), [currentPlan]);
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Plan access state for Growers
  const [hasGBPAccess, setHasGBPAccess] = useState(true);
  const [gbpAccessMessage, setGbpAccessMessage] = useState("");
  
  // Check if user has Google Business Profile access
  const checkGBPAccess = () => {
    // All plans now have access to Google Business Profile
    setHasGBPAccess(true);
    setGbpAccessMessage("");
  };
  const loadingRef = useRef(false); // More persistent loading prevention
  const initialLoadDone = useRef(false); // Track if initial load has been completed

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                          OVERVIEW STATE                                  ║
  // ║  Overview/analytics data, loading, errors                               ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  // Cache version: increment to invalidate old cached data when adding new fields
  const OVERVIEW_CACHE_VERSION = 3; // v3 adds postsData
  const [overviewData, setOverviewData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google-business-overview-data');
      try {
        const parsed = stored ? JSON.parse(stored) : null;
        // Invalidate cache if version is outdated or missing
        if (parsed && parsed._cacheVersion !== OVERVIEW_CACHE_VERSION) {
          localStorage.removeItem('google-business-overview-data');
          return null;
        }
        // Also invalidate if postsData is missing
        if (parsed && !('postsData' in parsed)) {
          localStorage.removeItem('google-business-overview-data');
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Ref to track image URLs for cleanup
  const imageUrlsRef = useRef<string[]>([]);

  // Update ref whenever imageUrls changes
  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                       TAB & NAVIGATION STATE                             ║
  // ║  Active tab, URL sync, mobile menu                                      ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const [activeTab, setActiveTab] = useState<'connect' | 'overview' | 'create-post' | 'photos' | 'business-info' | 'services' | 'more' | 'reviews' | 'protection'>(() => {
    // Initialize from URL parameter if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as 'connect' | 'overview' | 'create-post' | 'photos' | 'business-info' | 'services' | 'more' | 'reviews' | 'protection';
      if (tabParam && ['connect', 'overview', 'create-post', 'photos', 'business-info', 'services', 'more', 'reviews', 'protection'].includes(tabParam)) {
        return tabParam;
      }
    }
    // Default to connect tab if not connected, otherwise overview
    return 'connect';
  });

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                      TAB & URL SYNC EFFECTS                              ║
  // ║  URL parameter sync, default tab selection, tab change handler          ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  // Set default tab based on connection status
  useEffect(() => {
    // Only set default tab if no URL parameter was provided and not loading
    if (!isLoading && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hasTabParam = urlParams.has('tab');
      
      if (!hasTabParam) {
        // If not connected or no locations, show connect tab
        // Otherwise show overview tab with stats
        const defaultTab = (!isConnected || locations.length === 0) ? 'connect' : 'overview';
        setActiveTab(defaultTab);
      }
    }
  }, [isConnected, isLoading]);

  // Check GBP access when plan changes
  useEffect(() => {
    if (currentPlan) {
      checkGBPAccess();
    }
  }, [currentPlan]);

  // Update URL when tab changes
  const changeTab = (newTab: 'connect' | 'overview' | 'create-post' | 'photos' | 'business-info' | 'services' | 'more' | 'reviews' | 'protection') => {
    setActiveTab(newTab);
    setIsMobileMenuOpen(false); // Close mobile menu when tab changes
    
    // Update URL parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Auto-clear SUCCESS messages after a delay, but keep ERROR messages visible
  useEffect(() => {
    if (postResult && postResult.success) {
      const timer = setTimeout(() => {
        setPostResult(null);
      }, 5000); // Clear success messages after 5 seconds
      return () => clearTimeout(timer);
    }
    // Don't auto-clear error messages - user must dismiss them manually
  }, [postResult]);

  /**
   * Handle post-OAuth redirects and initial page load
   * 
   * CRITICAL OAUTH ERROR HANDLING:
   * 1. OAuth callback adds query params: ?tab=connect&error=XXX&message=YYY
   * 2. This effect reads those params and displays appropriate messages
   * 3. Most common error: missing_scope (user didn't check permission checkbox)
   * 
   * URL PARAMETER HANDLING:
   * - Must properly parse when URL already has query params (?tab=connect)
   * - OAuth callback uses & to append additional params
   * - Clean up URL after processing to prevent message persistence
   * - MUST preserve tab parameter when cleaning URL (fixed bug where tab was lost)
   * 
   * COMMON ISSUES & FIXES:
   * - If no message shows: Check URL has proper format (not ?tab=connect?error=...)
   * - If message disappears: Check postResult state is being set
   * - If wrong tab shows: Ensure setActiveTab('connect') for errors
   * - If connection succeeds but UI doesn't update: Check tab parameter is preserved
   * 
   * FLOW AFTER OAUTH:
   * 1. User clicks Connect → Goes to Google OAuth
   * 2. User grants/denies permissions → Redirects to callback
   * 3. Callback processes tokens → Redirects to dashboard with params
   * 4. This effect reads params → Shows message and updates UI
   * 5. Clean URL but keep tab → User stays on correct tab
   */
  useEffect(() => {
    
    // Prevent multiple runs - only run once per page load
    if (initialLoadDone.current) {
      return;
    }
    
    // Mark initial load as completed IMMEDIATELY to prevent re-runs
    initialLoadDone.current = true;
    
    // Check if we're coming back from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const isPostOAuth = urlParams.get('connected') === 'true';
    const hasError = urlParams.get('error');
    
    // Clear OAuth flag when returning from OAuth
    if (typeof window !== 'undefined' && sessionStorage.getItem('googleOAuthInProgress') === 'true') {
      sessionStorage.removeItem('googleOAuthInProgress');
    }
    
    // Also check for cookie flag from OAuth callback
    if (typeof document !== 'undefined' && document.cookie.includes('clearGoogleOAuthFlag=true')) {
      // Clear the cookie
      document.cookie = 'clearGoogleOAuthFlag=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
    
    // Handle OAuth errors
    if (hasError) {
      const message = urlParams.get('message');
      const conflictEmail = urlParams.get('conflictEmail');

      // Check if this is a missing_scope error
      if (hasError === 'missing_scope') {

        // Just show the simple message - no auto-fix attempts
        setPostResult({
          success: false,
          message: message ? decodeURIComponent(message) : 'Please try connecting again and make sure to check the business management permission checkbox when prompted.'
        });

        // Set active tab to connect so user sees the Connect button
        setActiveTab('connect');
      } else if (hasError === 'already_connected') {
        // Handle duplicate Google account connection error with special formatting
        const email = conflictEmail ? decodeURIComponent(conflictEmail) : 'this Google account';
        const conflictAccount = urlParams.get('conflictAccount');
        const accountName = conflictAccount ? decodeURIComponent(conflictAccount) : 'another account';

        // Use the message from the URL, or build a default one
        const detailedMessage = message ? decodeURIComponent(message) :
          `This Google account (${email}) is already connected to "${accountName}". Switch to that account and disconnect there, or revoke access in Google Account Security → Third-party apps.`;

        setPostResult({
          success: false,
          message: detailedMessage
        });

        // Set active tab to connect so user sees the Connect button
        setActiveTab('connect');
      } else {
        // Other errors - show the message
        setPostResult({
          success: false,
          message: message ? decodeURIComponent(message) : 'Failed to connect to Google Business Profile'
        });
      }
      
      /**
       * CRITICAL: Clean up OAuth parameters but PRESERVE the tab parameter
       * 
       * Previous bug: Using window.location.pathname removed ALL query params including tab
       * This caused the UI to lose track of which tab to show after OAuth redirect
       * 
       * Solution: Extract and preserve the tab parameter when cleaning the URL
       * This ensures users stay on the Connect tab after OAuth success/error
       */
      const tabParam = urlParams.get('tab');
      const cleanUrl = tabParam ? `${window.location.pathname}?tab=${tabParam}` : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      
      // Load platforms to show disconnected state
      loadPlatforms();
    } else if (isPostOAuth) {
      
      /**
       * POST-OAUTH LOADING STATE FIX:
       * Show immediate loading feedback to user after OAuth
       * Previously tabs were greyed out with no indication of processing
       */
      setIsPostOAuthConnecting(true); // Show "Finalizing connection..." state
      setIsLoading(true);
      
      // Show initial connecting message
      const message = urlParams.get('message');
      if (message) {
        setPostResult({ success: true, message: decodeURIComponent(message) });
      } else {
        // Show connecting message, not success yet
        setPostResult({ success: true, message: 'Connecting to Google Business Profile...' });
      }
      
      /**
       * CRITICAL: Clean up OAuth parameters but PRESERVE the tab parameter
       * 
       * Previous bug: Using window.location.pathname removed ALL query params including tab
       * This caused the UI to lose track of which tab to show after OAuth redirect
       * 
       * Solution: Extract and preserve the tab parameter when cleaning the URL
       * This ensures users stay on the Connect tab after OAuth success/error
       */
      const tabParam = urlParams.get('tab');
      const cleanUrl = tabParam ? `${window.location.pathname}?tab=${tabParam}` : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      
      // Don't set connected state yet - wait for actual data
      // setIsConnected(true); // Removed - wait for actual connection confirmation
      
      // Give the database a moment to save the tokens, then load platforms
      setTimeout(async () => {
        try {
          await loadPlatforms();
          // Success message will be shown after platforms are actually loaded
          // and locations are fetched (handled in loadPlatforms)
        } finally {
          setIsPostOAuthConnecting(false); // Clear the connecting state
        }
      }, 1000); // Reduced to 1 second - balance between safety and speed
    } else {
      // Load platforms on page load (normal page load)
      loadPlatforms();
    }
    
    // IMPORTANT: No automatic refresh after initial load to prevent form resets
  }, []); // Empty dependencies - this should only run once on mount

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                    LOCALSTORAGE PERSISTENCE EFFECTS                      ║
  // ║  Sync state changes to localStorage                                     ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  useEffect(() => {
    localStorage.setItem('google-business-connected', isConnected.toString());
  }, [isConnected]);

  useEffect(() => {
    localStorage.setItem('google-business-locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('google-business-selected-locations', JSON.stringify(selectedLocations));
  }, [selectedLocations]);

  useEffect(() => {
    if (overviewData) {
      // Add cache version when saving
      localStorage.setItem('google-business-overview-data', JSON.stringify({
        ...overviewData,
        _cacheVersion: OVERVIEW_CACHE_VERSION
      }));
    }
  }, [overviewData]);

  // Clear localStorage when account changes to prevent stale data from other accounts
  const prevAccountIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentAccountId = selectedAccountId || account?.id;

    // On first load, just store the account ID
    if (prevAccountIdRef.current === null) {
      prevAccountIdRef.current = currentAccountId || null;
      return;
    }

    // If account changed, clear all google-business localStorage
    if (currentAccountId && prevAccountIdRef.current !== currentAccountId) {
      console.log('[GBP] Account changed, clearing localStorage cache');
      localStorage.removeItem('google-business-connected');
      localStorage.removeItem('google-business-locations');
      localStorage.removeItem('google-business-selected-locations');
      localStorage.removeItem('google-business-fetch-attempted');
      localStorage.removeItem('google-business-overview-data');

      // Reset state
      setIsConnected(false);
      setLocations([]);
      setSelectedLocations([]);
      setHasAttemptedFetch(false);
      setOverviewData(null);

      // Update the ref
      prevAccountIdRef.current = currentAccountId;

      // Trigger a fresh load
      setIsLoading(true);
    }
  }, [selectedAccountId, account?.id]);

  // Clean up image URLs on unmount
  useEffect(() => {
    return () => {
      // imageUrlsRef.current.forEach(url => URL.revokeObjectURL(url)); // This ref was removed
    };
  }, []); // Empty dependency array means this runs only on unmount

  // REMOVED: Conflicting useEffect that was setting loading states without calling loadPlatforms
  // The main useEffect above handles all platform loading logic

  // Handle rate limit countdown
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCountdown(rateLimitCountdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (rateLimitCountdown === 0 && hasRateLimitError) {
      // Countdown finished, allow retry
      setHasRateLimitError(false);
    }
  }, [rateLimitCountdown, hasRateLimitError]);

  // Handle rate limit for fetch locations button
  useEffect(() => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      const checkInterval = setInterval(() => {
        if (Date.now() >= rateLimitedUntil) {
          setRateLimitedUntil(null);
        }
      }, 1000); // Check every second
      
      return () => clearInterval(checkInterval);
    }
  }, [rateLimitedUntil]);

  // Auto-select first location when locations load
  const initialFetchDone = useRef(false);

  useEffect(() => {
    let locationToUse: string | null = null;

    if (selectedLocations.length > 0) {
      if (!selectedLocations.includes(selectedLocationId)) {
        locationToUse = selectedLocations[0];
        setSelectedLocationId(locationToUse);
      } else {
        locationToUse = selectedLocationId; // Already selected
      }
    } else if (scopedLocations.length > 0) {
      if (!selectedLocationId) {
        locationToUse = scopedLocations[0].id;
        setSelectedLocationId(locationToUse);
      } else {
        locationToUse = selectedLocationId; // Already selected
      }
    }

    // Trigger initial overview fetch on overview tab
    if (locationToUse && activeTab === 'overview' && isConnected && !initialFetchDone.current) {
      // Check if we need to fetch (no data or outdated cache)
      const needsFetch = !overviewData ||
        overviewData.locationId !== locationToUse ||
        !('postsData' in overviewData) ||
        overviewData._cacheVersion !== OVERVIEW_CACHE_VERSION;

      if (needsFetch) {
        initialFetchDone.current = true;
        fetchOverviewData(locationToUse);
      } else {
        initialFetchDone.current = true;
      }
    }
  }, [selectedLocations, selectedLocationId, scopedLocations, activeTab, isConnected, overviewData]);

  // Fetch overview data when tab becomes active (only if not already cached)
  // Track whether we have a valid account ID to trigger refetch
  const hasValidAccountId = !!(selectedAccountId || account?.id);

  useEffect(() => {
    // Wait until account context is ready
    if (!hasValidAccountId) return;

    // Check all conditions
    if (activeTab !== 'overview' || !selectedLocationId || !isConnected) return;

    // Only fetch if we don't have data, if the selected location changed, or if postsData is missing
    const needsFetch = !overviewData ||
      overviewData.locationId !== selectedLocationId ||
      !('postsData' in overviewData);

    if (needsFetch) {
      fetchOverviewData(selectedLocationId);
    }
  }, [activeTab, selectedLocationId, isConnected, hasValidAccountId, overviewData, locations.length]);

  // REMOVED: Auto-switch to overview tab - let users stay on the tab they choose
  // This was causing confusion when users fetched locations and got moved away from Connect tab
  // useEffect(() => {
  //   if (isConnected && activeTab === 'connect' && locations.length > 0) {
  //     changeTab('overview');
  //   }
  // }, [isConnected, activeTab, locations.length]);

  // Fetch social connections (Bluesky, LinkedIn) for cross-posting on create-post tab
  useEffect(() => {
    if (activeTab !== 'create-post' || !isConnected) return;

    const fetchSocialConnections = async () => {
      try {
        const data = await apiClient.get<{
          connections: Array<{
            platform: string;
            status: string;
            handle: string;
            id: string;
            organizations?: Array<{ id: string; name: string; logoUrl?: string }>;
          }>;
        }>('/social-posting/connections');

        if (data.connections) {
          const bluesky = data.connections.find(c => c.platform === 'bluesky' && c.status === 'active');
          const linkedin = data.connections.find(c => c.platform === 'linkedin' && c.status === 'active');

          console.log('[GBP] LinkedIn connection from API:', linkedin);
          console.log('[GBP] LinkedIn organizations:', linkedin?.organizations);

          setBlueskyConnection(bluesky ? { id: bluesky.id, handle: bluesky.handle } : null);
          setLinkedinConnection(linkedin ? {
            id: linkedin.id,
            handle: linkedin.handle,
            organizations: linkedin.organizations
          } : null);
        }
      } catch (err) {
        console.error('Failed to fetch social connections:', err);
      }
    };

    fetchSocialConnections();
  }, [activeTab, isConnected]);

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                       PLATFORM LOADING LOGIC                             ║
  // ║  loadPlatforms callback - fetches GBP connection status and locations   ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const loadPlatforms = useCallback(async (accountOverride?: string) => {
    
    // Prevent multiple simultaneous calls using ref (more reliable)
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    setIsLoadingPlatforms(true);
    
    try {
      const activeAccountId = accountOverride ?? accountIdRef.current;

      if (!activeAccountId) {
        console.warn('[Google Business] Missing account context for platform status fetch');
      }

      // Get the current session token for authentication
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setIsConnected(false);
        setLocations([]);
        setSelectedLocations([]);
        setPostResult({ 
          success: false, 
          message: 'Please refresh the page to sign in again.' 
        });
        setIsLoading(false);
        return;
      }

      // Check platforms API for database state only (no token validation calls)
      // Add cache-busting to ensure fresh data after disconnect
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache'
      };

      if (activeAccountId) {
        headers['X-Selected-Account'] = activeAccountId;
      }

      const response = await fetch(`/api/social-posting/platforms?t=${Date.now()}`, {
        cache: 'no-store',
        headers,
        credentials: 'same-origin'
      });
      
      if (response.status === 401) {
        setIsConnected(false);
        setLocations([]);
        setSelectedLocations([]);
        setPostResult({ 
          success: false, 
          message: 'Please refresh the page or sign in again to access Google Business Profile features.' 
        });
        setIsLoading(false);
        return;
      }
      
      if (response.ok) {
        const responseData = await response.json();
        
        const platforms = responseData.platforms || [];
        const googlePlatform = platforms.find((p: any) => p.id === 'google-business-profile');
        
        
        if (googlePlatform && googlePlatform.connected) {
          setIsConnected(true);
          setConnectedEmail(googlePlatform.connectedEmail || null);

          // Extract and store max locations limit from API response
          if (googlePlatform.maxLocations !== undefined) {
            setMaxGBPLocations(googlePlatform.maxLocations);
            console.log(`✅ Account max GBP locations limit: ${googlePlatform.maxLocations}`);
          }

          // Load business locations from the platforms response
          const locations = googlePlatform.locations || [];
          
          // Debug: Log the raw location data structure
          if (locations.length > 0) {
          }
          
          // Ensure location_name is accessible before transformation
          const locationsWithNames = locations.map(loc => ({
            ...loc,
            name: loc.location_name || loc.name, // Ensure name field exists
            title: loc.location_name || loc.title // Ensure title field exists
          }));
          
          // Use safe transformer to prevent TypeErrors
          const transformedLocations = safeTransformLocations(locationsWithNames);
          
          // Validate the transformation
          const validation = validateTransformedLocations(transformedLocations);
          if (!validation.valid && process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Location data validation issues:', validation.issues);
            // Still proceed, but log issues for monitoring
          }
          
          // Log summary in development
          if (process.env.NODE_ENV === 'development') {
            transformedLocations.forEach((loc, i) => {
              if (loc._debug?.warnings?.length) {
              }
            });
          }
          
          // Only update locations if they've actually changed to prevent unnecessary re-renders
          setLocations(prev => {
            const hasChanged = prev.length !== transformedLocations.length || 
              prev.some((loc, idx) => loc.id !== transformedLocations[idx]?.id);
            
            if (hasChanged) {
              return transformedLocations;
            } else {
              return prev; // Return existing array to prevent re-render
            }
          });
          
          if (transformedLocations.length > 0 && selectedLocations.length === 0) {
            setSelectedLocations([transformedLocations[0].id]); // Select first location by default
          }
          
          // If we have locations, clear the attempted fetch flag
          if (transformedLocations.length > 0) {
            setHasAttemptedFetch(false);
            localStorage.removeItem('google-business-fetch-attempted');
            
            // Show success message when we actually have the data
            // Only show if we're in post-OAuth flow (not regular page load)
            if (isPostOAuthConnecting) {
              setPostResult({ 
                success: true, 
                message: `Successfully connected! Found ${transformedLocations.length} business location${transformedLocations.length !== 1 ? 's' : ''}.` 
              });
            }
          } else if (isPostOAuthConnecting) {
            // Connected but no locations found yet
            setPostResult({ 
              success: true, 
              message: 'Successfully connected! Click "Fetch Business Locations" to load your businesses.' 
            });
          }
        } else {
          setIsConnected(false);
          setConnectedEmail(null);
          setLocations([]);
          setSelectedLocations([]);
          
          // Show error message if available
          if (googlePlatform?.error) {
            setPostResult({ 
              success: false, 
              message: googlePlatform.error 
            });
          }
        }
      } else {
        console.error('Failed to check platform connections, status:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
        setIsConnected(false);
        setPostResult({ 
          success: false, 
          message: `Unable to load social posting platforms (status: ${response.status}). Please try refreshing the page.` 
        });
      }
    } catch (error) {
      console.error('Failed to load platforms:', error);
      setIsConnected(false);
      setLocations([]);
      setSelectedLocations([]);
      
      // const errorMessage = error instanceof Error ? error.message : String(error);
      setPostResult({ 
        success: false, 
        message: 'Failed to load Google Business Profile connection. Please refresh the page or try reconnecting.' 
      });
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      
      // Add a delay before clearing the platforms loading state
      // This ensures React has time to process the location state updates
      setTimeout(() => {
        setIsLoadingPlatforms(false);
      }, 500); // Increased delay to 500ms for better reliability
    }
  }, []); // Remove dependency to prevent useEffect from running multiple times

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                        CONNECTION HANDLERS                               ║
  // ║  OAuth connect/disconnect, location fetching and selection              ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const handleConnect = async () => {
    // Check if user has GBP access before connecting
    if (!hasGBPAccess) {
      setPostResult({ 
        success: false, 
        message: 'Google Business Profile integration is available on Builder and Maven plans. Please upgrade to connect your Google Business Profile.' 
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Store flag to preserve session during OAuth redirect
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('googleOAuthInProgress', 'true');
      }
      
      // Get Google OAuth credentials from environment
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '984479581786-8h619lvt0jvhakg7riaom9bs7mlo1lku.apps.googleusercontent.com';
      const redirectUriRaw = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
      
      // Validate required environment variables
      if (!redirectUriRaw) {
        setPostResult({ success: false, message: 'Missing Google OAuth configuration. Please check environment variables.' });
        setIsLoading(false);
        // Clear OAuth flag on error
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('googleOAuthInProgress');
        }
        return;
      }
      
      const redirectUri = encodeURIComponent(redirectUriRaw);
      // OAuth scope for Google Business Profile API
      // Use the exact scope that was working before
      const scope = 'https://www.googleapis.com/auth/business.manage email profile openid';
      // URL encode the entire scope string
      const encodedScope = encodeURIComponent(scope);
      const responseType = 'code';
      // CRITICAL: Always require an explicit account ID for OAuth
      // This prevents cross-account token leakage
      const activeAccountId = selectedAccountId || account?.id;
      if (!activeAccountId) {
        setConnectionError('Unable to determine account context. Please refresh the page and try again.');
        setIsConnecting(false);
        return;
      }

      const statePayload = {
        platform: 'google-business-profile',
        returnUrl: '/dashboard/google-business?tab=connect',
        accountId: activeAccountId
      };

      console.log('🔍 [OAuth] Starting OAuth flow with state:', statePayload);

      const state = encodeURIComponent(JSON.stringify(statePayload));

      console.log('🔍 [OAuth] Encoded state:', state);

      // Construct Google OAuth URL
      // Use prompt=select_account+consent to force account selection AND show all permissions
      // This helps bypass Google's cached permissions
      // include_granted_scopes=false ensures only requested scopes are granted
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodedScope}&response_type=${responseType}&state=${state}&access_type=offline&prompt=select_account%20consent&include_granted_scopes=false`;
      
      
      // Add a small delay to ensure session storage is set
      setTimeout(() => {
        // Redirect to Google OAuth
        window.location.href = googleAuthUrl;
      }, 100);
    } catch (error) {
      console.error('❌ Failed to initiate Google OAuth:', error);
      setPostResult({ success: false, message: 'Failed to connect to Google Business Profile' });
      setIsLoading(false);
      // Clear OAuth flag on error
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('googleOAuthInProgress');
      }
    }
  };

  /**
   * Handles disconnecting from Google Business Profile
   * 
   * CRITICAL NOTES:
   * 1. State is cleared IMMEDIATELY in finally block for instant UI feedback
   * 2. Tab is forced to 'connect' after disconnect to show connection UI
   * 3. Uses 1.5s delay before loadPlatforms() to ensure DB transaction completes
   * 4. Service role client used in API to bypass RLS policies
   * 
   * DISCONNECT UI UPDATE FIX (2025-08-12):
   * - Problem: UI wasn't updating immediately after disconnect
   * - Root cause: loadPlatforms() was called too soon (500ms) before DB update completed
   * - Solution: 
   *   a) Clear all state IMMEDIATELY in finally block (don't wait for API)
   *   b) Force activeTab to 'connect' to show connection UI
   *   c) Increase delay to 1.5s before loadPlatforms() for DB sync
   *   d) Added validation in platforms API to check for null tokens
   * 
   * Flow:
   * 1. Call disconnect API to revoke Google tokens and remove from database
   * 2. Immediately clear all localStorage and React state (in finally block)
   * 3. Force tab to 'connect' and close modal
   * 4. Wait 1.5s then reload platforms to confirm disconnection
   * 
   * State cleared:
   * - localStorage: google-business-connected, locations, selected-locations, fetch-attempted, overview-data
   * - React state: isConnected, locations, selectedLocations, selectedLocationId, hasAttemptedFetch, overviewData
   */
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setIsLoadingPlatforms(true); // Also set platforms loading state
      
      // Call API to remove OAuth tokens from database
      try {
        await apiClient.post('/social-posting/platforms/google-business-profile/disconnect', {});
        setPostResult({
          success: true,
          message: 'Successfully disconnected from Google Business Profile'
        });
      } catch {
        console.warn('⚠️ API disconnect failed, clearing local state anyway');
        setPostResult({
          success: false,
          message: 'Disconnect partially failed - local state cleared'
        });
      }
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
      setPostResult({ 
        success: false, 
        message: 'Error during disconnect - local state cleared' 
      });
    } finally {
      /**
       * CRITICAL: Clear state IMMEDIATELY to reflect disconnection in UI
       * This ensures the user sees the change right away, even before
       * the platforms API confirms the disconnection.
       * 
       * Order of operations:
       * 1. Clear all localStorage entries
       * 2. Reset all React state to disconnected state
       * 3. Close modal
       * 4. Wait longer (1.5s) before reloading platforms to ensure DB is updated
       */
      
      // Clear all localStorage entries
      localStorage.removeItem('google-business-connected');
      localStorage.removeItem('google-business-locations');
      localStorage.removeItem('google-business-selected-locations');
      localStorage.removeItem('google-business-fetch-attempted');
      localStorage.removeItem('google-business-overview-data');

      // Immediately update UI state to show disconnected
      setIsConnected(false);
      setConnectedEmail(null); // Clear the connected email
      setLocations([]);
      setSelectedLocations([]);
      setSelectedLocationId('');
      setHasAttemptedFetch(false);
      setOverviewData(null); // Clear the overview data state
      setIsLoading(false);
      setIsLoadingPlatforms(false); // Clear platforms loading state too
      
      // Close the disconnect confirmation dialog
      setShowDisconnectConfirm(false);
      
      // Force tab to Connect after disconnect to show the connection UI
      setActiveTab('connect');
      
      // CRITICAL: Wait longer before reloading to ensure database is fully updated
      // This gives time for the database transaction to complete
      // Also force a hard refresh to clear any potential caching
      setTimeout(async () => {
        
        // Force clear the loading ref to ensure loadPlatforms can run
        loadingRef.current = false;
        
        // Add a cache-busting parameter to force fresh data
        await loadPlatforms();
      }, 2000); // Increased to 2000ms for better reliability
    }
  };

  const handleFetchLocations = async () => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
      const remainingTime = Math.ceil((rateLimitedUntil - Date.now()) / 1000);
      setPostResult({ 
        success: false, 
        message: `Rate limited. Please wait ${remainingTime} more seconds.` 
      });
      return;
    }
    
    // Show confirmation modal
    setShowFetchConfirmModal(true);
  };
  
  const performFetchLocations = async () => {
    const platformId = 'google-business-profile';
    setShowFetchConfirmModal(false);
    setFetchingLocations(platformId);

    try {
      // CRITICAL: Include account context in request
      const activeAccountId = selectedAccountId || account?.id;
      if (!activeAccountId) {
        setPostResult({
          success: false,
          message: 'Unable to determine account context. Please refresh the page and try again.'
        });
        setFetchingLocations(null);
        return;
      }

      console.log('🔍 [Fetch Locations] Using account ID:', activeAccountId);

      // Increase timeout to 5 minutes to account for rate limiting delays
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes

      const response = await fetch(`/api/social-posting/platforms/${platformId}/fetch-locations`, {
        method: 'POST',
        signal: controller.signal,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Selected-Account': activeAccountId
        },
        body: JSON.stringify({ force: true }) // Always force refresh to get latest from Google
      });
      
      clearTimeout(timeoutId);

      if (response.status === 429) {
        const result = await response.json();
        const retryAfter = result.retryAfter || 120; // Default to 120 seconds (2 minutes)
        const cooldownTime = Date.now() + (retryAfter * 1000);
        setRateLimitedUntil(cooldownTime);
        
        // Show detailed rate limit message
        let message = `⏳ Google Business Profile API Rate Limit\n\n`;
        message += result.message || 'API rate limit reached.';
        
        if (result.suggestion) {
          message += `\n\n💡 ${result.suggestion}`;
        }
        
        if (result.details?.waitTime) {
          message += `\n\n⏱️ Wait time: ${result.details.waitTime}`;
        }
        
        if (result.details?.reason) {
          message += `\n📝 Reason: ${result.details.reason}`;
        }
        
        setPostResult({ success: false, message });
        return;
      }

      if (!response.ok) {
        try {
          const errorData = await response.json();
          
          // Handle specific error types
          if (errorData.error === 'AUTH_ERROR') {
            setPostResult({ 
              success: false, 
              message: `Authentication Error: ${errorData.message}. ${errorData.suggestion || 'Please reconnect your Google Business Profile.'}` 
            });
            // Clear connection state
            setIsConnected(false);
            setLocations([]);
            setOverviewData(null);
            localStorage.removeItem('google-business-connected');
            localStorage.removeItem('google-business-locations');
            localStorage.removeItem('google-business-overview-data');
            return;
          } else if (errorData.error === 'PERMISSION_ERROR') {
            setPostResult({ 
              success: false, 
              message: `Permission Error: ${errorData.message}. ${errorData.suggestion || 'Check your Google Business Profile permissions.'}` 
            });
            return;
          } else if (errorData.error === 'NETWORK_ERROR') {
            setPostResult({ 
              success: false, 
              message: `Network Error: ${errorData.message}. ${errorData.suggestion || 'Check your internet connection.'}` 
            });
            return;
          } else if (errorData.error === 'TOKEN_REFRESHED') {
            // Token was refreshed, retry automatically
            setPostResult({ success: true, message: 'Your authentication was refreshed. Retrying...' });
            // Retry the fetch
            setTimeout(() => handleFetchLocations(), 1000);
            return;
          }
          
          throw new Error(errorData.message || errorData.error || 'Failed to fetch locations');
        } catch (parseError) {
          // If JSON parsing fails, fall back to text
          const errorText = await response.text();
          throw new Error(`Failed to fetch locations: ${errorText}`);
        }
      }

      const result = await response.json();
      
      // Update local state with fetched locations
      if (result.locations && result.locations.length > 0) {
        // Validate and transform locations to ensure proper structure
        const validLocations = result.locations.map((loc: any) => ({
          id: loc.id || loc.location_id || '',
          name: loc.name || loc.location_name || '',
          address: loc.address || ''
        }));
        
        
        // If only one location, auto-select it and skip the modal
        if (validLocations.length === 1) {
          
          // Auto-select the single location
          const singleLocation = validLocations[0];
          setLocations([singleLocation]);
          setSelectedLocations([singleLocation.id]);
          setSelectedLocationId(singleLocation.id);
          
          // Save to localStorage
          localStorage.setItem('google-business-locations', JSON.stringify([singleLocation]));
          localStorage.setItem('google-business-selected-locations', JSON.stringify([singleLocation.id]));
          
          // Mark as fetched
          setHasAttemptedFetch(true);
          localStorage.setItem('google-business-fetch-attempted', 'true');
          
          // Show success message
          const demoNote = result.isDemoMode ? ' (Demo Mode - Using test data due to Google rate limits)' : '';
          setPostResult({ 
            success: true, 
            message: `Connected to ${singleLocation.name}!${demoNote} Your business location is ready to manage.` 
          });
          
          // Automatically switch to overview tab for single location
          changeTab('overview');
        } else {
          // Multiple locations - show selection modal
          setPendingLocations(validLocations);
          setShowLocationSelectionModal(true);
          
          // Show initial success message
          const demoNote = result.isDemoMode ? ' (Demo Mode - Using test data due to Google rate limits)' : '';
          setPostResult({ 
            success: true, 
            message: `Found ${result.locations?.length || 0} business locations!${demoNote} Please select which ones to manage.` 
          });
        }
      } else {
        // Only mark as attempted if we got a response but no locations
        setHasAttemptedFetch(true);
        localStorage.setItem('google-business-fetch-attempted', 'true');
        setPostResult({ 
          success: false, 
          message: 'No business locations found. Please check your Google Business Profile access.' 
        });
      }
      
      // Don't call loadPlatforms here as it causes duplicate messages
      // The state is already updated above
    } catch (error) {
      console.error('Error fetching locations:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setPostResult({ 
          success: false, 
          message: 'Request timed out. The process may still be running in the background. Please wait a few minutes and refresh the page to check if locations were fetched.' 
        });
             } else if (error instanceof Error && error.message.includes('rate limit')) {
        // Rate limited - set a 2 minute cooldown
        const cooldownTime = Date.now() + (120 * 1000); // 2 minutes
        setRateLimitedUntil(cooldownTime);
        setPostResult({ 
          success: false, 
          message: 'Google Business Profile API quota exhausted. Please wait 2 minutes before trying again, or request higher quota limits in Google Cloud Console.' 
        });
      } else {
        setPostResult({ 
          success: false, 
          message: 'Failed to fetch business locations. Please try again.' 
        });
      }
    } finally {
      setFetchingLocations(null);
    }
  };

  // Handle location selection confirmation
  const handleLocationSelectionConfirm = async (selectedIds: string[]) => {
    try {
      
      // Filter locations to only selected ones
      const selectedLocs = pendingLocations.filter(loc => selectedIds.includes(loc.id));
      
      
      // Validate selected locations
      if (!selectedLocs || selectedLocs.length === 0) {
        throw new Error('No valid locations selected');
      }
      
      // Save to database
      await apiClient.post('/social-posting/platforms/google-business-profile/save-selected-locations', {
        locations: selectedLocs.map(loc => ({
          id: loc.id || '',
          name: loc.name || '',
          address: loc.address || ''
        }))
      });
      
      // Save selected locations to state and localStorage
      setLocations(selectedLocs);
      localStorage.setItem('google-business-locations', JSON.stringify(selectedLocs));
      setHasAttemptedFetch(false);
      
      // Auto-select first location if none selected
      if (!selectedLocationId && selectedLocs.length > 0) {
        setSelectedLocationId(selectedLocs[0].id);
      }
      
      setShowLocationSelectionModal(false);
      setPendingLocations([]);
      
      // Show success message
      setPostResult({ 
        success: true, 
        message: `Successfully configured ${selectedLocs.length} location${selectedLocs.length !== 1 ? 's' : ''} for management!` 
      });
      
      // Switch to overview tab
      setActiveTab('overview');
    } catch (error) {
      console.error('Error saving location selection:', error);
      setPostResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to save location selection. Please try again.' 
      });
    }
  };
  
  // Handle location selection cancel
  const handleLocationSelectionCancel = () => {
    // Clear pending locations and close modal
    setPendingLocations([]);
    setShowLocationSelectionModal(false);
    
    // Mark as attempted so user can try again
    setHasAttemptedFetch(true);
    localStorage.setItem('google-business-fetch-attempted', 'true');
    
    setPostResult({
      success: false,
      message: 'Location selection cancelled. You can select locations later from the settings.'
    });
  };

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                          POST HANDLERS                                   ║
  // ║  Post creation, AI improvement, image upload                            ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const handlePost = async () => {
    if (!postContent.trim() || selectedLocations.length === 0) {
      setPostResult({ success: false, message: 'Please enter post content and select at least one location' });
      return;
    }

    // Validate CTA if enabled
    if (showCTA && !ctaUrl.trim()) {
      setPostResult({ success: false, message: 'Please provide a URL for your Call-to-Action button' });
      return;
    }

    if (showCTA && ctaUrl && !isValidUrl(ctaUrl)) {
      setPostResult({ success: false, message: 'Please provide a valid URL for your Call-to-Action button' });
      return;
    }

    try {
      setIsPosting(true);
      setPostResult(null);
      
      
      // Upload images to Supabase storage (with error handling)
      let uploadedImageUrls: string[] = [];
      if (selectedImages.length > 0) {
        try {
          uploadedImageUrls = await uploadImagesToStorage(selectedImages);
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          
          // Check if it's a bucket not found error
          if (uploadError?.message?.includes('Bucket not found') || uploadError?.error === 'Bucket not found') {
            setPostResult({ 
              success: false, 
              message: 'Image storage is not configured. Please contact support to enable image uploads, or post without images for now.' 
            });
          } else {
            // Show more detailed error message
            const errorMessage = uploadError?.message || uploadError?.error || JSON.stringify(uploadError) || 'Unknown error';
            setPostResult({ 
              success: false, 
              message: `Failed to upload images: ${errorMessage}` 
            });
          }
          setIsPosting(false);
          return;
        }
      }

      // Build additional platforms for cross-posting
      const additionalPlatforms: {
        bluesky?: { enabled: boolean; connectionId: string };
        linkedin?: { enabled: boolean; connectionId: string; targets: Array<{ type: 'personal' | 'organization'; id: string; name: string }> };
      } = {};
      if (postToBluesky && blueskyConnection) {
        additionalPlatforms.bluesky = { enabled: true, connectionId: blueskyConnection.id };
      }
      if (linkedInTargets.length > 0 && linkedinConnection) {
        additionalPlatforms.linkedin = {
          enabled: true,
          connectionId: linkedinConnection.id,
          targets: linkedInTargets
        };
      }

      // Post to each selected location individually
      const postPromises = selectedLocations.map(async (locationId) => {
        const postData = {
          content: postContent,
          platforms: ['google-business-profile'],
          additionalPlatforms: Object.keys(additionalPlatforms).length > 0 ? additionalPlatforms : undefined,
          type: postType,
          mediaUrls: uploadedImageUrls, // Include uploaded image URLs for the adapter
          callToAction: showCTA && ctaUrl ? {
            actionType: ctaType,
            url: ctaUrl
          } : undefined,
          metadata: {
            locationId: locationId
          }
        };
        
        
        let result;
        try {
          result = await apiClient.post<{ success: boolean; data?: any; error?: string }>('/social-posting/posts', postData);
        } catch (error) {
          result = { success: false, error: error instanceof Error ? error.message : 'Failed to post' };
        }
        const location = locations.find(loc => loc.id === locationId);
        
        return {
          locationId,
          locationName: location?.name || locationId,
          success: result.success,
          result: result
        };
      });

      const postResults = await Promise.all(postPromises);

      const successfulPosts = postResults.filter(r => r.success);
      const failedPosts = postResults.filter(r => !r.success);

      if (successfulPosts.length === selectedLocations.length) {
        setPostResult({ 
          success: true, 
          message: `Successfully published to all ${selectedLocations.length} location${selectedLocations.length !== 1 ? 's' : ''}!`
        });
        setPostContent(''); // Clear content on success
        localStorage.removeItem('googleBusinessPostContent'); // Clear saved content
        clearAllImages(); // Clear uploaded images on success
        setShowCTA(false); // Clear CTA on success
        setCTAType('LEARN_MORE');
        setCTAUrl('');
      } else if (successfulPosts.length > 0) {
        setPostResult({ 
          success: true, 
          message: `Published to ${successfulPosts.length} of ${selectedLocations.length} locations. ${failedPosts.length} location${failedPosts.length !== 1 ? 's' : ''} failed: ${failedPosts.map(f => f.locationName).join(', ')}`
        });
      } else {
        // All posts failed
        const firstError = failedPosts[0]?.result?.data?.publishResults?.['google-business-profile']?.error || 
                          failedPosts[0]?.result?.error || 
                          'All posts failed';
        setPostResult({ 
          success: false, 
          message: `Failed to publish to any locations. Error: ${firstError}`
        });
      }
    } catch (error) {
      console.error('Post failed:', error);
      setPostResult({ success: false, message: 'Failed to publish posts. Please check your connection and try again.' });
    } finally {
      setIsPosting(false);
    }
  };

  const getCharacterCount = () => postContent.length;
  const getCharacterLimit = () => 1500;
  const isOverLimit = () => getCharacterCount() > getCharacterLimit();

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      // Allow tel: links for CALL CTA
      if (ctaType === 'CALL' && url.startsWith('tel:')) {
        return url.length > 4; // Must have something after 'tel:'
      }
      // Standard URL validation for other CTA types
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Clear all form data
  const clearAllFormData = () => {
    setPostContent('');
    localStorage.removeItem('googleBusinessPostContent'); // Clear saved content
    setPostResult(null);
    clearAllImages();
    setShowCTA(false);
    setCTAType('LEARN_MORE');
    setCTAUrl('');
  };

  // Improve post with AI
  const handleImproveWithAI = async () => {
    if (!postContent.trim()) {
      setPostResult({ success: false, message: 'Please enter some post content to improve' });
      return;
    }

    if (selectedLocations.length === 0) {
      setPostResult({ success: false, message: 'Please select at least one location to get business context' });
      return;
    }

    setImprovingWithAI(true);
    setPostResult(null);

    try {
      // Get selected location names for context
      const selectedLocationNames = selectedLocations.map(locationId => {
        const location = locations.find(l => l.id === locationId);
        return location?.name || 'Unknown Location';
      });

      const requestData = {
        currentContent: postContent,
        businessLocations: selectedLocationNames,
        ctaType: showCTA ? ctaType : null,
        ctaUrl: showCTA ? ctaUrl : null,
        imageCount: selectedImages.length
      };

      const result = await apiClient.post<{ success: boolean; improvedContent?: string; message?: string }>('/social-posting/improve-with-ai', requestData);
      
      if (result.success && result.improvedContent) {
        setPostContent(result.improvedContent);
        setPostResult({
          success: true,
          message: 'Post improved with AI! Check the enhanced content above.'
        });
      } else {
        setPostResult({ success: false, message: result.message || 'Failed to improve post' });
      }
    } catch (error) {
      console.error('Error improving post with AI:', error);
      setPostResult({ 
        success: false, 
        message: 'Failed to improve post. Please try again.' 
      });
    } finally {
      setImprovingWithAI(false);
    }
  };

  // Image upload functions
  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isImage) {
        setPostResult({ success: false, message: 'Please select only image files.' });
        return false;
      }
      if (!isValidSize) {
        setPostResult({ success: false, message: 'Images must be smaller than 10MB.' });
        return false;
      }
      return true;
    });

    if (selectedImages.length + imageFiles.length > 10) {
      setPostResult({ success: false, message: 'Maximum 10 images allowed per post.' });
      return;
    }

    setUploadingImages(true);
    setPostResult(null);

    try {
      // Create a copy of existing images and add new ones
      const newImages = [...selectedImages, ...imageFiles];
      setSelectedImages(newImages);

      // Create preview URLs for new images
      const newImageUrls = imageFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newImageUrls]);

    } catch (error) {
      console.error('Image upload error:', error);
      setPostResult({ success: false, message: 'Failed to process images. Please try again.' });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imageUrls[index]);
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    // Revoke all object URLs
    imageUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImageUrls([]);
  };

  // Upload images to Supabase storage
  // NOTE: Requires 'post-images' bucket to exist in Supabase Storage
  // Run scripts/create-post-images-bucket.js to create it
  const uploadImagesToStorage = async (images: File[]): Promise<string[]> => {
    if (images.length === 0) return [];

    const uploadPromises = images.map(async (image, index) => {
      try {
        const fileName = `post-image-${Date.now()}-${index}-${image.name}`;
        const { data, error } = await createClient()
          .storage
          .from('post-images')
          .upload(fileName, image);

        if (error) {
          console.error('Error uploading image:', error);
          // Make sure error has proper structure
          const errorObj = {
            message: error?.message || 'Failed to upload image',
            error: error?.error || error?.message || 'Unknown error',
            statusCode: error?.statusCode || error?.status || '400'
          };
          throw errorObj;
        }

        // Get public URL
        const { data: urlData } = createClient()
          .storage
          .from('post-images')
          .getPublicUrl(fileName);

        return urlData.publicUrl;
      } catch (error) {
        console.error('Failed to upload image:', error);
        throw error;
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error: any) {
      console.error('Some images failed to upload:', error);
      // Pass through the error with more details
      throw error;
    }
  };

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                        OVERVIEW HANDLERS                                 ║
  // ║  Overview data fetching, quick actions, PDF export, review import       ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const fetchOverviewData = async (locationId: string) => {
    if (!locationId) return;

    // Get account ID directly to avoid stale ref issues
    const activeAccountId = selectedAccountId || account?.id || accountIdRef.current;

    if (!activeAccountId) return;

    setOverviewLoading(true);
    setOverviewError(null);

    try {
      const data = await apiClient.get<{ success: boolean; data?: any; error?: string }>(`/google-business-profile/overview?locationId=${encodeURIComponent(locationId)}`);

      if (data.success) {
        // Include locationId in the stored data for cache validation
        console.log('📊 Overview Data Received:', {
          totalReviews: data.data?.reviewTrends?.totalReviews,
          monthlyDataLength: data.data?.reviewTrends?.monthlyReviewData?.length,
          monthlyData: data.data?.reviewTrends?.monthlyReviewData
        });
        setOverviewData({ ...data.data, locationId });
      } else {
        setOverviewError(data.error || 'Failed to fetch overview data');
      }
    } catch (error) {
      setOverviewError('Failed to fetch overview data');
    } finally {
      setOverviewLoading(false);
    }
  };

  // Handle location selection for overview
  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
    if (locationId && activeTab === 'overview') {
      fetchOverviewData(locationId);
    }
  };

  // Handle quick actions from overview
  const handleOverviewQuickAction = (action: string, data?: any) => {
    switch (action) {
      case 'edit-business-info':
        changeTab('business-info');
        break;
      case 'manage-reviews':
        changeTab('reviews');
        break;
      case 'manage-photos':
        changeTab('photos');
        break;
      case 'create-post':
        changeTab('create-post');
        break;
      case 'navigate':
        if (data?.url) {
          window.open(data.url, '_blank');
        }
        break;
    }
  };

  // Handle PDF export
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    if (isExportingPDF) return;

    setIsExportingPDF(true);
    try {
      const locationName = scopedLocations.find(loc => loc.id === selectedLocationId)?.name || 'Business Overview';
      await exportOverviewToPDF('overview-content', {
        filename: `google-business-optimization-report-${locationName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
        locationName,
        date: new Date()
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Handle importing reviews from Google Business Profile
  const handleImportReviews = async (type: 'all' | 'new') => {
    // Prevent multiple simultaneous imports
    if (isImportingReviews) {
      console.warn('⚠️ Import already in progress, ignoring duplicate call');
      return;
    }

    if (!selectedLocationId) {
      setImportResult({ success: false, message: 'Please select a location first' });
      return;
    }

    setIsImportingReviews(true);
    setImportResult(null);

    try {
      console.log('🔄 Starting import with:', {
        locationId: selectedLocationId,
        importType: type,
        accountId: accountIdRef.current,
        selectedAccountId: selectedAccountId,
        accountFromContext: account?.id,
        fullAccount: account
      });

      const result = await apiClient.post<{ success: boolean; message?: string; count?: number; errors?: any[]; totalErrorCount?: number; error?: string; details?: any }>('/google-business-profile/import-reviews', {
        locationId: selectedLocationId,
        importType: type
      });

      console.log('📦 Import result:', result);

      if (result.success) {
        const locationName = locations.find(l => l.id === selectedLocationId)?.name || 'selected location';
        setImportResult({
          success: true,
          message: result.message || `Reviews imported successfully from ${locationName}!`,
          count: result.count,
          errors: result.errors, // Include error details for debugging
          totalErrorCount: result.totalErrorCount
        });
        if (result.errors && result.errors.length > 0) {
          console.warn('⚠️ Import had some errors:', result.errors);
        }
      } else {
        const errorMsg = result.error || result.message || 'Failed to import reviews';
        setImportResult({
          success: false,
          message: errorMsg
        });
        console.error('❌ Failed to import reviews:', {
          error: result.error,
          message: result.message,
          details: result.details,
          fullResult: result
        });
      }
    } catch (error) {
      console.error('❌ Error importing reviews:', error);
      setImportResult({
        success: false,
        message: `Failed to import reviews: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsImportingReviews(false);
    }
  };

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║                              RENDER                                      ║
  // ║  Loading states and main UI render                                      ║
  // ╚══════════════════════════════════════════════════════════════════════════╝

  // Also check if we're connected but locations are still being loaded
  const isStillLoadingLocations = isConnected && locations.length === 0 && isLoadingPlatforms;
  
  if (isLoading || isPostOAuthConnecting || isLoadingPlatforms || isStillLoadingLocations) {
    return (
      <PageLoader 
        showText={true} 
        text={isPostOAuthConnecting ? 'Connecting to Google Business Profile...' : 'Loading Google Business...'} 
      />
    );
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16">
      <PageCard
        icon={<Icon name="FaGoogle" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-0"
      >
        
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
            <div className="text-left">
              <h1 className="text-3xl font-bold text-slate-blue mb-2">
                Google Biz Optimizer
              </h1>
              <p className="text-gray-600">
                Optimize your Google Business Profile with Prompty power! Update regularly for best results.
              </p>
              {/* Connection Status Indicator */}
              {isConnected && (
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-sm">
                  <div className="flex items-center space-x-1 text-green-600">
                    <Icon name="FaCheck" className="w-3 h-3" />
                    <span className="font-medium">Connected</span>
                  </div>
                  {connectedEmail && (
                    <span className="text-gray-600">
                      • {connectedEmail}
                    </span>
                  )}
                  {locations.length > 0 && (
                    <span className="text-gray-500">
                      • {selectedLocations.length > 0
                        ? `${selectedLocations.length} selected of ${locations.length} location${locations.length !== 1 ? 's' : ''}`
                        : `${locations.length} location${locations.length !== 1 ? 's' : ''} available`
                      }
                      {currentPlan === 'grower' && locations.length > 1 && (
                        <span className="text-amber-600"> (Grower plan: 1 location limit)</span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Import Reviews Button */}
              {isConnected && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className="w-full sm:w-auto px-4 py-2 text-sm text-green-700 border border-green-300 rounded-md hover:bg-green-50 transition-colors"
                >
                  Import & verify reviews
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex justify-between items-center p-4">
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'connect' && 'Connect'}
                {activeTab === 'overview' && 'Overview'}
                {activeTab === 'create-post' && 'Post'}
                {activeTab === 'photos' && 'Photos'}
                {activeTab === 'business-info' && 'Business Info'}
                {activeTab === 'services' && 'Services'}
                {activeTab === 'more' && 'More'}
                {activeTab === 'reviews' && 'Reviews'}
              </h3>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue"
              >
                <Icon name={isMobileMenuOpen ? "FaTimes" : "FaBars"} className="w-5 h-5" size={20} />
              </button>
            </div>

            {/* Desktop Navigation */}
            <TabNavigation
              activeTab={activeTab}
              isConnected={isConnected}
              hasLocations={locations.length > 0}
              onTabChange={changeTab}
            />

            {/* Mobile Navigation Menu */}
            <MobileTabMenu
              activeTab={activeTab}
              isConnected={isConnected}
              isOpen={isMobileMenuOpen}
              onTabChange={changeTab}
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'connect' && (
            <ConnectTab
              isConnected={isConnected}
              isLoading={isLoading}
              locations={locations}
              selectedLocations={selectedLocations}
              hasAttemptedFetch={hasAttemptedFetch}
              fetchingLocations={fetchingLocations}
              rateLimitedUntil={rateLimitedUntil}
              rateLimitCountdown={rateLimitCountdown}
              postResult={postResult}
              onConnect={handleConnect}
              onShowDisconnectConfirm={() => setShowDisconnectConfirm(true)}
              onFetchLocations={handleFetchLocations}
              onLoadPlatforms={loadPlatforms}
              onChangeTab={changeTab}
              onClearPostResult={() => setPostResult(null)}
              setIsLoading={setIsLoading}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewTab
              hasGBPAccess={hasGBPAccess}
              gbpAccessMessage={gbpAccessMessage}
              isConnected={isConnected}
              scopedLocations={scopedLocations}
              isLoadingPlatforms={isLoadingPlatforms}
              selectedLocationId={selectedLocationId}
              resolvedSelectedLocation={resolvedSelectedLocation}
              onLocationChange={handleLocationChange}
              overviewData={overviewData}
              overviewLoading={overviewLoading}
              overviewError={overviewError}
              onRefreshOverview={fetchOverviewData}
              isExportingPDF={isExportingPDF}
              onExportPDF={handleExportPDF}
              onQuickAction={handleOverviewQuickAction}
            />
          )}

          {activeTab === 'create-post' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <Icon name="FaGoogle" className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Google Business Profile to start posting updates to your business locations.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="FaGoogle" className="w-4 h-4" />
                        <span>Connect Google Business</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Link to Post Scheduling */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Icon name="FaCalendarAlt" size={14} className="inline mr-2" />
                      Want to schedule posts in advance?
                    </p>
                    <a
                      href="/dashboard/social-posting"
                      className="text-sm font-medium text-slate-blue hover:underline"
                    >
                      Go to Post Scheduling →
                    </a>
                  </div>

                  {/* Success Messages for Create Post tab */}
                  {postResult && postResult.success && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex items-center space-x-2 text-green-800 mb-2">
                        <Icon name="FaCheck" className="w-4 h-4" />
                        <span className="text-sm font-medium">Success</span>
                      </div>
                      <p className="text-sm text-green-700">{postResult.message}</p>
                    </div>
                  )}

                  {/* Error Messages for Create Post tab */}
                  {postResult && !postResult.success && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 relative">
                      <button
                        onClick={() => setPostResult(null)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                        aria-label="Dismiss"
                      >
                        <Icon name="FaTimes" className="w-4 h-4" />
                      </button>
                      <div className="flex items-center space-x-2 text-red-800 mb-2">
                        <Icon name="FaExclamationTriangle" className="w-4 h-4" />
                        <span className="text-sm font-medium">Error</span>
                      </div>
                      <p className="text-sm text-red-700">{postResult.message}</p>
                    </div>
                  )}

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Create a Google Business Post</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Share news, offers, or updates with the locations you select below.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Locations:</p>
                      {scopedLocations.length <= 1 ? (
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                          Google Business Profile: {scopedLocations[0]?.name || 'No locations connected'}
                        </div>
                      ) : (
                        <LocationPicker
                          mode="multi"
                          locations={locations}
                          selectedIds={selectedLocations}
                          onChange={setSelectedLocations}
                          includeSelectAll={maxGBPLocations === null || maxGBPLocations > 1}
                          maxSelections={maxGBPLocations || undefined}
                          onMaxSelection={() => {
                            setPostResult({
                              success: false,
                              message: `Your account is limited to ${maxGBPLocations} location${maxGBPLocations !== 1 ? 's' : ''}. Please upgrade your plan to manage more locations.`
                            });
                          }}
                          className="bg-gray-50 rounded-lg p-4"
                          helperText={locations.length > 0 ? 'Posts will publish to every selected location.' : undefined}
                          emptyState={(
                            <div className="text-center py-8">
                              <Icon name="FaMapMarker" className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                              {hasAttemptedFetch ? (
                                <>
                                  <p className="text-gray-600 mb-4">No business locations found</p>
                                  <p className="text-sm text-gray-500 mb-4">
                                    Your Google Business Profile might not have any locations, or they couldn't be retrieved.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-gray-600 mb-4">Ready to get started</p>
                                  <p className="text-sm text-gray-500 mb-4">
                                    Fetch your business locations from Google Business Profile to begin posting.
                                  </p>
                                </>
                              )}
                              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <button
                                  onClick={() => handleFetchLocations()}
                                  disabled={fetchingLocations === 'google-business-profile' || Boolean(rateLimitedUntil && Date.now() < rateLimitedUntil)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    fetchingLocations === 'google-business-profile' || Boolean(rateLimitedUntil && Date.now() < rateLimitedUntil)
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-slate-blue text-white hover:bg-slate-700'
                                  }`}
                                >
                                  {fetchingLocations === 'google-business-profile' ? (
                                    <>
                                      <Icon name="FaSpinner" className="w-4 h-4 animate-spin mr-2" />
                                      Fetching...
                                    </>
                                  ) : rateLimitedUntil && Date.now() < rateLimitedUntil ? (
                                    `Rate limited (${Math.ceil((rateLimitedUntil - Date.now()) / 1000)}s)`
                                  ) : (
                                    <>Fetch locations</>
                                  )}
                                </button>
                                <button
                                  onClick={() => changeTab('connect')}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                                >
                                  Or go to Connect Tab →
                                </button>
                              </div>
                            </div>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  {/* Post Creation Form */}
                  {locations.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold">Post</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Creating posts helps your SEO. 
                          <button
                            onClick={() => setShowPostTypesHelpModal(true)}
                            className="ml-1 text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            Learn more
                          </button>
                        </p>
                      </div>

                      {/* Post Type Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Post type</label>
                        <select
                          value={postType}
                          onChange={(e) => setPostType(e.target.value as any)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
                        >
                          <option value="WHATS_NEW">What's New</option>
                          <option value="EVENT">Event</option>
                          <option value="OFFER">Offer</option>
                          <option value="PRODUCT">Product</option>
                        </select>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Post content</label>
                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="What would you like to share with your customers?"
                          rows={4}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue resize-none"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-gray-500">
                            {postContent.length}/1500 characters
                          </div>
                          <button
                            onClick={handleImproveWithAI}
                            disabled={improvingWithAI || !postContent.trim()}
                            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                          >
                            {improvingWithAI ? (
                              <>
                                <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                                <span>Improving...</span>
                              </>
                            ) : (
                              <>
                                <Icon name="prompty" className="w-3 h-3" />
                                <span>AI improve</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Optional)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-slate-blue transition-colors">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                            className="hidden"
                            id="image-upload"
                            disabled={uploadingImages}
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <Icon name="FaImage" className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              {uploadingImages ? 'Processing images...' : 'Click to upload photos or drag and drop'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG up to 10MB each (max 10 photos)
                            </p>
                          </label>
                        </div>

                        {/* Image Previews */}
                        {imageUrls.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {imageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-md border border-gray-200"
                                />
                                <button
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Icon name="FaTimes" className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Call-to-Action */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700">Call-to-Action Button</label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showCTA}
                              onChange={(e) => setShowCTA(e.target.checked)}
                              className="w-4 h-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue"
                            />
                            <span className="text-sm text-gray-600">Add CTA button</span>
                          </label>
                        </div>

                        {showCTA && (
                          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Button type</label>
                              <select
                                value={ctaType}
                                onChange={(e) => setCTAType(e.target.value as any)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
                              >
                                <option value="LEARN_MORE">Learn more</option>
                                <option value="CALL">Call</option>
                                <option value="ORDER_ONLINE">Order online</option>
                                <option value="BOOK">Book</option>
                                <option value="SIGN_UP">Sign up</option>
                                <option value="BUY">Buy</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {ctaType === 'CALL' ? 'Phone number' : 'URL'}
                              </label>
                              <input
                                type={ctaType === 'CALL' ? 'tel' : 'url'}
                                value={ctaUrl}
                                onChange={(e) => setCTAUrl(e.target.value)}
                                placeholder={ctaType === 'CALL' ? 'tel:+1234567890' : 'https://example.com'}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cross-posting Options */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-3">Also post to:</p>
                        <div className="space-y-3">
                          {/* Bluesky */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {blueskyConnection ? (
                                <input
                                  type="checkbox"
                                  checked={postToBluesky}
                                  onChange={(e) => setPostToBluesky(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                              ) : (
                                <div className="w-4 h-4" />
                              )}
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                                  <svg viewBox="0 0 512 512" className="w-3 h-3" role="img">
                                    <path fill="#ffffff" d="M110.985 30.442c58.695 44.217 121.837 133.856 145.013 181.961 23.176-48.105 86.322-137.744 145.016-181.961 42.361-31.897 110.985-56.584 110.985 21.96 0 15.681-8.962 131.776-14.223 150.628-18.272 65.516-84.873 82.228-144.112 72.116 103.55 17.68 129.889 76.238 73 134.8-108.04 111.223-155.288-27.905-167.385-63.554-3.489-10.262-2.991-10.498-6.561 0-12.098 35.649-59.342 174.777-167.382 63.554-56.89-58.562-30.551-117.12 72.999-134.8-59.239 10.112-125.84-6.6-144.112-72.116C8.962 184.178 0 68.083 0 52.402c0-78.544 68.633-53.857 110.985-21.96z" />
                                  </svg>
                                </div>
                                <span className="text-sm text-gray-700">
                                  Bluesky {blueskyConnection ? `(@${blueskyConnection.handle})` : ''}
                                </span>
                              </div>
                            </div>
                            {!blueskyConnection && (
                              <a
                                href="/dashboard/integrations"
                                className="text-xs text-slate-blue hover:underline font-medium"
                              >
                                Connect
                              </a>
                            )}
                          </div>

                          {/* LinkedIn */}
                          <div className="space-y-2">
                            {linkedinConnection ? (
                              <>
                                {/* Personal Profile */}
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={linkedInTargets.some(t => t.type === 'personal' && t.id === linkedinConnection.id)}
                                    onChange={() => {
                                      const exists = linkedInTargets.some(t => t.type === 'personal' && t.id === linkedinConnection.id);
                                      if (exists) {
                                        setLinkedInTargets(prev => prev.filter(t => !(t.type === 'personal' && t.id === linkedinConnection.id)));
                                      } else {
                                        setLinkedInTargets(prev => [...prev, { type: 'personal', id: linkedinConnection.id, name: linkedinConnection.handle || 'My Profile' }]);
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Icon name="FaLinkedin" className="w-5 h-5 text-[#0A66C2]" />
                                    <span className="text-sm text-gray-700">
                                      {linkedinConnection.handle || 'My Profile'} (Personal)
                                    </span>
                                  </div>
                                </div>
                                {/* Organization Pages */}
                                {linkedinConnection.organizations?.map((org) => (
                                  <div key={org.id} className="flex items-center space-x-3 ml-6">
                                    <input
                                      type="checkbox"
                                      checked={linkedInTargets.some(t => t.type === 'organization' && t.id === org.id)}
                                      onChange={() => {
                                        const exists = linkedInTargets.some(t => t.type === 'organization' && t.id === org.id);
                                        if (exists) {
                                          setLinkedInTargets(prev => prev.filter(t => !(t.type === 'organization' && t.id === org.id)));
                                        } else {
                                          setLinkedInTargets(prev => [...prev, { type: 'organization', id: org.id, name: org.name }]);
                                        }
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div className="flex items-center space-x-2">
                                      <Icon name="FaBuilding" className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm text-gray-700">
                                        {org.name} (Company)
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-4 h-4" />
                                  <div className="flex items-center space-x-2">
                                    <Icon name="FaLinkedin" className="w-5 h-5 text-[#0A66C2]" />
                                    <span className="text-sm text-gray-700">LinkedIn</span>
                                  </div>
                                </div>
                                <a
                                  href="/dashboard/integrations"
                                  className="text-xs text-slate-blue hover:underline font-medium"
                                >
                                  Connect
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <button
                          onClick={clearAllFormData}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={handlePost}
                          disabled={isPosting || !postContent.trim() || selectedLocations.length === 0}
                          className="px-6 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                          {isPosting ? (
                            <>
                              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                              <span>Publishing...</span>
                            </>
                          ) : (
                            <>
                              <Icon name="FaPlus" className="w-4 h-4" />
                              <span>Publish post</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <PhotosTab
              isConnected={isConnected}
              isLoading={isLoading}
              scopedLocations={scopedLocations}
              onConnect={handleConnect}
            />
          )}

          {/* Business Information Tab */}
          {activeTab === 'business-info' && (
            <BusinessInfoTab
              isConnected={isConnected}
              isLoading={isLoading}
              scopedLocations={scopedLocations}
              onConnect={handleConnect}
            />
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <ServicesTab
              isConnected={isConnected}
              isLoading={isLoading}
              scopedLocations={scopedLocations}
              onConnect={handleConnect}
            />
          )}

          {/* More Tab - Features Not Available via API */}
          {activeTab === 'more' && (
            <MoreTab
              isConnected={isConnected}
              isLoading={isLoading}
              onConnect={handleConnect}
              onShowProductsHelp={() => setShowProductsHelpModal(true)}
            />
          )}

          {/* Protection Tab - GBP Profile Protection */}
          {activeTab === 'protection' && (
            <ProtectionTab accountPlan={currentPlan} />
          )}

          {/* Reviews Management Tab */}
          {activeTab === 'reviews' && (
            <ReviewsTab
              isConnected={isConnected}
              isLoading={isLoading}
              scopedLocations={scopedLocations}
              selectedLocationId={selectedLocationId}
              selectedLocations={selectedLocations}
              onConnect={handleConnect}
            />
          )}



        </div>
      </PageCard>
      
      {/* Disconnect Confirmation Dialog */}
      <DisconnectConfirmModal
        isOpen={showDisconnectConfirm}
        isLoading={isLoading}
        onConfirm={() => {
          setShowDisconnectConfirm(false);
          handleDisconnect();
        }}
        onCancel={() => setShowDisconnectConfirm(false)}
      />

      {/* Import Reviews Modal */}
      <ImportReviewsModal
        isOpen={showImportModal}
        isImporting={isImportingReviews}
        locations={scopedLocations}
        selectedLocationId={selectedLocationId}
        resolvedSelectedLocation={resolvedSelectedLocation}
        isLoadingPlatforms={isLoadingPlatforms}
        selectedImportType={selectedImportType}
        importResult={importResult}
        onClose={() => {
          setShowImportModal(false);
          setImportResult(null);
        }}
        onLocationSelect={(id) => setSelectedLocationId(id)}
        onImportTypeChange={(type) => setSelectedImportType(type)}
        onImport={handleImportReviews}
      />
      
      {/* Fetch Locations Confirmation Modal */}
      <FetchLocationsModal
        isOpen={showFetchConfirmModal}
        onConfirm={performFetchLocations}
        onCancel={() => setShowFetchConfirmModal(false)}
      />
      
      {/* Products Help Modal */}
      <HelpModal
        isOpen={showProductsHelpModal}
        onClose={() => setShowProductsHelpModal(false)}
        initialArticleId="google-products"
        initialKeywords={['products', 'google', 'business-profile', 'productize', 'services']}
        initialTab="tutorials"
      />

      {/* Post Types Help Modal */}
      <HelpModal
        isOpen={showPostTypesHelpModal}
        onClose={() => setShowPostTypesHelpModal(false)}
        initialArticleId="google-post-types"
        initialKeywords={['posts', 'google', 'business-profile', 'seo', 'updates', 'offers']}
        initialTab="tutorials"
      />
      
      {/* Location Selection Modal */}
      {showLocationSelectionModal && (
        <LocationSelectionModal
          locations={pendingLocations}
          planLimit={getMaxLocationsForPlan(currentPlan)}
          planName={getPlanDisplayName(currentPlan)}
          onConfirm={handleLocationSelectionConfirm}
          onCancel={handleLocationSelectionCancel}
        />
      )}
    </div>
  );
} 
