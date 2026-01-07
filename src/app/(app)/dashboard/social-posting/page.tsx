"use client";

import { useState, useEffect, useCallback } from "react";
import PageCard, { PageCardHeader } from "@/app/(app)/components/PageCard";
import Icon from "@/components/Icon";
import GlobalOverlayLoader from "@/app/(app)/components/GlobalOverlayLoader";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";
import type { GoogleBusinessScheduledPost } from "@/features/social-posting";
import ContentQueue from "./components/ContentQueue";
import ScheduledList from "./components/ScheduledList";
import HistoryList from "./components/HistoryList";
import CreatePostModal, { type PlatformData } from "./components/CreatePostModal";

type TabType = "scheduled" | "drafts" | "history";

interface ScheduledDataResponse {
  success: boolean;
  data?: {
    drafts: GoogleBusinessScheduledPost[];
    upcoming: GoogleBusinessScheduledPost[];
    past: GoogleBusinessScheduledPost[];
  };
  error?: string;
}

export default function SocialPostingPage() {
  useAuthGuard();
  const { selectedAccountId } = useAccountData();

  const [activeTab, setActiveTab] = useState<TabType>("scheduled");
  const [drafts, setDrafts] = useState<GoogleBusinessScheduledPost[]>([]);
  const [upcoming, setUpcoming] = useState<GoogleBusinessScheduledPost[]>([]);
  const [past, setPast] = useState<GoogleBusinessScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);
  const [platformData, setPlatformData] = useState<PlatformData | null>(null);
  const [editingDraft, setEditingDraft] = useState<GoogleBusinessScheduledPost | null>(null);

  // Fetch all scheduled data
  const fetchData = useCallback(async () => {
    if (!selectedAccountId) return;

    try {
      setLoading(true);
      const response = await apiClient.get<ScheduledDataResponse>(
        "/social-posting/scheduled"
      );
      if (response.success && response.data) {
        setDrafts(response.data.drafts);
        setUpcoming(response.data.upcoming);
        setPast(response.data.past);
      } else {
        setError(response.error || "Failed to load content");
      }
    } catch (err) {
      console.error("Failed to fetch scheduled content:", err);
      setError("Failed to load scheduled content");
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [success]);

  const handleScheduleComplete = () => {
    setSuccess("Posts scheduled successfully");
    fetchData();
  };

  const handleReorderComplete = () => {
    // Silently update, no message needed
    fetchData();
  };

  const handleError = (message: string) => {
    setError(message);
  };

  // Handle edit draft - fetch platforms and open modal with draft data
  const handleEditDraft = async (draft: GoogleBusinessScheduledPost) => {
    setLoadingPlatforms(true);
    setEditingDraft(draft);
    try {
      const gbpLocations: PlatformData["gbpLocations"] = [];
      let blueskyConnection: PlatformData["blueskyConnection"] = null;
      let linkedinConnection: PlatformData["linkedinConnection"] = null;

      // Fetch GBP locations
      try {
        const locationsRes = await apiClient.get<{
          data?: {
            locations: Array<{
              location_id: string;
              location_name: string;
              address: string;
            }>;
          };
        }>("/social-posting/platforms/google-business-profile/locations");

        if (locationsRes.data?.locations) {
          locationsRes.data.locations.forEach((loc) => {
            gbpLocations.push({
              id: loc.location_id,
              name: loc.location_name,
              address: loc.address,
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch GBP locations:", err);
      }

      // Fetch social platform connections
      try {
        const connectionsRes = await apiClient.get<{
          connections: Array<{
            id: string;
            platform: string;
            handle: string;
            status: string;
            organizations?: Array<{ id: string; name: string; logoUrl?: string }>;
          }>;
        }>("/social-posting/connections");

        const connections = connectionsRes.connections || [];

        const activeBluesky = connections.find(
          (c) => c.platform === "bluesky" && c.status === "active"
        );
        if (activeBluesky) {
          blueskyConnection = {
            id: activeBluesky.id,
            platform: activeBluesky.platform,
            status: activeBluesky.status,
            handle: activeBluesky.handle,
          };
        }

        const activeLinkedIn = connections.find(
          (c) => c.platform === "linkedin" && c.status === "active"
        );
        if (activeLinkedIn) {
          linkedinConnection = {
            id: activeLinkedIn.id,
            platform: activeLinkedIn.platform,
            status: activeLinkedIn.status,
            handle: activeLinkedIn.handle,
            organizations: activeLinkedIn.organizations,
          };
        }
      } catch (err) {
        console.error("Failed to fetch social connections:", err);
      }

      setPlatformData({ gbpLocations, blueskyConnection, linkedinConnection });
      setShowCreateModal(true);
    } catch (err) {
      console.error("Failed to load platforms:", err);
      setError("Failed to load platforms");
      setEditingDraft(null);
    } finally {
      setLoadingPlatforms(false);
    }
  };

  // Handle create post button - fetch platforms first, then show modal
  const handleCreatePost = async () => {
    setLoadingPlatforms(true);
    try {
      const gbpLocations: PlatformData["gbpLocations"] = [];
      let blueskyConnection: PlatformData["blueskyConnection"] = null;
      let linkedinConnection: PlatformData["linkedinConnection"] = null;

      // Fetch GBP locations
      try {
        const locationsRes = await apiClient.get<{
          data?: {
            locations: Array<{
              location_id: string;
              location_name: string;
              address: string;
            }>;
          };
        }>("/social-posting/platforms/google-business-profile/locations");

        if (locationsRes.data?.locations) {
          locationsRes.data.locations.forEach((loc) => {
            gbpLocations.push({
              id: loc.location_id,
              name: loc.location_name,
              address: loc.address,
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch GBP locations:", err);
      }

      // Fetch social platform connections (Bluesky, LinkedIn, etc.)
      try {
        const connectionsRes = await apiClient.get<{
          connections: Array<{
            id: string;
            platform: string;
            handle: string;
            status: string;
            organizations?: Array<{ id: string; name: string; logoUrl?: string }>;
          }>;
        }>("/social-posting/connections");

        const connections = connectionsRes.connections || [];

        // Find active Bluesky connection
        const activeBluesky = connections.find(
          (c) => c.platform === "bluesky" && c.status === "active"
        );
        if (activeBluesky) {
          blueskyConnection = {
            id: activeBluesky.id,
            platform: activeBluesky.platform,
            status: activeBluesky.status,
            handle: activeBluesky.handle,
          };
        }

        // Find active LinkedIn connection
        const activeLinkedIn = connections.find(
          (c) => c.platform === "linkedin" && c.status === "active"
        );
        if (activeLinkedIn) {
          linkedinConnection = {
            id: activeLinkedIn.id,
            platform: activeLinkedIn.platform,
            status: activeLinkedIn.status,
            handle: activeLinkedIn.handle,
            organizations: activeLinkedIn.organizations,
          };
        }
      } catch (err) {
        console.error("Failed to fetch social connections:", err);
      }

      setPlatformData({ gbpLocations, blueskyConnection, linkedinConnection });
      setShowCreateModal(true);
    } catch (err) {
      console.error("Failed to load platforms:", err);
      setError("Failed to load platforms");
    } finally {
      setLoadingPlatforms(false);
    }
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "scheduled", label: "Scheduled", count: upcoming.length },
    { id: "drafts", label: "Drafts", count: drafts.length },
    { id: "history", label: "History", count: past.length },
  ];

  return (
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <PageCard
        icon={
          <Icon
            name="FaCalendarAlt"
            className="w-7 h-7 text-slate-blue"
            size={28}
          />
        }
      >
        <PageCardHeader
          title="Post scheduling"
          description="Manage scheduled posts for Google Business Profile, Bluesky, and LinkedIn."
          iconClearance={false}
          actions={
            <button
              onClick={handleCreatePost}
              disabled={loadingPlatforms}
              className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <Icon name="FaPlus" size={14} />
              Create post
            </button>
          }
        />

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md text-base font-medium border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md text-base font-medium border border-green-200">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "border-slate-blue text-slate-blue"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? "bg-slate-blue/10 text-slate-blue"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <Icon
              name="FaSpinner"
              className="w-8 h-8 text-slate-blue animate-spin"
              size={32}
            />
          </div>
        )}

        {/* Tab content */}
        {!loading && activeTab === "scheduled" && (
          <ScheduledList
            posts={upcoming}
            onCancelComplete={() => {
              setSuccess("Post cancelled");
              fetchData();
            }}
            onError={handleError}
          />
        )}

        {!loading && activeTab === "drafts" && (
          <ContentQueue
            drafts={drafts}
            onScheduleComplete={handleScheduleComplete}
            onReorderComplete={handleReorderComplete}
            onError={handleError}
            onEditDraft={handleEditDraft}
          />
        )}

        {!loading && activeTab === "history" && (
          <HistoryList posts={past} />
        )}

        {/* Help info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              <a href="/dashboard/integrations" className="underline hover:text-blue-900">Connect your accounts</a> to enable posting
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              RSS feeds automatically schedule posts based on your settings
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              Create posts manually or save as drafts for later
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              Posts are published daily at 1 PM UTC
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              Each post uses 1 credit when scheduled
            </li>
          </ul>
        </div>
      </PageCard>

      {/* Full-page loading overlay */}
      <GlobalOverlayLoader visible={loadingPlatforms} blocking />

      {/* Create Post Modal */}
      {showCreateModal && selectedAccountId && platformData && (
        <CreatePostModal
          accountId={selectedAccountId}
          platformData={platformData}
          editingDraft={editingDraft}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDraft(null);
          }}
          onCreated={(result) => {
            setShowCreateModal(false);
            setEditingDraft(null);

            // Set appropriate success message based on mode and result
            let message = "Post created successfully";
            if (result?.mode === "immediate") {
              message = result.published ? "Post published successfully" : "Post queued for publishing";
            } else if (result?.mode === "scheduled") {
              message = "Post scheduled successfully";
            } else if (result?.mode === "draft") {
              message = editingDraft ? "Draft updated successfully" : "Draft saved successfully";
            }
            setSuccess(message);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
