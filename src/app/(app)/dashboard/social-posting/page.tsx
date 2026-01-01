"use client";

import { useState, useEffect, useCallback } from "react";
import PageCard from "@/app/(app)/components/PageCard";
import Icon from "@/components/Icon";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";
import type { GoogleBusinessScheduledPost } from "@/features/social-posting";
import ContentQueue from "./components/ContentQueue";
import ScheduledList from "./components/ScheduledList";
import HistoryList from "./components/HistoryList";
import CreatePostModal from "./components/CreatePostModal";

type TabType = "queue" | "scheduled" | "history";

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

  const [activeTab, setActiveTab] = useState<TabType>("queue");
  const [drafts, setDrafts] = useState<GoogleBusinessScheduledPost[]>([]);
  const [upcoming, setUpcoming] = useState<GoogleBusinessScheduledPost[]>([]);
  const [past, setPast] = useState<GoogleBusinessScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "queue", label: "Queue", count: drafts.length },
    { id: "scheduled", label: "Scheduled", count: upcoming.length },
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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-blue mb-2">
              Social content
            </h1>
            <p className="text-gray-600">
              Manage your content queue and scheduled posts for Google Business Profile and Bluesky.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors"
          >
            <Icon name="FaPlus" size={14} />
            Create post
          </button>
        </div>

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
        {!loading && activeTab === "queue" && (
          <ContentQueue
            drafts={drafts}
            onScheduleComplete={handleScheduleComplete}
            onReorderComplete={handleReorderComplete}
            onError={handleError}
          />
        )}

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

        {!loading && activeTab === "history" && (
          <HistoryList posts={past} />
        )}

        {/* Help info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              Add content to queue from RSS feeds or create manually
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              Drag to reorder, then bulk schedule with your preferred interval
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

      {/* Create Post Modal */}
      {showCreateModal && selectedAccountId && (
        <CreatePostModal
          accountId={selectedAccountId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            setSuccess("Post created successfully");
            fetchData();
          }}
        />
      )}
    </div>
  );
}
