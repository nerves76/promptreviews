"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRef } from "react";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageCard from "@/app/(app)/components/PageCard";
import UniversalPromptPageForm from "../../dashboard/edit-prompt-page/universal/UniversalPromptPageForm";
import AppLoader from "@/app/(app)/components/AppLoader";
import QRCodeGenerator, { QR_FRAME_SIZES } from "../../dashboard/components/QRCodeGenerator";
import dynamic from "next/dynamic";
import PromptPagesTable from "@/app/(app)/components/PromptPagesTable";
import PromptTypeSelectModal from "@/app/(app)/components/PromptTypeSelectModal";

import { useRouter } from "next/navigation";
import QRCodeModal from "../../components/QRCodeModal";
import StarfallCelebration from "@/app/(app)/components/StarfallCelebration";
import { promptTypesWithDarkIcons as promptTypes } from "@/config/promptTypes";
import { useAuthUser, useAccountData, useAuthLoading } from "@/auth/hooks/granularAuthHooks";
import { useAccountSelection } from "@/utils/accountSelectionHooks";
import BusinessLocationModal from "@/app/(app)/components/BusinessLocationModal";
import { BusinessLocation } from "@/types/business";
import { hasLocationAccess, formatLocationAddress, getLocationDisplayName } from "@/utils/locationUtils";

import EmojiEmbedButton from "@/app/(app)/components/EmojiEmbedButton";
import CommunicationButtons from "@/app/(app)/components/communication/CommunicationButtons";

const StylePage = dynamic(() => import("../../dashboard/style/StyleModalPage"), { ssr: false });

export default function IndividualOutreach() {
  const supabase = createClient();
  const { user: authUser } = useAuthUser();
  const { accountId: authAccountId } = useAccountData();
  const { isLoading: authLoading } = useAuthLoading();
  const { selectedAccountId } = useAccountSelection();

  const [loading, setLoading] = useState(true);
  const [promptPages, setPromptPages] = useState<any[]>([]);
  const [universalPromptPage, setUniversalPromptPage] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
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
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [locationPromptPages, setLocationPromptPages] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<BusinessLocation | null>(null);
  const [locationLimits, setLocationLimits] = useState({ current: 0, max: 0, canCreateMore: false });

  const router = useRouter();

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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Use auth context data
        if (!authUser) {
          throw new Error("Not signed in");
        }
        
        // Use selectedAccountId if available (from account switcher), otherwise fall back to authAccountId
        const fetchedAccountId = selectedAccountId || authAccountId;
        setAccountId(fetchedAccountId);
        
        if (!fetchedAccountId) {
          setError("Please complete your account setup to access prompt pages.");
          setLoading(false);
          return;
        }

        // Fetch account data for plan info
        const { data: accountData } = await supabase
          .from("accounts")
          .select("plan, location_count, max_locations")
          .eq("id", fetchedAccountId)
          .single();
        setAccount(accountData);

        const { data: businessProfiles } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", fetchedAccountId)
          .order("created_at", { ascending: false })
          .limit(1);
        
        const businessProfile = businessProfiles?.[0];
        
        // Check if business profile exists and has a valid name
        if (!businessProfile || 
            !businessProfile.name || 
            businessProfile.name.trim() === '') {
          router.push('/dashboard?message=complete-business-first');
          return;
        }
        
        setBusiness(businessProfile);
        
        // DEVELOPMENT MODE BYPASS - Use mock universal prompt page
        let universalPage = null;
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && localStorage.getItem('dev_auth_bypass') === 'true' && fetchedAccountId === '12345678-1234-5678-9abc-123456789012') {
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
            .eq("account_id", fetchedAccountId)
            .eq("is_universal", true)
            .order("created_at", { ascending: false })
            .limit(1);
          
          universalPage = universalPages?.[0];
        }
        setUniversalPromptPage(universalPage);
        if (universalPage?.slug) {
          setUniversalUrl(`${window.location.origin}/r/${universalPage.slug}`);
        }
        
        const { data: pages } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", accountId)
          .eq("is_universal", false)
          .is("business_location_id", null)  // Only get non-location pages
          .order("created_at", { ascending: false });
        setPromptPages(pages || []);
        
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
          await fetchLocations(fetchedAccountId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    // Only fetch when auth is ready and we have an account ID
    if (!authLoading && (selectedAccountId || authAccountId)) {
      fetchData();
    }
  }, [authLoading, selectedAccountId, authAccountId, supabase]);

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
    const flag = localStorage.getItem("showPostSaveModal");
    if (flag) {
      try {
        const data = JSON.parse(flag);
        
        // If this is a location creation, find the latest location prompt page
        if (data.isLocationCreation) {
          const latestLocationPage = locationPromptPages
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          
          if (latestLocationPage) {
            data.url = `${window.location.origin}/r/${latestLocationPage.slug}`;
          }
        }
        
        setPostSaveData(data);
        setShowPostSaveModal(true);
        // Trigger starfall celebration automatically when modal appears
        setShowStars(true);
        // Also trigger global starfall celebration
        setShowStarfallCelebration(true);
        localStorage.removeItem("showPostSaveModal");
      } catch {}
    }
  }, [locationPromptPages]);

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
    setShowTypeModal(false);
    router.push(`/create-prompt-page?type=${typeKey}`);
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
    <>
      <PromptTypeSelectModal
        open={showTypeModal}
        onClose={() => setShowTypeModal(false)}
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
      
      <div className="min-h-screen flex flex-col items-start px-4 sm:px-0">
        <PageCard icon={<span className="text-3xl font-bold align-middle text-slate-blue" style={{ fontFamily: 'Inter, sans-serif' }}>[P]</span>}>
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between mt-2 mb-4">
              <div className="flex flex-col mt-0 md:mt-[3px]">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-slate-blue mt-0">Individual outreach</h1>
                  <Icon name="FaUserCircle" className="w-8 h-8 text-slate-blue" size={32} />
                </div>
                <p className="text-gray-600 text-base max-w-md mt-0 mb-10">Create personalized prompt pages for specific customers and clients.</p>
              </div>
              <div className="flex items-start" style={{ alignSelf: "flex-start" }}>
                <button
                  type="button"
                  className="bg-blue-100 text-slate-blue rounded font-semibold px-4 py-2 hover:bg-blue-200 transition whitespace-nowrap flex items-center gap-2"
                  onClick={() => setShowStyleModal(true)}
                >
                  <Icon name="FaPalette" className="w-5 h-5" size={20} />
                  Style
                </button>
              </div>
            </div>
            
            {/* Custom Prompt Pages Section */}
            <div className="my-12">
              <div className="flex items-center justify-between mb-[75px]">
                <div>
                  <h2 className="text-2xl font-bold text-slate-blue mb-2 flex items-center gap-3">
                    <Icon name="FaStar" className="w-8 h-8 text-slate-blue" size={32} />
                    Individual prompt pages
                  </h2>
                  <p className="text-sm text-gray-600">
                    These Prompt Pages are great for personalized outreach. For best results, send as a text.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Validate business profile before allowing prompt page creation
                    if (!business) {
                      alert('Please create a business profile first before creating prompt pages. You can do this from the "Your Business" section in the dashboard.');
                      router.push('/dashboard/business-profile');
                      return;
                    }
                    
                    if (!business.name || business.name.trim() === '') {
                      alert('Please complete your business profile by adding your business name. This is required for creating prompt pages.');
                      router.push('/dashboard/business-profile');
                      return;
                    }
                    
                    setShowTypeModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded hover:bg-slate-blue/90 font-medium transition"
                >
                  + Prompt Page
                </button>
              </div>
              
              <div className="overflow-x-auto shadow border-l border-r border-b border-gray-200 sm:rounded-b-lg">
                <PromptPagesTable
                  promptPages={promptPages}
                  business={business}
                  account={business}
                  universalUrl={universalUrl}
                  onStatusUpdate={async (pageId, newStatus) => {
                    await supabase.from("prompt_pages").update({ status: newStatus }).eq("id", pageId);
                    setPromptPages((pages) =>
                      pages.map((page) =>
                        page.id === pageId ? { ...page, status: newStatus } : page
                      )
                    );
                  }}
                  onDeletePages={async (pageIds) => {
                    await supabase.from("prompt_pages").delete().in("id", pageIds);
                    setPromptPages((pages) => pages.filter((page) => !pageIds.includes(page.id)));
                  }}
                  onCreatePromptPage={() => {
                    // Validate business profile before allowing prompt page creation
                    if (!business) {
                      alert('Please create a business profile first before creating prompt pages. You can do this from the "Your Business" section in the dashboard.');
                      router.push('/dashboard/business-profile');
                      return;
                    }
                    
                    if (!business.name || business.name.trim() === '') {
                      alert('Please complete your business profile by adding your business name. This is required for creating prompt pages.');
                      router.push('/dashboard/business-profile');
                      return;
                    }
                    
                    setShowTypeModal(true);
                  }}
                />
              </div>
            </div>
          </div>
        </PageCard>
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
      
      {/* Style Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <StylePage 
            onClose={() => setShowStyleModal(false)} 
            accountId={accountId}
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
                    src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/small-prompty-success.png"
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

                {/* Communication Buttons with Tracking */}
                <div className="p-3 bg-teal-500/30 backdrop-blur-sm rounded-lg border border-teal-300/30">
                  <div className="text-sm font-medium text-white mb-3">Send Review Request</div>
                  <CommunicationButtons
                    contact={{
                      id: postSaveData.contact_id || postSaveData.id || `temp-${Date.now()}`,
                      first_name: postSaveData.first_name || '',
                      last_name: postSaveData.last_name || '',
                      email: postSaveData.email,
                      phone: postSaveData.phone
                    }}
                    promptPage={{
                      id: postSaveData.prompt_page_id || postSaveData.id || `temp-${Date.now()}`,
                      slug: postSaveData.url ? postSaveData.url.split('/r/')[1] || '' : '',
                      status: postSaveData.status || 'draft',
                      client_name: business?.name || 'Your Business',
                      location: postSaveData.location || ''
                    }}
                    onCommunicationSent={() => {
                    }}
                    onStatusUpdated={(newStatus) => {
                      // Update postSaveData if needed
                      setPostSaveData((prev: any) => ({ ...prev, status: newStatus }));
                    }}
                    className="flex gap-2 justify-center"
                  />
                </div>

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

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowPostSaveModal(false);
                    setShowStars(false);
                    setPostSaveData(null);
                  }}
                  className="bg-slate-blue text-white px-4 py-2 rounded-md hover:bg-slate-blue/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Location Modal */}
      {showLocationModal && (
        <BusinessLocationModal
          isOpen={showLocationModal}
          onClose={() => {
            setShowLocationModal(false);
            setEditingLocation(null);
          }}
          location={editingLocation}
          onSave={editingLocation ? handleUpdateLocation : handleCreateLocation}
          canCreateMore={locationLimits.canCreateMore}
          currentCount={locationLimits.current}
          maxLocations={locationLimits.max}
          businessLogoUrl={business?.logo_url || null}
          businessReviewPlatforms={business?.review_platforms || []}
        />
      )}

    </>
  );
} 