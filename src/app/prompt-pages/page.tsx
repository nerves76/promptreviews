"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRef } from "react";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { createClient, getUserOrMock } from "@/utils/supabaseClient";
import Link from "next/link";
import { FaGlobe, FaLink, FaTimes, FaPalette, FaPlus, FaCheck, FaMapMarkerAlt, FaEdit, FaTrash, FaStar } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import PageCard from "@/app/components/PageCard";
import UniversalPromptPageForm from "../dashboard/edit-prompt-page/universal/UniversalPromptPageForm";
import AppLoader from "@/app/components/AppLoader";
import QRCodeGenerator, { QR_FRAME_SIZES } from "../dashboard/components/QRCodeGenerator";
import dynamic from "next/dynamic";
import PromptPagesTable from "@/app/components/PromptPagesTable";
import PromptTypeSelectModal from "@/app/components/PromptTypeSelectModal";
import { FaHandsHelping, FaBoxOpen } from "react-icons/fa";
import { MdPhotoCamera, MdVideoLibrary, MdEvent } from "react-icons/md";
import { useRouter } from "next/navigation";
import QRCodeModal from "../components/QRCodeModal";
import StarfallCelebration from "@/app/components/StarfallCelebration";
import { getAccountIdForUser } from "@/utils/accountUtils";
import BusinessLocationModal from "@/app/components/BusinessLocationModal";
import { BusinessLocation } from "@/types/business";
import { hasLocationAccess, formatLocationAddress, getLocationDisplayName } from "@/utils/locationUtils";
import { FaQuestionCircle } from "react-icons/fa";
import EmojiEmbedButton from "@/app/components/EmojiEmbedButton";

const StylePage = dynamic(() => import("../dashboard/style/StyleModalPage"), { ssr: false });

export default function PromptPages() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [promptPages, setPromptPages] = useState<any[]>([]);
  const [universalPromptPage, setUniversalPromptPage] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);
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
  
  // Tab state for Maven users
  const [activeTab, setActiveTab] = useState<'locations' | 'custom'>('locations');

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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        
        // Get the account ID for the user
        const accountId = await getAccountIdForUser(user.id, supabase);
        
        if (!accountId) {
          throw new Error("No account found for user");
        }

        // Fetch account data for plan info
        const { data: accountData } = await supabase
          .from("accounts")
          .select("plan, location_count, max_locations")
          .eq("id", accountId)
          .single();
        setAccount(accountData);

        const { data: businessProfile } = await supabase
          .from("businesses")
          .select("*")
          .eq("account_id", accountId)
          .single();
        setBusiness(businessProfile);
        
        const { data: universalPage } = await supabase
          .from("prompt_pages")
          .select("*")
          .eq("account_id", accountId)
          .eq("is_universal", true)
          .single();
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
          await fetchLocations(accountId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

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

  const promptTypes = [
    {
      key: "service",
      label: "Service review",
      icon: <FaHandsHelping className="w-7 h-7 text-slate-blue" />,
      description: "Capture a review from a customer or client who loves what you do",
    },
    {
      key: "photo",
      label: "Photo + testimonial",
      icon: <MdPhotoCamera className="w-7 h-7 text-[#1A237E]" />,
      description: "Capture a headshot and testimonial to display on your website or in marketing materials.",
    },
    {
      key: "product",
      label: "Product review",
      icon: <FaBoxOpen className="w-7 h-7 text-slate-blue" />,
      description: "Get a review from a customer who fancies your products",
    },
    {
      key: "video",
      label: "Video testimonial",
      icon: <MdVideoLibrary className="w-7 h-7 text-[#1A237E]" />,
      description: "Request a video testimonial from your client.",
      comingSoon: true,
    },
    {
      key: "event",
      label: "Events & spaces",
      icon: <MdEvent className="w-7 h-7 text-[#1A237E]" />,
      description: "For events, rentals, tours, and more.",
      comingSoon: true,
    },
  ];

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
                <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">Prompt pages</h1>
                <p className="text-gray-600 text-base max-w-md mt-0 mb-10">Create and manage your prompt pages and outreach efforts.</p>
              </div>
              <div className="flex items-start" style={{ alignSelf: "flex-start" }}>
                <button
                  type="button"
                  className="bg-blue-100 text-slate-blue rounded font-semibold px-4 py-2 hover:bg-blue-200 transition whitespace-nowrap flex items-center gap-2"
                  onClick={() => setShowStyleModal(true)}
                >
                  <FaPalette className="w-4 h-4" />
                  Style
                </button>
              </div>
            </div>
            {/* Universal Prompt Page Card (dashboard port) */}
            {universalPromptPage && (
              <div className="rounded-lg p-6 bg-blue-50 border border-blue-200 flex items-center gap-4 shadow relative mt-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-3">
                        <FaGlobe className="w-7 h-7 text-slate-blue" />
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
                    Your Universal Prompt Page is general-use and not customer specific.
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => handleCopyLink()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                      >
                        <FaLink className="w-4 h-4" />
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
                        <MdDownload size={22} color="#b45309" />
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
            
            {/* Tab Navigation - Only show for Maven tier users with location access */}
            {account && hasLocationAccess(account.plan) && (
              <div className="my-12">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('locations')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === 'locations'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4" />
                        Locations
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('custom')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === 'custom'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FaPlus className="w-4 h-4" />
                        Custom
                      </div>
                    </button>
                  </nav>
                </div>
              </div>
            )}
            
            {/* Business Locations Section - Only show for Maven tier when locations tab is active */}
            {account && hasLocationAccess(account.plan) && activeTab === 'locations' && (
              <div className="my-12">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-2">
                      <FaMapMarkerAlt className="w-6 h-6" />
                      Business Locations
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Create location-specific prompt pages • {locationLimits.current} of {locationLimits.max} locations used
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    disabled={!locationLimits.canCreateMore}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded font-medium transition ${
                      locationLimits.canCreateMore
                        ? 'bg-slate-blue text-white hover:bg-slate-blue/90'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaPlus className="w-4 h-4" />
                    Add Location
                  </button>
                </div>
                
                {locations.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                    <FaMapMarkerAlt className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create location-specific prompt pages for each of your business locations.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded hover:bg-slate-blue/90 transition"
                    >
                      <FaPlus className="w-4 h-4" />
                      Add Your First Location
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto shadow sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                          <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-gray-900">Actions</th>
                          <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-gray-900">Share</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {locations.map((location, index) => {
                          const locationPage = locationPromptPages.find(p => p.business_location_id === location.id);
                          return (
                            <tr key={location.id} className={index % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                <div className="font-medium text-gray-900">
                                  {getLocationDisplayName(location)}
                                </div>
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <div className="flex flex-row gap-2 items-center justify-end">
                                  <div className="flex gap-2">
                                    <Link href={`/r/${locationPage?.slug || '#'}`} className="text-slate-blue underline hover:text-slate-blue/80 hover:underline">View</Link>
                                    <button
                                      onClick={() => {
                                        setEditingLocation(location);
                                        setShowLocationModal(true);
                                      }}
                                      className="text-slate-blue underline hover:text-slate-blue/80 hover:underline bg-transparent border-none cursor-pointer p-0"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteLocation(location.id)}
                                    className="text-gray-600 hover:text-red-600"
                                    title="Delete location"
                                  >
                                    <FaTrash className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <div className="flex flex-row gap-2 items-center justify-end">
                                  <button
                                    type="button"
                                    className="inline-flex items-center px-2 py-1.5 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap w-full sm:w-auto"
                                    title="Copy link"
                                    onClick={async () => {
                                      try {
                                        const url = locationPage ? `${window.location.origin}/r/${locationPage.slug}` : `${window.location.origin}/r/${location.id}`;
                                        await navigator.clipboard.writeText(url);
                                        setCopySuccess("Link copied!");
                                        setTimeout(() => setCopySuccess(""), 2000);
                                      } catch (err) {
                                        alert("Could not copy to clipboard. Please copy manually.");
                                      }
                                    }}
                                  >
                                    <FaLink className="w-4 h-4" />
                                  </button>
                                  
                                  {/* Emoji Embed Button - only show when sentiment flow is enabled */}
                                  {(location.emoji_sentiment_enabled || locationPage?.emoji_sentiment_enabled) && locationPage?.slug && (
                                    <div className="flex items-center">
                                      <EmojiEmbedButton slug={locationPage.slug} />
                                    </div>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = locationPage ? `${window.location.origin}/r/${locationPage.slug}` : `${window.location.origin}/r/${location.id}`;
                                      setQrModal({
                                        open: true,
                                        url: url,
                                        clientName: getLocationDisplayName(location),
                                        logoUrl: location.logo_url,
                                        showNfcText: locationPage?.nfc_text_enabled ?? false,
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 text-sm font-medium shadow h-9 align-middle whitespace-nowrap"
                                  >
                                    <MdDownload size={22} color="#b45309" />
                                    QR code
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
            
            {/* Custom Prompt Pages Section - Show for non-Maven users OR when custom tab is active */}
            {(!account || !hasLocationAccess(account.plan) || activeTab === 'custom') && (
              <div className="my-12">
                <div className="flex items-center justify-between mb-[75px]">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-blue mb-2 flex items-center gap-3">
                      <FaStar className="w-7 h-7 text-slate-blue" />
                      Custom Prompt Pages
                    </h2>
                    <p className="text-sm text-gray-600">
                      These Prompt Pages are great for personlized outreach. For best results, send as a text.
                    </p>
                  </div>
                <button
                  type="button"
                  onClick={() => setShowTypeModal(true)}
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
                  onCreatePromptPage={() => setShowTypeModal(true)}
                />
              </div>
            </div>
            )}
          </div>
        </PageCard>
      </div>
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
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Send SMS</span>
                  <a
                    href={`sms:${postSaveData.phone || ''}?body=Hi ${postSaveData.first_name || 'there'}, I'd love to get your feedback! Please leave a review here: ${postSaveData.url}`}
                    className="text-slate-blue hover:text-slate-blue/80 text-sm font-medium"
                  >
                    Send
                  </a>
                </div>

                {/* Email link */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Send Email</span>
                  <a
                    href={`mailto:${postSaveData.email || ''}?subject=Please leave a review&body=Hi ${postSaveData.first_name || 'there'},%0D%0A%0D%0AI'd love to get your feedback! Please leave a review here: ${postSaveData.url}%0D%0A%0D%0AThank you!`}
                    className="text-slate-blue hover:text-slate-blue/80 text-sm font-medium"
                  >
                    Send
                  </a>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
        <FaQuestionCircle
          className="inline-block w-4 h-4 align-middle cursor-pointer"
          title="Universal Prompt Page info"
        />
      </button>
      {show && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 w-80 p-3 bg-white border border-gray-200 rounded shadow text-sm text-gray-700">
          Your Universal Prompt Page is a great choice for a QR code featured at your front desk or on tables at your restaurant or even a business card or lanyard. You could also feature it in a newsletter or an auto-reply (For best results, we highly recommend reaching out personally for reviews.) To avoid duplicate or similar reviews, Universal Prompt Pages don't allow pre-written reviews, but users can use Prompty AI to get an optimized review template.
        </div>
      )}
    </span>
  );
} 