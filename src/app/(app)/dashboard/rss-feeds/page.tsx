"use client";

import { useState, useEffect, useCallback } from "react";
import PageCard from "@/app/(app)/components/PageCard";
import Icon from "@/components/Icon";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";
import {
  RssFeedSource,
  FeedListResponse,
  FeedDetailResponse,
} from "@/features/rss-feeds/types";
import FeedFormModal from "./components/FeedFormModal";
import FeedItemsList from "./components/FeedItemsList";
import TestFeedModal from "./components/TestFeedModal";
import BrowseFeedModal from "./components/BrowseFeedModal";

export default function RssFeedsPage() {
  useAuthGuard();
  const { selectedAccountId } = useAccountData();

  const [feeds, setFeeds] = useState<RssFeedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingFeed, setEditingFeed] = useState<RssFeedSource | null>(null);
  const [browsingFeed, setBrowsingFeed] = useState<RssFeedSource | null>(null);
  const [expandedFeedId, setExpandedFeedId] = useState<string | null>(null);
  const [processingFeedId, setProcessingFeedId] = useState<string | null>(null);
  const [resettingFeedId, setResettingFeedId] = useState<string | null>(null);

  // Fetch feeds
  const fetchFeeds = useCallback(async () => {
    if (!selectedAccountId) return;

    try {
      setLoading(true);
      const response = await apiClient.get<FeedListResponse>("/rss-feeds");
      if (response.success) {
        setFeeds(response.feeds);
      }
    } catch (err) {
      console.error("Failed to fetch feeds:", err);
      setError("Failed to load RSS feeds");
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

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

  // Handle feed saved (create or update)
  const handleFeedSaved = () => {
    setShowAddModal(false);
    setEditingFeed(null);
    setSuccess("Feed saved successfully");
    fetchFeeds();
  };

  // Handle feed delete
  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm("Are you sure you want to delete this feed?")) return;

    try {
      await apiClient.delete(`/rss-feeds/${feedId}`);
      setSuccess("Feed deleted successfully");
      fetchFeeds();
    } catch (err) {
      console.error("Failed to delete feed:", err);
      setError("Failed to delete feed");
    }
  };

  // Handle manual process
  const handleProcessFeed = async (feedId: string) => {
    setProcessingFeedId(feedId);
    try {
      const response = await apiClient.post<{
        success: boolean;
        result: {
          itemsDiscovered: number;
          itemsScheduled: number;
          itemsSkipped: number;
          errors: string[];
        };
      }>(`/rss-feeds/${feedId}/process`);

      if (response.success) {
        const { result } = response;
        if (result.itemsScheduled > 0) {
          setSuccess(
            `Processed: ${result.itemsScheduled} posts scheduled from ${result.itemsDiscovered} items`
          );
        } else if (result.itemsDiscovered === 0) {
          setSuccess("No new items found in feed");
        } else {
          setSuccess(
            `Found ${result.itemsDiscovered} items, ${result.itemsSkipped} skipped`
          );
        }
        fetchFeeds();
      }
    } catch (err: unknown) {
      console.error("Failed to process feed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process feed";
      setError(errorMessage);
    } finally {
      setProcessingFeedId(null);
    }
  };

  // Reset feed - clear all items and re-sync
  const handleResetFeed = async (feedId: string) => {
    if (!confirm("Reset this feed? This will delete all scheduled posts from this feed and re-sync items as 'Available'.")) {
      return;
    }

    setResettingFeedId(feedId);
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        itemCount: number;
        deletedScheduledPosts: number;
      }>(`/rss-feeds/${feedId}/reset`);

      if (response.success) {
        setSuccess(response.message);
        fetchFeeds();
      }
    } catch (err: unknown) {
      console.error("Failed to reset feed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset feed";
      setError(errorMessage);
    } finally {
      setResettingFeedId(null);
    }
  };

  // Toggle feed active/paused
  const handleToggleActive = async (feed: RssFeedSource) => {
    try {
      await apiClient.patch(`/rss-feeds/${feed.id}`, {
        isActive: !feed.isActive,
      });
      setSuccess(feed.isActive ? "Feed paused" : "Feed activated");
      fetchFeeds();
    } catch (err) {
      console.error("Failed to toggle feed:", err);
      setError("Failed to update feed");
    }
  };

  // Get status badge
  const getStatusBadge = (feed: RssFeedSource) => {
    if (!feed.isActive) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          Paused
        </span>
      );
    }
    if (feed.errorCount > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600">
          Error
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
        Active
      </span>
    );
  };

  // Format last polled time
  const formatLastPolled = (date: string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex justify-center items-start px-4 sm:px-0">
      <PageCard
        icon={<Icon name="FaLink" className="w-7 h-7 text-slate-blue" size={28} />}
        topRightAction={
          <div className="flex gap-2">
            <button
              onClick={() => setShowTestModal(true)}
              className="px-4 py-2 text-sm font-medium text-slate-blue border border-slate-blue rounded-lg hover:bg-slate-blue hover:text-white transition-colors"
            >
              Test feed
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors"
              disabled={feeds.length >= 3}
              title={feeds.length >= 3 ? "Maximum 3 feeds allowed" : undefined}
            >
              <Icon name="FaPlus" size={14} className="inline mr-2" />
              Add feed
            </button>
          </div>
        }
      >
        <h1 className="text-2xl font-bold text-slate-blue mb-2">
          RSS feed automation
        </h1>
        <p className="text-gray-600 mb-6">
          Automatically post content from RSS feeds to Google Business Profile
          and Bluesky.
        </p>

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

        {/* Empty state */}
        {!loading && feeds.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <Icon
              name="FaLink"
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
              size={48}
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No RSS feeds configured
            </h3>
            <p className="text-gray-500 mb-4">
              Add your first RSS feed to start auto-posting to social platforms.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90"
            >
              Add your first feed
            </button>
          </div>
        )}

        {/* Feeds list */}
        {!loading && feeds.length > 0 && (
          <div className="space-y-4">
            {feeds.map((feed) => (
              <div
                key={feed.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Feed header */}
                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    setExpandedFeedId(
                      expandedFeedId === feed.id ? null : feed.id
                    )
                  }
                >
                  {/* Top row: feed info and status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Icon
                        name={
                          expandedFeedId === feed.id
                            ? "FaChevronDown"
                            : "FaChevronRight"
                        }
                        size={14}
                        className="text-gray-400 mt-1 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900">
                          {feed.feedName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {feed.feedUrl}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(feed)}
                      <span className="text-sm text-gray-500 hidden sm:inline">
                        Last polled: {formatLastPolled(feed.lastPolledAt)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom row: actions */}
                  <div
                    className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-gray-500 sm:hidden">
                      Last polled: {formatLastPolled(feed.lastPolledAt)}
                    </span>
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => handleToggleActive(feed)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title={feed.isActive ? "Pause feed" : "Activate feed"}
                      >
                        <Icon
                          name={feed.isActive ? "FaTimes" : "FaCheck"}
                          size={14}
                        />
                      </button>
                      <button
                        onClick={() => handleProcessFeed(feed.id)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Process feed now"
                        disabled={
                          !feed.isActive || processingFeedId === feed.id
                        }
                      >
                        {processingFeedId === feed.id ? (
                          <Icon
                            name="FaSpinner"
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Icon name="FaRedo" size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => setBrowsingFeed(feed)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Browse & schedule items"
                      >
                        <Icon name="FaSearch" size={14} />
                      </button>
                      <button
                        onClick={() => setEditingFeed(feed)}
                        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Edit feed"
                      >
                        <Icon name="FaEdit" size={14} />
                      </button>
                      <button
                        onClick={() => handleResetFeed(feed.id)}
                        className="px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Reset feed - clear all and re-sync as Available"
                        disabled={resettingFeedId === feed.id}
                      >
                        {resettingFeedId === feed.id ? (
                          <Icon name="FaSpinner" size={12} className="animate-spin" />
                        ) : (
                          "Reset"
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteFeed(feed.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete feed"
                      >
                        <Icon name="FaTrash" size={14} />
                      </button>
                    </div>
                  </div>

                  {feed.lastError && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      Error: {feed.lastError}
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {expandedFeedId === feed.id && (
                  <div className="border-t border-gray-200">
                    <FeedItemsList feedId={feed.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              RSS feeds are checked hourly for new content
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              New items are automatically scheduled as posts
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              Posts are published daily at 1 PM UTC
            </li>
            <li>
              <Icon name="FaCheck" size={12} className="inline mr-2" />
              Each auto-post uses 1 credit
            </li>
          </ul>
        </div>

        {/* Media info box */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Media handling</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              <Icon name="FaImage" size={12} className="inline mr-2 text-gray-400" />
              Images from your feed are automatically included in posts
            </li>
            <li>
              <Icon name="FaLink" size={12} className="inline mr-2 text-gray-400" />
              For podcast or video feeds, posts link back to the original content
            </li>
            <li>
              <Icon name="FaInfoCircle" size={12} className="inline mr-2 text-gray-400" />
              Audio and video files are not uploaded, only images
            </li>
          </ul>
        </div>
      </PageCard>

      {/* Modals */}
      {(showAddModal || editingFeed) && selectedAccountId && (
        <FeedFormModal
          feed={editingFeed}
          accountId={selectedAccountId}
          onClose={() => {
            setShowAddModal(false);
            setEditingFeed(null);
          }}
          onSaved={handleFeedSaved}
        />
      )}

      {showTestModal && (
        <TestFeedModal
          onClose={() => setShowTestModal(false)}
          onUseUrl={(url, name) => {
            setShowTestModal(false);
            setShowAddModal(true);
            // The form will be pre-filled via state
          }}
        />
      )}

      {browsingFeed && (
        <BrowseFeedModal
          feedId={browsingFeed.id}
          feedName={browsingFeed.feedName}
          onClose={() => setBrowsingFeed(null)}
          onScheduled={() => {
            setSuccess("Items scheduled successfully");
            fetchFeeds();
          }}
        />
      )}
    </div>
  );
}
