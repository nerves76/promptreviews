"use client";

import { useState } from "react";
import { Modal } from "@/app/(app)/components/ui/modal";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import type { GoogleBusinessScheduledPost } from "@/features/social-posting";

interface EditScheduleModalProps {
  post: GoogleBusinessScheduledPost;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditScheduleModal({
  post,
  isOpen,
  onClose,
  onSave,
}: EditScheduleModalProps) {
  const [scheduledDate, setScheduledDate] = useState(post.scheduledDate || "");
  const [caption, setCaption] = useState(
    post.content?.summary || post.caption || ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

  const handleSave = async () => {
    if (!scheduledDate) {
      setError("Please select a date");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apiClient.patch(`/social-posting/scheduled/${post.id}`, {
        scheduledDate,
        caption,
        content: post.content
          ? { ...post.content, summary: caption }
          : { summary: caption },
      });
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to update post:", err);
      setError("Failed to update post. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit scheduled post" size="md">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Thumbnail preview */}
        {post.mediaPaths &&
          post.mediaPaths.length > 0 &&
          post.mediaPaths[0].publicUrl && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img
                src={post.mediaPaths[0].publicUrl}
                alt="Post thumbnail"
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="text-sm text-gray-600">
                {post.mediaPaths.length} image
                {post.mediaPaths.length > 1 ? "s" : ""} attached
              </div>
            </div>
          )}

        {/* Scheduled date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled date
          </label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent"
          />
        </div>

        {/* Caption/content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Post content
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent resize-none"
            placeholder="Enter post content..."
          />
          <p className="mt-1 text-xs text-gray-500">
            {caption.length} characters
          </p>
        </div>

        {/* Target platforms display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Posting to
          </label>
          <div className="flex flex-wrap gap-2">
            {post.selectedLocations?.map((location, index) => (
              <span
                key={`gbp-${index}`}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
              >
                <Icon name="FaGoogle" size={10} className="mr-1" />
                {location.name || location.id}
              </span>
            ))}
            {post.additionalPlatforms?.bluesky?.enabled && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-sky-100 text-sky-700 rounded">
                <Icon name="FaGlobe" size={10} className="mr-1" />
                Bluesky
              </span>
            )}
          </div>
        </div>
      </div>

      <Modal.Footer>
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
        >
          {saving && (
            <Icon name="FaSpinner" size={14} className="animate-spin" />
          )}
          Save changes
        </button>
      </Modal.Footer>
    </Modal>
  );
}
