"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRef } from "react";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageCard from "@/app/components/PageCard";

import AppLoader from "@/app/components/AppLoader";
import QRCodeGenerator, { QR_FRAME_SIZES } from "../dashboard/components/QRCodeGenerator";
import dynamic from "next/dynamic";
import PromptPagesTable from "@/app/components/PromptPagesTable";
import PublicPromptPagesTable from "@/app/components/PublicPromptPagesTable";
import PromptTypeSelectModal from "@/app/components/PromptTypeSelectModal";

import { useRouter, useSearchParams } from "next/navigation";
import QRCodeModal from "../components/QRCodeModal";
import StarfallCelebration from "@/app/components/StarfallCelebration";
import { promptTypesWithDarkIcons as promptTypes } from "@/config/promptTypes";
import { getAccountIdForUser } from "@/utils/accountUtils";
import BusinessLocationModal from "@/app/components/BusinessLocationModal";
import LocationCard from "@/app/components/LocationCard";
import { BusinessLocation, LocationWithPromptPage } from "@/types/business";
import { hasLocationAccess, formatLocationAddress, getLocationDisplayName } from "@/utils/locationUtils";

import EmojiEmbedButton from "@/app/components/EmojiEmbedButton";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import BusinessProfileBanner from "@/app/components/BusinessProfileBanner";
import { useAuth } from "@/contexts/AuthContext";

const StylePage = dynamic(() => import("../dashboard/style/StyleModalPage"), { ssr: false });

function PromptPagesContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasBusiness, user: authUser, accountId: authAccountId, isLoading: authLoading } = useAuth();

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

  // Check if user has access to individual prompt pages (exclude grower plan)
  const hasIndividualAccess = (plan?: string): boolean => {
    if (!plan) return false;
    return plan !== 'grower';
  };

  // Handle tab changes and update URL
  const handleTabChange = (newTab: 'public' | 'individual' | 'locations') => {
    setPromptPagesTab(newTab);
    const params = new URLSearchParams(searchParams);
    params.set('tab', newTab);
    router.push(`/prompt-pages?${params.toString()}`, { scroll: false });
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

  // Update tab state when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as 'public' | 'individual' | 'locations';
    if (tabFromUrl && ['public', 'individual', 'locations'].includes(tabFromUrl)) {
      setPromptPagesTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      // Don't fetch if auth is still loading
      if (authLoading) return;
      
      setLoading(true);
      setError(null);
      try {
        // Use auth context user and accountId instead of direct Supabase call
        if (!authUser) throw new Error("Not signed in");
        if (!authAccountId) throw new Error("No account found for user");
        
        setUser(authUser);
        const accountId = authAccountId;

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
          console.log('🔧 DEV MODE: Using API endpoint to fetch businesses for prompt pages');
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
        
        console.log('🔍 DEBUG: Prompt pages business query result:', { businessProfiles, businessError });
        const businessProfile = businessProfiles?.[0];
        console.log('🔍 DEBUG: Selected business for prompt pages:', businessProfile);
        
        // Check if business profile exists and has a valid name
        if (!businessProfile || 
            !businessProfile.name || 
            businessProfile.name.trim() === '') {
          setShowBusinessRequiredModal(true);
          setLoading(false);
          return;
        }
        
        setBusiness(businessProfile);
        
        // DEVELOPMENT MODE BYPASS - Use mock universal prompt page
        let universalPage = null;
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true' && accountId === '12345678-1234-5678-9abc-123456789012') {
          console.log('🔧 DEV MODE: Using mock universal prompt page');
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
          const { data: universalPages } = await supabase
            .from("prompt_pages")
            .select("*")
            .eq("account_id", accountId)
            .eq("is_universal", true)
            .order("created_at", { ascending: false })
            .limit(1);
          
          universalPage = universalPages?.[0];
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
        
        // Fetch individual prompt pages (campaign_type = 'individual')
        const { data: individualPages } = await supabase
          .from("prompt_pages")
          .select("*")
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
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase, authLoading, authUser, authAccountId]);

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
      console.log('🔍 Frontend: Sending location data:', JSON.stringify(locationData, null, 2));
      
      const response = await fetch('/api/business-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(locationData),
      });
      
      console.log('🔍 Frontend: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Frontend: Success response:', data);
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
        console.log('🔍 Frontend: Error response:', error);
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
    const handlePostSaveModal = async () => {
      const flag = localStorage.getItem("showPostSaveModal");
      if (flag) {
        try {
          const data = JSON.parse(flag);
          
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
          
          console.log('🔍 Setting post save data:', data);
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
  }, []); // Remove locationPromptPages dependency to prevent re-running

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



  function handlePromptTypeSelect(typeKey: string) {
    console.log('[DEBUG] handlePromptTypeSelect called with:', typeKey);
    console.log('[DEBUG] Current localStorage campaign_type:', localStorage.getItem('campaign_type'));
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-75">
          <FiveStarSpinner size={24} />
          <div className="mt-4 text-lg text-white font-semibold">Loading prompt page…</div>
        </div>
      )}
      
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
        <div className="flex bg-white/10 backdrop-blur-sm border-2 border-white rounded-full p-1 shadow-lg w-full max-w-md">
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
                      console.log('🎯 PROMPT PAGES - promptPagesTab:', promptPagesTab);
                      console.log('🎯 PROMPT PAGES - Setting localStorage campaign_type to:', promptPagesTab);
                      localStorage.setItem('campaign_type', promptPagesTab);
                      console.log('🎯 PROMPT PAGES - localStorage after setting:', localStorage.getItem('campaign_type'));
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
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
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
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
          <StylePage onClose={() => setShowStyleModal(false)} />
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-50">
            {/* Standardized red X close button */}
            <button
              onClick={() => {
                setShowPostSaveModal(false);
                setShowStars(false);
                setPostSaveData(null);
              }}
              className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
              style={{ width: 48, height: 48 }}
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {postSaveData.isLocationCreation ? 'Location created! 🎉' : 'Prompt page published! 🎉'}
                </h3>
                <p className="text-sm text-gray-600">
                  {postSaveData.isLocationCreation 
                    ? `Your location "${postSaveData.locationName}" is now live with its own prompt page ready to collect reviews.`
                    : 'Your prompt page is now live and ready to collect reviews.'
                  }
                </p>
              </div>

              {/* Sharing Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Share Link</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(postSaveData.url);
                    }}
                    className="text-slate-blue hover:text-slate-blue/80 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>

                {/* SMS link */}
                <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Send SMS</span>
                  <a
                    href={`sms:${postSaveData.phone || ''}?body=Hi ${postSaveData.first_name || 'there'}, I'd love to get your feedback! Please leave a review here: ${postSaveData.url}`}
                    className="text-slate-blue hover:text-slate-blue/80 text-sm font-medium"
                  >
                    Send
                  </a>
                </div>

                {/* Email link */}
                <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Send Email</span>
                  <a
                    href={`mailto:${postSaveData.email || ''}?subject=Please leave a review&body=Hi ${postSaveData.first_name || 'there'},%0D%0A%0D%0AI'd love to get your feedback! Please leave a review here: ${postSaveData.url}%0D%0A%0D%0AThank you!`}
                    className="text-slate-blue hover:text-slate-blue/80 text-sm font-medium"
                  >
                    Send
                  </a>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-100 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">View Prompt Page</span>
                  <a
                    href={postSaveData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-blue hover:text-slate-blue/80 text-sm font-medium"
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
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
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
    <Suspense fallback={<FiveStarSpinner />}>
      <PromptPagesContent />
    </Suspense>
  );
} 