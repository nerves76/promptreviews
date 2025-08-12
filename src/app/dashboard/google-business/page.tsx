/**
 * Social Media Posting Dashboard Page
 * Universal dashboard for managing social media posting across platforms
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/Icon';
import PageCard from '@/app/components/PageCard';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';
import PhotoManagement from '@/app/components/PhotoManagement';
import ReviewManagement from '@/app/components/ReviewManagement';
import BusinessInfoEditor from '@/app/components/BusinessInfoEditor';
import ReviewResponseGenerator from '@/app/components/ReviewResponseGenerator';
import ServiceDescriptionGenerator from '@/app/components/ServiceDescriptionGenerator';
import BusinessDescriptionAnalyzer from '@/app/components/BusinessDescriptionAnalyzer';
import { createClient, getSessionOrMock } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import UnrespondedReviewsWidget from '@/app/components/UnrespondedReviewsWidget';
import LocationSelector from '@/components/GoogleBusinessProfile/LocationSelector';
import OverviewStats from '@/components/GoogleBusinessProfile/OverviewStats';
import BusinessHealthMetrics from '@/components/GoogleBusinessProfile/BusinessHealthMetrics';
// Using built-in alert for notifications instead of react-toastify

interface GoogleBusinessLocation {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
}

export default function SocialPostingDashboard() {
  const { currentPlan } = useAuth();
  
  // Loading and connection state
  const [isLoading, setIsLoading] = useState(true);
  
  // Connection state with localStorage persistence
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('google-business-connected');
      return stored === 'true';
    }
    return false;
  });
  
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
  
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'WHATS_NEW' | 'EVENT' | 'OFFER' | 'PRODUCT'>('WHATS_NEW');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImportingReviews, setIsImportingReviews] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number; errors?: string[]; totalErrorCount?: number } | null>(null);
  const [showFetchConfirmModal, setShowFetchConfirmModal] = useState(false);
  
  // Plan access state for Growers
  const [hasGBPAccess, setHasGBPAccess] = useState(true);
  const [gbpAccessMessage, setGbpAccessMessage] = useState("");
  
  // Check if user has Google Business Profile access
  const checkGBPAccess = () => {
    if (currentPlan === 'grower') {
      setHasGBPAccess(false);
      setGbpAccessMessage("Google Business Profile integration is available on Builder and Maven plans.");
    } else {
      setHasGBPAccess(true);
      setGbpAccessMessage("");
    }
  };
  const loadingRef = useRef(false); // More persistent loading prevention
  const initialLoadDone = useRef(false); // Track if initial load has been completed

  // Overview page state
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [overviewData, setOverviewData] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Ref to track image URLs for cleanup
  const imageUrlsRef = useRef<string[]>([]);

  // Update ref whenever imageUrls changes
  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  // Tab state with URL parameter support and dynamic default based on connection
  const [activeTab, setActiveTab] = useState<'connect' | 'overview' | 'create-post' | 'respond-reviews' | 'business-info' | 'reviews'>(() => {
    // Initialize from URL parameter if available
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as 'connect' | 'overview' | 'create-post' | 'respond-reviews' | 'business-info' | 'reviews';
      if (tabParam && ['connect', 'overview', 'create-post', 'respond-reviews', 'business-info', 'reviews'].includes(tabParam)) {
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
  const changeTab = (newTab: 'connect' | 'overview' | 'create-post' | 'respond-reviews' | 'business-info' | 'reviews') => {
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

  // Handle post-OAuth redirects  
  useEffect(() => {
    console.log('🔄 Main useEffect triggered - checking for OAuth or initial load');
    console.log('🔄 initialLoadDone.current:', initialLoadDone.current);
    
    // Prevent multiple runs - only run once per page load
    if (initialLoadDone.current) {
      console.log('⏸️ Skipping useEffect - initial load already completed');
      return;
    }
    
    // Check if we're coming back from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const isPostOAuth = urlParams.get('connected') === 'true';
    const hasError = urlParams.get('error');
    
    // Clear OAuth flag when returning from OAuth
    if (typeof window !== 'undefined' && sessionStorage.getItem('googleOAuthInProgress') === 'true') {
      sessionStorage.removeItem('googleOAuthInProgress');
      console.log('🔒 Cleared googleOAuthInProgress flag on page load');
    }
    
    // Also check for cookie flag from OAuth callback
    if (typeof document !== 'undefined' && document.cookie.includes('clearGoogleOAuthFlag=true')) {
      // Clear the cookie
      document.cookie = 'clearGoogleOAuthFlag=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      console.log('🔒 Cleared OAuth flag from callback cookie');
    }
    
    // Handle OAuth errors
    if (hasError) {
      console.log('❌ OAuth error detected:', hasError);
      const message = urlParams.get('message');
      
      // Check if this is a missing_scope error
      if (hasError === 'missing_scope') {
        console.log('🔄 Missing scope detected - attempting automatic fix');
        
        // Show a temporary message while we fix it
        setPostResult({ 
          success: false, 
          message: 'Google didn\'t grant all permissions. Fixing this automatically...' 
        });
        
        // Try to revoke and reconnect automatically
        setTimeout(async () => {
          try {
            // First revoke existing permissions
            const revokeResponse = await fetch('/api/social-posting/platforms/google-business-profile/revoke', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (revokeResponse.ok) {
              console.log('✅ Revoked existing permissions');
              setPostResult({ 
                success: false, 
                message: 'Permissions cleared. Please click "Connect Google Business" to try again with fresh permissions.' 
              });
            } else {
              // Fall back to manual instructions if revoke fails
              setPostResult({ 
                success: false, 
                message: message ? decodeURIComponent(message) : 'Google did not grant business management permissions. Please try connecting again.' 
              });
            }
          } catch (error) {
            console.error('❌ Failed to auto-revoke:', error);
            setPostResult({ 
              success: false, 
              message: message ? decodeURIComponent(message) : 'Failed to connect to Google Business Profile' 
            });
          }
        }, 1000);
      } else {
        // Other errors - show the message
        setPostResult({ 
          success: false, 
          message: message ? decodeURIComponent(message) : 'Failed to connect to Google Business Profile' 
        });
      }
      
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      // Load platforms to show disconnected state
      loadPlatforms();
    } else if (isPostOAuth) {
      console.log('🔄 Post-OAuth redirect detected');
      
      // Show success message from OAuth
      const message = urlParams.get('message');
      if (message) {
        setPostResult({ success: true, message: decodeURIComponent(message) });
      } else {
        // Default success message if none provided
        setPostResult({ success: true, message: 'Successfully connected to Google Business Profile!' });
      }
      
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      // Set connected state optimistically since OAuth succeeded
      setIsConnected(true);
      setIsLoading(true);
      
      // Give the database a moment to save the tokens, then load platforms
      console.log('🔄 Post-OAuth: Waiting for database to sync before loading platforms...');
      setTimeout(() => {
        console.log('🔄 Post-OAuth: Loading platforms to refresh connection state');
        loadPlatforms();
      }, 2000); // 2 second delay to ensure database is updated
    } else {
      // Load platforms on page load (normal page load)
      console.log('🔄 Initial page load: Loading platforms');
      loadPlatforms();
    }
    
    // Mark initial load as completed
    initialLoadDone.current = true;
    console.log('✅ Initial load marked as completed');
    
    // IMPORTANT: No automatic refresh after initial load to prevent form resets
  }, []);

  // Add effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isLocationDropdownOpen && !target.closest('.location-dropdown')) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocationDropdownOpen]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('google-business-connected', isConnected.toString());
  }, [isConnected]);

  useEffect(() => {
    localStorage.setItem('google-business-locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('google-business-selected-locations', JSON.stringify(selectedLocations));
  }, [selectedLocations]);

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
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Fetch overview data when tab becomes active
  useEffect(() => {
    if (activeTab === 'overview' && selectedLocationId && isConnected) {
      fetchOverviewData(selectedLocationId);
    }
  }, [activeTab, selectedLocationId, isConnected]);

  // REMOVED: Auto-switch to overview tab - let users stay on the tab they choose
  // This was causing confusion when users fetched locations and got moved away from Connect tab
  // useEffect(() => {
  //   if (isConnected && activeTab === 'connect' && locations.length > 0) {
  //     changeTab('overview');
  //   }
  // }, [isConnected, activeTab, locations.length]);

  // Simplified platform loading - no API validation calls
  const loadPlatforms = useCallback(async () => {
    console.log('🔍 TRACE: loadPlatforms called from:', new Error().stack?.split('\n')[1]?.trim());
    console.log('🔍 Current loadingRef.current:', loadingRef.current);
    console.log('🔍 Current isLoadingPlatforms state:', isLoadingPlatforms);
    
    // Prevent multiple simultaneous calls using ref (more reliable)
    if (loadingRef.current) {
      console.log('⏸️ Skipping loadPlatforms - already in progress (via ref)');
      return;
    }
    
    console.log('Loading platforms (database check only)...');
    console.log('🔄 Setting loading flags to true');
    loadingRef.current = true;
    setIsLoadingPlatforms(true);
    
    try {
      // Get the current session token for authentication
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No session token available');
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
      console.log('🔍 Fetching platforms (database only)...');
      const response = await fetch('/api/social-posting/platforms');
      console.log('Platforms API response status:', response.status);
      
      if (response.status === 401) {
        console.log('Authentication error - session may have expired');
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
        console.log('Platforms API response data:', responseData);
        
        const platforms = responseData.platforms || [];
        const googlePlatform = platforms.find((p: any) => p.id === 'google-business-profile');
        
        console.log('Google platform found:', googlePlatform);
        
        if (googlePlatform && googlePlatform.connected) {
          setIsConnected(true);
          console.log('Google Business Profile is connected');
          
          // Load business locations from the platforms response
          const locations = googlePlatform.locations || [];
          console.log('Locations from platforms API:', locations);
          
          // Transform locations to match expected format
          const transformedLocations = locations.map((loc: any) => {
            // Debug log to see what we're getting
            console.log('Raw location data:', {
              location_id: loc.location_id,
              location_name: loc.location_name,
              address: loc.address,
              status: loc.status,
              allKeys: Object.keys(loc)
            });
            
            return {
              id: loc.location_id || loc.id,
              name: loc.location_name || loc.name || 'Unknown Location',
              address: loc.address || '',
              status: loc.status || 'active' // Use actual status if available
            };
          });
          
          // Only update locations if they've actually changed to prevent unnecessary re-renders
          setLocations(prev => {
            const hasChanged = prev.length !== transformedLocations.length || 
              prev.some((loc, idx) => loc.id !== transformedLocations[idx]?.id);
            
            if (hasChanged) {
              console.log('📍 Locations have changed, updating state');
              return transformedLocations;
            } else {
              console.log('📍 Locations unchanged, keeping existing state to prevent re-renders');
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
          }
        } else {
          setIsConnected(false);
          setLocations([]);
          setSelectedLocations([]);
          console.log('Google Business Profile is not connected');
          
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
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setPostResult({ 
        success: false, 
        message: 'Failed to load Google Business Profile connection. Please refresh the page or try reconnecting.' 
      });
    } finally {
      console.log('Setting loading states to false');
      console.log('🔄 Setting both loading flags to false');
      loadingRef.current = false;
      setIsLoading(false);
      setIsLoadingPlatforms(false);
    }
  }, []); // Remove dependency to prevent useEffect from running multiple times

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
        console.log('🔒 Set OAuth in progress flag to preserve session');
      }
      
      // Get Google OAuth credentials from environment
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '984479581786-8h619lvt0jvhakg7riaom9bs7mlo1lku.apps.googleusercontent.com';
      const redirectUriRaw = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
      
      // Validate required environment variables
      if (!redirectUriRaw) {
        console.error('❌ Missing environment variable: NEXT_PUBLIC_GOOGLE_REDIRECT_URI');
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
      const state = encodeURIComponent(JSON.stringify({ 
        platform: 'google-business-profile',
        returnUrl: '/dashboard/google-business'
      }));

      // Construct Google OAuth URL
      // Use prompt=select_account+consent to force account selection AND show all permissions
      // This helps bypass Google's cached permissions
      // include_granted_scopes=false ensures only requested scopes are granted
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodedScope}&response_type=${responseType}&state=${state}&access_type=offline&prompt=select_account%20consent&include_granted_scopes=false`;
      
      console.log('🔗 Redirecting to Google OAuth:', googleAuthUrl);
      console.log('🔒 OAuth flag set, preserving Supabase session during redirect');
      
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
        console.log('🔒 Cleared googleOAuthInProgress flag due to error');
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log('🔌 Disconnecting Google Business Profile...');
      setIsLoading(true);
      
      // Call API to remove OAuth tokens from database
      const response = await fetch('/api/social-posting/platforms/google-business-profile/disconnect', {
        method: 'POST',
        credentials: 'include',  // Changed from 'same-origin' to 'include' to ensure cookies are sent
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ Successfully disconnected from Google Business Profile API');
        setPostResult({ 
          success: true, 
          message: 'Successfully disconnected from Google Business Profile' 
        });
      } else {
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
      // Always clear local state regardless of API success
      console.log('🧹 Clearing local Google Business Profile state');
      localStorage.removeItem('google-business-connected');
      localStorage.removeItem('google-business-locations');
      localStorage.removeItem('google-business-selected-locations');
      localStorage.removeItem('google-business-fetch-attempted'); // Clear fetch attempt flag
      setIsConnected(false);
      setLocations([]);
      setSelectedLocations([]);
      setHasAttemptedFetch(false); // Reset fetch attempt state
      setIsLoading(false);
      
      // Close the disconnect confirmation dialog
      setShowDisconnectConfirm(false);
    }
  };

  const handleFetchLocations = async (platformId: string) => {
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
      // Increase timeout to 5 minutes to account for rate limiting delays
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes
      
      const response = await fetch(`/api/social-posting/platforms/${platformId}/fetch-locations`, {
        method: 'POST',
        signal: controller.signal,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
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
            localStorage.removeItem('google-business-connected');
            localStorage.removeItem('google-business-locations');
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
            setTimeout(() => handleFetchLocations(platformId), 1000);
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
      console.log(`✅ Fetched ${result.locations?.length || 0} business locations`);
      
      // Update local state with fetched locations
      if (result.locations && result.locations.length > 0) {
        setLocations(result.locations);
        localStorage.setItem('google-business-locations', JSON.stringify(result.locations));
        setHasAttemptedFetch(false); // Clear the flag since we have locations now
        
        // Auto-select first location if none selected
        if (!selectedLocationId && result.locations.length > 0) {
          setSelectedLocationId(result.locations[0].id);
        }
      } else {
        // Only mark as attempted if we got a response but no locations
        setHasAttemptedFetch(true);
        localStorage.setItem('google-business-fetch-attempted', 'true');
      }
      
      // Show success message with demo mode indicator
      const demoNote = result.isDemoMode ? ' (Demo Mode - Using test data due to Google rate limits)' : '';
      setPostResult({ 
        success: true, 
        message: `Successfully fetched ${result.locations?.length || 0} business locations!${demoNote}` 
      });
      
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
      
      console.log(`📝 Posting to ${selectedLocations.length} Google Business Profile location(s)...`);
      
      // Upload images to Supabase storage
      const uploadedImageUrls = await uploadImagesToStorage(selectedImages);

      // Post to each selected location individually
      const postPromises = selectedLocations.map(async (locationId) => {
        const postData = {
          content: postContent,
          platforms: ['google-business-profile'],
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
        
        console.log(`📝 Posting to location: ${locationId}`);
        
        const response = await fetch('/api/social-posting/posts', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        const result = await response.json();
        const location = locations.find(loc => loc.id === locationId);
        
        return {
          locationId,
          locationName: location?.name || locationId,
          success: result.success,
          result: result
        };
      });

      const postResults = await Promise.all(postPromises);
      console.log('📊 All post responses:', postResults);

      const successfulPosts = postResults.filter(r => r.success);
      const failedPosts = postResults.filter(r => !r.success);

      if (successfulPosts.length === selectedLocations.length) {
        setPostResult({ 
          success: true, 
          message: `Successfully published to all ${selectedLocations.length} location${selectedLocations.length !== 1 ? 's' : ''}!`
        });
        setPostContent(''); // Clear content on success
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

      const response = await fetch('/api/social-posting/improve-with-ai', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to improve post: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
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

      console.log(`�� Added ${imageFiles.length} image(s). Total: ${newImages.length}`);
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
          throw error;
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
    } catch (error) {
      console.error('Some images failed to upload:', error);
      throw new Error('Failed to upload one or more images');
    }
  };

  // Handle overview data fetching
  const fetchOverviewData = async (locationId: string) => {
    if (!locationId) return;

    setOverviewLoading(true);
    setOverviewError(null);

    try {
      const response = await fetch(`/api/google-business-profile/overview?locationId=${encodeURIComponent(locationId)}`, {
        credentials: 'same-origin'
      });
      const data = await response.json();

      if (data.success) {
        setOverviewData(data.data);
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
      case 'create-post':
        changeTab('post');
        break;
      case 'navigate':
        if (data?.url) {
          window.open(data.url, '_blank');
        }
        break;
    }
  };

  // Handle importing reviews from Google Business Profile
  const handleImportReviews = async (type: 'all' | 'new') => {
    if (!selectedLocationId) {
      setImportResult({ success: false, message: 'Please select a location first' });
      return;
    }

    setIsImportingReviews(true);
    setImportResult(null);

    try {
      console.log(`🔄 Importing ${type} reviews for location:`, selectedLocationId);
      
      const response = await fetch('/api/google-business-profile/import-reviews', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationId: selectedLocationId,
          importType: type
        }),
      });

      const result = await response.json();

      if (result.success) {
        setImportResult({ 
          success: true, 
          message: result.message || 'Reviews imported successfully!',
          count: result.count,
          errors: result.errors, // Include error details for debugging
          totalErrorCount: result.totalErrorCount
        });
        console.log('✅ Reviews imported successfully:', result.count);
        if (result.errors && result.errors.length > 0) {
          console.log('⚠️ Import errors:', result.errors);
        }
      } else {
        setImportResult({ 
          success: false, 
          message: result.error || 'Failed to import reviews'
        });
        console.error('❌ Failed to import reviews:', result.error);
      }
    } catch (error) {
      console.error('❌ Error importing reviews:', error);
      setImportResult({ 
        success: false, 
        message: 'Failed to import reviews. Please try again.' 
      });
    } finally {
      setIsImportingReviews(false);
    }
  };

  if (isLoading || isPostOAuthConnecting || isLoadingPlatforms) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-12 md:mt-16 lg:mt-20 mb-16 flex justify-center items-start">
        <PageCard
          icon={<Icon name="FaGoogle" className="w-8 h-8 text-slate-blue" size={32} />}
          topMargin="mt-0"
        >
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <FiveStarSpinner />
            <p className="mt-4 text-gray-600">
              {isPostOAuthConnecting ? 'Connecting to Google Business Profile...' : 'Loading...'}
            </p>
          </div>
        </PageCard>
      </div>
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
                Google Business Profiles
              </h1>
              <p className="text-gray-600">
                Optimize your Google Business Profiles with Prompty power! Update regularly for best results.
              </p>
              {/* Connection Status Indicator */}
              {isConnected && (
                <div className="mt-2 flex items-center space-x-2 text-sm">
                  <div className="flex items-center space-x-1 text-green-600">
                    <Icon name="FaCheck" className="w-3 h-3" />
                    <span className="font-medium">Connected</span>
                  </div>
                  {locations.length > 0 && (
                    <span className="text-gray-500">
                      • {locations.length} location{locations.length !== 1 ? 's' : ''}
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
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 text-sm text-green-700 border border-green-300 rounded-md hover:bg-green-50 transition-colors"
                >
                  <Icon name="FaImport" className="w-4 h-4" size={16} />
                  <span>Import Reviews</span>
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
                {activeTab === 'create-post' && 'Create Post'}
                {activeTab === 'respond-reviews' && 'Respond to Reviews'}
                {activeTab === 'business-info' && 'Business Info'}
                {activeTab === 'reviews' && 'Reviews'}
              </h3>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-blue"
              >
                <Icon name={isMobileMenuOpen ? "FaTimes" : "FaBars"} className="w-5 h-5" size={20} />
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex -mb-px space-x-8">
              <button
                onClick={() => changeTab('connect')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'connect'
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaGoogle" className="w-4 h-4" />
                  <span>Connect</span>
                </div>
              </button>
              <button
                onClick={() => changeTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="MdBarChart" className="w-4 h-4" size={16} />
                  <span>Overview</span>
                </div>
              </button>
              <button
                onClick={() => changeTab('business-info')}
                disabled={!isConnected || locations.length === 0}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'business-info' && isConnected && locations.length > 0
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${(!isConnected || locations.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaStore" className="w-4 h-4" size={16} />
                  <span>Business Info</span>
                </div>
              </button>
              <button
                onClick={() => changeTab('create-post')}
                disabled={!isConnected || locations.length === 0}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create-post' && isConnected && locations.length > 0
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${(!isConnected || locations.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaPlus" className="w-4 h-4" size={16} />
                  <span>Create Post</span>
                </div>
              </button>
              <button
                onClick={() => changeTab('respond-reviews')}
                disabled={!isConnected || locations.length === 0}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'respond-reviews' && isConnected && locations.length > 0
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${(!isConnected || locations.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaCommentAlt" className="w-4 h-4" size={16} />
                  <span>Respond to Reviews</span>
                </div>
              </button>
              <button
                onClick={() => changeTab('reviews')}
                disabled={!isConnected || locations.length === 0}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews' && isConnected && locations.length > 0
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${(!isConnected || locations.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon name="FaStar" className="w-4 h-4" size={16} />
                  <span>Reviews</span>
                </div>
              </button>
            </nav>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden bg-gray-50 border-t border-gray-200">
                <div className="px-2 py-3 space-y-1">
                  <button
                    onClick={() => changeTab('connect')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'connect'
                        ? 'bg-slate-blue text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name="FaGoogle" className="w-4 h-4" />
                      <span>Connect</span>
                    </div>
                  </button>
                  <button
                    onClick={() => changeTab('overview')}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'overview'
                        ? 'bg-slate-blue text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name="MdBarChart" className="w-4 h-4" size={16} />
                      <span>Overview</span>
                    </div>
                  </button>
                  <button
                    onClick={() => changeTab('business-info')}
                    disabled={!isConnected}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'business-info' && isConnected
                        ? 'bg-slate-blue text-white'
                        : isConnected 
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name="FaStore" className="w-4 h-4" size={16} />
                      <span>Business Info</span>
                    </div>
                  </button>
                  <button
                    onClick={() => changeTab('create-post')}
                    disabled={!isConnected}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'create-post' && isConnected
                        ? 'bg-slate-blue text-white'
                        : isConnected 
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name="FaPlus" className="w-4 h-4" size={16} />
                      <span>Create Post</span>
                    </div>
                  </button>
                  <button
                    onClick={() => changeTab('respond-reviews')}
                    disabled={!isConnected}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'respond-reviews' && isConnected
                        ? 'bg-slate-blue text-white'
                        : isConnected 
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name="FaCommentAlt" className="w-4 h-4" size={16} />
                      <span>Respond to Reviews</span>
                    </div>
                  </button>
                  <button
                    onClick={() => changeTab('reviews')}
                    disabled={!isConnected}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeTab === 'reviews' && isConnected
                        ? 'bg-slate-blue text-white'
                        : isConnected 
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon name="FaStar" className="w-4 h-4" size={16} />
                      <span>Reviews</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'connect' && (
            <div className="space-y-6">
              {/* Show loading state when syncing after OAuth */}
              {isLoading && isConnected && locations.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center space-x-3">
                    <Icon name="FaSpinner" className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Syncing Connection...</h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Verifying your Google Business Profile connection. Please wait...
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Google Business Profile Connection Status */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon name="FaGoogle" className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Google Business Profile</h3>
                      <p className="text-sm text-gray-600">
                        Connect to post updates to your business locations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isConnected ? (
                      <>
                        <div className="flex items-center space-x-2 text-green-600">
                          <Icon name="FaCheck" className="w-4 h-4" />
                          <span className="text-sm font-medium">Connected</span>
                        </div>
                        <button
                          onClick={() => setShowDisconnectConfirm(true)}
                          disabled={isLoading}
                          className={`px-4 py-2 rounded-md transition-colors text-sm flex items-center space-x-2 ${
                            isLoading
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                              : 'text-red-600 border border-red-200 hover:bg-red-50'
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                              <span>Disconnecting...</span>
                            </>
                          ) : (
                            <>
                              <Icon name="FaTimes" className="w-4 h-4" />
                              <span>Disconnect</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-end space-y-2">
                        <button
                          onClick={handleConnect}
                          disabled={isLoading}
                          className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
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
                        <p className="text-xs text-gray-500 text-right max-w-xs">
                          ⚠️ Important: Check ALL permission boxes when prompted by Google
                        </p>
                      </div>
                    )}
                  </div>
                </div>



                {/* Show fetching progress indicator */}
                {fetchingLocations === 'google-business-profile' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <Icon name="FaSpinner" className="w-5 h-5 text-blue-600 animate-spin" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Fetching Business Locations...</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          This typically takes 1-2 minutes due to Google API rate limits. Please wait...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {isConnected && locations.length === 0 && !fetchingLocations && (
                  <div className={`border rounded-md p-4 ${hasAttemptedFetch ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-start space-x-3">
                      <Icon name={hasAttemptedFetch ? "FaExclamationTriangle" : "FaInfoCircle"} className={`w-5 h-5 mt-0.5 ${hasAttemptedFetch ? 'text-yellow-600' : 'text-blue-600'}`} />
                      <div>
                        <h4 className={`text-sm font-medium mb-1 ${hasAttemptedFetch ? 'text-yellow-800' : 'text-blue-800'}`}>
                          {hasAttemptedFetch ? 'No Locations Found' : 'Next Step: Fetch Your Business Locations'}
                        </h4>
                        <p className={`text-sm mb-3 ${hasAttemptedFetch ? 'text-yellow-700' : 'text-blue-700'}`}>
                          {hasAttemptedFetch 
                            ? 'Your Google Business Profile appears to have no locations, or they couldn\'t be retrieved. You can try fetching again or check your Google Business Profile.'
                            : 'Great! Your Google Business Profile is connected. Now fetch your business locations to start creating posts and managing your online presence.'
                          }
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleFetchLocations('google-business-profile')}
                            disabled={fetchingLocations === 'google-business-profile' || Boolean(rateLimitedUntil && Date.now() < rateLimitedUntil)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                              fetchingLocations === 'google-business-profile' || Boolean(rateLimitedUntil && Date.now() < rateLimitedUntil)
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-slate-600 text-white hover:bg-slate-700'
                            }`}
                          >
                            {fetchingLocations === 'google-business-profile' ? (
                              <>
                                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                                <span>Fetching (1-2 min)...</span>
                              </>
                            ) : Boolean(rateLimitedUntil && Date.now() < rateLimitedUntil) ? (
                              <>
                                <Icon name="FaClock" className="w-4 h-4" />
                                <span>Rate limited ({rateLimitedUntil ? Math.ceil((rateLimitedUntil - Date.now()) / 1000) : 0}s)</span>
                              </>
                            ) : (
                              <>
                                <Icon name="FaDownload" className="w-4 h-4" />
                                <span>Fetch Business Locations</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Success & Locations */}
                {isConnected && locations.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-start space-x-3">
                      <Icon name="FaCheck" className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800 mb-1">
                          Setup Complete!
                        </h4>
                        <p className="text-sm text-green-700 mb-3">
                          Found {locations.length} business location{locations.length !== 1 ? 's' : ''}. Your Google Business Profile is ready! You can now create posts, manage photos, business info, and reviews.
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => changeTab('create-post')}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Create Posts →
                          </button>
                          <button
                            onClick={() => changeTab('reviews')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Respond to Reviews →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Success Messages */}
              {postResult && postResult.success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center space-x-2 text-green-800 mb-2">
                    <Icon name="FaCheck" className="w-4 h-4" />
                    <span className="text-sm font-medium">Success</span>
                  </div>
                  <p className="text-sm text-green-700">{postResult.message}</p>
                  {/* 🔧 FIX: Add refresh button if connected but no locations visible */}
                  {isConnected && locations.length === 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          console.log('🔄 Manual refresh requested');
                          setIsLoading(true);
                          loadPlatforms();
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        Refresh Connection Status
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Error Messages */}
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
                  
                  {/* Add specific help for permission/scope errors */}
                  {postResult.message && (postResult.message.includes('revoke') || postResult.message.includes('permission') || postResult.message.includes('scope')) && (
                    <div className="mt-3 p-3 bg-white border border-red-200 rounded">
                      <p className="text-sm font-medium text-red-800 mb-2">How to revoke and reconnect:</p>
                      <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
                        <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline text-red-800 font-medium">Google Account Permissions</a></li>
                        <li>Find "Prompt Reviews" in the list</li>
                        <li>Click on it and select "Remove Access"</li>
                        <li>Come back here and click "Connect Google Business" again</li>
                        <li>Make sure to check ALL permission checkboxes when prompted</li>
                      </ol>
                    </div>
                  )}
                  
                  {rateLimitCountdown > 0 && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
                      <Icon name="FaClock" className="w-3 h-3" />
                      <span>You can retry in {rateLimitCountdown} seconds</span>
                    </div>
                  )}
                </div>
              )}
              
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* GBP Access Message for Growers */}
              {!hasGBPAccess && gbpAccessMessage && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    {gbpAccessMessage}
                    <button 
                      onClick={() => window.open('/dashboard/plan', '_blank')}
                      className="ml-2 text-yellow-900 underline hover:no-underline"
                    >
                      Upgrade your plan
                    </button>
                    {' '}to connect your Google Business Profile.
                  </p>
                </div>
              )}
              {/* Always show the impressive charts and stats */}
              {(
                <div className="space-y-6">
                  {/* Location Selector - show demo location if not connected */}
                  <LocationSelector
                    locations={locations.length > 0 ? locations.map(loc => ({
                      id: loc.id,
                      name: loc.name,
                      address: loc.address,
                      status: loc.status
                    })) : [
                      {
                        id: 'demo-location',
                        name: 'Your Business Name',
                        address: '123 Main Street, Your City, State 12345',
                        status: 'active' as const
                      }
                    ]}
                    selectedLocationId={selectedLocationId || 'demo-location'}
                    onLocationChange={handleLocationChange}
                    isConnected={isConnected}
                  />

                  {/* Error State */}
                  {overviewError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex items-center space-x-2 text-red-800 mb-2">
                        <Icon name="FaExclamationTriangle" className="w-4 h-4" />
                        <span className="text-sm font-medium">Error Loading Overview</span>
                      </div>
                      <p className="text-sm text-red-700">{overviewError}</p>
                      <button
                        onClick={() => selectedLocationId && fetchOverviewData(selectedLocationId)}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Overview Stats - Always show with dummy data when not connected */}
                  <OverviewStats
                    totalReviews={overviewData?.reviewTrends.totalReviews || 247}
                    reviewTrend={overviewData?.reviewTrends.reviewTrend || 12.5}
                    averageRating={overviewData?.reviewTrends.averageRating || 4.8}
                    monthlyReviewData={overviewData?.reviewTrends.monthlyReviewData || [
                      { month: 'Jan', fiveStar: 45, fourStar: 12, threeStar: 3, twoStar: 1, oneStar: 2, noRating: 5 },
                      { month: 'Feb', fiveStar: 52, fourStar: 8, threeStar: 2, twoStar: 1, oneStar: 1, noRating: 3 },
                      { month: 'Mar', fiveStar: 38, fourStar: 15, threeStar: 4, twoStar: 2, oneStar: 1, noRating: 7 },
                      { month: 'Apr', fiveStar: 61, fourStar: 11, threeStar: 2, twoStar: 0, oneStar: 1, noRating: 4 },
                      { month: 'May', fiveStar: 49, fourStar: 13, threeStar: 5, twoStar: 2, oneStar: 2, noRating: 6 },
                      { month: 'Jun', fiveStar: 55, fourStar: 9, threeStar: 3, twoStar: 1, oneStar: 0, noRating: 2 }
                    ]}
                    isLoading={overviewLoading}
                  />

                  <BusinessHealthMetrics
                    locationId={selectedLocationId || 'demo'}
                    profileData={overviewData?.profileData || {
                      completeness: 92,
                      photosCount: 47,
                      hoursComplete: true,
                      phoneComplete: true,
                      websiteComplete: true,
                      categoryComplete: true,
                      categoriesUsed: 3,
                      maxCategories: 9,
                      servicesCount: 8,
                      servicesWithDescriptions: 6,
                      businessDescriptionLength: 525,
                      businessDescriptionMaxLength: 750,
                      seoScore: 7,
                      photosByCategory: {
                        'LOGO': 1,
                        'COVER': 2,
                        'INTERIOR': 12,
                        'EXTERIOR': 8,
                        'TEAM': 4,
                        'PRODUCT': 15
                      }
                    }}
                    engagementData={overviewData?.engagementData || {
                      unrespondedReviews: 3,
                      totalQuestions: 12,
                      unansweredQuestions: 2,
                      recentPosts: 1,
                      recentPhotos: 0,
                      lastPostDate: '2024-07-15',
                      lastPhotoDate: '2024-06-28'
                    }}
                    performanceData={overviewData?.performanceData || {
                      monthlyViews: 0,
                      viewsTrend: 0,
                      topSearchQueries: [],
                      customerActions: {
                        websiteClicks: 0,
                        phoneCalls: 0,
                        directionRequests: 0,
                        photoViews: 0
                      }
                    }}
                    optimizationOpportunities={overviewData?.optimizationOpportunities || [
                      { id: '1', priority: 'high', title: 'Upload more photos', description: 'Your profile needs 2+ photos this month. Current: 0/2 photos uploaded.' },
                      { id: '2', priority: 'low', title: 'Optimize business description', description: 'Add 225 more characters to maximize your 750-character description for better SEO.' },
                      { id: '3', priority: 'high', title: 'Respond to 3 reviews', description: 'You have 3 unresponded reviews that need attention to improve customer relations.' },
                      { id: '4', priority: 'medium', title: 'Add more service categories', description: 'Use 6 more of your available 9 categories to improve discoverability.' }
                    ]}
                    isLoading={overviewLoading}
                    onQuickAction={handleOverviewQuickAction}
                  />

                  {/* Loading State */}
                  {overviewLoading && !overviewData && (
                    <div className="space-y-6">
                      <OverviewStats
                        totalReviews={0}
                        reviewTrend={0}
                        averageRating={0}
                        monthlyReviewData={[]}
                        isLoading={true}
                      />
                      <BusinessHealthMetrics
                        locationId=""
                        profileData={{} as any}
                        engagementData={{} as any}
                        performanceData={{} as any}
                        optimizationOpportunities={[]}
                        isLoading={true}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create-post' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <Icon name="FaGoogle" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                  {/* Location Selection */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Select Locations</h3>
                    
                    {locations.length === 0 ? (
                      <div className="text-center py-8">
                        <Icon name="FaMapMarker" className="w-8 h-8 text-gray-400 mx-auto mb-3" />
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
                            onClick={() => handleFetchLocations('google-business-profile')}
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
                              <>
                                <Icon name="MdDownload" className="w-4 h-4 mr-2" />
                                Fetch Locations
                              </>
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
                    ) : (
                      <div className="location-dropdown relative">
                        <button
                          onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                          className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-slate-blue focus:border-slate-blue"
                        >
                          <div className="flex items-center space-x-2">
                            <Icon name="FaMapMarker" className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              {selectedLocations.length === 0 
                                ? 'Select business locations' 
                                : selectedLocations.length === 1 
                                  ? locations.find(l => l.id === selectedLocations[0])?.name || 'Selected location'
                                  : `${selectedLocations.length} locations selected`
                              }
                            </span>
                          </div>
                          {isLocationDropdownOpen ? (
                            <Icon name="FaChevronUp" className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Icon name="FaChevronDown" className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        
                        {isLocationDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                            {locations.map((location) => (
                              <label
                                key={location.id}
                                className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedLocations.includes(location.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLocations([...selectedLocations, location.id]);
                                    } else {
                                      setSelectedLocations(selectedLocations.filter(id => id !== location.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{location.name}</div>
                                  {location.address && (
                                    <div className="text-sm text-gray-500 truncate">{location.address}</div>
                                  )}
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                  location.status === 'active' ? 'bg-green-100 text-green-800' :
                                  location.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {location.status}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Creation Form */}
                  {locations.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Create Post</h3>
                      </div>

                      {/* Post Type Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Post Content</label>
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
                                <Icon name="MdFlashOn" className="w-3 h-3" />
                                <span>AI Improve</span>
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
                            <Icon name="FaImage" className="w-8 h-8 text-gray-400 mx-auto mb-2" />
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">Button Type</label>
                              <select
                                value={ctaType}
                                onChange={(e) => setCTAType(e.target.value as any)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-slate-blue focus:border-slate-blue"
                              >
                                <option value="LEARN_MORE">Learn More</option>
                                <option value="CALL">Call</option>
                                <option value="ORDER_ONLINE">Order Online</option>
                                <option value="BOOK">Book</option>
                                <option value="SIGN_UP">Sign Up</option>
                                <option value="BUY">Buy</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {ctaType === 'CALL' ? 'Phone Number' : 'URL'}
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
                              <span>Publish Post</span>
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

          {activeTab === 'respond-reviews' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <Icon name="FaImage" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Google Business Profile to manage photos for your business locations.
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
                <PhotoManagement 
                  locations={locations}
                  isConnected={isConnected}
                />
              )}
            </div>
          )}

          {/* Business Information Tab */}
          {activeTab === 'business-info' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <Icon name="FaStore" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Google Business Profile to edit business information.
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
                <BusinessInfoEditor 
                  key="business-info-editor" 
                  locations={locations}
                  isConnected={isConnected}
                />
              )}
            </div>
          )}

          {/* Reviews Management Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {!isConnected ? (
                <div className="text-center py-12">
                  <Icon name="FaStar" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Business Profile</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your Google Business Profile to manage reviews for your business locations.
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
                <>
                  <UnrespondedReviewsWidget />
                  <ReviewManagement 
                    locations={locations}
                    isConnected={isConnected}
                  />
                </>
              )}
            </div>
          )}



        </div>
      </PageCard>
      
      {/* Disconnect Confirmation Dialog */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="FaExclamationTriangle" className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Disconnect Google Business Profile?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will remove your Google Business Profile connection and all stored business locations. 
              You'll need to reconnect and fetch your locations again to use posting features.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDisconnectConfirm(false);
                  handleDisconnect();
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <>
                    <Icon name="FaTimes" className="w-4 h-4" />
                    <span>Yes, Disconnect</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Reviews Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
            {/* Standardized circular close button */}
            <button
              onClick={() => {
                setShowImportModal(false);
                setImportResult(null);
              }}
              className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-20"
              style={{ width: 48, height: 48 }}
              aria-label="Close modal"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="FaImport" className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Import Google Reviews</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Import your existing Google Business Profile reviews into Prompt Reviews. Showcase them in a widget, launch a double-dip campaign
                <span className="relative inline-block ml-1 group">
                  <Icon 
                    name="FaQuestionCircle" 
                    className="w-4 h-4 text-blue-500 cursor-help hover:text-blue-700 transition-colors" 
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-50">
                    A double-dip campaign is just my silly terminology for asking contacts to take a review they've already written and edit/alter/improve and post on another review site. My advice? Go for the "triple-dip." YOLO! - Chris
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </span>
                , or filter out contacts who have already reviewed you.
              </p>
              
              {selectedLocationId && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="FaMapMarker" className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800 font-medium">
                      Location: {locations.find(l => l.id === selectedLocationId)?.name || 'Selected Location'}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Import Options:</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleImportReviews('all')}
                    disabled={isImportingReviews || !selectedLocationId}
                    className="w-full px-4 py-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Import All Reviews</div>
                        <div className="text-sm text-gray-500">Import all reviews from this location</div>
                      </div>
                      <Icon name="FaImport" className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleImportReviews('new')}
                    disabled={isImportingReviews || !selectedLocationId}
                    className="w-full px-4 py-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Import New Reviews Only</div>
                        <div className="text-sm text-gray-500">Skip reviews that already exist</div>
                      </div>
                      <Icon name="FaPlus" className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                </div>
              </div>

              {importResult && (
                <div className={`mt-4 p-3 rounded-md ${
                  importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`flex items-center space-x-2 ${
                    importResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <Icon 
                      name={importResult.success ? "FaCheck" : "FaExclamationTriangle"} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm font-medium">
                      {importResult.success ? 'Success' : 'Error'}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    importResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {importResult.message}
                    {importResult.count !== undefined && ` (${importResult.count} reviews)`}
                  </p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      <p className="font-medium mb-1">Error details:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {importResult.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                      {importResult.totalErrorCount && importResult.totalErrorCount > 5 && (
                        <p className="mt-1 italic">...and {importResult.totalErrorCount - 5} more errors</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Fetch Locations Confirmation Modal */}
      {showFetchConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="FaDownload" className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Fetch Business Locations</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will retrieve all your Google Business Profile locations and their details.
              The process is usually quick but may take a moment depending on the number of locations.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6">
              <div className="flex items-start space-x-2">
                <Icon name="FaInfoCircle" className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What happens next:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>We'll fetch all your business locations from Google</li>
                    <li>Each location's details will be saved for quick access</li>
                    <li>You'll be able to post updates to any of your locations</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={performFetchLocations}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Icon name="FaDownload" className="w-4 h-4" />
                <span>Fetch Locations</span>
              </button>
              <button
                onClick={() => setShowFetchConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 