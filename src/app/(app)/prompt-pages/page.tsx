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
import type { PromptPage as PromptPageRecord } from "@/app/(app)/components/PromptPagesTable";
import PromptPagesKanban from "@/app/(app)/components/PromptPagesKanban";
import StatusLabelEditor from "@/app/(app)/components/StatusLabelEditor";
import PublicPromptPagesTable from "@/app/(app)/components/PublicPromptPagesTable";
import PromptTypeSelectModal from "@/app/(app)/components/PromptTypeSelectModal";
import { useStatusLabels } from "@/hooks/useStatusLabels";

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
import WelcomePopup from "@/app/(app)/components/WelcomePopup";
import HelpModal from "@/app/(app)/components/help/HelpModal";

import PromptPageEmbedButton from "@/app/(app)/components/PromptPageEmbedButton";
// Page-level loading uses global overlay
import { useGlobalLoader } from "@/app/(app)/components/GlobalLoaderProvider";
import BusinessProfileBanner from "@/app/(app)/components/BusinessProfileBanner";
import { useAuth } from "@/auth";
import { useBusinessData, useAuthUser, useAccountData, useAuthLoading } from "@/auth/hooks/granularAuthHooks";
import PromptPageSettingsModal from "@/app/(app)/components/PromptPageSettingsModal";
import { apiClient } from "@/utils/apiClient";

const StylePage = dynamic(() => import("../dashboard/style/StyleModalPage"), { ssr: false });

type PromptPagesTab = 'catch-all' | 'campaign' | 'locations';
type CampaignType = 'public' | 'individual' | 'universal' | 'location';

const TAB_TO_CAMPAIGN_TYPE: Record<PromptPagesTab, CampaignType> = {
  'catch-all': 'public',
  campaign: 'individual',
  locations: 'location',
};

function normalizeCampaignTypePreference(value?: string | null): CampaignType {
  switch (value) {
    case 'public':
    case 'individual':
    case 'universal':
    case 'location':
      return value;
    case 'catch-all':
      return 'public';
    case 'campaign':
      return 'individual';
    case 'locations':
      return 'location';
    default:
      return 'individual';
  }
}

const getStoredCampaignType = (): CampaignType => {
  if (typeof window === 'undefined') return 'individual';
  const raw = localStorage.getItem('campaign_type');
  const normalized = normalizeCampaignTypePreference(raw);
  if (raw !== normalized) {
    localStorage.setItem('campaign_type', normalized);
  }
  return normalized;
};

function PromptPagesContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedAccountId, accountLoading: primaryAccountLoading } = useAuth();
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
  const [promptPagesTab, setPromptPagesTab] = useState<PromptPagesTab>(
    (searchParams.get('tab') as 'catch-all' | 'campaign' | 'locations') || 'catch-all'
  );
  const [isNavigating, setIsNavigating] = useState(false); // Add navigation loading state
  const [showBusinessRequiredModal, setShowBusinessRequiredModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const updateLocalPromptPageStatus = (
    pageId: string,
    newStatus: PromptPageRecord["status"],
    lastContactAt?: string | null
  ) => {
    setIndividualPromptPages((pages) =>
      pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              status: newStatus,
              last_contact_at: lastContactAt ?? page.last_contact_at,
            }
          : page
      )
    );
  };

  const attachLastContactInfo = async (pages: any[] | null) => {
    if (!pages || pages.length === 0) {
      return pages || [];
    }
    const promptPageIds = pages.map((page) => page.id).filter(Boolean);
    if (!promptPageIds.length) {
      return pages;
    }
    const { data, error } = await supabase
      .from("communication_records")
      .select("prompt_page_id, sent_at")
      .in("prompt_page_id", promptPageIds)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching last contact timestamps:", error);
      return pages;
    }

    const lastContactMap: Record<string, string> = {};
    (data || []).forEach((record) => {
      if (!lastContactMap[record.prompt_page_id]) {
        lastContactMap[record.prompt_page_id] = record.sent_at;
      }
    });

    return pages.map((page) => ({
      ...page,
      last_contact_at: lastContactMap[page.id] || null,
    }));
  };

  // Kanban view state
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [selectedType, setSelectedType] = useState("");
  const [showLabelEditor, setShowLabelEditor] = useState(false);

  // Custom status labels
  const { statusLabels, updateStatusLabels, isLoading: labelsLoading } = useStatusLabels();
  const [helpArticleId, setHelpArticleId] = useState<string | undefined>(undefined);

  // Check if user has access to individual prompt pages (exclude grower plan)
  const hasIndividualAccess = (plan?: string): boolean => {
    if (!plan) return false;
    return plan !== 'grower';
  };

  // Handler for closing the welcome popup
  const handleWelcomeClose = () => {
    setShowWelcomePopup(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenPromptPagesWelcome', 'true');
    }
  };

  // Handler for link clicks in welcome popup
  const handleWelcomeLinkClick = (action: string, param?: string) => {
    if (action === 'help') {
      setShowWelcomePopup(false);
      setHelpArticleId(param);
      setShowHelpModal(true);
    } else if (action === 'settings') {
      setShowWelcomePopup(false);
      setShowSettingsModal(true);
    }
  };

  // Handle tab changes and update URL
  const handleTabChange = (newTab: PromptPagesTab) => {
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
    // Wait for auth loading to complete AND account loading to complete before considering auth "initialized"
    // This prevents premature redirects during page refresh hydration
    if (!authInitialized && !authLoading && !primaryAccountLoading) {
      setAuthInitialized(true);
    }
  }, [authLoading, primaryAccountLoading, authInitialized]);

  // Listen for reorder events to refetch data
  useEffect(() => {
    const handleReorder = () => {
      // Force a refetch by clearing business state
      setBusiness(null);
    };

    window.addEventListener('prompt-pages-reordered', handleReorder);
    return () => window.removeEventListener('prompt-pages-reordered', handleReorder);
  }, []);

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

        setUser(authUser);

        // Use selectedAccountId if available (from account switcher), otherwise fall back to authAccountId
        const accountId = selectedAccountId || authAccountId;

        // Wait for account ID to be available before proceeding
        if (!accountId) {
          // Still loading
          if (authLoading || primaryAccountLoading || !authInitialized) {
            return;
          }
          // If still no account after loading, show the modal (handled below by checking business profile)
          // For now, just return and let the loading state continue
          return;
        }

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
            const apiResult = await apiClient.get(`/businesses?account_id=${accountId}`);
            businessProfiles = apiResult.businesses || [];
            businessError = null;
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

          try {
            const ensureData = await apiClient.post('/prompt-pages/ensure-universal', {});
            universalPage = ensureData.page || null;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('ensure-universal failed', error);
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
              phone,
              business_name
            )
          `)
          .eq("account_id", accountId)
          .eq("is_universal", false)
          .eq("campaign_type", "individual")
          .is("business_location_id", null)  // Only get non-location pages
          .order("created_at", { ascending: false });
        const enrichedIndividualPages = await attachLastContactInfo(individualPages || []);
        setIndividualPromptPages(enrichedIndividualPages || []);
        
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

        // Check if this is the first time visiting the prompt-pages page
        if (typeof window !== 'undefined') {
          const hasSeenPromptPagesWelcome = localStorage.getItem('hasSeenPromptPagesWelcome');
          if (!hasSeenPromptPagesWelcome) {
            setShowWelcomePopup(true);
          }
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
  }, [authInitialized, authAccountId, authUser, selectedAccountId, authLoading, primaryAccountLoading]);

  const fetchLocations = async (accountId: string) => {
    try {
      const data = await apiClient.get('/business-locations');
      setLocations(data.locations || []);
      setLocationLimits({
        current: data.count || 0,
        max: data.limit || 0,
        canCreateMore: data.can_create_more || false,
      });
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleCreateLocation = async (locationData: Partial<BusinessLocation>) => {
    try {

      const data = await apiClient.post('/business-locations', locationData);

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
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  };

  const handleUpdateLocation = async (locationData: Partial<BusinessLocation>) => {
    if (!editingLocation?.id) return;

    try {
      const data = await apiClient.put(`/business-locations/${editingLocation.id}`, locationData);

      setLocations(prev => prev.map(loc =>
        loc.id === editingLocation.id ? data.location : loc
      ));
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
      await apiClient.delete(`/business-locations/${locationId}`);

      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      setLocationLimits(prev => ({ 
          ...prev, 
          current: prev.current - 1,
          canCreateMore: prev.current - 1 < prev.max
        }));

        // Remove associated prompt pages
        setLocationPromptPages(prev => prev.filter(page => page.business_location_id !== locationId));
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
          const isForUniversal = data.isUniversal === true;
          const isForIndividual = !isForLocation && !isForUniversal && (data.first_name || data.email || data.phone);

          // Check if we're on the right tab
          const currentTab = promptPagesTab;
          const expectedTab = isForLocation ? 'locations' : (isForIndividual ? 'campaign' : 'catch-all');

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
                const locationsData = await apiClient.get('/business-locations');
                const latestLocation = locationsData.locations?.[0];
                if (latestLocation?.prompt_page_slug) {
                  data.url = `${window.location.origin}/r/${latestLocation.prompt_page_slug}`;
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
      const updatedBusiness = await apiClient.put(`/businesses/${authAccountId}`, settingsData);
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
    const campaignType = getStoredCampaignType();
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

  // In-page navigations rely on router/network interception to reduce flicker

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
      {/* Navigation loading uses global overlay (controlled via effect) */}
      
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


      {/* Page Title and Settings Icons */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              Prompt Pages
            </h1>

            {/* Settings Icons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (universalPromptPage?.slug) {
                    router.push(`/r/${universalPromptPage.slug}?openStyleModal=true`);
                  } else {
                    setShowStyleModal(true);
                  }
                }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/20 transition"
                title="Style settings"
              >
                <Icon name="FaPalette" className="w-5 h-5 text-white" size={20} />
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/20 transition"
                title="Prompt page settings"
              >
                <Icon name="FaCog" className="w-5 h-5 text-white" size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

       {/* Campaign Type Selector - Tab navigation */}
       <div className="flex justify-center w-full mt-0 mb-0 z-20 px-4">
        <div className="flex bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-1 shadow-lg w-full max-w-xl">
          <button
            type="button"
            onClick={() => handleTabChange('catch-all')}
            className={`flex-1 px-4 sm:px-8 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center justify-center gap-2
              ${promptPagesTab === 'catch-all'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white'}
            `}
          >
            <Icon name="FaUsers" className="w-5 h-5" size={20} />
            <span className="whitespace-nowrap">Catch-all</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('campaign')}
            className={`flex-1 px-4 sm:px-8 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center justify-center gap-2
              ${promptPagesTab === 'campaign'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white'}
            `}
          >
            <Icon name="FaUserCircle" className="w-5 h-5" size={20} />
            <span className="whitespace-nowrap">Campaign</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('locations')}
            className={`flex-1 px-4 sm:px-8 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center justify-center gap-2
              ${promptPagesTab === 'locations'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white'}
            `}
          >
            <Icon name="FaMapMarker" className="w-5 h-5" size={20} />
            <span className="whitespace-nowrap">Locations</span>
          </button>
        </div>
      </div>

      {/* Public (Catch all) Tab Content */}
      {promptPagesTab === 'catch-all' && (
        <div className="mt-12 mb-8 px-4 sm:px-6 lg:px-8">
          {/* Business Profile Banner */}
          <div className="max-w-7xl mx-auto mb-6">
            <BusinessProfileBanner
              userId={user?.id}
              hasBusiness={hasBusiness}
            />
          </div>

          {/* Subheading and Description */}
          <div className="max-w-7xl mx-auto mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-white">Catch-all campaigns</h2>
            </div>
            <p className="text-white/80 text-sm max-w-2xl">
              Use a single Prompt Page to capture many reviews from many people.
            </p>
          </div>

          {/* Universal Prompt Page Card */}
          {universalPromptPage && (
            <div className="max-w-7xl mx-auto mb-12">
              <div className="max-w-[800px] rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow-lg relative">
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
                        className="text-slate-blue underline hover:text-slate-blue/80"
                      >
                        View
                      </Link>
                      {universalPromptPage?.slug && (
                        <Link
                          href={"/dashboard/edit-prompt-page/universal"}
                          className="text-slate-blue underline hover:text-slate-blue/80"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-gray-700 mb-4 text-sm">
                    Your Universal Prompt Page is designed to be used in a wide variety of formats and settings.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => handleCopyLink()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 text-sm font-medium shadow border border-purple-300 h-9 align-middle whitespace-nowrap"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 text-sm font-medium shadow border border-amber-300 h-9 align-middle whitespace-nowrap"
                      >
                        <Icon name="MdDownload" className="w-5 h-5" size={20} />
                        QR code
                      </button>

                        {/* Prompt Page Embed Button - show for all prompt pages */}
                        {universalPromptPage?.slug && (
                          <PromptPageEmbedButton
                            slug={universalPromptPage.slug}
                            emojiSentimentEnabled={universalPromptPage?.emoji_sentiment_enabled}
                            isUniversal={true}
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const businessName = business?.name || "your business";
                            const reviewUrl = `${window.location.origin}/r/${universalPromptPage.slug}`;
                            const message = `Hi! I'd love to get your feedback on ${businessName}. Please leave a review here: ${reviewUrl}`;
                            window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm font-medium shadow border border-green-300 h-9 align-middle whitespace-nowrap"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm font-medium shadow border border-blue-300 h-9 align-middle whitespace-nowrap"
                      >
                        <Icon name="FaEnvelope" className="w-5 h-5" size={20} />
                        Send email
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
            </div>
          )}

          {/* Public Prompt Pages Table */}
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              {/* + Prompt Page Button */}
              <button
                type="button"
                onClick={() => {
                  const normalized = TAB_TO_CAMPAIGN_TYPE[promptPagesTab] || 'individual';
                  localStorage.setItem('campaign_type', normalized);
                  setShowTypeModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded hover:bg-slate-blue/90 font-medium transition whitespace-nowrap shadow-lg"
              >
                <Icon name="FaPlus" className="w-4 h-4" size={16} />
                Prompt Page
              </button>

              {/* Type Filter - Glassmorphic */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="pl-4 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22white%22%3E%3cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3c%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
              >
                <option value="" className="bg-slate-blue">All types</option>
                <option value="service" className="bg-slate-blue">Service</option>
                <option value="photo" className="bg-slate-blue">Photo</option>
                <option value="video" className="bg-slate-blue">Video</option>
                <option value="event" className="bg-slate-blue">Event</option>
                <option value="product" className="bg-slate-blue">Product</option>
                <option value="employee" className="bg-slate-blue">Employee</option>
              </select>
            </div>
            <div className="overflow-x-auto shadow border border-white/30 rounded-lg backdrop-blur-sm bg-white/5">
              <PublicPromptPagesTable
                promptPages={promptPages}
                business={business}
                account={business}
                universalUrl={universalUrl}
                selectedType={selectedType}
                onDeletePages={async (pageIds) => {
                  await supabase.from("prompt_pages").delete().in("id", pageIds);
                  setPromptPages((pages) => pages.filter((page) => !pageIds.includes(page.id)));
                }}
                onCreatePromptPage={() => setShowTypeModal(true)}
              />
            </div>
          </div>

          {/* QR Code Download Modal */}
          <QRCodeModal
            isOpen={qrModal?.open || false}
            onClose={() => setQrModal(null)}
            url={qrModal?.url || ""}
            clientName={qrModal?.clientName || ""}
            logoUrl={qrModal?.logoUrl}
            showNfcText={qrModal?.showNfcText}
          />
        </div>
      )}

            {/* Individual Outreach Content - Full Width */}
            {promptPagesTab === 'campaign' && (
              <div className="mt-12 mb-8 px-4 sm:px-6 lg:px-8">
                {/* Subheading and Description */}
                <div className="max-w-7xl mx-auto mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-white">Campaign pages</h2>
                  </div>
                  <p className="text-white/80 text-sm max-w-2xl">
                    Create personalized Prompt Pages for review outreach campaigns.
                  </p>
                </div>

                {(!account || !hasIndividualAccess(account.plan)) ? (
                  <div className="py-12">
                    {/* Preview Kanban Board with Fake Data */}
                    <div className="mb-8 relative">
                      {/* Overlay with upgrade message */}
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto shadow-xl">
                          <Icon name="FaColumns" className="w-16 h-16 mx-auto mb-4 text-slate-blue" size={64} />
                          <h3 className="font-semibold text-blue-900 mb-2">Upgrade to Builder</h3>
                          <p className="text-sm text-blue-700 mb-4">
                            Campaign pages let you import contacts, run personalized review outreach campaigns, and track engagement with alerts and reminders. Upgrade to Builder or higher to unlock this feature.
                          </p>
                          <button
                            type="button"
                            onClick={() => router.push('/dashboard/plan')}
                            className="bg-slate-blue text-white px-6 py-2 rounded hover:bg-slate-blue/90 font-medium transition"
                          >
                            Upgrade now
                          </button>
                        </div>
                      </div>

                      {/* Preview Kanban */}
                      <PromptPagesKanban
                        promptPages={[
                          {
                            id: 'preview-1',
                            slug: 'preview-1',
                            account_id: account?.id || '',
                            status: 'draft',
                            review_type: 'service',
                            is_universal: false,
                            campaign_type: 'individual',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            contacts: { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@example.com' }
                          },
                          {
                            id: 'preview-2',
                            slug: 'preview-2',
                            account_id: account?.id || '',
                            status: 'draft',
                            review_type: 'service',
                            is_universal: false,
                            campaign_type: 'individual',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            contacts: { first_name: 'Mike', last_name: 'Chen', email: 'mike@example.com' }
                          },
                          {
                            id: 'preview-3',
                            slug: 'preview-3',
                            account_id: account?.id || '',
                            status: 'in_queue',
                            review_type: 'service',
                            is_universal: false,
                            campaign_type: 'individual',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            contacts: { first_name: 'Emily', last_name: 'Rodriguez', email: 'emily@example.com' }
                          },
                          {
                            id: 'preview-4',
                            slug: 'preview-4',
                            account_id: account?.id || '',
                            status: 'sent',
                            review_type: 'service',
                            is_universal: false,
                            campaign_type: 'individual',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            contacts: { first_name: 'David', last_name: 'Kim', email: 'david@example.com' }
                          },
                          {
                            id: 'preview-5',
                            slug: 'preview-5',
                            account_id: account?.id || '',
                            status: 'sent',
                            review_type: 'service',
                            is_universal: false,
                            campaign_type: 'individual',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            contacts: { first_name: 'Jessica', last_name: 'Taylor', email: 'jessica@example.com' }
                          },
                          {
                            id: 'preview-6',
                            slug: 'preview-6',
                            account_id: account?.id || '',
                            status: 'follow_up',
                            review_type: 'service',
                            is_universal: false,
                            campaign_type: 'individual',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            contacts: { first_name: 'Robert', last_name: 'Anderson', email: 'robert@example.com' }
                          },
                          {
                            id: 'preview-7',
                            slug: 'preview-7',
                            account_id: account?.id || '',
                            status: 'complete',
                            review_type: 'service',
                            is_universal: false,
                            campaign_type: 'individual',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            contacts: { first_name: 'Amanda', last_name: 'White', email: 'amanda@example.com' }
                          },
                          {
                            id: 'preview-8',
                            slug: 'preview-8',
                            account_id: account?.id || '',
                            status: 'complete',
                            review_type: 'service',
                            is_universal: false,
                            campaign_type: 'individual',
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            contacts: { first_name: 'James', last_name: 'Martinez', email: 'james@example.com' }
                          },
                        ] as any}
                        business={business}
                        account={account}
                        statusLabels={statusLabels}
                        selectedType={selectedType}
                        onStatusUpdate={() => {}}
                        onEditLabel={() => {}}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Controls Bar */}
                    <div className="mb-6 max-w-7xl mx-auto flex items-center justify-between gap-4">
                      {/* + Prompt Page Button */}
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('campaign_type', 'individual');
                          setShowTypeModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded hover:bg-slate-blue/90 font-medium transition whitespace-nowrap shadow-lg"
                      >
                        <Icon name="FaPlus" className="w-4 h-4" size={16} />
                        Prompt page
                      </button>

                      {/* View Toggle and Type Filter */}
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => setViewMode("table")}
                          className={`flex items-center gap-2 px-6 py-1.5 rounded-full font-medium transition-all ${
                            viewMode === "table"
                              ? "bg-slate-blue text-white"
                              : "text-white hover:bg-white/10"
                          }`}
                        >
                          <Icon name="FaBars" size={18} />
                          Table
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("kanban")}
                          className={`flex items-center gap-2 px-6 py-1.5 rounded-full font-medium transition-all ${
                            viewMode === "kanban"
                              ? "bg-slate-blue text-white"
                              : "text-white hover:bg-white/10"
                          }`}
                        >
                          <Icon name="FaColumns" size={18} />
                          Kanban
                        </button>
                      </div>

                      {/* Type Filter - Always visible */}
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="pl-4 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22white%22%3E%3cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3c%2Fsvg%3E')] bg-[length:1.5em_1.5em] bg-[right_0.5rem_center] bg-no-repeat"
                      >
                        <option value="" className="bg-slate-blue">All types</option>
                        <option value="service" className="bg-slate-blue">Service</option>
                        <option value="photo" className="bg-slate-blue">Photo</option>
                        <option value="video" className="bg-slate-blue">Video</option>
                        <option value="event" className="bg-slate-blue">Event</option>
                        <option value="product" className="bg-slate-blue">Product</option>
                        <option value="employee" className="bg-slate-blue">Employee</option>
                      </select>
                      </div>
                    </div>

                    {/* Table or Kanban View */}
                    {viewMode === "table" ? (
                      <div className="max-w-7xl mx-auto">
                        <PromptPagesTable
                        promptPages={individualPromptPages}
                        business={business}
                        account={account}
                        universalUrl={universalUrl}
                        statusLabels={statusLabels}
                        onStatusUpdate={async (pageId: string, newStatus: PromptPageRecord["status"]) => {
                          await supabase.from("prompt_pages").update({ status: newStatus }).eq("id", pageId);
                          updateLocalPromptPageStatus(pageId, newStatus);
                        }}
                        onDeletePages={async (pageIds: string[]) => {
                          await supabase.from("prompt_pages").delete().in("id", pageIds);
                          setIndividualPromptPages((pages) => pages.filter((page) => !pageIds.includes(page.id)));
                        }}
                        onCreatePromptPage={() => setShowTypeModal(true)}
                        onLocalStatusUpdate={updateLocalPromptPageStatus}
                      />
                      </div>
                    ) : (
                      <div className="max-w-7xl mx-auto">
                        <PromptPagesKanban
                          promptPages={individualPromptPages}
                          business={business}
                          account={account}
                          statusLabels={statusLabels}
                          selectedType={selectedType}
                          onStatusUpdate={async (pageId: string, newStatus: PromptPageRecord["status"]) => {
                            await supabase.from("prompt_pages").update({ status: newStatus }).eq("id", pageId);
                            updateLocalPromptPageStatus(pageId, newStatus);
                          }}
                          onEditLabel={(status) => {
                            setShowLabelEditor(true);
                          }}
                          onLocalStatusUpdate={updateLocalPromptPageStatus}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Locations Content */}
            {promptPagesTab === 'locations' && (
              <div className="mt-12 mb-8 px-4 sm:px-6 lg:px-8">
                {/* Subheading and Description */}
                <div className="max-w-7xl mx-auto mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-white">Location campaigns</h2>
                  </div>
                  <p className="text-white/80 text-sm max-w-2xl">
                    Create location-specific prompt pages for each of your business locations.
                  </p>
                </div>

                {(!account || !hasLocationAccess(account.plan)) ? (
                  <div className="max-w-7xl mx-auto text-center py-12">
                    <div className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg p-6 max-w-md mx-auto">
                      <Icon name="FaMapMarker" className="w-16 h-16 mx-auto mb-4 text-white" size={64} />
                      <h3 className="font-semibold text-white mb-2">Upgrade to Maven</h3>
                      <p className="text-sm text-white/80 mb-4">
                        Location prompt pages are available with the Maven tier. Upgrade your plan to unlock this feature.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard/plan')}
                        className="bg-teal-500 text-white px-6 py-2 rounded hover:bg-teal-600 font-medium transition"
                      >
                        Upgrade now
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-7xl mx-auto">
                    {/* Location Limits Info */}
                    {account && (
                      <div className="mb-6 p-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white">Location limits</h3>
                            <p className="text-sm text-white/80">
                              {locationLimits.current} of {locationLimits.max} locations used
                            </p>
                          </div>
                          {!locationLimits.canCreateMore && (
                            <div className="text-sm text-red-400 font-medium">
                              Location limit reached
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Locations List Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">Your locations</h2>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        disabled={account?.plan === 'grower' || account?.plan === 'builder' || !locationLimits.canCreateMore}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded font-medium transition whitespace-nowrap shadow-lg ${
                          account?.plan === 'grower' || account?.plan === 'builder' || !locationLimits.canCreateMore
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-slate-blue text-white hover:bg-slate-blue/90'
                        }`}
                      >
                        <Icon name="FaPlus" className="w-4 h-4" size={16} />
                        Location
                      </button>
                    </div>

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
                        <div className="text-center py-8 text-white/80">
                          <Icon name="FaMapMarker" className="w-12 h-12 mx-auto mb-4 text-white" size={48} />
                          <p>No locations added yet.</p>
                          <p className="text-sm">Add your first location to get started.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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
            <div className="flex justify-end p-4">
              <button
                onClick={() => {
                  setShowPostSaveModal(false);
                  setShowStars(false);
                  setPostSaveData(null);
                }}
                className="text-white/80 hover:text-white focus:outline-none"
                aria-label="Close modal"
              >
                <Icon name="FaTimes" size={18} />
              </button>
            </div>

            <div className="px-6 pb-6">
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

                {/* For Campaign prompt pages with contact info, show CommunicationButtons */}
                {(postSaveData.first_name || postSaveData.email || postSaveData.phone) && !postSaveData.isLocationCreation && (
                  <div className="space-y-2 p-3 bg-teal-500/30 backdrop-blur-sm rounded-lg border border-teal-300/30">
                    <div className="flex items-center justify-between">
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
                          account_id: account?.id,
                          client_name: postSaveData.first_name || ''
                        }}
                        singleButton={true}
                        buttonText="Send"
                        className="px-3 py-1.5 text-sm"
                      />
                    </div>
                    <p className="text-xs text-white/80">
                      CRM tracking, alerts, and reminders are enabled for Campaign pages.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-amber-500/30 backdrop-blur-sm rounded-lg border border-amber-300/30">
                  <span className="text-sm font-medium text-white">View prompt page</span>
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
                Business profile required
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
                Go to your business
              </Link>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 px-6 py-2 transition-colors"
              >
                Back to dashboard
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
        businessInfo={business}
      />

      {/* Welcome Popup for first-time visitors */}
      <WelcomePopup
        isOpen={showWelcomePopup}
        onClose={handleWelcomeClose}
        onLinkClick={handleWelcomeLinkClick}
        title="Prompt Pages and YOU!"
        message={`Prompt Pages are brand-able and customizable review collection pages. You can enable a variety of features to make it easy for your customers to provide valuable reviews, testimonials, and feedback.

When a customer writes a review and clicks "Copy & continue" a few important things happen:

1. The review is saved to your Prompt Reviews account.
2. The review is copied to the users clipboard
3. The user is redirected to the review site.
4. Your customer can then paste and submit their review.

**Prompt Page Types**

There are different kinds of Prompt Pages for different use cases. If this is your first Prompt Reviews rodeo, we recommend [checking out the full Prompt Page tutorial|help:prompt-overview].

**[Prompt Page Settings|settings]**

These are global settings for all of your Prompt Pages. If you are using AI, you will want to fill out AI Dos and Don'ts as thoroughly as possible.

Also, the help bubble in the bottom-right of your screen is always there for you when you get stuck!`}
        imageUrl="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-teaching-about-your-business.png"
        imageAlt="Prompty teaching about Prompt Pages"
        buttonText="Let's get some reviews!"
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => {
          setShowHelpModal(false);
          setHelpArticleId(undefined);
        }}
        initialArticleId={helpArticleId}
      />

      {/* Status Label Editor Modal */}
      <StatusLabelEditor
        isOpen={showLabelEditor}
        onClose={() => setShowLabelEditor(false)}
        currentLabels={statusLabels}
        onSave={async (newLabels) => {
          const success = await updateStatusLabels(newLabels);
          return success;
        }}
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
