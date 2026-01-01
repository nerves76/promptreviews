"use client";

import { useState, useCallback, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import imageCompression from "browser-image-compression";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import type { GoogleBusinessScheduledMediaDescriptor, GoogleBusinessScheduledPost } from "@/features/social-posting";

export interface GbpLocation {
  id: string;
  name: string;
  address: string;
}

export interface LinkedInOrganization {
  id: string;        // urn:li:organization:XXX
  name: string;
  logoUrl?: string;
}

export interface SocialConnection {
  id: string;
  platform: string;
  status: string;
  handle: string | null;
  organizations?: LinkedInOrganization[]; // LinkedIn admin organizations
}

// Alias for backwards compatibility
export type BlueskyConnection = SocialConnection;

export interface PlatformData {
  gbpLocations: GbpLocation[];
  blueskyConnection: SocialConnection | null;
  linkedinConnection: SocialConnection | null;
}

interface CreatePostModalProps {
  onClose: () => void;
  onCreated: (result?: { mode: "immediate" | "scheduled" | "draft"; published?: boolean }) => void;
  accountId: string;
  platformData: PlatformData;
  editingDraft?: GoogleBusinessScheduledPost | null;
}

interface SchedulerMedia extends GoogleBusinessScheduledMediaDescriptor {
  previewUrl: string;
}

const CALL_TO_ACTION_OPTIONS = [
  { value: "LEARN_MORE", label: "Learn more" },
  { value: "CALL", label: "Call" },
  { value: "ORDER_ONLINE", label: "Order online" },
  { value: "BOOK", label: "Book" },
  { value: "SIGN_UP", label: "Sign up" },
  { value: "BUY", label: "Buy" },
];

const SUPPORTED_TIMEZONES =
  typeof Intl !== "undefined" &&
  typeof (Intl as any).supportedValuesOf === "function"
    ? (Intl as any).supportedValuesOf("timeZone")
    : [];

const DEFAULT_TIMEZONE =
  typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/Los_Angeles";

const compressionOptions: any = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1080,
  useWebWorker: true,
  fileType: "image/jpeg",
  initialQuality: 0.8,
  alwaysKeepResolution: false,
};

function isValidUrl(value: string, allowTel = false): boolean {
  if (!value) return false;
  if (allowTel && value.startsWith("tel:")) {
    return value.length > 4;
  }
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function CreatePostModal({
  onClose,
  onCreated,
  accountId,
  platformData,
  editingDraft,
}: CreatePostModalProps) {
  // Platform data from props
  const { gbpLocations, blueskyConnection, linkedinConnection } = platformData;

  // Initialize form state from editingDraft if provided
  const [mode, setMode] = useState<"post" | "photo">(editingDraft?.postKind || "post");
  const [postContent, setPostContent] = useState(editingDraft?.content?.summary || "");
  const [caption, setCaption] = useState(editingDraft?.caption || "");
  const [ctaEnabled, setCtaEnabled] = useState(!!editingDraft?.content?.callToAction);
  const [ctaType, setCtaType] = useState(editingDraft?.content?.callToAction?.actionType || "LEARN_MORE");
  const [ctaUrl, setCtaUrl] = useState(editingDraft?.content?.callToAction?.url || "");
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(() => {
    if (editingDraft?.selectedLocations?.length) {
      return editingDraft.selectedLocations.map(loc => loc.id);
    }
    // Auto-select if only one location
    return gbpLocations.length === 1 ? [gbpLocations[0].id] : [];
  });
  const [scheduledDate, setScheduledDate] = useState(editingDraft?.scheduledDate || "");
  const [timezone, setTimezone] = useState(editingDraft?.timezone || DEFAULT_TIMEZONE);
  const [mediaItems, setMediaItems] = useState<SchedulerMedia[]>(() => {
    if (editingDraft?.mediaPaths?.length) {
      return editingDraft.mediaPaths.map(m => ({
        ...m,
        previewUrl: m.publicUrl,
      }));
    }
    return [];
  });
  const [postToBluesky, setPostToBluesky] = useState(!!editingDraft?.additionalPlatforms?.bluesky?.enabled);

  // LinkedIn target selection - can include personal profile and/or organizations
  // Each target is { type: 'personal' | 'organization', id: string, name: string }
  const [linkedInTargets, setLinkedInTargets] = useState<Array<{ type: 'personal' | 'organization'; id: string; name: string }>>(() => {
    if (editingDraft?.additionalPlatforms?.linkedin?.targets) {
      return editingDraft.additionalPlatforms.linkedin.targets;
    }
    // Legacy: if linkedin was enabled but no targets, default to personal profile
    if (editingDraft?.additionalPlatforms?.linkedin?.enabled && linkedinConnection) {
      return [{ type: 'personal' as const, id: linkedinConnection.id, name: linkedinConnection.handle || 'My Profile' }];
    }
    return [];
  });

  // Derived state for backwards compatibility
  const postToLinkedIn = linkedInTargets.length > 0;

  // Schedule mode: 'immediate' posts now, 'draft' adds to queue, 'scheduled' schedules for later
  const [scheduleMode, setScheduleMode] = useState<"immediate" | "draft" | "scheduled">("immediate");

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Minimum date (tomorrow)
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  }, []);

  // Handle file selection
  const handleFilesSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (mediaItems.length + files.length > 10) {
        setError("Maximum 10 images allowed");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        for (const file of Array.from(files)) {
          // Validate file type
          if (!["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(file.type)) {
            setError("Only JPEG, PNG, and GIF images are supported");
            continue;
          }

          // Validate file size (10MB max before compression)
          if (file.size > 10 * 1024 * 1024) {
            setError("Images must be under 10MB");
            continue;
          }

          // Compress the image
          const compressed = await imageCompression(file, compressionOptions);

          // Upload to server (use upload-image endpoint for Supabase storage)
          const formData = new FormData();
          formData.append("file", compressed);
          formData.append("folder", "social-posts/scheduled");

          const response = await fetch("/api/social-posting/upload-image", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Upload failed:", response.status, errorData);
            throw new Error(errorData.error || `Upload failed with status ${response.status}`);
          }

          const data = await response.json();

          // upload-image returns { url, bucket, path, size, mime, checksum, originalName }
          if (data.url) {
            setMediaItems((prev) => [
              ...prev,
              {
                bucket: data.bucket,
                path: data.path,
                publicUrl: data.url,
                size: data.size,
                mime: data.mime,
                checksum: data.checksum,
                originalName: data.originalName,
                previewUrl: data.url,
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Failed to upload image");
      } finally {
        setIsUploading(false);
        // Reset file input
        e.target.value = "";
      }
    },
    [mediaItems.length]
  );

  // Remove media item
  const removeMedia = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle location selection
  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    );
  };

  // Toggle LinkedIn target selection (personal profile or organization)
  const toggleLinkedInTarget = (type: 'personal' | 'organization', id: string, name: string) => {
    setLinkedInTargets((prev) => {
      const exists = prev.some(t => t.type === type && t.id === id);
      if (exists) {
        return prev.filter(t => !(t.type === type && t.id === id));
      }
      return [...prev, { type, id, name }];
    });
  };

  // Check if a LinkedIn target is selected
  const isLinkedInTargetSelected = (type: 'personal' | 'organization', id: string) => {
    return linkedInTargets.some(t => t.type === type && t.id === id);
  };

  // Validation
  const canSubmit = useMemo(() => {
    // Must have at least one platform
    const hasGbp = selectedLocationIds.length > 0;
    const hasBluesky = postToBluesky && blueskyConnection?.id;
    const hasLinkedIn = linkedInTargets.length > 0 && linkedinConnection?.id;
    if (!hasGbp && !hasBluesky && !hasLinkedIn) return false;

    // Must have content
    if (mode === "post" && !postContent.trim()) return false;
    if (mode === "photo" && mediaItems.length === 0) return false;

    // If scheduled for later, must have date
    if (scheduleMode === "scheduled" && !scheduledDate) return false;

    // Photo mode only works with GBP, not immediate posting to other platforms
    if (mode === "photo" && scheduleMode === "immediate" && selectedLocationIds.length === 0) return false;

    // CTA validation
    if (ctaEnabled && mode === "post") {
      const allowTel = ctaType === "CALL";
      if (!isValidUrl(ctaUrl, allowTel)) return false;
    }

    return true;
  }, [
    selectedLocationIds,
    postToBluesky,
    blueskyConnection,
    linkedInTargets,
    linkedinConnection,
    mode,
    postContent,
    mediaItems,
    scheduleMode,
    scheduledDate,
    ctaEnabled,
    ctaType,
    ctaUrl,
  ]);

  // Submit handler
  const handleSubmit = async (asDraft = false) => {
    const effectiveMode = asDraft ? "draft" : scheduleMode;

    // Validation for non-draft modes
    if (!asDraft && !canSubmit) return;

    // For drafts, just need content
    if (asDraft) {
      if (mode === "post" && !postContent.trim()) return;
      if (mode === "photo" && mediaItems.length === 0) return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // All modes (immediate, draft, scheduled) use the /social-posting/scheduled API
      const payloadLocations = selectedLocationIds.map((id) => {
        const loc = gbpLocations.find((l) => l.id === id);
        return { id, name: loc?.name || "" };
      });

      const body: any = {
        postKind: mode,
        locations: payloadLocations,
        media: mediaItems.map(({ previewUrl, ...rest }) => rest),
      };

      // Set date, timezone, and status based on schedule mode
      if (effectiveMode === "immediate") {
        // Use today's date for immediate posting - cron will pick it up quickly
        body.scheduledDate = new Date().toISOString().split("T")[0];
        body.timezone = timezone;
        body.status = "pending";
      } else if (effectiveMode === "scheduled") {
        body.scheduledDate = scheduledDate;
        body.timezone = timezone;
        body.status = "pending";
      } else {
        // Draft - no date
        body.scheduledDate = null;
        body.status = "draft";
      }

      // Add additional platforms if enabled
      const additionalPlatforms: Record<string, any> = {};

      if (postToBluesky && blueskyConnection?.id) {
        additionalPlatforms.bluesky = {
          enabled: true,
          connectionId: blueskyConnection.id,
        };
      }

      if (linkedInTargets.length > 0 && linkedinConnection?.id) {
        additionalPlatforms.linkedin = {
          enabled: true,
          connectionId: linkedinConnection.id,
          targets: linkedInTargets, // Array of { type, id, name }
        };
      }

      if (Object.keys(additionalPlatforms).length > 0) {
        body.additionalPlatforms = additionalPlatforms;
      }

      // Add content based on mode
      if (mode === "post") {
        body.postType = "WHATS_NEW";
        body.content = {
          summary: postContent.trim(),
          callToAction: ctaEnabled
            ? {
                actionType: ctaType,
                url:
                  ctaType === "CALL" && !ctaUrl.startsWith("tel:")
                    ? `tel:${ctaUrl.replace(/[^0-9+]/g, "")}`
                    : ctaUrl,
              }
            : null,
        };
      } else {
        body.caption = caption.trim() || null;
      }

      let postId: string | undefined;

      if (editingDraft) {
        // Update existing draft
        const response = await apiClient.patch<{ success: boolean; error?: string; data?: { id: string } }>(
          `/social-posting/scheduled/${editingDraft.id}`,
          body
        );

        if (!response.success) {
          throw new Error(response.error || "Failed to update draft");
        }
        postId = editingDraft.id;
      } else {
        // Create new post
        const response = await apiClient.post<{ success: boolean; error?: string; data?: { id: string } }>(
          "/social-posting/scheduled",
          body
        );

        if (!response.success) {
          throw new Error(response.error || "Failed to create post");
        }
        postId = response.data?.id;
      }

      // For immediate posting, trigger processing now
      let published = false;
      if (effectiveMode === "immediate" && postId) {
        try {
          const processResult = await apiClient.post<{ success: boolean; postStatus?: string; error?: string }>(
            "/social-posting/process-now",
            { postId }
          );

          if (processResult.success && processResult.postStatus === "completed") {
            published = true;
          } else if (!processResult.success) {
            console.warn("Immediate processing failed:", processResult.error);
            setError(`Post created but publishing failed: ${processResult.error || "Unknown error"}. It will be processed by the scheduler.`);
            // Don't return - still call onCreated to refresh the list
          }
        } catch (processError) {
          console.warn("Failed to trigger immediate processing:", processError);
          setError("Post created but couldn't trigger immediate publishing. It will be processed by the scheduler.");
        }
      }

      onCreated({ mode: effectiveMode, published });
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasNoPlatforms = gbpLocations.length === 0 && !blueskyConnection && !linkedinConnection;

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 z-50"
            style={{ width: 48, height: 48 }}
            aria-label="Close modal"
          >
            <svg
              className="w-4 h-4 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                {editingDraft ? "Edit draft" : "Create post"}
              </Dialog.Title>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                  <Icon
                    name="FaExclamationTriangle"
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <span>{error}</span>
                </div>
              )}

              {hasNoPlatforms ? (
                <div className="text-center py-8">
                  <Icon
                    name="FaExclamationTriangle"
                    size={48}
                    className="text-amber-500 mx-auto mb-4"
                  />
                  <h3 className="font-medium text-gray-900 mb-2">
                    No platforms connected
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Connect a Google Business Profile, Bluesky, or LinkedIn account to
                    create posts.
                  </p>
                  <a
                    href="/dashboard/social-posting"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90"
                  >
                    <Icon name="FaLink" size={16} />
                    Connect platforms
                  </a>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Post Type Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post type
                    </label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value="post"
                          checked={mode === "post"}
                          onChange={() => setMode("post")}
                          className="text-slate-blue focus:ring-slate-blue"
                        />
                        <Icon name="FaFileAlt" size={16} className="text-gray-500" />
                        <div>
                          <span className="text-sm font-medium">Social post</span>
                          <p className="text-xs text-gray-500">Post to GBP and/or Bluesky (can include images)</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value="photo"
                          checked={mode === "photo"}
                          onChange={() => setMode("photo")}
                          className="text-slate-blue focus:ring-slate-blue"
                        />
                        <Icon name="FaImage" size={16} className="text-gray-500" />
                        <div>
                          <span className="text-sm font-medium">GBP photo gallery</span>
                          <p className="text-xs text-gray-500">Upload photos to your Google Business Profile gallery</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Content */}
                  {mode === "post" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Post content
                      </label>
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        rows={4}
                        maxLength={1500}
                        placeholder="What's new with your business?"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>
                          {postToBluesky && postContent.length > 300 && (
                            <span className="text-amber-600">
                              ⚠️ Bluesky limit: 300 chars
                            </span>
                          )}
                        </span>
                        <span>{postContent.length}/1500</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Caption (optional)
                      </label>
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={2}
                        placeholder="Add a caption..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Images {mode === "photo" && <span className="text-red-500">*</span>}
                    </label>

                    {/* Preview existing images */}
                    {mediaItems.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mediaItems.map((item, index) => (
                          <div key={index} className="relative">
                            <img
                              src={item.previewUrl}
                              alt={`Upload ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeMedia(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    {mediaItems.length < 10 && (
                      <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        {isUploading ? (
                          <>
                            <Icon name="FaSpinner" size={16} className="animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Icon name="FaImage" size={16} />
                            <span>Add image</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          multiple
                          onChange={handleFilesSelected}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      JPEG, PNG, or GIF. Max 10 images.
                    </p>
                  </div>

                  {/* Call to Action (post mode only) */}
                  {mode === "post" && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ctaEnabled}
                          onChange={(e) => setCtaEnabled(e.target.checked)}
                          className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Add call-to-action button
                        </span>
                      </label>

                      {ctaEnabled && (
                        <div className="mt-3 space-y-3 ml-6">
                          <select
                            value={ctaType}
                            onChange={(e) => setCtaType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            {CALL_TO_ACTION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={ctaUrl}
                            onChange={(e) => setCtaUrl(e.target.value)}
                            placeholder={
                              ctaType === "CALL"
                                ? "+1 (555) 123-4567"
                                : "https://example.com"
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Target Platforms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post to
                    </label>

                    {/* GBP Locations */}
                    {gbpLocations.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {gbpLocations.map((loc) => (
                          <label
                            key={loc.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLocationIds.includes(loc.id)}
                              onChange={() => toggleLocation(loc.id)}
                              className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                            />
                            <Icon name="FaGoogle" size={14} className="text-blue-500" />
                            <span className="text-sm text-gray-700">{loc.name}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Bluesky */}
                    {blueskyConnection && (
                      <div>
                        <label className={`flex items-center gap-2 ${mode === "photo" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                          <input
                            type="checkbox"
                            checked={postToBluesky && mode !== "photo"}
                            onChange={(e) => setPostToBluesky(e.target.checked)}
                            disabled={mode === "photo"}
                            className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue disabled:opacity-50"
                          />
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            className="w-4 h-4 text-sky-500"
                            fill="currentColor"
                          >
                            <path d="M111.8 62.2C170.2 105.9 233 194.7 256 242.4c23-47.6 85.8-136.4 144.2-180.2c42.1-31.6 110.3-56 110.3 21.8c0 15.5-8.9 130.5-14.1 149.2C478.2 298 412 314.6 353 304.5c102.9 17.5 129.1 75.5 72.5 133.5c-107.4 110.2-154.3-27.6-166.3-62.9l0 0c-1.7-4.9-2.6-7.8-3.3-7.8s-1.6 3-3.3 7.8l0 0c-12 35.3-59 173.1-166.3 62.9c-56.5-58-30.4-116 72.5-133.5C100 314.6 33.8 298 15.7 233.1C10.4 214.4 1.5 99.4 1.5 83.9c0-77.8 68.2-53.4 110.3-21.8z" />
                          </svg>
                          <span className="text-sm text-gray-700">
                            Bluesky ({blueskyConnection.handle || "connected"})
                          </span>
                        </label>
                        {mode === "photo" && (
                          <p className="text-xs text-gray-500 ml-6 mt-1">
                            Photo gallery uploads are GBP only
                          </p>
                        )}
                      </div>
                    )}

                    {/* LinkedIn - Multi-target selection */}
                    {linkedinConnection && (
                      <div className="space-y-2">
                        {/* Personal Profile */}
                        <label className={`flex items-center gap-2 ${mode === "photo" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                          <input
                            type="checkbox"
                            checked={isLinkedInTargetSelected('personal', linkedinConnection.id) && mode !== "photo"}
                            onChange={() => toggleLinkedInTarget('personal', linkedinConnection.id, linkedinConnection.handle || 'My Profile')}
                            disabled={mode === "photo"}
                            className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue disabled:opacity-50"
                          />
                          <Icon name="FaLinkedin" size={14} className="text-[#0A66C2]" />
                          <span className="text-sm text-gray-700">
                            {linkedinConnection.handle || "My Profile"} (Personal)
                          </span>
                        </label>

                        {/* Organization Pages */}
                        {linkedinConnection.organizations?.map((org) => (
                          <label
                            key={org.id}
                            className={`flex items-center gap-2 ${mode === "photo" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <input
                              type="checkbox"
                              checked={isLinkedInTargetSelected('organization', org.id) && mode !== "photo"}
                              onChange={() => toggleLinkedInTarget('organization', org.id, org.name)}
                              disabled={mode === "photo"}
                              className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue disabled:opacity-50"
                            />
                            <Icon name="FaBuilding" size={14} className="text-[#0A66C2]" />
                            <span className="text-sm text-gray-700">
                              {org.name} (Company)
                            </span>
                          </label>
                        ))}

                        {mode === "photo" && (
                          <p className="text-xs text-gray-500 ml-6 mt-1">
                            Photo gallery uploads are GBP only
                          </p>
                        )}
                      </div>
                    )}

                    {gbpLocations.length === 0 && !blueskyConnection && !linkedinConnection && (
                      <p className="text-sm text-gray-500">
                        No platforms connected.{" "}
                        <a
                          href="/dashboard/social-posting"
                          className="text-slate-blue hover:underline"
                        >
                          Connect now
                        </a>
                      </p>
                    )}
                  </div>

                  {/* Schedule Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When to post
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="scheduleMode"
                          value="immediate"
                          checked={scheduleMode === "immediate"}
                          onChange={() => setScheduleMode("immediate")}
                          className="mt-1 text-slate-blue focus:ring-slate-blue"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Post now
                          </span>
                          <p className="text-xs text-gray-500">
                            Publish immediately to selected platforms
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="scheduleMode"
                          value="scheduled"
                          checked={scheduleMode === "scheduled"}
                          onChange={() => {
                            setScheduleMode("scheduled");
                            if (!scheduledDate) setScheduledDate(tomorrow);
                          }}
                          className="mt-1 text-slate-blue focus:ring-slate-blue"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Schedule for later
                          </span>
                          <p className="text-xs text-gray-500">
                            Pick a date and time (1 credit)
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Date picker (only for scheduled mode) */}
                    {scheduleMode === "scheduled" && (
                      <div className="mt-3 flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={tomorrow}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">
                            Timezone
                          </label>
                          <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            {SUPPORTED_TIMEZONES.map((tz: string) => (
                              <option key={tz} value={tz}>
                                {tz.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Credit notice */}
                  {scheduleMode === "scheduled" && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
                      <Icon name="FaCoins" size={16} />
                      <span>Scheduling this post will use 1 credit</span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {!hasNoPlatforms && (
                <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting || (!postContent.trim() && mode === "post") || (mediaItems.length === 0 && mode === "photo")}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save as draft
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmit()}
                      disabled={!canSubmit || isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Icon
                            name="FaSpinner"
                            className="inline mr-2 animate-spin"
                            size={14}
                          />
                          {scheduleMode === "immediate" ? "Publishing..." : scheduleMode === "draft" ? "Saving..." : "Scheduling..."}
                        </>
                      ) : scheduleMode === "immediate" ? (
                        "Post now"
                      ) : (
                        "Schedule post"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
