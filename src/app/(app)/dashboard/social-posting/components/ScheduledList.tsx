"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import type { GoogleBusinessScheduledPost } from "@/features/social-posting";
import EditScheduleModal from "./EditScheduleModal";

interface ScheduledListProps {
  posts: GoogleBusinessScheduledPost[];
  onCancelComplete: () => void;
  onError: (message: string) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No date";
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ScheduledList({
  posts,
  onCancelComplete,
  onError,
}: ScheduledListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<GoogleBusinessScheduledPost | null>(null);

  const handleCancel = async (postId: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled post?")) {
      return;
    }

    setCancellingId(postId);
    try {
      await apiClient.delete(`/social-posting/scheduled/${postId}`);
      onCancelComplete();
    } catch (err) {
      console.error("Failed to cancel post:", err);
      onError("Failed to cancel post");
    } finally {
      setCancellingId(null);
    }
  };

  // Get content preview
  const getContentPreview = (post: GoogleBusinessScheduledPost) => {
    if (post.content?.summary) {
      const summary = post.content.summary;
      return summary.length > 150 ? summary.slice(0, 150) + "..." : summary;
    }
    if (post.caption) {
      return post.caption.length > 150
        ? post.caption.slice(0, 150) + "..."
        : post.caption;
    }
    return "No content";
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
            <Icon name="FaSpinner" size={10} className="animate-spin" />
            Processing
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  // Get target platforms
  const getTargetPlatforms = (post: GoogleBusinessScheduledPost) => {
    const platforms = [];

    if (post.selectedLocations && post.selectedLocations.length > 0) {
      // Show each GBP location by name
      post.selectedLocations.forEach((location, index) => {
        const locationName = location.name || location.id;
        platforms.push(
          <span
            key={`gbp-${index}`}
            className="inline-flex items-center px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
          >
            <Icon name="FaGoogle" size={10} className="mr-1" />
            {locationName}
          </span>
        );
      });
    }

    if (post.additionalPlatforms?.bluesky?.enabled) {
      platforms.push(
        <span
          key="bluesky"
          className="inline-flex items-center px-2 py-0.5 text-xs bg-sky-100 text-sky-700 rounded"
        >
          <Icon name="FaGlobe" size={10} className="mr-1" />
          Bluesky
        </span>
      );
    }

    return platforms;
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
        <Icon
          name="FaCalendarAlt"
          className="w-12 h-12 text-gray-300 mx-auto mb-4"
          size={48}
        />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No scheduled posts
        </h3>
        <p className="text-gray-500">
          Add content to your queue and schedule it to see upcoming posts here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="border border-gray-200 rounded-lg p-4 bg-white"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Thumbnail if media exists */}
            {post.mediaPaths && post.mediaPaths.length > 0 && post.mediaPaths[0].publicUrl && (
              <div className="flex-shrink-0">
                <img
                  src={post.mediaPaths[0].publicUrl}
                  alt="Post thumbnail"
                  className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                />
                {post.mediaPaths.length > 1 && (
                  <span className="block text-center text-xs text-gray-500 mt-1">
                    +{post.mediaPaths.length - 1} more
                  </span>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Date and status row */}
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium text-slate-blue">
                  Scheduled for {formatDate(post.scheduledDate)}
                </span>
                {getStatusBadge(post.status)}
              </div>

              {/* Content preview */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {getContentPreview(post)}
              </p>

              {/* Target platforms */}
              <div className="flex items-center gap-2 flex-wrap">
                {getTargetPlatforms(post)}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {/* Edit button - only for pending posts */}
              {post.status === "pending" && (
                <button
                  onClick={() => setEditingPost(post)}
                  className="p-2 text-gray-400 hover:text-slate-blue transition-colors"
                  title="Edit post"
                >
                  <Icon name="FaEdit" size={16} />
                </button>
              )}
              {/* Cancel button */}
              <button
                onClick={() => handleCancel(post.id)}
                disabled={cancellingId === post.id}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Cancel post"
              >
                {cancellingId === post.id ? (
                  <Icon name="FaSpinner" size={16} className="animate-spin" />
                ) : (
                  <Icon name="FaTimes" size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Edit modal */}
      {editingPost && (
        <EditScheduleModal
          post={editingPost}
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          onSave={() => {
            setEditingPost(null);
            onCancelComplete(); // Reuse this to refresh the list
          }}
        />
      )}
    </div>
  );
}
