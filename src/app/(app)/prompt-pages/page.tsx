"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRef } from "react";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageCard from "@/app/(app)/components/PageCard";

import QRCodeGenerator, { QR_FRAME_SIZES } from "../dashboard/components/QRCodeGenerator";
import dynamic from "next/dynamic";
import PromptPagesTable from "@/app/(app)/components/PromptPagesTable";
import PublicPromptPagesTable from "@/app/(app)/components/PublicPromptPagesTable";
import PromptTypeSelectModal from "@/app/(app)/components/PromptTypeSelectModal";

import { useRouter, useSearchParams } from "next/navigation";
import QRCodeModal from "../components/QRCodeModal";
import StarfallCelebration from "@/app/(app)/components/StarfallCelebration";
import { promptTypesWithDarkIcons as promptTypes } from "@/config/promptTypes";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import BusinessLocationModal from "@/app/(app)/components/BusinessLocationModal";
import LocationCard from "@/app/(app)/components/LocationCard";
import { BusinessLocation, LocationWithPromptPage } from "@/types/business";
import { hasLocationAccess, formatLocationAddress, getLocationDisplayName } from "@/utils/locationUtils";
import CommunicationButtons from "@/app/(app)/components/communication/CommunicationButtons";

import EmojiEmbedButton from "@/app/(app)/components/EmojiEmbedButton";
import FiveStarSpinner from "@/app/(app)/components/FiveStarSpinner";
import { useGlobalLoader } from "@/app/(app)/components/GlobalLoaderProvider";
import BusinessProfileBanner from "@/app/(app)/components/BusinessProfileBanner";
import { useAuth } from "@/auth";
import { useBusinessData, useAuthUser, useAccountData, useAuthLoading } from "@/auth/hooks/granularAuthHooks";
import PromptPageSettingsModal from "@/app/(app)/components/PromptPageSettingsModal";

const StylePage = dynamic(() => import("../dashboard/style/StyleModalPage"), { ssr: false });

function PromptPagesContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedAccountId } = useAuth();
  const { hasBusiness, businessName } = useBusinessData();
  const { user: authUser } = useAuthUser();
  const { accountId: authAccountId } = useAccountData();
  const { isLoading: authLoading } = useAuthLoading();

  // Track if initial auth load is complete
  const [authInitialized, setAuthInitialized] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [minLoadTimeElapsed, setMinLoadTimeElapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [promptPages, setPromptPages] = useState<any[]>([]);
  const [individualPromptPages, setIndividualPromptPages] = useState<any[]>([]);
  const [universalPromptPage, setUniversalPromptPage] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [universalUrl, setUniversalUrl] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    url: string;
    clientName: string;
    logoUrl?: string;
    showNfcText?: boolean;
  } | null>(null);
  const [selectedFrameSize, setSelectedFrameSize] = useState(QR_FRAME_SIZES[0]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<"draft" | "in_queue" | "in_progress" | "complete">("draft");
  const [sortField, setSortField] = useState<"first_name" | "last_name" | "review_type" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [error, setError] = useState<string | null>(null);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>("");
  const [showStarfallCelebration, setShowStarfallCelebration] = useState(false);
  const [showPostSaveModal, setShowPostSaveModal] = useState(false);
  const [postSaveData, setPostSaveData] = useState<any>(null);
  const [showStars, setShowStars] = useState(false);
  
  // Location-related state
  const [locations, setLocations] = useState<LocationWithPromptPage[]>([]);
  const [locationPromptPages, setLocationPromptPages] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<BusinessLocation | null>(null);
  const [locationLimits, setLocationLimits] = useState({ current: 0, max: 0, canCreateMore: false });
  
  // Tab state for prompt pages types - initialize from URL parameter
  const [promptPagesTab, setPromptPagesTab] = useState<'public' | 'individual' | 'locations'>(
    (searchParams.get('tab') as 'public' | 'individual' | 'locations') || 'public'
  );
  const [isNavigating, setIsNavigating] = useState(false); // Add navigation loading state
  const [showBusinessRequiredModal, setShowBusinessRequiredModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Check if user has access to individual prompt pages (exclude grower plan)
  const hasIndividualAccess = (plan?: string): boolean => {
    if (!plan) return false;
    return plan !== 'grower';
  };

  // Handle tab changes and update URL
  const handleTabChange = (newTab: 'public' | 'individual' | 'locations') => {
    // Only navigate if the tab is actually changing
    if (newTab !== promptPagesTab) {
      setPromptPagesTab(newTab);
      const params = new URLSearchParams(searchParams);
      params.set('tab', newTab);
      router.push(`/prompt-pages?${params.toString()}`, { scroll: false });
    }
  };

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (showStyleModal || showLocationModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showStyleModal, showLocationModal]);

  // Reset navigation loading state on unmount
  React.useEffect(() => {
    return () => {
      setIsNavigating(false);
    };
  }, []);

  // Update tab state when URL changes (but avoid loops)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as 'public' | 'individual' | 'locations';
    if (tabFromUrl && ['public', 'individual', 'locations'].includes(tabFromUrl)) {
      // Only update if it's actually different to avoid triggering unnecessary re-renders
      if (tabFromUrl !== promptPagesTab) {
        setPromptPagesTab(tabFromUrl);
      }
    }
  }, [searchParams]);

  // Auto-open Settings modal when openSettings=true is in URL
  useEffect(() => {
    if (searchParams.get('openSettings') === 'true' && !loading && business) {
      setShowSettingsModal(true);
      // Remove the query parameter after opening to avoid reopening on refresh
      const params = new URLSearchParams(searchParams);
      params.delete('openSettings');
      const newUrl = params.toString() ? `/prompt-pages?${params.toString()}` : '/prompt-pages';
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, loading, business, router]);

  // Set minimum load time to prevent quick flashes
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadTimeElapsed(true);
    }, 500); // Half second minimum
    return () => clearTimeout(timer);
  }, []);

  // Track when auth is fully initialized - only set to true once
  useEffect(() => {
    if (!authInitialized && !authLoading && authAccountId !== undefined) {
      setAuthInitialized(true);
    }
  }, [authLoading, authAccountId, authInitialized]);

  useEffect(() => {
    async function fetchData() {
      // Don't fetch until auth is fully initialized
      if (!authInitialized) {
        return;
      }
      
      // Don't fetch if we're already loading
      if (loading && business) {
        return;
      }
      
      // Don't refetch if we already have data for this account
      const currentAccountId = selectedAccountId || authAccountId;
      if (business && currentAccountId && business.account_id === currentAccountId) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Use auth context user and accountId instead of direct Supabase call
        if (!authUser) {
          router.push('/auth/sign-in');
          return;
        }
        
        // If no account ID, user needs to create a business first
        if (!authAccountId && !selectedAccountId) {
          router.push('/dashboard/create-business');
          return;
        }
        
        setUser(authUser);
        // Use selectedAccountId if available (from account switcher), otherwise fall back to authAccountId
        const accountId = selectedAccountId || authAccountId;

        // Fetch account data for plan info
        const { data: accountData } = await supabase
          .from("accounts")
          .select("plan, location_count, max_locations")
          .eq("id", accountId)
          .single();
        setAccount(accountData);

        let businessProfiles, businessError;
        
        // DEVELOPMENT MODE: Use API endpoint to bypass RLS issues
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true') {
          try {
            const response = await fetch(`/api/businesses?account_id=${accountId}`);
            const apiResult = await response.json();
            if (response.ok) {
              businessProfiles = apiResult.businesses || [];
              businessError = null;
            } else {
              businessProfiles = [];
              businessError = { message: apiResult.error || 'API error' };
            }
          } catch (err) {
            businessProfiles = [];
            businessError = { message: err instanceof Error ? err.message : 'Unknown error' };
          }
        } else {
          // Normal mode: Use Supabase client directly
          const result = await supabase
            .from("businesses")
            .select("*")
            .eq("account_id", accountId)
            .order("created_at", { ascending: false })
            .limit(1);
          businessProfiles = result.data;
          businessError = result.error;
        }
        
        const businessProfile = businessProfiles?.[0];
        
        // Check if business profile exists and has a valid name
        if (!businessProfile || 
            !businessProfile.name || 
            businessProfile.name.trim() === '') {
          if (!showBusinessRequiredModal) {
            setShowBusinessRequiredModal(true);
          }
          setLoading(false);
          return;
        }
        
        setBusiness(businessProfile);
        
        // DEVELOPMENT MODE BYPASS - Use mock universal prompt page
        let universalPage = null;
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true' && accountId === '12345678-1234-5678-9abc-123456789012') {
          universalPage = {
            id: '0f1ba885-07d6-4698-9e94-a63d990c65e0',
            account_id: '12345678-1234-5678-9abc-123456789012',
            slug: 'universal-mdwd0peh',
            is_universal: true,
            campaign_type: 'public',
            type: 'service',
            status: 'complete',
            recent_reviews_enabled: true,
            recent_reviews_scope: 'current_page',
            review_platforms: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        } else {
          // Include Authorization header to ensure server can authenticate
          let authHeaders: Record<string, string> = { 'X-Selected-Account': accountId };
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              authHeaders['Authorization'] = `Bearer ${session.access_token}`;
            }
          } catch {}

          const ensureRes = await fetch('/api/prompt-pages/ensure-universal', {
            method: 'POST',
            credentials: 'include',
            headers: authHeaders,
          });
          if (ensureRes.ok) {
            const ensureData = await ensureRes.json();
            universalPage = ensureData.page || null;
          } else {
            if (process.env.NODE_ENV === 'development') {
              try { const err = await ensureRes.json(); console.warn('ensure-universal failed', ensureRes.status, err); } catch {}
            }
            universalPage = null;
          }
        }
        setUniversalPromptPage(universalPage);
        if (universalPage?.slug) {
          setUniversalUrl(`${window.location.origin}/r/${universalPage.slug}`);
        }
        
        // Fetch public prompt pages (campaign_type = 'public')
        const { data: publicPages } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", accountId)
          .eq("is_universal", false)
          .eq("campaign_type", "public")
          .is("business_location_id", null)  // Only get non-location pages
          .order("created_at", { ascending: false });
        setPromptPages(publicPages || []);
        
        // Fetch individual prompt pages (campaign_type = 'individual') with contact information
        const { data: individualPages } = await supabase
          .from("prompt_pages")
          .select(`
            *,
            contacts (
              id,
              first_name,
              last_name,
              email,
              phone
            )
          `)
          .eq("account_id", accountId)
          .eq("is_universal", false)
          .eq("campaign_type", "individual")
          .is("business_location_id", null)  // Only get non-location pages
          .order("created_at", { ascending: false });
        setIndividualPromptPages(individualPages || []);
        
        // Fetch location prompt pages separately
        const { data: locationPages } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", accountId)
          .eq("is_universal", false)
          .not("business_location_id", "is", null)
          .order("created_at", { ascending: false });
        setLocationPromptPages(locationPages || []);
        
        // Fetch locations if user has access
        if (accountData && hasLocationAccess(accountData.plan)) {
          await fetchLocations(accountId);
        }
      } catch (err) {
        console.error('❌ Data fetch error:', err);
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
        setDataLoaded(true);
      }
    }
    fetchData();
  }, [authInitialized, authAccountId, authUser, selectedAccountId]);

  const fetchLocations = async (accountId: string) => {
    try {
      const response = await fetch('/api/business-locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
        setLocationLimits({
          current: data.count || 0,
          max: data.limit || 0,
          canCreateMore: data.can_create_more || false,
        });
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleCreateLocation = async (locationData: Partial<BusinessLocation>) => {
    try {
      
      const response = await fetch('/api/business-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(locationData),
      });
      
      
      if (response.ok) {
        const data = await response.json();
        setLocations(prev => [...prev, data.location]);
        setLocationLimits(prev => ({ ...prev, current: prev.current + 1 }));
        
        // If a prompt page was created, add it to locationPromptPages
        if (data.location.prompt_page_id) {
          const { data: newPromptPage } = await supabase
            .from("prompt_pages")
            .select("*")
            .eq("id", data.location.prompt_page_id)
            .single();
          
          if (newPromptPage) {
            setLocationPromptPages(prev => [...prev, newPromptPage]);
          }
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create location');
      }
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  };

  const handleUpdateLocation = async (locationData: Partial<BusinessLocation>) => {
    if (!editingLocation?.id) return;
    
    try {
      const response = await fetch(`/api/business-locations/${editingLocation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(locationData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocations(prev => prev.map(loc => 
          loc.id === editingLocation.id ? data.location : loc
        ));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location? This will also delete its prompt page.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/business-locations/${locationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        setLocations(prev => prev.filter(loc => loc.id !== locationId));
        setLocationLimits(prev => ({ 
          ...prev, 
          current: prev.current - 1,
          canCreateMore: prev.current - 1 < prev.max
        }));
        
        // Remove associated prompt pages
        setLocationPromptPages(prev => prev.filter(page => page.business_location_id !== locationId));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location. Please try again.');
    }
  };

  // Handle post-save modal and starfall celebration
  useEffect(() => {
    // Only check for modal when we're not loading and have the necessary data
    if (loading) return;
    
    const handlePostSaveModal = async () => {
      const flag = localStorage.getItem("showPostSaveModal");
      if (flag) {
        try {
          const data = JSON.parse(flag);
          
          
          // Determine which tab this modal should show on
          const isForLocation = data.isLocationCreation;
          const isForIndividual = !isForLocation && (data.first_name || data.email || data.phone);
          
          // Check if we're on the right tab
          const currentTab = promptPagesTab;
          const expectedTab = isForLocation ? 'locations' : (isForIndividual ? 'individual' : 'public');
          
          // If we're not on the right tab, don't show the modal here
          // The redirect should have put us on the right tab
          if (currentTab !== expectedTab) {
            return;
          }
          
          // If this is a location creation, find the latest location prompt page
          if (data.isLocationCreation) {
            // Try to find the latest location prompt page
            const latestLocationPage = locationPromptPages
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            
            if (latestLocationPage) {
              data.url = `${window.location.origin}/r/${latestLocationPage.slug}`;
            } else {
              // If we can't find it in the state yet, try to get it from the API
              try {
                const response = await fetch('/api/business-locations', {
                  credentials: 'include',
                });
                if (response.ok) {
                  const locationsData = await response.json();
                  const latestLocation = locationsData.locations?.[0];
                  if (latestLocation?.prompt_page_slug) {
                    data.url = `${window.location.origin}/r/${latestLocation.prompt_page_slug}`;
                  }
                }
              } catch (error) {
                console.error('Error fetching latest location:', error);
              }
            }
          }
          
          setPostSaveData(data);
          setShowPostSaveModal(true);
          // Trigger starfall celebration automatically when modal appears
          setShowStars(true);
          // Also trigger global starfall celebration
          setShowStarfallCelebration(true);
          localStorage.removeItem("showPostSaveModal");
        } catch (error) {
          console.error('Error handling post save modal:', error);
        }
      }
    };

    handlePostSaveModal();
  }, [loading, promptPagesTab, locationPromptPages]); // Check when loading completes and tab changes

  // Update URL for location creation if modal is already shown and locationPromptPages updates
  useEffect(() => {
    if (showPostSaveModal && postSaveData?.isLocationCreation && locationPromptPages.length > 0) {
      const latestLocationPage = locationPromptPages
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      if (latestLocationPage && !postSaveData.url) {
        const updatedData = {
          ...postSaveData,
          url: `${window.location.origin}/r/${latestLocationPage.slug}`
        };
        setPostSaveData(updatedData);
      }
    }
  }, [locationPromptPages, showPostSaveModal, postSaveData]);

  const handleSort = (field: "first_name" | "last_name" | "review_type") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredPromptPages = promptPages.filter((page) => {
    if (selectedTab === "in_queue") return page.status === "in_queue";
    if (selectedTab === "in_progress") return page.status === "in_progress";
    if (selectedTab === "complete") return page.status === "complete";
    if (selectedTab === "draft") return page.status === "draft";
    return true;
  });

  const sortedPromptPages = [...filteredPromptPages].sort((a, b) => {
    if (!sortField) return 0;
    let aValue = (a[sortField] || "").toLowerCase();
    let bValue = (b[sortField] || "").toLowerCase();
    if (sortDirection === "asc") {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const handleCopyLink = async (url: string = universalUrl) => {
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopySuccess("Copied!");
        setTimeout(() => setCopySuccess(""), 2000);
      } catch (err) {
        window.prompt("Copy this link:", url);
      }
    }
  };

  // Handle settings save
  const handleSettingsSave = async (settingsData: any) => {
    if (!authAccountId || !business) {
      throw new Error('Business data not available');
    }

    try {
      // Use authAccountId directly since that's the account we're authenticated as
      const response = await fetch(`/api/businesses/${authAccountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedBusiness = await response.json();
      setBusiness(updatedBusiness);
      
      // Don't show success message here - it's shown in the modal
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  function handlePromptTypeSelect(typeKey: string) {
    setShowTypeModal(false);
    setIsNavigating(true); // Show loading state
    const campaignType = localStorage.getItem('campaign_type') || 'individual';
    router.push(`/create-prompt-page?type=${typeKey}&campaign_type=${campaignType}`);
  }

  const starProps = useMemo(() => {
    const props = [];
    for (let i = 0; i < 50; i++) {
      props.push({
        left: Math.random() * 100 + "%",
        top: Math.random() * 20 + "%",
        color: ["#FFD700", "#FFA500", "#FF6347", "#FF69B4", "#87CEEB"][Math.floor(Math.random() * 5)],
        fontSize: Math.random() * 20 + 20 + "px",
      });
    }
    return props;
  }, []);

  // Check authentication first - redirect if not authenticated
  useEffect(() => {
    if (authInitialized && !authUser) {
      router.push('/auth/sign-in');
    }
  }, [authInitialized, authUser, router]);

  // Tie page-level loading to the global overlay
  const loader = useGlobalLoader();
  useEffect(() => {
    const isPageLoading = (!authInitialized || !dataLoaded || !minLoadTimeElapsed || authLoading);
    if (isPageLoading) {
      loader.show("page");
    } else {
      loader.hide("page");
    }
    return () => loader.hide("page");
  }, [authInitialized, dataLoaded, minLoadTimeElapsed, authLoading, loader]);

  // While loading, render nothing (global overlay covers the screen)
  if (!authInitialized || !dataLoaded || !minLoadTimeElapsed || authLoading) {
    return null;
  }

  // If auth is initialized but no user, show nothing while redirecting
  if (authInitialized && !authUser) {
    return null;
  }

  return (
    <div>
      {/* Navigation loading uses global overlay */}
      {isNavigating && loader.show("navigate")}
      {!isNavigating && loader.hide("navigate")}
      
      <PromptTypeSelectModal
        open={showTypeModal}
        onClose={() => {
          setShowTypeModal(false);
          setIsNavigating(false); // Reset loading state if modal is closed
        }}
        onSelectType={handlePromptTypeSelect}
        promptTypes={promptTypes}
      />
      
      {/* Business Location Modal */}
      {account && hasLocationAccess(account.plan) && (
        <BusinessLocationModal
          isOpen={showLocationModal}
          onClose={() => {
            setShowLocationModal(false);
            setEditingLocation(null);
          }}
          onSave={editingLocation ? handleUpdateLocation : handleCreateLocation}
          location={editingLocation}
          canCreateMore={locationLimits.canCreateMore}
          currentCount={locationLimits.current}
          maxLocations={locationLimits.max}
          businessLogoUrl={business?.logo_url || null}
          businessReviewPlatforms={business?.review_platforms || []}
        />
      )}
      
            {/* Title above navigation */}
      <div className="flex justify-center w-full mt-16 mb-6 z-20">
        <h2 className="text-white text-xl font-semibold">Prompt Page campaign type</h2>
      </div>
       
       {/* Pill navigation at the top of the PageCard */}
       <div className="flex justify-center w-full mt-0 mb-0 z-20 px-4">
        <div className="flex bg-white/10 backdrop-blur-sm border border-white rounded-full p-1 shadow-lg w-full max-w-md">
          <button
            type="button"
            onClick={() => handleTabChange('public')}
            className={`flex-1 px-3 sm:px-6 py-2 font-semibold text-xs sm:text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center justify-center gap-1 sm:gap-2
              ${promptPagesTab === 'public'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white'}
            `}
          >
            <Icon name="FaUsers" className="hidden sm:block w-5 h-5" size={20} />
            <span>Public</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('individual')}
            className={`flex-1 px-3 sm:px-6 py-2 font-semibold text-xs sm:text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center justify-center gap-1 sm:gap-2
              ${promptPagesTab === 'individual'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white'}
            `}
          >
            <Icon name="FaUserCircle" className="hidden sm:block w-5 h-5" size={20} />
            <span>Individual</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('locations')}
            className={`flex-1 px-3 sm:px-6 py-2 font-semibold text-xs sm:text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center justify-center gap-1 sm:gap-2
              ${promptPagesTab === 'locations'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white'}
            `}
          >
            <Icon name="FaMapMarker" className="hidden sm:block w-5 h-5" size={20} />
            <span>Locations</span>
          </button>
        </div>
      </div>
      <PageCard icon={<span className="text-3xl font-bold align-middle text-slate-blue" style={{ fontFamily: 'Inter, sans-serif' }}>[P]</span>}>
        {/* Card content below tabs */}
        <div className="p-6 pt-2">
            {/* Business Profile Banner */}
            <BusinessProfileBanner 
              userId={user?.id}
              hasBusiness={hasBusiness}
            />
            
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mt-2 mb-4">
              <div className="flex flex-col mt-0 md:mt-[3px] flex-1 min-w-0">
                <div className="mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-blue mt-0">
                    {promptPagesTab === 'public' && 'Public Prompt Pages'}
                    {promptPagesTab === 'individual' && 'Individual Prompt Pages'}
                    {promptPagesTab === 'locations' && 'Location Prompt Pages'}
                  </h1>
                </div>
                <p className="text-gray-600 text-base max-w-md mt-0 mb-6 lg:mb-10">
                  {promptPagesTab === 'public' && 'Capture reviews in person, at your place of business, through your website, or embed in your newsletter. These prompt pages are open to the public.'}
                  {promptPagesTab === 'individual' && 'Create personalized prompt pages for individuals and make them feel special. Pre-populated contact information, write your own review templates, and add custom messaging.'}
                  {promptPagesTab === 'locations' && 'Create location-specific prompt pages for each of your business locations.'}
                </p>
              </div>
              <div className="flex flex-row lg:items-start gap-3 flex-shrink-0">
                {(promptPagesTab === 'individual' || promptPagesTab === 'public') && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('campaign_type', promptPagesTab);
                      setShowTypeModal(true);
                    }}
                    disabled={promptPagesTab === 'individual' && account?.plan === 'grower'}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded font-medium transition whitespace-nowrap ${
                      promptPagesTab === 'individual' && account?.plan === 'grower'
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-slate-blue text-white hover:bg-slate-blue/90'
                    }`}
                  >
                    + Prompt Page
                  </button>
                )}
                {promptPagesTab === 'locations' && (
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    disabled={account?.plan === 'grower' || account?.plan === 'builder'}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded font-medium transition whitespace-nowrap ${
                      account?.plan === 'grower' || account?.plan === 'builder'
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-slate-blue text-white hover:bg-slate-blue/90'
                    }`}
                  >
                    + Location
                  </button>
                )}
                <button
                  type="button"
                  className="bg-blue-100 text-slate-blue rounded font-semibold px-4 py-2 hover:bg-blue-200 transition whitespace-nowrap flex items-center gap-2 flex-shrink-0"
                  onClick={() => setShowStyleModal(true)}
                >
                  <Icon name="FaPalette" className="w-5 h-5" size={20} />
                  Style
                </button>
                <button
                  type="button"
                  className="bg-blue-100 text-slate-blue rounded font-semibold px-4 py-2 hover:bg-blue-200 transition whitespace-nowrap flex items-center gap-2 flex-shrink-0"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <Icon name="FaCog" className="w-5 h-5" size={20} />
                  Settings
                </button>
              </div>
            </div>
            
            {/* Universal Prompt Page Card - Only visible on public tab */}
            {promptPagesTab === 'public' && universalPromptPage && (
              <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow relative mt-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3">
                        <Icon name="FaGlobe" className="w-8 h-8 text-slate-blue" size={32} />
                        Universal Prompt Page
                      </h2>
                      <UniversalTooltip />
                    </div>
                    <div className="flex gap-4 items-center">
                      <Link
                        href={`/r/${universalPromptPage.slug}`}
                        className="text-slate-blue underline hover:text-slate-blue/80 hover:underline"
                      >
                        View
                      </Link>
                      {universalPromptPage?.slug && (
                        <Link
                          href={"/dashboard/edit-prompt-page/universal"}
                          className="text-slate-blue underline hover:text-slate-blue/80 hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-blue-900 mb-4 text-sm">
                    Your Universal Prompt Page is your general-use Prompt Page that can be shared with one or many.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => handleCopyLink()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 backdrop-blur-sm text-purple-800 rounded hover:bg-purple-500/30 text-sm font-medium shadow border border-white/30 h-9 align-middle whitespace-nowrap"
                      >
                        <Icon name="FaLink" className="w-5 h-5" size={20} />
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQrModal({
                            open: true,
                            url: `${window.location.origin}/r/${universalPromptPage.slug}`,
                            clientName: business?.name || "PromptReviews",
                            logoUrl: business?.logo_print_url || business?.logo_url,
                            showNfcText: universalPromptPage?.nfc_text_enabled ?? false,
                          });
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 backdrop-blur-sm text-amber-800 rounded hover:bg-amber-500/30 text-sm font-medium shadow border border-white/30 h-9 align-middle whitespace-nowrap"
                      >
                        <Icon name="MdDownload" className="w-5 h-5" size={20} />
                        QR code
                      </button>
                        
                        {/* Emoji Embed Button - only show when sentiment flow is enabled */}
                        {universalPromptPage?.emoji_sentiment_enabled && universalPromptPage?.slug && (
                          <EmojiEmbedButton slug={universalPromptPage.slug} />
                        )}
                        
                        <button
                          type="button"
                          onClick={() => {
                            const businessName = business?.name || "your business";
                            const reviewUrl = `${window.location.origin}/r/${universalPromptPage.slug}`;
                            const message = `Hi! I'd love to get your feedback on ${businessName}. Please leave a review here: ${reviewUrl}`;
                            window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/20 backdrop-blur-sm text-green-800 rounded hover:bg-green-500/30 text-sm font-medium shadow border border-white/30 h-9 align-middle whitespace-nowrap"
                        >
                          <Icon name="FaMobile" className="w-5 h-5" size={20} />
                          Send SMS
                        </button>
                      <button
                        type="button"
                        onClick={() => {
                          const businessName = business?.name || "your business";
                          const reviewUrl = `${window.location.origin}/r/${universalPromptPage.slug}`;
                          const subject = "Please leave a review";
                          const message = `Hi,\n\nI'd love to get your feedback on ${businessName}. Please leave a review here: ${reviewUrl}\n\nThank you!`;
                          window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 backdrop-blur-sm text-blue-800 rounded hover:bg-blue-500/30 text-sm font-medium shadow border border-white/30 h-9 align-middle whitespace-nowrap"
                      >
                        <Icon name="FaEnvelope" className="w-5 h-5" size={20} />
                        Send Email
                      </button>

                      {copySuccess && (
                        <span className="ml-2 text-green-600 text-xs font-semibold">
                          {copySuccess}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* QR Code Download Modal */}
            <QRCodeModal
              isOpen={qrModal?.open || false}
              onClose={() => setQrModal(null)}
              url={qrModal?.url || ""}
              clientName={qrModal?.clientName || ""}
              logoUrl={qrModal?.logoUrl}
              showNfcText={qrModal?.showNfcText}
            />
            
            {/* Public Outreach Content */}
            {promptPagesTab === 'public' && (
              <>
                {/* Public Prompt Pages Section */}
                <div className="my-12">
                  <h2 className="text-2xl font-bold text-slate-blue mb-6">Your public Prompt Pages</h2>
                
                <div className="overflow-x-auto shadow border-l border-r border-b border-gray-200 sm:rounded-b-lg">
                  <PublicPromptPagesTable
                    promptPages={promptPages}
                    business={business}
                    account={business}
                    universalUrl={universalUrl}
                    onDeletePages={async (pageIds) => {
                      await supabase.from("prompt_pages").delete().in("id", pageIds);
                      setPromptPages((pages) => pages.filter((page) => !pageIds.includes(page.id)));
                    }}
                    onCreatePromptPage={() => setShowTypeModal(true)}
                  />
                </div>
              </div>
              </>
            )}
            
            {/* Individual Outreach Content */}
            {promptPagesTab === 'individual' && (
              <div className="my-12">
                {(!account || !hasIndividualAccess(account.plan)) ? (
                  <div className="text-center py-12">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                      <Icon name="FaUser" className="w-16 h-16 mx-auto mb-4 text-slate-blue" size={64} />
                      <h3 className="font-semibold text-blue-900 mb-2">Upgrade to Builder</h3>
                      <p className="text-sm text-blue-700 mb-4">
                        Individual prompt pages are available with the Builder tier and above. Upgrade your plan to unlock this feature.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/upgrade')}
                        className="bg-slate-blue text-white px-6 py-2 rounded hover:bg-slate-blue/90 font-medium transition"
                      >
                        Upgrade Now
                      </button>
                    </div>
                  </div>
                ) : (
                <PromptPagesTable
                  promptPages={individualPromptPages}
                  business={business}
                  account={account}
                  universalUrl={universalUrl}
                  onStatusUpdate={async (pageId: string, newStatus: any) => {
                    await supabase.from("prompt_pages").update({ status: newStatus }).eq("id", pageId);
                    setIndividualPromptPages((pages) =>
                      pages.map((page) =>
                        page.id === pageId ? { ...page, status: newStatus } : page
                      )
                    );
                  }}
                  onDeletePages={async (pageIds: string[]) => {
                    await supabase.from("prompt_pages").delete().in("id", pageIds);
                    setIndividualPromptPages((pages) => pages.filter((page) => !pageIds.includes(page.id)));
                  }}
                  onCreatePromptPage={() => setShowTypeModal(true)}
                />
                )}
              </div>
            )}
            
            {/* Locations Content */}
            {promptPagesTab === 'locations' && (
              <div className="my-12">
                {(!account || !hasLocationAccess(account.plan)) ? (
                  <div className="text-center py-12">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                      <Icon name="FaMapMarker" className="w-16 h-16 mx-auto mb-4 text-slate-blue" size={64} />
                      <h3 className="font-semibold text-blue-900 mb-2">Upgrade to Maven</h3>
                      <p className="text-sm text-blue-700 mb-4">
                        Location prompt pages are available with the Maven tier. Upgrade your plan to unlock this feature.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/upgrade')}
                        className="bg-slate-blue text-white px-6 py-2 rounded hover:bg-slate-blue/90 font-medium transition"
                      >
                        Upgrade Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                
                {/* Location Limits Info */}
                {account && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">Location Limits</h3>
                        <p className="text-sm text-blue-700">
                          {locationLimits.current} of {locationLimits.max} locations used
                        </p>
                      </div>
                      {!locationLimits.canCreateMore && (
                        <div className="text-sm text-red-600 font-medium">
                          Location limit reached
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Locations List */}
                <div className="space-y-4">
                  {locations.map((location) => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      businessName={business?.name}
                      businessLogoUrl={business?.logo_url}
                      onEdit={(location) => {
                        setEditingLocation(location);
                        setShowLocationModal(true);
                      }}
                      onDelete={handleDeleteLocation}
                    />
                  ))}
                  
                  {locations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Icon name="FaMapMarker" className="w-12 h-12 mx-auto mb-4 text-slate-blue" size={48} />
                      <p>No locations added yet.</p>
                      <p className="text-sm">Add your first location to get started.</p>
                    </div>
                  )}
                </div>
                  </>
                )}
              </div>
            )}
          </div>
        </PageCard>
      {/* Style Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <StylePage 
            onClose={() => setShowStyleModal(false)} 
            accountId={selectedAccountId || authAccountId}
          />
        </div>
      )}

      {/* Global Starfall Celebration */}
      {showStarfallCelebration && (
        <StarfallCelebration
          isVisible={showStarfallCelebration}
          onComplete={() => setShowStarfallCelebration(false)}
        />
      )}

      {/* Post-save share modal with star fall animation */}
      {showPostSaveModal && postSaveData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          {/* Star Falling Animation - behind modal, only after button click */}
          {starProps.map((props, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: props.left,
                top: props.top,
                pointerEvents: "none",
                zIndex: 50,
              }}
            >
              <span
                className="absolute animate-fall"
                style={{
                  color: props.color,
                  fontSize: props.fontSize,
                  left: 0,
                  top: 0,
                }}
              >
                ⭐
              </span>
            </span>
          ))}

          {/* Modal Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full mx-4 relative z-50 border border-white/30">
            {/* Glass-style close button */}
            <button
              onClick={() => {
                setShowPostSaveModal(false);
                setShowStars(false);
                setPostSaveData(null);
              }}
              className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
              style={{ width: 36, height: 36 }}
              aria-label="Close modal"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6">
              <div className="text-center mb-6">
                {/* Prompty Success Image */}
                <div className="mb-3 flex justify-center">
                  <img
                    src="/images/prompty-success.png"
                    alt="Prompty Success"
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {postSaveData.isLocationCreation ? 'Location created! 🎉' : 'Prompt Page published! 🎉'}
                </h3>
                <p className="text-sm text-white/90">
                  {postSaveData.isLocationCreation 
                    ? `Your location "${postSaveData.locationName}" is now live with its own Prompt Page ready to collect reviews.`
                    : 'Your Prompt Page is now live and ready to collect reviews.'
                  }
                </p>
              </div>

              {/* Sharing Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-500/30 backdrop-blur-sm rounded-lg border border-purple-300/30">
                  <span className="text-sm font-medium text-white">Share link</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(postSaveData.url);
                    }}
                    className="text-white hover:text-white/80 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>

                {/* For individual prompt pages with contact info, show CommunicationButtons */}
                {(postSaveData.first_name || postSaveData.email || postSaveData.phone) && !postSaveData.isLocationCreation ? (
                  <div className="flex items-center justify-between p-3 bg-teal-500/30 backdrop-blur-sm rounded-lg border border-teal-300/30">
                    <span className="text-sm font-medium text-white">SMS or Email</span>
                    <CommunicationButtons
                      contact={{
                        id: postSaveData.contact_id || 'temp-contact',
                        first_name: postSaveData.first_name || '',
                        last_name: postSaveData.last_name || '',
                        email: postSaveData.email,
                        phone: postSaveData.phone
                      }}
                      promptPage={{
                        id: postSaveData.prompt_page_id || 'temp-page',
                        slug: postSaveData.slug || '',
                        status: 'draft',
                        client_name: postSaveData.first_name || ''
                      }}
                      singleButton={true}
                      buttonText="Send"
                      className="px-3 py-1.5 text-sm"
                    />
                  </div>
                ) : (
                  <>
                    {/* For non-individual pages, show the original SMS and Email links */}
                    {/* SMS link */}
                    <div className="flex items-center justify-between p-3 bg-green-500/30 backdrop-blur-sm rounded-lg border border-green-300/30">
                      <span className="text-sm font-medium text-white">Send SMS</span>
                      <a
                        href={`sms:${postSaveData.phone || ''}?body=Hi ${postSaveData.first_name || 'there'}, I'd love to get your feedback! Please leave a review here: ${postSaveData.url}`}
                        className="text-white hover:text-white/80 text-sm font-medium"
                      >
                        Send
                      </a>
                    </div>

                    {/* Email link */}
                    <div className="flex items-center justify-between p-3 bg-blue-500/30 backdrop-blur-sm rounded-lg border border-blue-300/30">
                      <span className="text-sm font-medium text-white">Send email</span>
                      <a
                        href={`mailto:${postSaveData.email || ''}?subject=Please leave a review&body=Hi ${postSaveData.first_name || 'there'},%0D%0A%0D%0AI'd love to get your feedback! Please leave a review here: ${postSaveData.url}%0D%0A%0D%0AThank you!`}
                        className="text-white hover:text-white/80 text-sm font-medium"
                      >
                        Send
                      </a>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between p-3 bg-amber-500/30 backdrop-blur-sm rounded-lg border border-amber-300/30">
                  <span className="text-sm font-medium text-white">View Prompt Page</span>
                  <a
                    href={postSaveData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-white/80 text-sm font-medium"
                  >
                    Open
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Required Modal */}
      {showBusinessRequiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-4 text-center relative border-2 border-white shadow-2xl">
            <button
              onClick={() => setShowBusinessRequiredModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors"
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-6">
                              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-blue/10 mb-4">
                <Icon name="FaStore" className="h-6 w-6 text-slate-blue" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Business Profile Required
              </h3>
              <p className="text-sm text-gray-600">
                Before we get started with Prompt Pages, we need some more info about your business.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Link
                href="/dashboard/business-profile"
                className="bg-slate-blue text-white px-6 py-3 rounded-lg hover:bg-slate-blue/90 transition-colors font-medium"
              >
                Go to Your Business
              </Link>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 px-6 py-2 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <PromptPageSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSettingsSave}
        initialSettings={{
          // Review Platforms
          review_platforms: business?.review_platforms || [],
          
          // Keywords
          keywords: business?.keywords || '',
          
          // AI Dos and Don'ts
          ai_dos: business?.ai_dos || '',
          ai_donts: business?.ai_donts || '',
          
          // Special Offer
          default_offer_enabled: business?.default_offer_enabled || false,
          default_offer_title: business?.default_offer_title || 'Special Offer',
          default_offer_body: business?.default_offer_body || '',
          default_offer_url: business?.default_offer_url || '',
          default_offer_timelock: business?.default_offer_timelock || false,
          
          // AI Settings
          ai_button_enabled: business?.ai_button_enabled || false,
          fix_grammar_enabled: business?.fix_grammar_enabled || false,
          
          // Emoji Sentiment
          emoji_sentiment_enabled: business?.emoji_sentiment_enabled || false,
          emoji_sentiment_question: business?.emoji_sentiment_question || 'How was your experience?',
          emoji_feedback_message: business?.emoji_feedback_message || 'Please tell us more about your experience',
          emoji_thank_you_message: business?.emoji_thank_you_message || 'Thank you for your feedback!',
          emoji_feedback_popup_header: business?.emoji_feedback_popup_header || 'How can we improve?',
          emoji_feedback_page_header: business?.emoji_feedback_page_header || 'Your feedback helps us grow',
          
          // Falling Stars (corrected field names)
          falling_enabled: business?.falling_enabled !== undefined ? business.falling_enabled : true,
          falling_icon: business?.falling_icon || 'star',
          falling_icon_color: business?.falling_icon_color || '#FFD700',
          
          // Friendly Note (corrected field names)
          show_friendly_note: business?.show_friendly_note || false,
          friendly_note: business?.friendly_note || '',
          
          // Recent Reviews
          recent_reviews_enabled: business?.recent_reviews_enabled || false,
          recent_reviews_scope: business?.recent_reviews_scope || 'current_page',
          
          // Kickstarters
          kickstarters_enabled: business?.kickstarters_enabled !== undefined ? business.kickstarters_enabled : true,
          selected_kickstarters: business?.selected_kickstarters || [],
          custom_kickstarters: business?.custom_kickstarters || [],
          kickstarters_background_design: business?.kickstarters_background_design || false,
        }}
        businessName={business?.name || businessName}
        accountId={selectedAccountId || authAccountId}
      />

    </div>
  );
}

function UniversalTooltip() {
  const [show, setShow] = useState(false);
  
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        tabIndex={0}
        aria-label="Show Universal Prompt Page info"
        className="text-slate-blue hover:text-indigo-600 focus:outline-none"
        onClick={() => setShow((v) => !v)}
        onBlur={() => setShow(false)}
        style={{ lineHeight: 1 }}
      >
        <Icon name="FaInfoCircle" className="inline-block w-5 h-5 align-middle cursor-pointer" size={20} />
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-80 p-3 bg-white border border-gray-200 rounded shadow text-sm text-gray-700">
          Your Universal Prompt Page is a great choice for a QR code featured at your front desk or on tables at your restaurant or even a business card or lanyard. You could also feature it in a newsletter or an auto-reply (For best results, we highly recommend reaching out personally for reviews.) To avoid duplicate or similar reviews, Universal Prompt Pages don't allow pre-written reviews, but users can use Prompty AI to get an optimized review template.
        </div>
      )}
    </span>
  );
}

// Wrapper component with Suspense boundary
export default function PromptPages() {
  return (
    <Suspense fallback={<></>}>
      <PromptPagesContent />
    </Suspense>
  );
} 
