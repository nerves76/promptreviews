"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import {
  RssFeedSource,
  CreateFeedRequest,
  UpdateFeedRequest,
  TargetLocation,
  RSS_LIMITS,
} from "@/features/rss-feeds/types";

interface FeedFormModalProps {
  feed: RssFeedSource | null;
  onClose: () => void;
  onSaved: () => void;
}

interface GbpLocation {
  id: string;
  locationName: string;
}

interface BlueskyConnection {
  id: string;
  identifier: string;
  status: string;
}

export default function FeedFormModal({
  feed,
  onClose,
  onSaved,
}: FeedFormModalProps) {
  const isEditing = !!feed;

  // Form state
  const [feedUrl, setFeedUrl] = useState(feed?.feedUrl || "");
  const [feedName, setFeedName] = useState(feed?.feedName || "");
  const [pollingInterval, setPollingInterval] = useState(
    feed?.pollingIntervalMinutes || 60
  );
  const [postTemplate, setPostTemplate] = useState(
    feed?.postTemplate || "{title}\n\n{description}"
  );
  const [includeLink, setIncludeLink] = useState(feed?.includeLink ?? true);
  const [maxContentLength, setMaxContentLength] = useState(
    feed?.maxContentLength || 1500
  );
  const [selectedLocations, setSelectedLocations] = useState<TargetLocation[]>(
    feed?.targetLocations || []
  );
  const [blueskyEnabled, setBlueskyEnabled] = useState(
    feed?.additionalPlatforms?.bluesky?.enabled || false
  );
  const [blueskyConnectionId, setBlueskyConnectionId] = useState(
    feed?.additionalPlatforms?.bluesky?.connectionId || ""
  );
  const [isActive, setIsActive] = useState(feed?.isActive ?? true);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available platforms
  const [gbpLocations, setGbpLocations] = useState<GbpLocation[]>([]);
  const [blueskyConnections, setBlueskyConnections] = useState<
    BlueskyConnection[]
  >([]);

  // Fetch available GBP locations and Bluesky connections
  useEffect(() => {
    async function fetchPlatforms() {
      setLoading(true);
      try {
        // Fetch GBP locations
        const locationsRes = await apiClient.get<{
          success: boolean;
          locations: GbpLocation[];
        }>("/google-business/locations");
        if (locationsRes.success) {
          setGbpLocations(locationsRes.locations || []);
        }
      } catch (err) {
        console.error("Failed to fetch GBP locations:", err);
      }

      try {
        // Fetch Bluesky connections
        const blueskyRes = await apiClient.get<{
          success: boolean;
          connections: BlueskyConnection[];
        }>("/social-posting/connections?platform=bluesky");
        if (blueskyRes.success) {
          setBlueskyConnections(
            (blueskyRes.connections || []).filter((c) => c.status === "active")
          );
          // Auto-select first connection if only one
          if (blueskyRes.connections?.length === 1 && !blueskyConnectionId) {
            setBlueskyConnectionId(blueskyRes.connections[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Bluesky connections:", err);
      }

      setLoading(false);
    }

    fetchPlatforms();
  }, [blueskyConnectionId]);

  // Toggle GBP location selection
  const toggleLocation = (location: GbpLocation) => {
    const exists = selectedLocations.find((l) => l.id === location.id);
    if (exists) {
      setSelectedLocations(
        selectedLocations.filter((l) => l.id !== location.id)
      );
    } else {
      setSelectedLocations([
        ...selectedLocations,
        { id: location.id, name: location.locationName },
      ]);
    }
  };

  // Handle save
  const handleSave = async () => {
    // Validate
    if (!feedUrl) {
      setError("Feed URL is required");
      return;
    }
    if (!feedName) {
      setError("Feed name is required");
      return;
    }
    if (selectedLocations.length === 0 && !blueskyEnabled) {
      setError("At least one target platform is required");
      return;
    }
    if (blueskyEnabled && !blueskyConnectionId) {
      setError("Please select a Bluesky account");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const additionalPlatforms = blueskyEnabled
        ? {
            bluesky: {
              enabled: true,
              connectionId: blueskyConnectionId,
            },
          }
        : {};

      if (isEditing) {
        const updateData: UpdateFeedRequest = {
          feedName,
          pollingIntervalMinutes: pollingInterval,
          postTemplate,
          includeLink,
          maxContentLength,
          targetLocations: selectedLocations,
          additionalPlatforms,
          isActive,
        };
        await apiClient.patch(`/rss-feeds/${feed.id}`, updateData);
      } else {
        const createData: CreateFeedRequest = {
          feedUrl,
          feedName,
          pollingIntervalMinutes: pollingInterval,
          postTemplate,
          includeLink,
          maxContentLength,
          targetLocations: selectedLocations,
          additionalPlatforms,
          isActive,
        };
        await apiClient.post("/rss-feeds", createData);
      }

      onSaved();
    } catch (err: unknown) {
      console.error("Failed to save feed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save feed";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const pollingOptions = [
    { value: 15, label: "Every 15 minutes" },
    { value: 30, label: "Every 30 minutes" },
    { value: 60, label: "Every hour" },
    { value: 120, label: "Every 2 hours" },
    { value: 360, label: "Every 6 hours" },
    { value: 720, label: "Every 12 hours" },
    { value: 1440, label: "Once daily" },
  ];

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              {isEditing ? "Edit RSS feed" : "Add RSS feed"}
            </Dialog.Title>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <Icon
                  name="FaSpinner"
                  className="animate-spin text-slate-blue"
                  size={24}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Feed URL */}
                <div>
                  <label className="block font-medium text-sm text-gray-700 mb-1">
                    Feed URL
                  </label>
                  <input
                    type="url"
                    value={feedUrl}
                    onChange={(e) => setFeedUrl(e.target.value)}
                    disabled={isEditing}
                    placeholder="https://example.com/feed.xml"
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent disabled:bg-gray-100"
                  />
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">
                      URL cannot be changed after creation
                    </p>
                  )}
                </div>

                {/* Feed Name */}
                <div>
                  <label className="block font-medium text-sm text-gray-700 mb-1">
                    Feed name
                  </label>
                  <input
                    type="text"
                    value={feedName}
                    onChange={(e) => setFeedName(e.target.value)}
                    placeholder="My Blog Feed"
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  />
                </div>

                {/* Polling Interval */}
                <div>
                  <label className="block font-medium text-sm text-gray-700 mb-1">
                    Check for new posts
                  </label>
                  <select
                    value={pollingInterval}
                    onChange={(e) =>
                      setPollingInterval(parseInt(e.target.value))
                    }
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  >
                    {pollingOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Platforms */}
                <div>
                  <label className="block font-medium text-sm text-gray-700 mb-2">
                    Post to platforms
                  </label>

                  {/* GBP Locations */}
                  {gbpLocations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">
                        Google Business Profile locations:
                      </p>
                      <div className="space-y-2">
                        {gbpLocations.map((loc) => (
                          <label
                            key={loc.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLocations.some(
                                (l) => l.id === loc.id
                              )}
                              onChange={() => toggleLocation(loc)}
                              className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                            />
                            <span className="text-sm text-gray-700">
                              {loc.locationName}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {gbpLocations.length === 0 && (
                    <p className="text-sm text-gray-500 mb-3">
                      No Google Business Profile locations connected.{" "}
                      <a
                        href="/dashboard/google-business"
                        className="text-slate-blue hover:underline"
                      >
                        Connect GBP
                      </a>
                    </p>
                  )}

                  {/* Bluesky */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Bluesky:</p>
                    {blueskyConnections.length > 0 ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={blueskyEnabled}
                            onChange={(e) =>
                              setBlueskyEnabled(e.target.checked)
                            }
                            className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                          />
                          <span className="text-sm text-gray-700">
                            Post to Bluesky
                          </span>
                        </label>
                        {blueskyEnabled && blueskyConnections.length > 1 && (
                          <select
                            value={blueskyConnectionId}
                            onChange={(e) =>
                              setBlueskyConnectionId(e.target.value)
                            }
                            className="mt-2 w-full border border-gray-300 px-3 py-2 rounded-lg text-sm"
                          >
                            <option value="">Select account...</option>
                            {blueskyConnections.map((conn) => (
                              <option key={conn.id} value={conn.id}>
                                {conn.identifier}
                              </option>
                            ))}
                          </select>
                        )}
                        {blueskyEnabled && blueskyConnections.length === 1 && (
                          <p className="text-xs text-gray-500 ml-6">
                            Using: {blueskyConnections[0].identifier}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No Bluesky accounts connected.{" "}
                        <a
                          href="/dashboard/social-posting"
                          className="text-slate-blue hover:underline"
                        >
                          Connect Bluesky
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Post Template */}
                <div>
                  <label className="block font-medium text-sm text-gray-700 mb-1">
                    Post template
                  </label>
                  <textarea
                    value={postTemplate}
                    onChange={(e) => setPostTemplate(e.target.value)}
                    rows={4}
                    placeholder="{title}\n\n{description}"
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available tokens: {"{title}"}, {"{description}"},{" "}
                    {"{link}"}
                  </p>
                </div>

                {/* Include Link */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLink}
                    onChange={(e) => setIncludeLink(e.target.checked)}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                  />
                  <span className="text-sm text-gray-700">
                    Include article link in post
                  </span>
                </label>

                {/* Max Content Length */}
                <div>
                  <label className="block font-medium text-sm text-gray-700 mb-1">
                    Maximum post length: {maxContentLength} characters
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="1500"
                    step="100"
                    value={maxContentLength}
                    onChange={(e) =>
                      setMaxContentLength(parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>500</span>
                    <span>1500</span>
                  </div>
                </div>

                {/* Active Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                  />
                  <span className="text-sm text-gray-700">
                    Feed is active (will be checked for new posts)
                  </span>
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Icon
                      name="FaSpinner"
                      className="inline mr-2 animate-spin"
                      size={14}
                    />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Save changes"
                ) : (
                  "Add feed"
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
